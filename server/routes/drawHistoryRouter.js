import express from 'express';
import DrawHistory from '../models/DrawHistory.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: DrawHistory
 *   description: 查詢抽籤歷史紀錄與統計
 */

/**
 * @swagger
 * /history:
 *   get:
 *     tags: [DrawHistory]
 *     summary: 根據群組 ID 和日期區間查詢抽籤歷史與統計
 *     description: 查詢指定群組的午餐抽籤歷史紀錄，並回傳一份統計資料，顯示在指定日期區間內每家餐廳被抽中的次數。
 *     parameters:
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *         required: true
 *         description: 要查詢的群組 ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 查詢區間的開始日期 (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 查詢區間的結束日期 (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: 成功獲取抽籤歷史與統計資料
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                 statistics:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       restaurantName:
 *                         type: string
 *                       count:
 *                         type: integer
 *       400:
 *         description: 未提供 groupId
 *       500:
 *         description: 伺服器內部錯誤
 */
router.get('/', async (req, res) => {
  const { groupId, startDate, endDate } = req.query;

  if (!groupId) {
    return res.status(400).json({ message: '請提供 groupId 查詢參數' });
  }

  try {
    const matchCondition = { groupId };

    if (startDate || endDate) {
      matchCondition.drawnAt = {};
      if (startDate) {
        const startUTC = new Date(startDate + 'T00:00:00.000Z');
        matchCondition.drawnAt.$gte = startUTC;
      }
      if (endDate) {
        const endUTC = new Date(endDate + 'T23:59:59.999Z');
        matchCondition.drawnAt.$lte = endUTC;
      }
    }

    // 平行執行兩個查詢
    const [history, statistics] = await Promise.all([
      // 查詢一：獲取詳細歷史紀錄
      DrawHistory.find(matchCondition).populate('restaurantId', 'name').sort({ drawnAt: -1 }),

      // 查詢二：使用 Aggregation 進行統計
      DrawHistory.aggregate([
        { $match: matchCondition },
        { $group: { _id: '$restaurantId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        {
          $lookup: {
            from: 'restaurants',
            localField: '_id',
            foreignField: '_id',
            as: 'restaurantDetails',
          },
        },
        { $unwind: '$restaurantDetails' },
        {
          $project: {
            _id: 0,
            restaurantName: '$restaurantDetails.name',
            count: '$count',
          },
        },
      ]),
    ]);

    res.status(200).json({ history, statistics });
  } catch (error) {
    console.error('查詢抽籤歷史時發生錯誤:', error);
    res.status(500).json({ message: '伺服器內部錯誤' });
  }
});

export default router;

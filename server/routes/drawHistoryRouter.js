import express from 'express';
import DrawHistory from '../models/DrawHistory.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: DrawHistory
 *   description: 查詢抽籤歷史紀錄
 */

/**
 * @swagger
 * /history:
 *   get:
 *     tags: [DrawHistory]
 *     summary: 根據群組 ID 和日期區間查詢抽籤歷史
 *     description: 查詢指定群組的午餐抽籤歷史紀錄。可選填 startDate 和 endDate 來篩選特定時間範圍內的資料。
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
 *         description: 成功獲取抽籤歷史
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   restaurantId:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       url:
 *                         type: string
 *                       image:
 *                         type: string
 *                   groupId:
 *                     type: string
 *                   drawnAt:
 *                     type: string
 *                     format: date-time
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
    const query = { groupId };

    if (startDate || endDate) {
      query.drawnAt = {};
      if (startDate) {
        query.drawnAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.drawnAt.$lte = endOfDay;
      }
    }

    const history = await DrawHistory.find(query)
      .populate('restaurantId', 'name url image') // 只選擇需要的餐廳欄位
      .sort({ drawnAt: -1 }); // 按時間倒序

    res.status(200).json(history);
  } catch (error) {
    console.error('查詢抽籤歷史時發生錯誤:', error);
    res.status(500).json({ message: '伺服器內部錯誤' });
  }
});

export default router;

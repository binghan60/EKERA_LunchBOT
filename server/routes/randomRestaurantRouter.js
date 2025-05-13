const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const GroupSetting = require('../models/GroupSetting');
const GroupRestaurant = require('../models/GroupRestaurant');
const Restaurant = require('../models/Restaurant');

/**
 * @swagger
 * /random-restaurant:
 *   get:
 *     tags:
 *       - RandomRestaurant
 *     summary: 隨機抽取餐廳
 *     description: 根據群組 ID 和當前地點隨機抽取一間餐廳。
 *     parameters:
 *       - name: groupId
 *         in: query
 *         required: true
 *         description: 群組 ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功抽取餐廳
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   description: 餐廳名稱
 *                   example: 台北美食餐廳
 *       400:
 *         description: 群組尚未設定地點或沒有可抽的餐廳
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/', async (req, res) => {
    try {
        const { groupId } = req.query;

        if (!groupId) {
            return res.status(400).json({ message: '缺少群組 ID' });
        }

        // 查詢群組設定
        const groupSetting = await GroupSetting.findOne({ groupId });
        if (!groupSetting) {
            return res.status(400).json({ message: '這個群組還沒有設定地點，請先設定！' });
        }

        const currentOffice = groupSetting.currentOffice;

        // 抽取餐廳
        const result = await drawRestaurant(groupId, currentOffice);

        if (result) {
            return res.status(200).json({ name: result.name });
        } else {
            return res.status(400).json({ message: '沒有可以抽的餐廳，請先新增幾家！' });
        }
    } catch (error) {
        res.status(500).json({ message: '伺服器錯誤', error });
    }
});

// 抽取餐廳的邏輯
async function drawRestaurant(groupId, office) {
    const groupRestaurants = await GroupRestaurant.find({
        groupId,
        office,
    }).select('restaurantId');

    if (groupRestaurants.length === 0) return null;

    const restaurantIds = groupRestaurants.map((gr) => new mongoose.Types.ObjectId(gr.restaurantId));
    const result = await Restaurant.aggregate([{ $match: { _id: { $in: restaurantIds }, isActive: true } }, { $sample: { size: 1 } }]);

    return result[0] || null;
}

module.exports = router;

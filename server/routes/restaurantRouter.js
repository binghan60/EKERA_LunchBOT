const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');

/**
 * @swagger
 * tags:
 *   name: Restaurant
 *   description: 餐廳相關 API
 */

/**
 * @swagger
 * /restaurants:
 *   get:
 *     tags:
 *       - Restaurant
 *     summary: 查詢所有餐廳
 *     description: 可選擇使用關鍵字篩選餐廳。
 *     parameters:
 *       - name: keyword
 *         in: query
 *         description: 關鍵字，用於篩選餐廳名稱
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功取得餐廳列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Restaurant'
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/', async (req, res) => {
    try {
        const keyword = req.query.keyword || '';
        const filter = keyword ? { name: new RegExp(keyword, 'i') } : {};
        const restaurants = await Restaurant.find(filter);
        res.status(200).json(restaurants);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching restaurants', error });
    }
});

/**
 * @swagger
 * /restaurants/{id}:
 *   get:
 *     tags:
 *       - Restaurant
 *     summary: 查詢單一餐廳
 *     description: 根據餐廳 ID 查詢餐廳詳細資訊。
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 餐廳 ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功取得餐廳資訊
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       404:
 *         description: 找不到餐廳
 *       500:
 *         description: 伺服器錯誤
 */
router.get('/:id', async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
        res.status(200).json(restaurant);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching restaurant', error });
    }
});

/**
 * @swagger
 * /restaurants/add:
 *   post:
 *     tags:
 *       - Restaurant
 *     summary: 新增餐廳
 *     description: 新增一個新的餐廳。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 餐廳名稱
 *                 example: 台北美食餐廳
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 餐廳標籤
 *                 example: ["中式", "素食"]
 *               address:
 *                 type: string
 *                 description: 餐廳地址
 *                 example: 台北市中正區
 *               phone:
 *                 type: string
 *                 description: 餐廳電話
 *                 example: 02-12345678
 *     responses:
 *       201:
 *         description: 成功新增餐廳
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       500:
 *         description: 伺服器錯誤
 */
router.post('/add', async (req, res) => {
    try {
        const { name, tags, address, phone } = req.body;
        const restaurant = new Restaurant({ name, tags, address, phone });
        await restaurant.save();
        res.status(201).json({ message: 'Restaurant added', restaurant });
    } catch (error) {
        res.status(500).json({ message: 'Error adding restaurant', error });
    }
});

/**
 * @swagger
 * /restaurants/{id}:
 *   put:
 *     tags:
 *       - Restaurant
 *     summary: 修改餐廳
 *     description: 根據餐廳 ID 修改餐廳資訊。
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 餐廳 ID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 餐廳名稱
 *                 example: 台北美食餐廳
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 餐廳標籤
 *                 example: ["中式", "素食"]
 *               address:
 *                 type: string
 *                 description: 餐廳地址
 *                 example: 台北市中正區
 *               phone:
 *                 type: string
 *                 description: 餐廳電話
 *                 example: 02-12345678
 *               isActive:
 *                 type: boolean
 *                 description: 餐廳是否啟用
 *                 example: true
 *     responses:
 *       200:
 *         description: 成功修改餐廳資訊
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       404:
 *         description: 找不到餐廳
 *       500:
 *         description: 伺服器錯誤
 */
router.put('/:id', async (req, res) => {
    try {
        const { name, tags, address, phone, isActive } = req.body;
        const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, { name, tags, address, phone, isActive }, { new: true });
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
        res.status(200).json({ message: 'Restaurant updated', restaurant });
    } catch (error) {
        res.status(500).json({ message: 'Error updating restaurant', error });
    }
});

/**
 * @swagger
 * /restaurants/{id}:
 *   delete:
 *     tags:
 *       - Restaurant
 *     summary: 軟刪除餐廳(改為 inactive)
 *     description: 根據餐廳 ID 將餐廳設為 inactive。
 *     parameters:
 *       - name: id
 *         in: path
 *         description: 餐廳 ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功將餐廳設為 inactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       404:
 *         description: 找不到餐廳
 *       500:
 *         description: 伺服器錯誤
 */
router.delete('/:id', async (req, res) => {
    try {
        const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
        res.status(200).json({ message: 'Restaurant deactivated', restaurant });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting restaurant', error });
    }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Restaurant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 餐廳 ID
 *           example: 60c72b2f9b1e8a001c8e4d3a
 *         name:
 *           type: string
 *           description: 餐廳名稱
 *           example: 台北美食餐廳
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: 餐廳標籤
 *           example: ["中式", "素食"]
 *         address:
 *           type: string
 *           description: 餐廳地址
 *           example: 台北市中正區
 *         phone:
 *           type: string
 *           description: 餐廳電話
 *           example: 02-12345678
 *         isActive:
 *           type: boolean
 *           description: 餐廳是否啟用
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 餐廳建立時間
 *           example: 2025-05-12T12:34:56Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 餐廳最後更新時間
 *           example: 2025-05-12T12:34:56Z
 */

module.exports = router;

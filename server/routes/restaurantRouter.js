const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const mongoose = require('mongoose');

router.get('/', async (req, res) => {
    try {
        const groupId = req.query.groupId;
        if (!groupId) return res.status(400).json({ message: 'groupId 是必填參數' });

        const keyword = req.query.keyword || '';
        const filter = {
            groupId,
            ...(keyword && { name: new RegExp(keyword, 'i') }),
        };
        const restaurants = await Restaurant.find(filter);
        res.status(200).json(restaurants);
    } catch (error) {
        res.status(500).json({ message: '查詢餐廳時發生錯誤', error });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const groupId = req.query.groupId;
        if (!groupId) return res.status(400).json({ message: 'groupId 是必填參數' });
        const restaurant = await Restaurant.findOne({ _id: req.params.id, groupId });
        if (!restaurant) return res.status(404).json({ message: '找不到餐廳' });

        res.status(200).json(restaurant);
    } catch (error) {
        res.status(500).json({ message: '查詢餐廳時發生錯誤', error });
    }
});

router.post('/', async (req, res) => {
    try {
        const { groupId, name, address, phone, menu, tags, isActive } = req.body;

        if (!groupId || !name) {
            return res.status(400).json({ message: 'groupId、name 為必填欄位' });
        }

        const exists = await Restaurant.findOne({ groupId, name });
        if (exists) {
            return res.status(409).json({ message: `'${exists.name}'餐廳已存在` });
        }

        const restaurant = new Restaurant({ groupId, name, tags, address, phone, menu, isActive });
        await restaurant.save();
        res.status(201).json({ message: '新增成功', restaurant });
    } catch (error) {
        res.status(500).json({ message: '新增餐廳時發生錯誤', error });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { groupId, name, address, phone, menu, tags, isActive } = req.body;

        if (!groupId) return res.status(400).json({ message: 'groupId 是必填欄位' });

        const isValidId = mongoose.Types.ObjectId.isValid(req.params.id);
        if (!isValidId) return res.status(400).json({ message: '非法的餐廳 ID' });

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (tags !== undefined) updateData.tags = tags;
        if (address !== undefined) updateData.address = address;
        if (phone !== undefined) updateData.phone = phone;
        if (menu !== undefined) updateData.menu = menu;
        if (isActive !== undefined) updateData.isActive = isActive;

        const restaurant = await Restaurant.findOneAndUpdate({ _id: req.params.id, groupId }, { $set: updateData }, { new: true });

        if (!restaurant) return res.status(404).json({ message: '找不到餐廳或無權限編輯' });

        res.status(200).json({ message: '更新成功', restaurant });
    } catch (error) {
        console.error('更新餐廳錯誤:', error);
        res.status(500).json({ message: '更新餐廳時發生錯誤', error });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const groupId = req.body.groupId;
        if (!groupId) return res.status(400).json({ message: 'groupId 是必填欄位' });

        const restaurant = await Restaurant.findOneAndUpdate({ _id: req.params.id, groupId }, { $set: { isActive: false } }, { new: true });

        if (!restaurant) return res.status(404).json({ message: '找不到餐廳或無權限刪除' });

        res.status(200).json({ message: '已刪除（軟刪除）', restaurant });
    } catch (error) {
        res.status(500).json({ message: '刪除餐廳時發生錯誤', error });
    }
});

module.exports = router;

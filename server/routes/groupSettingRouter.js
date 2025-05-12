const express = require('express');
const router = express.Router();
const GroupSetting = require('../models/GroupSetting');

// 測試用
router.get('/', (req, res) => {
    res.send('Hello from group setting router!');
});

// 取得指定群組設定（Read）
router.get('/:id', async (req, res) => {
    try {
        const groupId = req.params.id;
        const groupSetting = await GroupSetting.findOne({ groupId });
        if (!groupSetting) {
            return res.status(404).send('Group setting not found');
        }
        res.status(200).json(groupSetting);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// 建立群組設定（Create）
router.post('/', async (req, res) => {
    try {
        const { groupId, currentOffice, officeOption } = req.body;

        const existing = await GroupSetting.findOne({ groupId });
        if (existing) {
            return res.status(400).send('Group setting already exists');
        }

        const newSetting = new GroupSetting({
            groupId,
            currentOffice,
            officeOption,
        });

        await newSetting.save();
        res.status(201).json(newSetting);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// 更新群組設定（Update）
router.put('/:id', async (req, res) => {
    try {
        const groupId = req.params.id;
        const { currentOffice, officeOption } = req.body;

        const updated = await GroupSetting.findOneAndUpdate(
            { groupId },
            {
                currentOffice,
                officeOption,
                updatedAt: Date.now(),
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).send('Group setting not found');
        }

        res.status(200).json(updated);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// 刪除群組設定（Delete）
router.delete('/:id', async (req, res) => {
    try {
        const groupId = req.params.id;

        const deleted = await GroupSetting.findOneAndDelete({ groupId });

        if (!deleted) {
            return res.status(404).send('Group setting not found');
        }

        res.status(200).send('Group setting deleted');
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;

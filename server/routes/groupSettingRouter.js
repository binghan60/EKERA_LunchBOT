const express = require('express');
const router = express.Router();
const GroupSetting = require('../models/GroupSetting');

/**
 * @swagger
 * tags:
 *   name: GroupSetting
 *   description: 群組設定相關 API
 */

/**
 * @swagger
 * /group-settings:
 *   
 *   post:
 *     tags:
 *       - GroupSetting
 *     summary: 建立群組設定
 *     description: 建立新的群組設定。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groupId:
 *                 type: string
 *                 description: 群組 ID
 *                 example: Uaca9aaaf9f872b1871196f9481ea0839
 *               currentOffice:
 *                 type: string
 *                 description: 當前選中的辦公室
 *                 example: 台北辦公室
 *               officeOption:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 辦公室選項列表
 *                 example: ["台北辦公室", "新竹辦公室"]
 *     responses:
 *       201:
 *         description: 成功建立群組設定
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GroupSetting'
 *       400:
 *         description: 群組設定已存在
 *       500:
 *         description: 伺服器錯誤
 *
 * /group-settings/{id}:
 *   get:
 *     tags:
 *       - GroupSetting
 *     summary: 取得指定群組設定
 *     description: 根據群組 ID 取得群組設定。
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: 群組 ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功取得群組設定
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GroupSetting'
 *       404:
 *         description: 找不到群組設定
 *       500:
 *         description: 伺服器錯誤
 *
 *   put:
 *     tags:
 *       - GroupSetting
 *     summary: 更新群組設定
 *     description: 根據群組 ID 更新群組設定。
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: 群組 ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentOffice:
 *                 type: string
 *                 description: 當前選中的辦公室
 *                 example: 台北辦公室
 *               officeOption:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 辦公室選項列表
 *                 example: ["台北辦公室", "新竹辦公室"]
 *     responses:
 *       200:
 *         description: 成功更新群組設定
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GroupSetting'
 *       404:
 *         description: 找不到群組設定
 *       500:
 *         description: 伺服器錯誤
 *

 */

/**
 * @swagger
 * components:
 *   schemas:
 *     GroupSetting:
 *       type: object
 *       properties:
 *         groupId:
 *           type: string
 *           description: 群組 ID
 *           example: Uaca9aaaf9f872b1871196f9481ea0839
 *         currentOffice:
 *           type: string
 *           description: 當前選中的辦公室
 *           example: 台北辦公室
 *         officeOption:
 *           type: array
 *           items:
 *             type: string
 *           description: 辦公室選項列表
 *           example: ["台北辦公室", "新竹辦公室"]
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 最後更新時間
 *           example: 2025-05-12T12:34:56Z
 */

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

//  *   delete:
//  *     tags:
//  *       - GroupSetting
//  *     summary: 刪除群組設定
//  *     description: 根據群組 ID 刪除群組設定。
//  *     parameters:
//  *       - name: id
//  *         in: path
//  *         required: true
//  *         description: 群組 ID
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: 成功刪除群組設定
//  *       404:
//  *         description: 找不到群組設定
//  *       500:
//  *         description: 伺服器錯誤

// 刪除群組設定（Delete）
// router.delete('/:id', async (req, res) => {
//     try {
//         const groupId = req.params.id;

//         const deleted = await GroupSetting.findOneAndDelete({ groupId });

//         if (!deleted) {
//             return res.status(404).send('Group setting not found');
//         }

//         res.status(200).send('Group setting deleted');
//     } catch (err) {
//         res.status(500).send('Server error');
//     }
// });

module.exports = router;

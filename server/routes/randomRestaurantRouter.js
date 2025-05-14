const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');
const GroupSetting = require('../models/GroupSetting');
const GroupRestaurant = require('../models/GroupRestaurant');
const Restaurant = require('../models/Restaurant');
require('dotenv').config(); // 確保在檔案頂部加載環境變數

// --- LINE 設定 ---
const LINE_CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN; // 從環境變數讀取
const LINE_PUSH_API_URL = 'https://api.line.me/v2/bot/message/push';

/**
 * @swagger
 * /random-restaurant:
 *   post:
 *     tags:
 *       - RandomRestaurant
 *     summary: 隨機抽取餐廳並推播 LINE 訊息
 *     description: 根據提供的群組 ID，隨機抽取一間該群組設定地點的活躍餐廳，並將餐廳資訊以 LINE Flex Message 推播到該群組設定的 LINE 群組。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *             properties:
 *               groupId:
 *                 type: string
 *                 description: 群組的唯一識別碼。用於查找群組設定及對應的 LINE 群組 ID。
 *                 example: "Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
 *     responses:
 *       '200':
 *         description: 成功抽取餐廳並已成功推播 LINE 訊息。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "餐廳已抽取並成功推播 LINE 訊息。"
 *                 restaurantName:
 *                   type: string
 *                   description: 抽中的餐廳名稱。
 *                   example: "美味食堂"
 *                 linePushStatus:
 *                   type: string
 *                   example: "Success"
 *                 linePushResponse:
 *                   type: object
 *                   description: LINE Messaging API 的成功回應。
 *                   example: { "sentMessages": [ { "id": "...", "quoteToken": "..." } ] }
 *       '400':
 *         description: 用戶端請求錯誤。可能原因包括請求主體缺少 groupId、群組未設定地點、找不到對應的 LINE 群組 ID、或群組內沒有可抽取的餐廳。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               examples:
 *                 missingGroupId:
 *                   value: "請求主體 (Request body) 中缺少 groupId"
 *                 noGroupSetting:
 *                   value: "這個群組還沒有設定地點，請先設定！"
 *                 noLineGroup:
 *                   value: "無法確定要推播的 LINE 群組 ID，請檢查群組設定中的 groupId 欄位。"
 *                 noRestaurants:
 *                   value: "沒有可以抽的餐廳，請先新增幾家！"
 *       '500':
 *         description: 伺服器端錯誤。可能是成功抽取餐廳但 LINE 推播失敗，或發生其他未預期的伺服器內部錯誤。
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   title: LinePushFailedError
 *                   description: 成功抽取餐廳，但 LINE 推播失敗。
 *                   required:
 *                     - message
 *                     - restaurantName
 *                     - linePushStatus
 *                     - errorDetails
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "成功抽取餐廳，但 LINE 推播失敗。"
 *                     restaurantName:
 *                       type: string
 *                       example: "美味食堂"
 *                     linePushStatus:
 *                       type: string
 *                       example: "Failed"
 *                     errorDetails:
 *                       type: object
 *                       description: LINE API 的錯誤回應或錯誤訊息。
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: "A message (messages[0]) in the request body is invalid"
 *                         details:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               message:
 *                                 type: string
 *                               property:
 *                                 type: string
 *                 - type: object
 *                   title: GenericServerError
 *                   description: 一般的伺服器內部錯誤。
 *                   required:
 *                     - message
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "伺服器內部錯誤"
 *                     error:
 *                       type: string
 *                       description: 錯誤的詳細訊息（若存在）。
 */

router.get('/', async (req, res) => {
    try {
        const notificationGroup = await GroupSetting.findOne({ lunchNotification: true });
    } catch (error) {
        console.error('Error fetching notification group:', error);
        return res.status(500).json({ message: '伺服器內部錯誤', error: error.message });
    }
});

router.post('/', async (req, res) => {
    // <--- router.get 改為 router.post
    try {
        const { groupId } = req.body; // <--- 從 req.body 獲取 groupId

        if (!groupId) {
            // 注意：通常 Express 的 body-parser (如 express.json()) 會處理空 body 的情況，
            // 但明確檢查 groupId 是否存在於 body 中是個好習慣。
            return res.status(400).json({ message: '請求主體 (Request body) 中缺少 groupId' });
        }

        // 查詢群組設定
        const groupSetting = await GroupSetting.findOne({ groupId });
        if (!groupSetting) {
            return res.status(400).json({ message: '這個群組還沒有設定地點，請先設定！' });
        }

        // 假設 GroupSetting 中儲存了對應的 LINE Group ID，欄位名稱為 groupId
        const targetGroupId = groupSetting.groupId;
        if (!targetGroupId) {
            return res.status(400).json({ message: '無法確定要推播的 LINE 群組 ID，請檢查群組設定中的 groupId 欄位。' });
        }

        const currentOffice = groupSetting.currentOffice;

        // 抽取餐廳
        const restaurant = await drawRestaurant(groupId, currentOffice);

        if (restaurant && restaurant.name) {
            // 成功抽取到餐廳，現在發送 LINE 訊息
            try {
                const lineResponse = await sendLunchLineMessage(targetGroupId, restaurant);
                // console.log('LINE push successful:', lineResponse.data); // 可以保留用於調試
                return res.status(200).json({
                    message: '餐廳已抽取並成功推播 LINE 訊息。',
                    restaurantName: restaurant.name,
                    linePushStatus: 'Success',
                    linePushResponse: lineResponse.data,
                });
            } catch (lineError) {
                console.error('LINE push failed:', lineError.response ? lineError.response.data : lineError.message);
                return res.status(500).json({
                    message: '成功抽取餐廳，但 LINE 推播失敗。',
                    restaurantName: restaurant.name,
                    linePushStatus: 'Failed',
                    errorDetails: lineError.response ? lineError.response.data : { message: lineError.message }, // 確保 errorDetails 總是一個物件
                });
            }
        } else {
            return res.status(400).json({ message: '沒有可以抽的餐廳，請先新增幾家！' });
        }
    } catch (error) {
        console.error('Server error caught in router:', error);
        res.status(500).json({ message: '伺服器內部錯誤', error: error.message });
    }
});

// 抽取餐廳的邏輯 (假設 Restaurant model 有 address, phone, imageUrl, mapUrl 等欄位)
async function drawRestaurant(groupId, office) {
    const groupRestaurants = await GroupRestaurant.find({
        groupId,
        office,
    }).select('restaurantId');

    if (groupRestaurants.length === 0) return null;

    const restaurantIds = groupRestaurants.map((gr) => new mongoose.Types.ObjectId(gr.restaurantId));

    const results = await Restaurant.aggregate([{ $match: { _id: { $in: restaurantIds }, isActive: true } }, { $sample: { size: 1 } }]);

    if (results && results.length > 0) {
        return results[0]; // 假設 results[0] 包含所有需要的欄位 (name, address, phone, etc.)
    }
    return null;
}

async function sendLunchLineMessage(toGroupId, restaurant) {
    if (!LINE_CHANNEL_ACCESS_TOKEN) {
        console.error('LINE_CHANNEL_ACCESS_TOKEN is not defined. Please check environment variables.');
        throw new Error('LINE Channel Access Token is missing.'); // 內部錯誤，不應直接暴露給用戶
    }
    const restaurantName = restaurant.name || '今日神秘店家';
    const displayAddress = restaurant.address || '店家未提供地址';
    const mapAddress = restaurant.address;
    const restaurantPhone = restaurant.phone || null;
    const restaurantImage = restaurant.imageUrl || 'https://res.cloudinary.com/dtxauiukh/image/upload/w_1000,ar_1:1,c_fill,g_auto,e_art:hokusai/v1747128923/20240430184650-c091c8f9_jogmqt.jpg';

    const footerButtons = [];

    if (mapAddress && typeof mapAddress === 'string' && mapAddress.trim() !== '') {
        footerButtons.push({
            type: 'button',
            style: 'link',
            height: 'sm',
            action: {
                type: 'uri',
                label: '地圖導航',
                uri: `https://maps.google.com/?q=${encodeURIComponent(mapAddress)}`,
            },
        });
    }

    if (restaurantPhone && typeof restaurantPhone === 'string' && /^[0-9+()\-\s]+$/.test(restaurantPhone.trim())) {
        const trimmedPhone = restaurantPhone.trim();
        footerButtons.push({
            type: 'button',
            style: 'link',
            height: 'sm',
            action: {
                type: 'uri',
                label: '撥打電話',
                uri: `tel:${trimmedPhone}`,
            },
        });
    }

    const flexContent = {
        type: 'bubble',
        hero: {
            type: 'image',
            url: restaurantImage,
            size: 'full',
            aspectRatio: '20:13',
            aspectMode: 'cover',
        },
        body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            contents: [
                {
                    type: 'text',
                    text: `🍱 今日推薦：${restaurantName}`,
                    wrap: true,
                    weight: 'bold',
                    size: 'lg',
                },
                {
                    type: 'box',
                    layout: 'vertical',
                    spacing: 'sm',
                    contents: [
                        {
                            type: 'box',
                            layout: 'baseline',
                            spacing: 'sm',
                            contents: [
                                { type: 'text', text: '📍 地址', color: '#aaaaaa', size: 'sm', flex: 1 },
                                { type: 'text', text: displayAddress, wrap: true, color: '#666666', size: 'sm', flex: 5 },
                            ],
                        },
                        {
                            type: 'box',
                            layout: 'baseline',
                            spacing: 'sm',
                            contents: [
                                { type: 'text', text: '📞 電話', color: '#aaaaaa', size: 'sm', flex: 1 },
                                { type: 'text', text: restaurantPhone || '店家未提供電話', wrap: true, color: '#666666', size: 'sm', flex: 5 },
                            ],
                        },
                    ],
                },
            ],
        },
    };

    if (footerButtons.length > 0) {
        flexContent.footer = {
            type: 'box',
            layout: footerButtons.length === 1 ? 'vertical' : 'horizontal',
            spacing: 'sm',
            contents: footerButtons,
            flex: 0,
        };
    }

    const payload = {
        to: toGroupId,
        messages: [
            {
                type: 'flex',
                altText: `今日午餐推薦：${restaurantName}`,
                contents: flexContent,
            },
        ],
    };

    const config = {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
        },
    };

    return axios.post(LINE_PUSH_API_URL, payload, config);
}

module.exports = router;

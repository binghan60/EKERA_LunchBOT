const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios'); // 引入 axios
const GroupSetting = require('../models/GroupSetting');
const GroupRestaurant = require('../models/GroupRestaurant');
const Restaurant = require('../models/Restaurant'); // 假設 Restaurant model 有 name, address, phone, imageUrl, mapUrl 等欄位
require('dotenv').config();

// --- LINE 設定 (強烈建議使用環境變數) ---
const LINE_CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN; // 替換成你的
const LINE_PUSH_API_URL = 'https://api.line.me/v2/bot/message/push';
// 注意：通常 LINE Group ID 會在 API 請求時動態決定，或者與 API 的 groupId 相關聯。
// 這裡假設一個固定的群組ID，或者你可以從 GroupSetting 中獲取 LINE Group ID。
// 為簡化，這裡假設 API 的 groupId 就是要推播的 LINE Group ID，或者你有其他方式映射。
// 如果你的 GroupSetting model 中有 lineGroupId 欄位，那會更好。
// const DEFAULT_LINE_GROUP_ID = 'YOUR_LINE_GROUP_ID_TO_PUSH_TO';

/**
 * @swagger
 * /random-restaurant:
 * get:
 * tags:
 * - RandomRestaurant
 * summary: 隨機抽取餐廳並推播 LINE 訊息
 * description: 根據群組 ID 隨機抽取一間餐廳，並將餐廳資訊以 LINE Flex Message 推播到指定群組。
 * parameters:
 * - name: groupId
 * in: query
 * required: true
 * description: 群組 ID (也將用於決定推播到哪個 LINE 群組，或根據此 ID 查詢 LINE 群組 ID)
 * schema:
 * type: string
 * responses:
 * 200:
 * description: 成功抽取餐廳並已嘗試推播 LINE 訊息
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message:
 * type: string
 * example: 餐廳已抽取並嘗試推播。
 * restaurantName:
 * type: string
 * description: 餐廳名稱
 * example: 台北美食餐廳
 * linePushStatus:
 * type: string
 * example: Success | Failed
 * linePushResponse:
 * type: object
 * description: LINE API 的回應 (成功或失敗時)
 * 400:
 * description: 群組尚未設定地點、沒有可抽的餐廳或缺少群組 ID
 * 500:
 * description: 伺服器錯誤或 LINE 推播時發生問題
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
        // 假設 GroupSetting 中儲存了對應的 LINE Group ID
        // 如果沒有，你需要決定如何獲取要推播的 LINE Group ID
        const targetLineGroupId = groupSetting.lineGroupId || groupId; // 範例：如果 GroupSetting 有 lineGroupId 欄位，就用它，否則用 API 的 groupId 作為 LINE Group ID (請依實際情況調整)

        if (!targetLineGroupId) {
            return res.status(400).json({ message: '無法確定要推播的 LINE 群組 ID' });
        }

        const currentOffice = groupSetting.currentOffice;

        // 抽取餐廳 (假設 drawRestaurant 已修改為回傳更詳細的餐廳資訊)
        const restaurant = await drawRestaurant(groupId, currentOffice);

        if (restaurant && restaurant.name) {
            // 成功抽取到餐廳，現在發送 LINE 訊息
            try {
                const lineResponse = await sendLunchLineMessage(targetLineGroupId, restaurant);
                console.log('LINE push successful:', lineResponse.data);
                return res.status(200).json({
                    message: '餐廳已抽取並成功推播 LINE 訊息。',
                    restaurantName: restaurant.name,
                    linePushStatus: 'Success',
                    linePushResponse: lineResponse.data, // 可以選擇性回傳LINE API的原始回應
                });
            } catch (lineError) {
                console.error('LINE push failed:', lineError.response ? lineError.response.data : lineError.message);
                // 即使 LINE 推播失敗，餐廳還是抽出來了
                return res.status(500).json({
                    // 或者用 207 Multi-Status
                    message: '成功抽取餐廳，但 LINE 推播失敗。',
                    restaurantName: restaurant.name,
                    linePushStatus: 'Failed',
                    errorDetails: lineError.response ? lineError.response.data : lineError.message,
                });
            }
        } else {
            return res.status(400).json({ message: '沒有可以抽的餐廳，請先新增幾家！' });
        }
    } catch (error) {
        console.error('Server error:', error);
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

    // 假設 Restaurant schema 有 name, address, phone, imageUrl, mapUrl 等欄位
    // $sample 會隨機取一筆
    const results = await Restaurant.aggregate([
        { $match: { _id: { $in: restaurantIds }, isActive: true } },
        { $sample: { size: 1 } },
        // 如果需要更多欄位，請確保 Restaurant model 有這些欄位且 $match 後的文檔包含它們
        // 如果 Restaurant model 的欄位名稱不同，請對應調整
    ]);

    if (results && results.length > 0) {
        // 假設回傳的 restaurant 物件包含所有需要的資訊
        return results[0];
    }
    return null;
}

// 新增：發送 LINE Flex Message 的函數
async function sendLunchLineMessage(toGroupId, restaurant) {
    // 從 restaurant 物件中獲取資訊，如果沒有則使用預設值
    const restaurantName = restaurant.name || '今日神秘店家';
    const restaurantAddress = restaurant.address || '店家未提供地址';
    const restaurantPhone = restaurant.phone || '店家未提供電話';
    // 預設圖片，或從 restaurant.imageUrl 獲取
    const restaurantImage = restaurant.imageUrl || 'https://imageproxy.pixnet.cc/imgproxy?url=https://pic.pimg.tw/jetpeter/1733120100-2838930736-g_n.jpg';
    // 預設地圖 URI，或根據 restaurant.mapUrl 或 restaurant.address 生成
    const mapUri = restaurant.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurantAddress)}`;
    const telUri = restaurant.phone ? `tel:${restaurant.phone}` : '#';

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
                                { type: 'text', text: restaurantAddress, wrap: true, color: '#666666', size: 'sm', flex: 5 },
                            ],
                        },
                        {
                            type: 'box',
                            layout: 'baseline',
                            spacing: 'sm',
                            contents: [
                                { type: 'text', text: '📞 電話', color: '#aaaaaa', size: 'sm', flex: 1 },
                                { type: 'text', text: restaurantPhone, wrap: true, color: '#666666', size: 'sm', flex: 5 },
                            ],
                        },
                    ],
                },
            ],
        },
        footer: {
            type: 'box',
            layout: 'horizontal',
            spacing: 'sm',
            contents: [
                {
                    type: 'button',
                    style: 'link',
                    height: 'sm',
                    action: { type: 'uri', label: '地圖導航', uri: mapUri },
                },
                {
                    type: 'button',
                    style: 'link',
                    height: 'sm',
                    action: { type: 'uri', label: '撥打電話', uri: telUri },
                },
            ],
            flex: 0,
        },
    };

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

    // 使用 axios 發送請求到 LINE API
    return axios.post(LINE_PUSH_API_URL, payload, config);
}

module.exports = router;

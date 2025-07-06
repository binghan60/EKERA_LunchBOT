import * as line from '@line/bot-sdk';
import express from 'express';
import GroupSetting from '../models/GroupSetting.js';
import axios from 'axios';
import { drawRestaurant, createRestaurantFlexMessage } from '../utils/restaurantUtils.js';
import sendErrorEmail from '../utils/sendEmail.js';

import 'dotenv/config';

export default (config) => {
  const router = express.Router();
  const client = new line.Client(config);

  router.post('/', async (req, res) => {
    try {
      const events = req.body.events;
      const results = await Promise.all(events.map((event) => handleEvent(event, client)));
      res.json(results);
    } catch (err) {
      console.error(err);
      await sendErrorEmail('🤖 LINE BOT 崩潰了！', err);
      res.status(500).end();
    }
  });

  return router;
};

async function handleEvent(event, client) {
  const sourceType = event.source.type;
  let groupId;

  if (sourceType === 'user') {
    groupId = event.source.userId;
  } else if (sourceType === 'group') {
    groupId = event.source.groupId;
  } else if (sourceType === 'room') {
    groupId = event.source.roomId;
  }

  if (event.type === 'message' && event.message.type === 'text') {
    return handleTextMessage(event, groupId, client);
  }

  if (event.type === 'join' || event.type === 'follow') {
    return handleJoinEvent(event, groupId, client);
  }

  return Promise.resolve(null);
}
// 文字事件
async function handleTextMessage(event, groupId, client) {
  const msg = event.message.text.trim();
  const apiPath = process.env.API_BASE_URL;
  const clientUrl = process.env.CLIENT_URL;

  if (msg === '/h') {
    try {
      const existSetting = await GroupSetting.findOne({ groupId });
      if (!existSetting) {
        const payload = {
          groupId,
          lunchNotification: false,
          currentOffice: 'default',
          officeOption: ['default'],
        };
        await axios.post(`${apiPath}/api/group-setting`, payload);
      }

      const helpMessage = `
🎯 𝗟𝗜𝗡𝗘 𝗟𝗨𝗡𝗖𝗛 𝗕𝗢𝗧 🎯
  ━━━━━━━━━━━━━
🛠️ 群組後台管理
  ━━━━━━━━━━━━━
✨ 在這裡你可以：
🔔 設定推播通知時間
🏢 管理辦公室資料
🍽️ 新增/編輯餐廳資料
⚙️ 調整各種設定

🌐 ${clientUrl}/?groupId=${groupId}
  ━━━━━━━━━━━━━
💡 小提示：輸入「抽獎」來隨機選餐廳！`;

      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: helpMessage,
      });
    } catch (error) {
      console.error('處理 /h 指令時錯誤：', error);
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: `
❌ 系統錯誤
━━━━━━━━━━━━━
😢 無法取得後台網址
請稍後再試一次，或聯絡管理員`,
      });
    }
  }

  if (msg === '抽獎') {
    try {
      const groupSetting = await GroupSetting.findOne({ groupId });

      if (!groupSetting) {
        const noSettingMessage = `
🔧 設定尚未完成
━━━━━━━━━━━━━
找不到群組設定，請先完成初始設定

👉 輸入 /h 取得後台連結`;

        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: noSettingMessage,
        });
        return;
      }

      const restaurant = await drawRestaurant(groupSetting.groupId, groupSetting.currentOffice);
      if (!restaurant) {
        const noRestaurantMessage = `
😅 沒有餐廳可以抽選
━━━━━━━━━━━━━
📍 辦公室：${groupSetting.currentOffice}

🍽️ 請先到後台新增餐廳資料
並將餐廳綁定到對應的辦公室

🔗 ${clientUrl}/?groupId=${groupId}`;

        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: noRestaurantMessage,
        });
        return;
      }

      // 使用 Flex Message 顯示抽獎結果
      const flexMessage = createRestaurantFlexMessage(restaurant);
      await client.replyMessage(event.replyToken, flexMessage);
    } catch (err) {
      console.error('抽獎失敗：', err);

      const errorMessage = `
😵 抽獎系統暫時故障
━━━━━━━━━━━━━
🔧 系統正在維護中...
請稍後再試一次

或者手動選擇今天的午餐吧！ 🍜`;

      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: errorMessage,
      });
    }
    return;
  }

  return Promise.resolve(null);
}

// 加入 群組 或 好友時
async function handleJoinEvent(event, groupId, client) {
  const apiPath = process.env.API_BASE_URL;
  const clientUrl = process.env.CLIENT_URL;

  try {
    const existSetting = await GroupSetting.findOne({ groupId });
    if (!existSetting) {
      const payload = {
        groupId,
        lunchNotification: false,
        currentOffice: 'default',
        officeOption: ['default'],
      };
      await axios.post(`${apiPath}/api/group-setting`, payload);
    }
  } catch (error) {
    console.error('處理 join 事件時錯誤：', error);

    const initErrorMessage = `
⚠️ 初始化失敗
━━━━━━━━━━━━━
群組設定初始化時發生錯誤
請稍後再試，或聯絡系統管理員 🙇`;

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: initErrorMessage,
    });
  }

  const welcomeMessage = `
🎉 歡迎使用午餐抽獎機器人！
━━━━━━━━━━━━━
👋 嗨嗨～謝謝邀請我加入群組！

🎯 快速開始：
1️⃣ 輸入 /h 開啟後台新增餐廳資料
2️⃣ 後台開啟午餐通知，每天11:30主動推播目前辦公室隨機餐廳
3️⃣ 輸入「抽獎」手動從目前辦公室餐廳抽一間餐廳

🌐 後台網址：
${clientUrl}/?groupId=${groupId}
━━━━━━━━━━━━━
讓我來幫你們解決選擇困難症！ 🍽️✨`;

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: welcomeMessage,
  });
}

const line = require('@line/bot-sdk');
const express = require('express');
const GroupSetting = require('../models/GroupSetting');
const axios = require('axios');
require('dotenv').config();

module.exports = (config) => {
  const router = express.Router();
  const client = new line.Client(config);

  router.post('/', async (req, res) => {
    try {
      const events = req.body.events;
      const results = await Promise.all(events.map((event) => handleEvent(event, client)));
      res.json(results);
    } catch (err) {
      console.error(err);
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

  if (event.type === 'join') {
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

      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: `嗨嗨～這是你的群組後台網址！\n用來設定推播通知、餐廳資料、開關啟用狀態等等～\n👉 ${clientUrl}/?groupId=${groupId}\n\n你也可以輸入「抽獎」來隨機抽一間餐廳喔 🍽`,
      });
    } catch (error) {
      console.error('處理 /h 指令時錯誤：', error);
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '發生錯誤，無法取得後台網址，請稍後再試 😢',
      });
    }
  }
  if (msg === '抽獎') {
    const payload = { groupId };
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '午餐醬幫你抽籤中～請稍等一下唷 🍽✨',
    });
    try {
      await axios.post(`${apiPath}/api/random-restaurant`, payload);
    } catch (err) {
      console.error('抽獎失敗：', err.response?.data || err.message);
      await client.pushMessage(groupId, {
        type: 'text',
        text: err.response?.data?.message || '嗚嗚～午餐醬抽籤失敗了，請稍後再試一次 🙇',
      });
    }
    return;
  }
  return Promise.resolve(null);
}
// 加入事件
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
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '初始化群組設定時發生錯誤，請稍後再試 🙇',
    });
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `嗨嗨～謝謝你邀請我進來！\n請輸入 /h 呼叫後台～\n👉 ${clientUrl}/?groupId=${groupId}`,
  });
}

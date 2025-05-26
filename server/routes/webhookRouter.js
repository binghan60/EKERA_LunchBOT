const line = require('@line/bot-sdk');
const express = require('express');
const Restaurant = require('../models/Restaurant');
const GroupRestaurant = require('../models/GroupRestaurant');
const mongoose = require('mongoose');
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
  const apiPath = process.env.API_BASE_URL;
  const sourceType = event.source.type;
  let groupId;

  if (sourceType === 'user') {
    groupId = event.source.userId;
  } else if (sourceType === 'group') {
    groupId = event.source.groupId;
  } else if (sourceType === 'room') {
    groupId = event.source.roomId;
  }
  if (event.type === 'message') {
    const msg = event.message.text.trim();
    if (msg === '/h') {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: `嗨嗨～這是你的群組後台網址！\n用來設定餐廳、開關啟用狀態、備註等等～\n👉 https://ekera-lunch-bot-client.vercel.app/?groupId=${groupId}`,
      });
    }
  }
  if (event.type === 'join') {
    try {
      const payload = {
        groupId,
        lunchNotification: false,
        currentOffice: 'default',
        officeOption: ['default'],
      };
      const response = await axios.post(`${apiPath}/api/group-settings`, payload);
      console.log(response);
    } catch (error) {
      console.log(error);
    }
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `嗨嗨～謝謝你邀請我進來！\n請輸入 /h 呼叫後台～\n👉 https://ekera-lunch-bot-client.vercel.app/?groupId=${groupId}`,
    });
  }

  return Promise.resolve(null);
}

const line = require('@line/bot-sdk');
const express = require('express');
const Restaurant = require('../models/Restaurant');
const GroupRestaurant = require('../models/GroupRestaurant');
const mongoose = require('mongoose');
const axios = require('axios');

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
    if (event.message === 'text') {
        const msg = event.message.text.trim();
        if (msg === '/h') {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: '回傳控制面板網址',
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
            await axios.post(`${apiPath}/api/group-settings`, payload);
        } catch (error) {
            console.log(error);
        }
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: '嗨嗨～謝謝你邀請我進來，請輸入 `/h` 看我能做什麼喵！',
        });
    }

    return Promise.resolve(null);
}

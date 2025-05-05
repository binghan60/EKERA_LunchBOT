require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const mongoose = require('mongoose');
const app = express();

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.messagingApi.MessagingApiClient({
    channelAccessToken: config.channelAccessToken,
});
console.log('process.env.MONGODB_URI', process.env.MONGODB_URI);
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('資料庫連線成功');
    })
    .catch((err) => {
        console.log('資料庫連線失敗');
    });

app.post('/webhook', line.middleware(config), async (req, res) => {
    try {
        const events = req.body.events;
        const results = await Promise.all(events.map(handleEvent));
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).end();
    }
});
app.get('/', (req, res) => {
    res.send('Hello World! This is a LINE Bot server.');
});

async function handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') return;

    const sourceType = event.source.type;
    let senderId;

    if (sourceType === 'user') {
        senderId = event.source.userId;
    } else if (sourceType === 'group') {
        senderId = event.source.groupId;
    } else if (sourceType === 'room') {
        senderId = event.source.roomId;
    }

    if (event.message.text === '抽獎') {
        const randomNumber = Math.floor(Math.random() * 100) + 1;
        return client.replyMessage({
            replyToken: event.replyToken,
            messages: [
                {
                    type: 'text',
                    text: `抽獎結果：${randomNumber} + ${senderId}`,
                },
            ],
        });
    }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`✅ LINE Bot server running at http://localhost:${port}`);
});

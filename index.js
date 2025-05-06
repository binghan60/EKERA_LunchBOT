require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const GroupRestaurant = require('./models/GroupRestaurant');
const GroupSetting = require('./models/GroupSetting');

const app = express();

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('資料庫連線成功');
    })
    .catch((err) => {
        console.log('資料庫連線失敗', err);
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
    if (event.type !== 'message' || event.message.type !== 'text') return Promise.resolve(null);

    const sourceType = event.source.type;
    let senderId;

    if (sourceType === 'user') {
        senderId = event.source.userId;
    } else if (sourceType === 'group') {
        senderId = event.source.groupId;
    } else if (sourceType === 'room') {
        senderId = event.source.roomId;
    }

    if (event.message.text === '/切換地點') {
        const groupSetting = await GroupSetting.findOne({ groupId: senderId });
        if (groupSetting) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: `😿 這個群組已經設定過地點了！`,
            });
        }
        const newGroupSetting = new GroupSetting({
            groupId: senderId,
            currentOffice: '台北', // 預設地點
        });
        await newGroupSetting.save();
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: `🎉 群組地點已設定為「台北」！`,
        });
    }

    if (event.message.text === '抽獎') {
        const groupSetting = await GroupSetting.findOne({ groupId: senderId });
        if (!groupSetting) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: `😿 這個群組還沒有設定地點，請先設定！`,
            });
        }
        const currentOffice = groupSetting.currentOffice;
        const result = await drawRestaurant(senderId, currentOffice);

        if (result) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: `🎯 今天抽到的是：「${result.name}」喵！`,
            });
        } else {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: `😿 沒有可以抽的餐廳唷～請先加幾家！`,
            });
        }
    }
    return Promise.resolve(null);
}

async function drawRestaurant(groupId, office) {
    const groupRestaurants = await GroupRestaurant.find({
        groupId,
        office,
    }).select('restaurantId');
    if (groupRestaurants.length === 0) return null;
    const restaurantIds = groupRestaurants.map((gr) => new mongoose.Types.ObjectId(gr.restaurantId));
    const result = await Restaurant.aggregate([{ $match: { _id: { $in: restaurantIds }, isActive: true } }, { $sample: { size: 1 } }]);
    return result[0] || null;
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`✅ LINE Bot server running at http://localhost:${port}`);
});

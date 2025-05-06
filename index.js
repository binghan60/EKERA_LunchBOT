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

    const msg = event.message.text.trim();

    // 🔁 切換地點指令
    if (msg.startsWith('/切換地點')) {
        const parts = msg.split(' ');
        const newOffice = parts[1];

        if (!newOffice) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: `請用「/切換地點 XX」格式切換地點喵～`,
            });
        }

        await GroupSetting.findOneAndUpdate({ groupId: senderId }, { currentOffice: newOffice, updatedAt: new Date() }, { upsert: true });

        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: `📍 已切換至「${newOffice}」喵！`,
        });
    }

    if (msg.startsWith('/新增餐廳')) {
        const parts = msg.split(' ');
        const name = parts[1];
        const office = parts[2];

        if (!name || !office) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: `請用「/新增餐廳 餐廳名稱 辦公室」的格式喵～例如：/新增餐廳 小六食堂 內湖`,
            });
        }

        let restaurant = await Restaurant.findOne({ name });

        if (!restaurant) {
            restaurant = await Restaurant.create({ name });
        }

        const exists = await GroupRestaurant.findOne({
            groupId,
            restaurantId: restaurant._id,
            office,
        });

        if (exists) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: `⚠️ 餐廳「${name}」已經在「${office}」這個辦公室囉喵～`,
            });
        }

        await GroupRestaurant.create({
            groupId,
            restaurantId: restaurant._id,
            office,
            addedBy: event.source.userId || '系統',
        });

        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: `✅ 已新增餐廳「${name}」到「${office}」喵！`,
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

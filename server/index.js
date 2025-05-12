require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const GroupRestaurant = require('./models/GroupRestaurant');
const GroupSetting = require('./models/GroupSetting');
const restaurantRouter = require('./routes/restaurantRouter.js');
const groupSettingRouter = require('./routes/groupSettingRouter.js');
const cors = require('cors');
// const bodyParser = require('body-parser');

const app = express();
app.use(cors());
// app.use(express.json());
// app.use(bodyParser.json());
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
app.get('/', (req, res) => {
    res.send('Hello World! This is a LINE Bot server.');
});
app.use('/group-settings', groupSettingRouter);
app.use('/restaurant', restaurantRouter);
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

// API TODO
// 1. 新增餐廳
// 2. 刪除餐廳
// 3. 列出所有餐廳
// 4. 列出所有辦公室
// 5. 切換辦公室
// 6. 列出目前辦公室的餐廳
// 7. 抽獎
// 8. 列出所有餐廳的詳細資訊
// 9. Group基本設定

async function handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') return Promise.resolve(null);

    const sourceType = event.source.type;
    let groupId;

    if (sourceType === 'user') {
        groupId = event.source.userId;
    } else if (sourceType === 'group') {
        groupId = event.source.groupId;
    } else if (sourceType === 'room') {
        groupId = event.source.roomId;
    }

    const msg = event.message.text.trim();

    if (msg === '/機器人') {
        let groupSetting = await GroupSetting.findOne({ groupId });
        if (!groupSetting) {
            groupSetting = await GroupSetting.create({
                groupId,
                currentOffice: '未設定',
                officeOption: [],
            });

            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: `🤖 已為這個群組建立初始設定，請使用 /h 查詢指令`,
            });
        }
    }

    if (msg === '/h') {
        const groupSetting = await GroupSetting.findOne({ groupId });
        if (!groupSetting) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: `😿 這個群組還沒有設定地點，請先設定！`,
            });
        }

        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: `指令列表：\n\n` + `吃飯 - 抽出一間餐廳\n` + `/新增餐廳 餐廳名稱 辦公室 - 新增餐廳到指定辦公室\n` + `/刪除餐廳 餐廳名稱 辦公室 - 刪除指定辦公室的餐廳\n` + `/辦公室列表 - 列出所有辦公室\n` + `/切換辦公室 辦公室名稱 - 切換目前辦公室\n` + `/目前餐廳 - 列出目前辦公室的餐廳\n` + `/全部餐廳 - 列出所有餐廳\n`,
        });
    }

    if (msg === '/辦公室列表') {
        const offices = await GroupRestaurant.distinct('office', { groupId });
        if (!offices.length) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: `😿 目前還沒有加入任何辦公室的餐廳唷～`,
            });
        }
        const list = offices.map((o, i) => `${i + 1}. ${o}`).join('\n');
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: `🏢 此群組目前的辦公室列表如下喵：\n\n${list}`,
        });
    }

    if (msg.startsWith('/切換辦公室')) {
        const parts = msg.split(' ');
        const newOffice = parts[1];
        if (!newOffice) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: `請用「/切換地點 XX」格式切換地點喵～`,
            });
        }
        const officeList = await GroupRestaurant.distinct('office', { groupId });
        if (!officeList.includes(newOffice)) {
            const list = officeList.length ? officeList.join('、') : '無';
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: `❌ 找不到「${newOffice}」這個辦公室喵～\n可用辦公室有：${list}`,
            });
        }
        await GroupSetting.findOneAndUpdate({ groupId }, { currentOffice: newOffice, updatedAt: new Date() }, { upsert: true });
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: `📍 已切換至「${newOffice}」喵！`,
        });
    }
    if (msg === '/全部餐廳') {
        const restaurants = await Restaurant.find().sort({ name: 1 }).select('name');
        if (!restaurants.length) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: `😿 目前還沒有任何餐廳喵～`,
            });
        }
        const list = restaurants.map((r, i) => `${i + 1}. ${r.name}`).join('\n');
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: `📖 所有登錄過的餐廳如下喵：\n\n${list}`,
        });
    }
    if (msg === '/目前餐廳') {
        const setting = await GroupSetting.findOne({ groupId });

        if (!setting || !setting.currentOffice) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: `😿 尚未設定目前的辦公室喵，請先用 /切換地點 指定地點喵～`,
            });
        }

        const currentOffice = setting.currentOffice;

        const groupRestaurants = await GroupRestaurant.find({
            groupId,
            office: currentOffice,
        }).populate('restaurantId');

        if (groupRestaurants.length === 0) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: `📭 目前辦公室「${currentOffice}」下還沒有任何餐廳喵～`,
            });
        }

        const list = groupRestaurants.map((gr, i) => `${i + 1}. ${gr.restaurantId.name}`).join('\n');

        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: `📋 目前辦公室「${currentOffice}」的餐廳列表如下喵～\n\n${list}`,
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

    if (msg.startsWith('/刪除餐廳')) {
        const parts = msg.split(' ');
        const name = parts[1];
        const office = parts[2];
        if (!name || !office) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: `請用「/刪除餐廳 餐廳名稱 辦公室」的格式喵～例如：/刪除餐廳 小六食堂 內湖`,
            });
        }
        const restaurant = await Restaurant.findOne({ name });
        if (!restaurant) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: `😿 沒有找到叫「${name}」的餐廳喵～`,
            });
        }

        const deleted = await GroupRestaurant.findOneAndDelete({
            groupId,
            restaurantId: restaurant._id,
            office,
        });

        if (!deleted) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: `😿 找不到「${name}」在「${office}」的紀錄喵～`,
            });
        }

        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: `🗑️ 已從「${office}」刪除餐廳「${name}」喵！`,
        });
    }

    if (event.message.text === '吃飯') {
        const groupSetting = await GroupSetting.findOne({ groupId });
        if (!groupSetting) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: `😿 這個群組還沒有設定地點，請先設定！`,
            });
        }
        const currentOffice = groupSetting.currentOffice;
        const result = await drawRestaurant(groupId, currentOffice);

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

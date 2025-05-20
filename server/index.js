require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const mongoose = require('mongoose');
const apiRoutes = require('./routes/apiRouter.js');
const webhookRoutes = require('./routes/webhookRouter.js');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(cors());
// app.use(bodyParser.json());
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('資料庫連線成功');
    })
    .catch((err) => {
        console.log('資料庫連線失敗', err);
    });
app.use('/api', apiRoutes);
app.post('/webhook', line.middleware(config), webhookRoutes(config));

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

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`✅ LINE Bot server running at http://localhost:${port}`);
    console.log(`Swagger docs: http://localhost:${port}/api-docs`);
});

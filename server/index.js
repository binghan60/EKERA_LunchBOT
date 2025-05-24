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
app.use('/webhook', line.middleware(config), webhookRoutes(config));


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`✅ LINE Bot server running at http://localhost:${port}`);
    console.log(`Swagger docs: http://localhost:${port}/api-docs`);
});

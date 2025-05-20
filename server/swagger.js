// swagger.js 或 swaggerOptions.js
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0', // 或 '2.0'
        info: {
            title: '午餐機器人API',
            version: '1.0.0',
            description: '',
        },
        servers: [
            {
                url: 'http://localhost:3000', // 替換成你的 API 主機
            },
        ],
    },
    apis: ['./routes/*.js'], // API 註解的檔案位置（可調整）
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;

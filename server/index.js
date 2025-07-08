import 'dotenv/config';
import express from 'express';
import * as line from '@line/bot-sdk';
import mongoose from 'mongoose';
import apiRoutes from './routes/apiRouter.js';
import webhookRoutes from './routes/webhookRouter.js';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';
import sendErrorEmail from './utils/sendEmail.js';

// Global error handling to send email on crash
process.on('uncaughtException', (err, origin) => {
  const errorDetails = `Caught exception: ${err}\n` + `Exception origin: ${origin}\n\n${err.stack}`;
  console.error(errorDetails);
  // Try to send email and then exit.
  sendErrorEmail('🤖 機器人崩潰：未捕捉的例外 (Uncaught Exception)', errorDetails).finally(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  const errorDetails = `Unhandled Rejection at: ${promise}\nReason: ${reason.stack || reason}`;
  console.error(errorDetails);
  // Try to send email and then exit.
  sendErrorEmail('🤖 機器人崩潰：未處理的 Promise 拒絕 (Unhandled Rejection)', errorDetails).finally(() => {
    process.exit(1);
  });
});

const app = express();
app.get("/", async (req, res) => {
  res.status(200).json({ message: "LINE BOT!!" });
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(cors());
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("資料庫連線成功");
  })
  .catch((err) => {
    console.log("資料庫連線失敗", err);
  });

app.use("/api", apiRoutes);
app.use("/webhook", line.middleware(config), webhookRoutes(config));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ LINE Bot server running at http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api-docs`);
});

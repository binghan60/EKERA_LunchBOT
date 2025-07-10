import express from 'express';
const router = express.Router();
import axios from 'axios';
import GroupSetting from '../models/GroupSetting.js';
import DrawHistory from '../models/DrawHistory.js';
import { drawRestaurant, createRestaurantFlexMessage, sendLineMessage } from '../utils/restaurantUtils.js';
import sendErrorEmail from '../utils/sendEmail.js';

/**
 * @swagger
 * tags:
 *   name: RandomRestaurant
 *   description: 隨機抽取餐廳並推播 LINE 訊息相關 API
 */

/**
 * @swagger
 * /random-restaurant:
 *   get:
 *     tags:
 *       - RandomRestaurant
 *     summary: 獲取啟用午餐通知的群組
 *     description: 獲取所有啟用了午餐通知的群組列表。
 *     responses:
 *       200:
 *         description: 成功獲取通知群組
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 成功獲取通知群組
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       groupId:
 *                         type: string
 *                         description: 群組 ID
 *                         example: Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *       500:
 *         description: 伺服器內部錯誤
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 伺服器內部錯誤
 *                 error:
 *                   type: string
 *                   example: 錯誤訊息
 */

/**
 * @swagger
 * /random-restaurant:
 *   post:
 *     tags:
 *       - RandomRestaurant
 *     summary: 隨機抽取餐廳並推播 LINE 訊息
 *     description: 根據提供的群組 ID，隨機抽取一間該群組設定地點的活躍餐廳，並將餐廳資訊以 LINE Flex Message 推播到該群組設定的 LINE 群組。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *             properties:
 *               groupId:
 *                 type: string
 *                 description: 群組的唯一識別碼。用於查找群組設定及對應的 LINE 群組 ID。
 *                 example: "Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
 *     responses:
 *       200:
 *         description: 成功抽取餐廳並已成功推播 LINE 訊息。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 餐廳已抽取並成功推播 LINE 訊息。
 *                 restaurantName:
 *                   type: string
 *                   description: 抽中的餐廳名稱。
 *                   example: 美味食堂
 *                 linePushStatus:
 *                   type: string
 *                   example: Success
 *                 linePushResponse:
 *                   type: object
 *                   description: LINE Messaging API 的成功回應。
 *                   example: { "sentMessages": [ { "id": "...", "quoteToken": "..." } ] }
 *       400:
 *         description: 用戶端請求錯誤。可能原因包括請求主體缺少 groupId、群組未設定地點、找不到對應的 LINE 群組 ID、或群組內沒有可抽取的餐廳。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               examples:
 *                 missingGroupId:
 *                   value: "請求主體 (Request body) 中缺少 groupId"
 *                 noGroupSetting:
 *                   value: "這個群組還沒有設定地點，請先設定！"
 *                 noLineGroup:
 *                   value: "無法確定要推播的 LINE 群組 ID，請檢查群組設定中的 groupId 欄位。"
 *                 noRestaurants:
 *                   value: "沒有可以抽的餐廳，請先新增幾家！"
 *       500:
 *         description: 伺服器端錯誤。可能是成功抽取餐廳但 LINE 推播失敗，或發生其他未預期的伺服器內部錯誤。
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   title: LinePushFailedError
 *                   description: 成功抽取餐廳，但 LINE 推播失敗。
 *                   required:
 *                     - message
 *                     - restaurantName
 *                     - linePushStatus
 *                     - errorDetails
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: 成功抽取餐廳，但 LINE 推播失敗。
 *                     restaurantName:
 *                       type: string
 *                       example: 美味食堂
 *                     linePushStatus:
 *                       type: string
 *                       example: Failed
 *                     errorDetails:
 *                       type: object
 *                       description: LINE API 的錯誤回應或錯誤訊息。
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: A message (messages[0]) in the request body is invalid
 *                         details:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               message:
 *                                 type: string
 *                               property:
 *                                 type: string
 *                 - type: object
 *                   title: GenericServerError
 *                   description: 一般的伺服器內部錯誤。
 *                   required:
 *                     - message
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: 伺服器內部錯誤
 *                     error:
 *                       type: string
 *                       description: 錯誤的詳細訊息（若存在）。
 */

router.get('/', async (req, res) => {
  try {
    const notificationGroups = await GroupSetting.find({ lunchNotification: true }).select('groupId -_id');
    res.status(200).json({ message: '成功獲取通知群組', data: notificationGroups });
  } catch (error) {
    const errorMessage = '獲取推播群組時發生錯誤';
    console.error(errorMessage, error);
    await sendErrorEmail(errorMessage, error.stack || error);
    return res.status(500).json({ message: '伺服器內部錯誤', error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { groupId } = req.body;
  try {
    if (!groupId) {
      return res.status(400).json({ message: '請求主體 (Request body) 中缺少 groupId' });
    }

    const groupSetting = await GroupSetting.findOne({ groupId });
    if (!groupSetting) {
      return res.status(400).json({ message: '這個群組還沒有設定地點，請先設定！' });
    }

    const targetGroupId = groupSetting.groupId;
    if (!targetGroupId) {
      return res.status(400).json({ message: '無法確定要推播的 LINE 群組 ID，請檢查群組設定中的 groupId 欄位。' });
    }

    const currentOffice = groupSetting.currentOffice;

    // 抽取餐廳
    const restaurant = await drawRestaurant(groupId, currentOffice);
    if (restaurant && restaurant.name) {
      // 成功抽取到餐廳，建立 FlexMessage
      const flexMessage = await createRestaurantFlexMessage(restaurant);
      try {
        // 推播訊息
        const lineResponse = await sendLineMessage(targetGroupId, flexMessage);

        // 成功推播後，儲存或更新當日的抽籤歷史
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        await DrawHistory.findOneAndUpdate(
          {
            groupId: groupId,
            drawnAt: { $gte: startOfDay, $lte: endOfDay },
          },
          {
            restaurantId: restaurant._id,
            groupId: groupId,
            drawnAt: new Date(),
          },
          {
            upsert: true, // 如果找不到符合條件的紀錄，就新增一筆
            new: true, // 回傳更新後的文檔
          }
        );

        return res.status(200).json({
          message: '餐廳已抽取並成功推播 LINE 訊息。',
          restaurantName: restaurant.name,
          linePushStatus: 'Success',
          linePushResponse: lineResponse.data,
        });
      } catch (lineError) {
        const errorMessage = `LINE 推播失敗，群組ID: ${groupId}`;
        console.error(errorMessage, lineError.response ? lineError.response.data : lineError.message);
        await sendErrorEmail(errorMessage, lineError.stack || lineError);
        return res.status(500).json({
          message: '成功抽取餐廳，但 LINE 推播失敗。',
          restaurantName: restaurant.name,
          linePushStatus: 'Failed',
          errorDetails: lineError.response ? lineError.response.data : { message: lineError.message },
        });
      }
    } else {
      const clientUrl = process.env.CLIENT_URL;
      return res.status(400).json({ message: `沒有可以抽的餐廳，請先新增餐廳，並綁定至辦公室清單！\n👉 ${clientUrl}/?groupId=${groupId}` });
    }
  } catch (error) {
    const errorMessage = `每日午餐推播失敗，群組ID: ${groupId}`;
    console.error(errorMessage, error);
    await sendErrorEmail(errorMessage, error.stack || error);
    res.status(500).json({ message: '伺服器內部錯誤', error: error.message });
  }
});

export default router;

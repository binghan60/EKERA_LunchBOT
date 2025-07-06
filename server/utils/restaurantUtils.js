import mongoose from 'mongoose';
import GroupRestaurant from '../models/GroupRestaurant.js';
import Restaurant from '../models/Restaurant.js';
import axios from 'axios';

export async function drawRestaurant(groupId, office) {
  try {
    const groupRestaurants = await GroupRestaurant.find({
      groupId,
      office,
      isActiveInOffice: true,
    }).select('restaurantId');

    if (groupRestaurants.length === 0) {
      return null;
    }
    // 取得餐廳 ID 陣列
    const restaurantIds = groupRestaurants.map((gr) => new mongoose.Types.ObjectId(gr.restaurantId));
    // 使用 MongoDB aggregation 隨機抽餐廳
    const results = await Restaurant.aggregate([
      {
        $match: {
          _id: { $in: restaurantIds },
          isActive: true,
        },
      },
      {
        $sample: { size: 1 },
      },
    ]);

    if (results && results.length > 0) {
      return results[0];
    }
    return null;
  } catch (error) {
    console.error('Error in drawRestaurant:', error);
    throw error;
  }
}

// 🎨 主題模板
const ThemeList = [
  {
    name: 'MilkTea',
    header: '#B08968',
    body: '#FAF3E0',
    footer: '#FAF3E0',
    primaryBtn: '#A3C9A8',
    secondaryBtn: '#DDB892',
    titleText: '#6D6875',
    subText: '#8D8D8D',
  },
  {
    name: 'FreshGreen',
    header: '#88AB8E',
    body: '#EFF1EC',
    footer: '#EFF1EC',
    primaryBtn: '#A0C1B8',
    secondaryBtn: '#F4D58D',
    titleText: '#335C67',
    subText: '#7D7D7D',
  },
];

const WineDateTheme = {
  header: '#8B5E83',
  body: '#F4EDF2',
  footer: '#E6D6DD',
  primaryBtn: '#B67BA4',
  secondaryBtn: '#F1A9A0',
  titleText: '#4A2E38',
  subText: '#998D95',
};

export function createRestaurantFlexMessage(restaurant, options = {}) {
  const randomTheme = ThemeList[Math.floor(Math.random() * ThemeList.length)];

  const { title = '🎊 午餐轉盤結果 🎊', defaultImage = 'https://res.cloudinary.com/dtxauiukh/image/upload/w_1000,ar_1:1,c_fill,g_auto,e_art:hokusai/v1747128923/20240430184650-c091c8f9_jogmqt.jpg', showMapButton = true, showPhoneButton = true, theme = randomTheme } = options;

  const restaurantName = restaurant.name || '神秘究極料理';
  const displayAddress = restaurant?.address || '深山秘境，地址不明';
  const mapAddress = restaurant.address;
  const restaurantPhone = restaurant?.phone || '無人接聽，考驗默契';
  const restaurantImage = restaurant?.menu?.[0] || defaultImage;

  const footerButtons = [];

  if (showMapButton && mapAddress && typeof mapAddress === 'string' && mapAddress.trim() !== '') {
    footerButtons.push({
      type: 'button',
      style: 'primary',
      color: theme.primaryBtn,
      height: 'sm',
      action: {
        type: 'uri',
        label: '導航去吃！',
        uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapAddress)}`,
      },
    });
  }

  if (showPhoneButton && restaurantPhone && typeof restaurantPhone === 'string' && /^[0-9+()\-\s]+$/.test(restaurantPhone.trim())) {
    footerButtons.push({
      type: 'button',
      style: 'secondary',
      color: theme.secondaryBtn,
      height: 'sm',
      action: {
        type: 'uri',
        label: '馬上CALL！',
        uri: `tel:${restaurantPhone.trim()}`,
      },
    });
  }

  const flexContent = {
    type: 'bubble',
    size: 'giga',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: title,
          weight: 'bold',
          size: 'lg',
          color: '#FFEEDB',
          align: 'center',
        },
      ],
      paddingAll: 'lg',
    },
    hero: {
      type: 'image',
      url: restaurantImage,
      size: 'full',
      aspectRatio: '20:13',
      aspectMode: 'cover',
      action: {
        type: 'uri',
        label: '查看大圖',
        uri: restaurantImage,
      },
    },
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      contents: [
        {
          type: 'text',
          text: '🎯 就決定是你了...',
          size: 'sm',
          color: theme.subText,
          align: 'center',
        },
        {
          type: 'text',
          text: restaurantName,
          weight: 'bold',
          size: 'xxl',
          color: theme.titleText,
          align: 'center',
        },
        {
          type: 'separator',
          margin: 'lg',
          color: '#E6D5C0',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'icon',
                  url: 'https://cdn-icons-png.flaticon.com/512/3220/3220164.png',
                  size: 'sm',
                },
                {
                  type: 'text',
                  text: '地址：',
                  color: '#888888',
                  size: 'sm',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: displayAddress,
                  wrap: true,
                  color: '#444444',
                  size: 'sm',
                  flex: 5,
                },
              ],
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'icon',
                  url: 'https://cdn-icons-png.flaticon.com/512/3059/3059502.png',
                  size: 'sm',
                },
                {
                  type: 'text',
                  text: '電話：',
                  color: '#888888',
                  size: 'sm',
                  flex: 1,
                },
                {
                  type: 'text',
                  text: restaurantPhone,
                  wrap: true,
                  color: '#444444',
                  size: 'sm',
                  flex: 5,
                },
              ],
            },
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: footerButtons.length === 2 ? 'horizontal' : 'vertical',
      spacing: 'sm',
      contents:
        footerButtons.length > 0
          ? footerButtons
          : [
              {
                type: 'text',
                text: title,
                color: theme.header,
                size: 'sm',
                align: 'center',
                weight: 'bold',
              },
            ],
      paddingAll: 'md',
      flex: 0,
    },
    styles: {
      header: {
        backgroundColor: theme.header,
      },
      body: {
        backgroundColor: theme.body,
      },
      footer: {
        backgroundColor: theme.footer,
      },
    },
  };

  return {
    type: 'flex',
    altText: `今日午餐：${restaurantName}`,
    contents: flexContent,
  };
}

const LINE_CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN; // 從環境變數讀取
const LINE_PUSH_API_URL = 'https://api.line.me/v2/bot/message/push';

export async function sendLineMessage(toGroupId, message) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN is not defined. Please check environment variables.');
    throw new Error('LINE Channel Access Token is missing.');
  }

  const payload = {
    to: toGroupId,
    messages: [message],
  };

  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
  };

  return axios.post(LINE_PUSH_API_URL, payload, config);
}

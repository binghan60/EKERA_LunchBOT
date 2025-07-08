import express from 'express';
const router = express.Router();
import Restaurant from '../models/Restaurant.js';
import GroupRestaurant from '../models/GroupRestaurant.js';
import mongoose from 'mongoose';
import cloudinary from '../utils/cloudinary.js';
import upload from '../middleware/multer.js';
import sendErrorEmail from '../utils/sendEmail.js';

router.get('/', async (req, res) => {
  try {
    const groupId = req.query.groupId;
    if (!groupId) return res.status(400).json({ message: 'groupId 是必填參數' });

    const keyword = req.query.keyword || '';
    const filter = {
      groupId,
      ...(keyword && { name: new RegExp(keyword, 'i') }),
    };
    const restaurants = await Restaurant.find(filter);
    res.status(200).json(restaurants);
  } catch (error) {
    const errorMessage = `查詢餐廳列表時發生錯誤，群組ID: ${req.query.groupId}`;
    console.error(errorMessage, error);
    await sendErrorEmail(errorMessage, error.stack || error);
    res.status(500).json({ message: '查詢餐廳時發生錯誤', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const groupId = req.query.groupId;
    if (!groupId) return res.status(400).json({ message: 'groupId 是必填參數' });
    const restaurant = await Restaurant.findOne({ _id: req.params.id, groupId });
    if (!restaurant) return res.status(404).json({ message: '找不到餐廳' });

    res.status(200).json(restaurant);
  } catch (error) {
    const errorMessage = `查詢單一餐廳時發生錯誤，ID: ${req.params.id}`;
    console.error(errorMessage, error);
    await sendErrorEmail(errorMessage, error.stack || error);
    res.status(500).json({ message: '查詢餐廳時發生錯誤', error: error.message });
  }
});

router.post('/', upload.array('menu', 5), async (req, res) => {
  const { groupId, name } = req.body;
  try {
    const { address, phone, tags, isActive } = req.body;

    if (!groupId || !name) {
      return res.status(400).json({ message: 'groupId、name 為必填欄位' });
    }

    const exists = await Restaurant.findOne({ groupId, name });
    if (exists) {
      return res.status(409).json({ message: `'${exists.name}'餐廳已存在` });
    }

    // 上傳所有圖片到 Cloudinary
    const menuImageUrls = [];
    if (req.files) {
      for (const file of req.files) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ folder: `EKERA_Lunch_BOT/${groupId}` }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
          stream.end(file.buffer);
        });
        menuImageUrls.push(result.secure_url);
      }
    }

    const restaurant = new Restaurant({
      groupId,
      name,
      address,
      phone,
      tags,
      isActive,
      menu: menuImageUrls,
    });

    await restaurant.save();
    res.status(201).json({ message: '新增成功', restaurant });
  } catch (error) {
    const errorMessage = `新增餐廳時發生錯誤，群組ID: ${groupId}，名稱: ${name}`;
    console.error(errorMessage, error);
    await sendErrorEmail(errorMessage, error.stack || error);
    res.status(500).json({ message: '新增餐廳時發生錯誤', error: error.message });
  }
});

router.put('/:id', upload.array('menu', 5), async (req, res) => {
  const { id } = req.params;
  const { groupId, imagesToDelete, name, address, phone, tags, isActive } = req.body;
  try {
    if (!groupId) return res.status(400).json({ message: 'groupId 是必填欄位' });

    const isValidId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidId) return res.status(400).json({ message: '非法的餐廳 ID' });

    const restaurant = await Restaurant.findOne({ _id: id, groupId });
    if (!restaurant) return res.status(404).json({ message: '找不到餐廳或無權限編輯' });

    let currentMenu = restaurant.menu || [];

    let imagesToDeleteArray = [];
    if (imagesToDelete) {
      try {
        imagesToDeleteArray = JSON.parse(imagesToDelete);
        if (!Array.isArray(imagesToDeleteArray)) {
          imagesToDeleteArray = []; // Ensure it's an array even if parsing results in non-array
        }
      } catch (parseError) {
        console.warn('Failed to parse imagesToDelete JSON string:', parseError);
        imagesToDeleteArray = [];
      }
    }

    // 刪除指定的 Cloudinary 圖片
    if (imagesToDeleteArray.length > 0) {
      for (const url of imagesToDeleteArray) {
        const publicId = extractPublicId(url);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
            currentMenu = currentMenu.filter((item) => item !== url); // 從現有菜單中移除已刪除的圖片
          } catch (err) {
            const imageErrorMessage = `編輯時刪除 Cloudinary 圖片失敗: ${publicId}`;
            console.warn(imageErrorMessage, err);
            await sendErrorEmail(imageErrorMessage, err.stack || err);
          }
        }
      }
    }

    // 上傳所有新圖片到 Cloudinary
    const newMenuImageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ folder: `EKERA_Lunch_BOT/${groupId}` }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
          stream.end(file.buffer);
        });
        newMenuImageUrls.push(result.secure_url);
      }
    }

    // 合併現有圖片（已移除刪除的）與新上傳的圖片
    const updatedMenu = [...currentMenu, ...newMenuImageUrls];

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (tags !== undefined) updateData.tags = tags;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    updateData.menu = updatedMenu; // 總是更新 menu 欄位
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedRestaurant = await Restaurant.findOneAndUpdate({ _id: id, groupId }, { $set: updateData }, { new: true });

    if (!updatedRestaurant) return res.status(404).json({ message: '找不到餐廳或無權限編輯' });

    res.status(200).json({ message: '更新成功', restaurant: updatedRestaurant });
  } catch (error) {
    const errorMessage = `更新餐廳時發生錯誤，ID: ${id}`;
    console.error(errorMessage, error);
    await sendErrorEmail(errorMessage, error.stack || error);
    res.status(500).json({ message: '更新餐廳時發生錯誤', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { groupId } = req.body;
  const { id } = req.params;
  try {
    if (!groupId) {
      return res.status(400).json({ message: 'groupId 是必填欄位' });
    }

    // 找餐廳
    const restaurant = await Restaurant.findOne({ _id: id, groupId });
    if (!restaurant) {
      return res.status(404).json({ message: '找不到餐廳或無權限刪除' });
    }

    // 刪除 Cloudinary 圖片
    if (Array.isArray(restaurant.menu)) {
      for (const url of restaurant.menu) {
        const publicId = extractPublicId(url);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            // Log and email this specific error, but don't stop the whole process
            const imageErrorMessage = `刪除 Cloudinary 圖片失敗: ${publicId}`;
            console.warn(imageErrorMessage, err);
            await sendErrorEmail(imageErrorMessage, err.stack || err);
          }
        }
      }
    }

    // 刪除資料
    await Restaurant.deleteOne({ _id: id, groupId });
    // 刪除關聯資料
    await GroupRestaurant.deleteMany({ restaurantId: id, groupId });

    res.status(200).json({ message: '已成功刪除餐廳（包含菜單圖片與綁定紀錄）', restaurant });
  } catch (error) {
    const errorMessage = `刪除餐廳時發生錯誤，ID: ${id}`;
    console.error(errorMessage, error);
    await sendErrorEmail(errorMessage, error.stack || error);
    res.status(500).json({ message: '刪除餐廳時發生錯誤', error: error.message });
  }
});

function extractPublicId(url) {
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) {
    return null;
  }
  let startIndex = uploadIndex + '/upload/'.length;

  // Check for version part like v123/
  const versionMatch = url.substring(startIndex).match(/^v\d+\//);
  if (versionMatch) {
    startIndex += versionMatch[0].length;
  }

  const dotIndex = url.lastIndexOf('.');
  if (dotIndex === -1 || dotIndex < startIndex) {
    return null;
  }

  return url.substring(startIndex, dotIndex);
}

export default router;

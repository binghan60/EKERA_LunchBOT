import express from 'express';
const router = express.Router();
import GroupRestaurant from '../models/GroupRestaurant.js';
import GroupSetting from '../models/GroupSetting.js';
import sendErrorEmail from '../utils/sendEmail.js';

router.get('/:groupId', async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const results = await GroupRestaurant.find({ groupId }).populate('restaurantId').select('restaurantId office isActiveInOffice note');
    res.status(200).json(results);
  } catch (error) {
    const errorMessage = `查詢群組餐廳時發生錯誤，群組ID: ${req.params.groupId}`;
    console.error(errorMessage, error);
    await sendErrorEmail(errorMessage, error.stack || error);
    res.status(500).json({ message: '查詢群組餐廳時發生錯誤', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { groupId, office, restaurantId, isActiveInOffice = true, note } = req.body;

    if (!groupId || !office || !restaurantId) {
      return res.status(400).json({ error: 'groupId, office and restaurantId are required.' });
    }

    const existing = await GroupRestaurant.findOne({ groupId, office, restaurantId });
    if (existing) {
      return res.status(400).json({ error: 'This restaurant is already assigned to the office in this group.' });
    }

    const newGR = new GroupRestaurant({ groupId, office, restaurantId, isActiveInOffice, note });
    await newGR.save();
    res.status(201).json(newGR);
  } catch (error) {
    const errorMessage = '新增群組餐廳時發生錯誤';
    console.error(errorMessage, error);
    await sendErrorEmail(errorMessage, error.stack || error);
    res.status(500).json({ message: '新增群組餐廳時發生錯誤', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { office, isActiveInOffice, note } = req.body;

    const updateFields = {};
    if (office !== undefined) {
      updateFields.office = office;
    }
    if (isActiveInOffice !== undefined) {
      updateFields.isActiveInOffice = isActiveInOffice;
    }
    if (note !== undefined) {
      updateFields.note = note;
    }

    const groupRestaurant = await GroupRestaurant.findById(req.params.id);
    if (!groupRestaurant) {
      return res.status(404).json({ message: 'Group restaurant not found' });
    }

    if (office !== undefined) {
      const groupSetting = await GroupSetting.findOne({ groupId: groupRestaurant.groupId });
      if (!groupSetting || !groupSetting.officeOption.includes(office)) {
        return res.status(400).json({ message: `${office} 不在群組辦公室列表中` });
      }
    }

    const updated = await GroupRestaurant.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true });

    res.status(200).json(updated);
  } catch (error) {
    const errorMessage = `更新群組餐廳時發生錯誤，ID: ${req.params.id}`;
    console.error(errorMessage, error);
    await sendErrorEmail(errorMessage, error.stack || error);
    res.status(500).json({ message: '更新群組餐廳時發生錯誤', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await GroupRestaurant.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Group restaurant not found' });
    }
    res.status(200).json({ message: 'Group restaurant deleted' });
  } catch (error) {
    const errorMessage = `刪除群組餐廳時發生錯誤，ID: ${req.params.id}`;
    console.error(errorMessage, error);
    await sendErrorEmail(errorMessage, error.stack || error);
    res.status(500).json({ message: '刪除群組餐廳時發生錯誤', error: error.message });
  }
});

export default router;

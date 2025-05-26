const express = require('express');
const router = express.Router();
const GroupSetting = require('../models/GroupSetting');
const GroupRestaurant = require('../models/GroupRestaurant');

router.get('/:id', async (req, res) => {
  const groupId = req.params.id;

  if (!groupId) {
    return res.status(400).send('請提供 groupId');
  }

  try {
    const groupSetting = await GroupSetting.findOne({ groupId });
    if (!groupSetting) {
      return res.status(404).send('找不到該群組設定');
    }
    res.status(200).json(groupSetting);
  } catch (err) {
    console.error('讀取群組設定失敗：', err);
    res.status(500).send('伺服器錯誤');
  }
});

router.post('/', async (req, res) => {
  const { groupId, lunchNotification, currentOffice, officeOption } = req.body;

  if (!groupId || !currentOffice || !Array.isArray(officeOption)) {
    return res.status(400).send('請確認 groupId、currentOffice 與 officeOption 是否正確填寫');
  }
  if (!officeOption.includes(currentOffice)) {
    return res.status(400).send('currentOffice 必須包含在 officeOption 裡');
  }

  try {
    const existing = await GroupSetting.findOne({ groupId });
    if (existing) {
      return res.status(400).send('該群組已經設定過囉！');
    }

    const newSetting = new GroupSetting({
      groupId,
      lunchNotification: lunchNotification ?? false,
      currentOffice,
      officeOption,
    });

    await newSetting.save();
    res.status(201).json(newSetting);
  } catch (err) {
    console.error('建立群組設定失敗：', err);
    res.status(500).send('伺服器錯誤');
  }
});

router.put('/:id', async (req, res) => {
  const groupId = req.params.id;
  const { lunchNotification, currentOffice, officeOption } = req.body;

  if (!groupId) {
    return res.status(400).send('請提供 groupId');
  }

  const groupSetting = await GroupSetting.findOne({ groupId });
  if (!groupSetting) {
    return res.status(404).send('找不到該群組設定');
  }

  if (officeOption && currentOffice && !officeOption.includes(currentOffice)) {
    return res.status(400).send('currentOffice 必須包含在 officeOption 裡');
  }
  if (!groupSetting.officeOption.includes(currentOffice)) {
    return res.status(400).send('currentOffice 必須包含在 officeOption 裡');
  }

  const updateFields = {};
  if (lunchNotification !== undefined) updateFields.lunchNotification = lunchNotification;
  if (currentOffice !== undefined) updateFields.currentOffice = currentOffice;
  if (officeOption !== undefined) updateFields.officeOption = officeOption;

  try {
    // 找出被移除的辦公室
    let removedOffices = [];
    if (officeOption !== undefined) {
      removedOffices = groupSetting.officeOption.filter((office) => !officeOption.includes(office));
    }

    // 更新 GroupSetting
    const updated = await GroupSetting.findOneAndUpdate({ groupId }, { $set: updateFields }, { new: true });

    // 刪除對應 GroupRestaurant
    if (removedOffices.length > 0) {
      await GroupRestaurant.deleteMany({
        groupId,
        office: { $in: removedOffices },
      });
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error('更新群組設定失敗：', err);
    res.status(500).send('伺服器錯誤');
  }
});

module.exports = router;

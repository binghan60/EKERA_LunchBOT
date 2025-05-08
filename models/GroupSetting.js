const mongoose = require('mongoose');

const groupSettingSchema = new mongoose.Schema({
    groupId: { type: String, required: true, unique: true }, // 群組 ID
    currentOffice: { type: String, required: true }, // 目前使用的地點
    officeOption: { type: [String], default: [] }, // 可選的地點選項（陣列）
    updatedAt: { type: Date, default: Date.now }, // 最後更新時間
});

module.exports = mongoose.model('GroupSetting', groupSettingSchema);

const mongoose = require('mongoose');

const groupSettingSchema = new mongoose.Schema({
    groupId: { type: String, required: true, unique: true }, // 群組 ID
    currentOffice: { type: String, required: true }, // 目前使用的地點
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('GroupSetting', groupSettingSchema);

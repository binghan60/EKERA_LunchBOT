import mongoose from 'mongoose';

const groupSettingSchema = new mongoose.Schema(
    {
        groupId: { type: String, required: true, unique: true },
        lunchNotification: { type: Boolean, default: false },
        currentOffice: { type: String, default: 'default', required: true },
        officeOption: { type: [String], default: [] },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('GroupSetting', groupSettingSchema);

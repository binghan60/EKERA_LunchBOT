const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
    {
        groupId: { type: String, require: true },
        name: { type: String, required: true },
        menu: [{ type: String, default: '' }],
        address: { type: String, default: '' },
        phone: { type: String, default: '' },
        tags: [{ type: String, default: [] }],
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
    }
);
restaurantSchema.index({ name: 1, address: 1 }, { unique: true });
module.exports = mongoose.model('Restaurant', restaurantSchema);

const mongoose = require('mongoose');

const groupRestaurantSchema = new mongoose.Schema({
    groupId: { type: String, required: true }, // 群組 ID
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    addedBy: String,
    note: String,
    addedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('GroupRestaurant', groupRestaurantSchema);

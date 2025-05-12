const mongoose = require('mongoose');

const groupRestaurantSchema = new mongoose.Schema({
    groupId: { type: String, required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    office: { type: String, required: true },
    addedBy: String,
    note: String,
    addedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('GroupRestaurant', groupRestaurantSchema);

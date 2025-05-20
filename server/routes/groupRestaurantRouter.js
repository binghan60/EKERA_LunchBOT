const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const GroupRestaurant = require('../models/GroupRestaurant');

router.get('/:groupId', async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const restaurants = await GroupRestaurant.find({ groupId }).populate('restaurantId').select('restaurantId');
        res.status(200).json(restaurants);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching group restaurants', error });
    }
});

module.exports = router;

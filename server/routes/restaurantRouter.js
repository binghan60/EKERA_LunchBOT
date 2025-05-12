const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');

router.get('/', async (req, res) => {
    try {
        const restaurants = await restaurant.find();
        res.status(200).json(restaurants);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching restaurants', error });
    }
});
router.post('/add', async (req, res) => {
    res.send('Add restaurant endpoint');
});

module.exports = router;

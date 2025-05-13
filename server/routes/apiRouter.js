// apiRoutes.js
const express = require('express');
const restaurantRoutes = require('./restaurantRouter');
const groupSettingRoutes = require('./groupSettingRouter.js');
const randomRestaurantRoutes = require('./randomRestaurantRouter.js');
const router = express.Router();
router.use(express.json());
router.use('/group-settings', groupSettingRoutes);
router.use('/restaurant', restaurantRoutes);
router.use('/random-restaurant', randomRestaurantRoutes);

module.exports = router;

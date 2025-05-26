// apiRoutes.js
const express = require('express');
const restaurantRoutes = require('./restaurantRouter');
const groupSettingRoutes = require('./groupSettingRouter.js');
const randomRestaurantRoutes = require('./randomRestaurantRouter.js');
const groupRestaurantRoutes = require('./groupRestaurantRouter.js');
const router = express.Router();
router.use(express.json());
router.use('/group-setting', groupSettingRoutes);
router.use('/restaurant', restaurantRoutes);
router.use('/random-restaurant', randomRestaurantRoutes);
router.use('/group-restaurant', groupRestaurantRoutes);

module.exports = router;

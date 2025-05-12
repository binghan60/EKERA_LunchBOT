// apiRoutes.js
const express = require('express');
const restaurantRoutes = require('./restaurantRouter');
const groupSettingRoutes = require('./groupSettingRouter.js');

const router = express.Router();
router.use(express.json());
router.use('/group-settings', groupSettingRoutes);
router.use('/restaurant', restaurantRoutes);

module.exports = router;

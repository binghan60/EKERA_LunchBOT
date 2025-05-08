// apiRoutes.js
const express = require('express');
const restaurantRoutes = require('./routes/restaurantRouter.js');
const groupSettingRoutes = require('./routes/groupSettingRouter.js');

const router = express.Router();

router.use('/group-settings', groupSettingRoutes);
router.use('/restaurant', restaurantRoutes);

module.exports = router;
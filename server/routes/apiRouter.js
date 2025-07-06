// apiRoutes.js
import express from 'express';
import restaurantRoutes from './restaurantRouter.js';
import groupSettingRoutes from './groupSettingRouter.js';
import randomRestaurantRoutes from './randomRestaurantRouter.js';
import groupRestaurantRoutes from './groupRestaurantRouter.js';
const router = express.Router();
router.use(express.json());
router.use('/group-setting', groupSettingRoutes);
router.use('/restaurant', restaurantRoutes);
router.use('/random-restaurant', randomRestaurantRoutes);
router.use('/group-restaurant', groupRestaurantRoutes);

export default router;

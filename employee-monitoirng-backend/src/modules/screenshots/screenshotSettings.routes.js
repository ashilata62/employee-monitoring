const express = require('express');
const router = express.Router();
const screenshotSettingsController = require('./screenshotSettings.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

// All screenshot settings routes require authentication
router.use(authMiddleware);

router.get('/', screenshotSettingsController.getSettings);
router.patch('/', roleMiddleware(['ADMIN', 'MANAGER']), screenshotSettingsController.updateSettings);

module.exports = router;

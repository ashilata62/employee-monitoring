const express = require('express');
const router = express.Router();
const trackingController = require('./tracking.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

router.use(authMiddleware);

// Agent uploads
router.post('/upload', trackingController.upload);

// History
router.get('/history/:employeeId', trackingController.getHistory);

// Profiles CRUD
router.get('/profiles', trackingController.getProfiles);
router.post('/profiles', roleMiddleware(['ADMIN', 'MANAGER']), trackingController.createProfile);
router.put('/profiles/:id', roleMiddleware(['ADMIN', 'MANAGER']), trackingController.updateProfile);
router.delete('/profiles/:id', roleMiddleware(['ADMIN', 'MANAGER']), trackingController.deleteProfile);

// Advanced tracking settings
router.get('/advanced', trackingController.getAdvancedSettings);
router.put('/advanced', roleMiddleware(['ADMIN', 'MANAGER']), trackingController.updateAdvancedSettings);

module.exports = router;

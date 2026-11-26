const express = require('express');
const router = express.Router();
const locationController = require('./location.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

router.post('/track', authMiddleware, locationController.track);
router.get('/live', authMiddleware, roleMiddleware(['ADMIN', 'MANAGER']), locationController.getLive);
// Maintain legacy /employee/:id and add new alias /:employeeId as requested by user
router.get('/employee/:id', authMiddleware, roleMiddleware(['ADMIN', 'MANAGER']), locationController.getHistory);
router.get('/:employeeId', authMiddleware, roleMiddleware(['ADMIN', 'MANAGER']), locationController.getHistory);

module.exports = router;

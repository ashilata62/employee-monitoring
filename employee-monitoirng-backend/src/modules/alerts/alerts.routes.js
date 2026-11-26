const express = require('express');
const router = express.Router();
const alertsController = require('./alerts.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

router.use(authMiddleware);

// Alert History & Dismissal / Deletion
router.get('/history', alertsController.getAlertHistory);
router.delete('/history/delete-all', roleMiddleware(['ADMIN', 'MANAGER']), alertsController.deleteAllAlerts);
router.delete('/history/:id', roleMiddleware(['ADMIN', 'MANAGER']), alertsController.deleteAlert);
router.delete('/history', roleMiddleware(['ADMIN', 'MANAGER']), alertsController.deleteAllAlerts);
router.patch('/dismiss-all', roleMiddleware(['ADMIN', 'MANAGER']), alertsController.dismissAllAlerts);
router.patch('/:id/dismiss', roleMiddleware(['ADMIN', 'MANAGER']), alertsController.dismissAlert);

// Rules
router.get('/rules', alertsController.getAlertRules);
router.post('/rules', roleMiddleware(['ADMIN', 'MANAGER']), alertsController.createAlertRule);
router.put('/rules/:id', roleMiddleware(['ADMIN', 'MANAGER']), alertsController.updateAlertRule);
router.delete('/rules/:id', roleMiddleware(['ADMIN', 'MANAGER']), alertsController.deleteAlertRule);

// Settings
router.get('/settings', roleMiddleware(['ADMIN', 'MANAGER']), alertsController.getSettings);
router.put('/settings', roleMiddleware(['ADMIN', 'MANAGER']), alertsController.updateSettings);

module.exports = router;

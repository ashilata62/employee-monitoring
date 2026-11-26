const express = require('express');
const router = express.Router();
const projectsController = require('./projects.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

// All project routes require authentication
router.use(authMiddleware);

router.post('/', roleMiddleware(['ADMIN', 'MANAGER']), projectsController.createProject);
router.get('/', projectsController.getProjects);
router.post('/assign', roleMiddleware(['ADMIN', 'MANAGER']), projectsController.assignEmployees);
router.post('/log-time', projectsController.logTime);
router.put('/:id', roleMiddleware(['ADMIN', 'MANAGER']), projectsController.updateProject);
router.delete('/:id', roleMiddleware(['ADMIN', 'MANAGER']), projectsController.deleteProject);

module.exports = router;

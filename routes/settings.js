const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const authenticateToken = require('../middleware/auth');

// Public route - must be defined BEFORE authentication middleware
router.get('/public', settingController.getPublicSettings);

// All routes after this middleware will require authentication
router.use(authenticateToken);

// Protected routes
router.get('/', settingController.getAllSettings);
router.post('/', settingController.updateSetting);
router.get('/next-cohort', settingController.getNextCohortDate);

module.exports = router;

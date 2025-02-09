const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateToken = require('../middleware/auth');

// Auth routes
router.post('/login', adminController.login);
router.get('/dashboard-stats', authenticateToken, adminController.getDashboardStats);

// Application management routes
router.get('/applications', authenticateToken, adminController.getApplications);
router.put('/applications/:id', authenticateToken, adminController.updateApplicationStatus);
router.get('/cohorts/upcoming', authenticateToken, adminController.getUpcomingCohorts);
router.put('/applications/:id/cohort', authenticateToken, adminController.updateApplicationCohort);
router.get('/cohorts/stats', authenticateToken, adminController.getCohortStats);

module.exports = router; 
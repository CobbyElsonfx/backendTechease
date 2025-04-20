const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateToken = require('../middleware/auth');

// Auth routes
router.post('/login', adminController.login);
router.get('/verify-token', authenticateToken, adminController.verifyToken);

// Protected routes
router.use(authenticateToken);
router.get('/dashboard-stats', adminController.getDashboardStats);

// Application management routes
router.get('/applications', adminController.getApplications);
router.put('/applications/:id', adminController.updateApplicationStatus);
router.get('/cohorts/upcoming', adminController.getUpcomingCohorts);
router.put('/applications/:id/cohort', adminController.updateApplicationCohort);
router.get('/cohorts/stats', adminController.getCohortStats);

module.exports = router; 
const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const auth = require('../middleware/auth');

// Public routes
router.post('/submit', applicationController.createApplication);

// Admin routes (protected)
router.get('/all', auth, applicationController.getAllApplications);
router.put('/review/:applicationId', auth, applicationController.reviewApplication);
router.post('/update-payment-status', auth, applicationController.updatePaymentStatus);

module.exports = router;  
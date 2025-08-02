const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const authenticateToken = require('../middleware/auth');

// Public routes
router.post('/register', agentController.register);
router.post('/login', agentController.login);
router.get('/suggestions', agentController.getReferralCodeSuggestions);

// Protected routes
router.get('/verify-token', authenticateToken, agentController.verifyToken);
router.get('/stats', authenticateToken, agentController.getStats);
router.get('/admin/all', agentController.getAllAgents);
router.post('/pay-commission', authenticateToken, agentController.payCommission);

module.exports = router; 
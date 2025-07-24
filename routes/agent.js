const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const authenticateToken = require('../middleware/auth');

// Public routes
router.post('/register', agentController.register);
router.post('/login', agentController.login);

// Protected route for agent stats
router.get('/stats', authenticateToken, agentController.getStats);
router.get('/admin/all', agentController.getAllAgents);

module.exports = router; 
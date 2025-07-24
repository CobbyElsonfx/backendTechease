const express = require('express');
const router = express.Router();
const { sendEmail, sendAdminNotification, sendApplicationAcknowledgment, scheduleAdmissionLetter } = require('../utils/emailService');
const Application = require('../models/Application');
const Setting = require('../models/Setting');
const applicationController = require('../controllers/applicationController');

router.post('/submit', applicationController.createApplication);

module.exports = router;  
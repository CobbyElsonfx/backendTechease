const express = require('express');
const router = express.Router();
const { sendEmail, sendAdminNotification } = require('../utils/emailService');

router.post('/submit', async (req, res) => {
  try {
    const { email, firstName, lastName, selectedCourse, applicationData } = req.body;

    // Send PDF confirmation to student
    await sendEmail({
      to: email,
      firstName,
      selectedCourse
    });

    // Send simple notification to admin using Handlebars template
    await sendAdminNotification({
      to: process.env.ADMIN_EMAIL,
      subject: 'New Course Application Received',
      template: 'admin-notification',
      data: {
        firstName,
        lastName,
        email,
        selectedCourse,
        ...applicationData
      }
    });

    res.json({ 
      status: 'success',
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({ 
      status: 'error',
      message: error.message || 'Failed to process application'
    });
  }
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const { sendEmail } = require('../utils/emailService');

router.post('/send-email', async (req, res) => {
  try {
    const { to, name, course } = req.body;

    if (!to || !name || !course) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields'
      });
    }

    await sendEmail({
      to,
      subject: `Welcome to Teachease Africa, ${name}!`,
      template: 'student-confirmation',
      data: {
        name,
        courseName: course
      }
    });

    res.json({
      status: 'success',
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send email'
    });
  }
});

module.exports = router; 
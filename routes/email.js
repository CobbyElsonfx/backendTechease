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

// Newsletter subscription route
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required'
      });
    }

    // TODO: Add email to your newsletter database/CRM
    // For now, we'll just send a confirmation email
    await sendEmail({
      to: email,
      subject: 'Welcome to Teachease Africa Newsletter!',
      template: 'newsletter-welcome',
      data: {
        email
      }
    });

    res.json({
      status: 'success',
      message: 'Successfully subscribed to newsletter'
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to subscribe to newsletter'
    });
  }
});

module.exports = router; 
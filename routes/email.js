const express = require('express');
const router = express.Router();
const { sendEmail, sendNewsletterSubscriptionEmail , sendContactEmail} = require('../utils/emailService');
const NewsletterSubscription = require('../models/NewsletterSubscription');

router.post('/send-email', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required'
      });
    }

    await sendContactEmail({
      to: 'techeaseAfrica@gmail.com', // Your business email
      name,
      email,
      subject,
      message
    });

    res.json({
      status: 'success',
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Error sending email:', error);
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

    // Check if email already exists in the database
    const existingSubscription = await NewsletterSubscription.findOne({ email });
    if (existingSubscription) {
      return res.status(200).json({
        status: 'success',
        message: 'Email already subscribed'
      });
    }
    // If email does not exist, add it to the database
    const newSubscription = new NewsletterSubscription({ email });
    await newSubscription.save();


    // For now, we'll just send a confirmation email
    await sendNewsletterSubscriptionEmail({
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
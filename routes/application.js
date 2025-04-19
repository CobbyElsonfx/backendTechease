const express = require('express');
const router = express.Router();
const { sendEmail, sendAdminNotification } = require('../utils/emailService');
const Application = require('../models/Application');
const Setting = require('../models/Setting');

router.post('/submit', async (req, res) => {
  try {
    console.log('Received application submission:', req.body);
    
    const { email, firstName, lastName, selectedCourse, applicationData } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName || !selectedCourse) {
      console.log('Missing required fields:', { email, firstName, lastName, selectedCourse });
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields'
      });
    }

    // Get next cohort date from settings
    const settings = await Setting.findOne({});
    if (!settings || !settings.nextCohortDate) {
      return res.status(500).json({
        status: 'error',
        message: 'Next cohort date not configured'
      });
    }

    // Create new application record
    const application = new Application({
      firstName,
      lastName,
      email,
      selectedCourse,
      status: 'pending',
      applicationDate: new Date(),
      lastModified: new Date(),
      cohortStartDate: settings.nextCohortDate,
      cohortEndDate: new Date(new Date(settings.nextCohortDate).getTime() + (8 * 7 * 24 * 60 * 60 * 1000)) // 8 weeks from start date
    });

    // Save application to database
    try {
      await application.save();
      console.log('Application saved to database:', application._id);
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to save application to database'
      });
    }

    // Send PDF confirmation to student
    try {
      await sendEmail({
        to: email,
        firstName,
        selectedCourse
      });
      console.log('Confirmation email sent to student');
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the request if email fails
    }

    // Send notification to admin
    try {
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
      console.log('Admin notification sent');
    } catch (notificationError) {
      console.error('Admin notification error:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({ 
      status: 'success',
      message: 'Application submitted successfully',
      applicationId: application._id
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
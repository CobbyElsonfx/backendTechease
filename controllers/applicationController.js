const applicationController = {
  createApplication: async (req, res) => {
    try {
      console.log('Received application submission:', req.body);
      
      const { email, firstName, lastName, selectedCourse, applicationData, referralCode } = req.body;
  
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
  
      // Prepare agent association if referralCode is provided
      let agent = null;
      if (referralCode) {
        const Agent = require('../models/Agent');
        agent = await Agent.findOne({ referralCode });
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
        cohortEndDate: new Date(new Date(settings.nextCohortDate).getTime() + (8 * 7 * 24 * 60 * 60 * 1000)), // 8 weeks from start date
        agent: agent ? agent._id : undefined
      });
  
      // Save application to database
      try {
        await application.save();
        console.log('Application saved to database:', application._id);
        // If agent exists, increment stats
        if (agent) {
          const commissionAmount = 50; 
          agent.totalReferrals += 1;
          agent.totalCommission += commissionAmount;
          await agent.save();
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to save application to database'
        });
      }
  
      // Send initial acknowledgment email
      try {
        await sendApplicationAcknowledgment({
          to: email,
          firstName,
          selectedCourse
        });
        console.log('Initial acknowledgment email sent to student');
      } catch (acknowledgmentError) {
        console.error('Acknowledgment email error:', acknowledgmentError);
        // Don't fail the request if email fails
      }
  
      // Schedule admission letter to be sent in 30 minutes
      try {
        scheduleAdmissionLetter({
          to: email,
          firstName,
          selectedCourse
        });
        console.log('Admission letter scheduled to be sent in 30 minutes');
      } catch (schedulingError) {
        console.error('Scheduling error:', schedulingError);
        // Don't fail the request if scheduling fails
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
        message: 'Application submitted successfully. Please check your email for next steps.',
        applicationId: application._id,
        redirectUrl: '/application-success'
      });
    } catch (error) {
      console.error('Application submission error:', error);
      res.status(500).json({ 
        status: 'error',
        message: error.message || 'Failed to process application'
      });
    }
  }
};


module.exports = applicationController;
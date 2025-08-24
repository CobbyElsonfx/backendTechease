const { sendEmail, sendAdminNotification, sendApplicationAcknowledgment, sendRejectionEmail } = require('../utils/emailService');
const Application = require('../models/Application');
const Setting = require('../models/Setting');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
 
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads/student-cards';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'student-card-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed!'));
    }
  }
}).single('studentIdCard');

const applicationController = {
  createApplication: async (req, res) => {
    upload(req, res, async function(err) {
      if (err) {
        return res.status(400).json({
          status: 'error',
          message: err.message
        });
      }

      try {
        console.log('Received application submission:', req.body);
        
        const { 
          email, 
          firstName, 
          lastName, 
          otherName,
          whatsappNumber,
          country,
          educationLevel,
          selectedCourse, 
          referralCode,
          isStudent,
          scholarshipReason,
          applicationRef
        } = req.body;

        // Validate required fields
        if (!email || !firstName || !lastName || !selectedCourse || !scholarshipReason) {
          console.log('Missing required fields:', { email, firstName, lastName, selectedCourse, scholarshipReason });
          return res.status(400).json({
            status: 'error',
            message: 'Missing required fields'
          });
        }

        // Check if email has already been used for an application
        const existingApplication = await Application.findOne({ email: email.toLowerCase() });
        if (existingApplication) {
          return res.status(409).json({
            status: 'error',
            message: 'An application with this email address already exists. Each email can only be used once for course applications.'
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

        // Handle student ID card upload
        let studentIdCardPath = null;
        if (isStudent === 'true' && req.file) {
          studentIdCardPath = req.file.path;
        }

        // Create new application record
        const application = new Application({
          firstName,
          lastName,
          otherName: otherName || '',
          email: email.toLowerCase(),
          whatsappNumber,
          country,
          educationLevel,
          selectedCourse,
          status: 'pending', // Applications start as pending for admin review
          applicationDate: new Date(),
          lastModified: new Date(),
          cohortStartDate: settings.nextCohortDate,
          cohortEndDate: new Date(new Date(settings.nextCohortDate).getTime() + (8 * 7 * 24 * 60 * 60 * 1000)), // 8 weeks from start date
          agent: agent ? agent._id : undefined,
          isStudent: isStudent === 'true',
          studentIdCard: studentIdCardPath,
          scholarshipReason,
          applicationRef
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

        // Send initial acknowledgment email (no admission letter yet)
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

        // Send notification to admin about new application
        try {
          await sendAdminNotification({
            to: process.env.ADMIN_EMAIL || 'admin@trainova.africa',
            subject: 'New Application Submitted',
            template: 'admin-notification',
            data: {
              applicationRef,
              firstName,
              lastName,
              email,
              selectedCourse,
              isStudent: isStudent === 'true',
              country
            }
          });
          console.log('Admin notification sent');
        } catch (adminError) {
          console.error('Admin notification error:', adminError);
          // Don't fail the request if admin notification fails
        }

        res.status(201).json({
          status: 'success',
          message: 'Application submitted successfully. You will be notified once your application is reviewed.',
          applicationRef
        });

      } catch (error) {
        console.error('Application submission error:', error);
        res.status(500).json({
          status: 'error',
          message: 'Failed to submit application. Please try again.'
        });
      }
    });
  },

  // New method to approve/reject applications
  reviewApplication: async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { status, reviewNotes } = req.body;
      const adminId = req.user.id; // Assuming admin is authenticated

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid status. Must be either "approved" or "rejected"'
        });
      }

      const application = await Application.findById(applicationId);
      if (!application) {
        return res.status(404).json({
          status: 'error',
          message: 'Application not found'
        });
      }

      // Update application status
      application.status = status;
      application.reviewedBy = adminId;
      application.reviewedAt = new Date();
      application.reviewNotes = reviewNotes || '';

      await application.save();

      // Send appropriate email based on status
      if (status === 'approved') {
        // Send admission letter
        try {
          await sendEmail({
            to: application.email,
            firstName: application.firstName,
            selectedCourse: application.selectedCourse
          });
          console.log('Admission letter sent to approved applicant');
        } catch (emailError) {
          console.error('Admission letter error:', emailError);
        }
      } else {
        // Send rejection email
        try {
          await sendRejectionEmail({
            to: application.email,
            firstName: application.firstName,
            selectedCourse: application.selectedCourse,
            reviewNotes
          });
          console.log('Rejection email sent');
        } catch (emailError) {
          console.error('Rejection email error:', emailError);
        }
      }

      res.json({
        status: 'success',
        message: `Application ${status} successfully`,
        application
      });

    } catch (error) {
      console.error('Application review error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to review application'
      });
    }
  },

  // New method to update payment status
  updatePaymentStatus: async (req, res) => {
    try {
      const { applicationId, paymentStatus } = req.body;
      const adminId = req.user.id; // Assuming admin is authenticated

      if (!applicationId) {
        return res.status(400).json({
          status: 'error',
          message: 'Application ID is required'
        });
      }

      if (!['paid', 'unpaid'].includes(paymentStatus)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid payment status. Must be either "paid" or "unpaid"'
        });
      }

      const application = await Application.findById(applicationId);
      if (!application) {
        return res.status(404).json({
          status: 'error',
          message: 'Application not found'
        });
      }

      // Update payment status
      application.paymentStatus = paymentStatus;
      application.lastModified = new Date();

      await application.save();

      res.json({
        status: 'success',
        message: `Payment status updated to ${paymentStatus} successfully`,
        application
      });

    } catch (error) {
      console.error('Payment status update error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update payment status'
      });
    }
  },

  // Get all applications for admin review
  getAllApplications: async (req, res) => {
    try {
      const applications = await Application.find()
        .populate('agent', 'name email')
        .populate('reviewedBy', 'name')
        .sort({ createdAt: -1 });

      res.json({
        status: 'success',
        applications
      });
    } catch (error) {
      console.error('Get applications error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch applications'
      });
    }
  }
};

module.exports = applicationController;
const Admin = require('../models/Admin');
const Application = require('../models/Application');
const Course = require('../models/Course');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Add validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Debug log
    console.log('Login attempt for:', email);

    const admin = await Admin.findOne({ email });

    if (!admin) {
      console.log('Admin not found:', email);
      return res.status(401).json({ 
        message: 'Invalid credentials' 
      });
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    
    if (!isValidPassword) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ 
        message: 'Invalid credentials' 
      });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send response
    res.json({
      token,
      user: {
        id: admin._id,
        email: admin.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login',
      error: error.message 
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalApplications = await Application.countDocuments();
    const totalStudents = await Application.countDocuments({ status: 'accepted' });
    const activeCourses = await Course.countDocuments();

    res.json({
      totalApplications,
      totalStudents,
      activeCourses
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics' });
  }
};

exports.getApplications = async (req, res) => {
  try {
    const applications = await Application.find().sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching applications' });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const application = await Application.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Error updating application status' });
  }
};

// Get upcoming cohorts
exports.getUpcomingCohorts = async (req, res) => {
  try {
    const upcomingCohorts = await Application.getUpcomingCohorts();
    res.json(upcomingCohorts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching upcoming cohorts' });
  }
};

// Update application with cohort dates
exports.updateApplicationCohort = async (req, res) => {
  try {
    const { id } = req.params;
    const { cohortStartDate } = req.body;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.cohortStartDate = new Date(cohortStartDate);
    application.calculateEndDate(); // This will set the end date automatically
    await application.save();

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Error updating cohort dates' });
  }
};

// Get cohort statistics
exports.getCohortStats = async (req, res) => {
  try {
    const currentDate = new Date();
    const stats = await Application.aggregate([
      {
        $facet: {
          'currentCohort': [
            {
              $match: {
                cohortStartDate: { $lte: currentDate },
                cohortEndDate: { $gte: currentDate }
              }
            },
            { $count: 'count' }
          ],
          'upcomingCohorts': [
            {
              $match: {
                cohortStartDate: { $gt: currentDate }
              }
            },
            { $count: 'count' }
          ],
          'completedCohorts': [
            {
              $match: {
                cohortEndDate: { $lt: currentDate }
              }
            },
            { $count: 'count' }
          ]
        }
      }
    ]);

    res.json({
      currentCohort: stats[0].currentCohort[0]?.count || 0,
      upcomingCohorts: stats[0].upcomingCohorts[0]?.count || 0,
      completedCohorts: stats[0].completedCohorts[0]?.count || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cohort statistics' });
  }
}; 
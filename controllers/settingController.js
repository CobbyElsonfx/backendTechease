const Setting = require('../models/Setting');

// Get all settings
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await Setting.find();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings' });
  }
};

// Update or create setting
exports.updateSetting = async (req, res) => {
  try {
    const { nextCohortDate, courseDuration, sessionFrequency, applicationDeadline } = req.body;
    console.log("req.body", req.body);
   
    // Validate date format for nextCohortDate
    if (nextCohortDate) {
      const date = new Date(nextCohortDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: 'Invalid next cohort start date format. Please provide a valid date' });
      }
    }

    // Find the existing setting or create a new one
    const setting = await Setting.findOneAndUpdate(
      {}, // Empty filter to find any document
      {
        nextCohortDate: nextCohortDate ? new Date(nextCohortDate) : undefined,
        courseDuration,
        sessionFrequency,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : undefined
      },
      { 
        upsert: true, 
        new: true, 
        runValidators: true,
        setDefaultsOnInsert: true 
      }
    );
    
    res.json(setting);
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: error.message });
    } else {
      console.error('Error updating settings:', error);
      res.status(500).json({ message: 'Error updating setting' });
    }
  }
};

// Get setting by key
exports.getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await Setting.findOne({ key });
    
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching setting' });
  }
};

// Get next cohort date
exports.getNextCohortDate = async (req, res) => {
  try {
    const nextCohortDate = await Setting.getNextCohortDate();
    if (!nextCohortDate) {
      return res.status(404).json({ message: 'Next cohort date not set' });
    }
    res.json({ nextCohortDate });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching next cohort date' });
  }
};

// Initialize default settings
exports.initializeSettings = async (req, res) => {
  try {
    await Setting.initializeDefaultSettings();
    res.json({ message: 'Settings initialized successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error initializing settings' });
  }
};

// Add this new method to your existing controller
exports.getPublicSettings = async (req, res) => {
  try {
    // Only return specific public settings
    const publicSettings = await Setting.find({
      key: { $in: ['nextCohortDate', 'applicationDeadline'] }
    });
    res.json(publicSettings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching public settings' });
  }
}; 
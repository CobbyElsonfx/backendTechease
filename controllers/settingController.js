const Setting = require('../models/Setting');

const defaultSettings = {
  nextCohortDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
  courseDuration: '8 weeks',
  sessionFrequency: 'twice per week',
  applicationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
  maxStudentsPerCohort: 100
};

const settingController = {
  // Get all settings
  getAllSettings: async (req, res) => {
    try {
      let settings = await Setting.findOne({});
      if (!settings) {
        settings = await Setting.create(defaultSettings);
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get public settings
  getPublicSettings: async (req, res) => {
    try {
      let settings = await Setting.findOne({});
      if (!settings) {
        settings = await Setting.create(defaultSettings);
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Update settings
  updateSetting: async (req, res) => {
    try {
      const updatedSettings = await Setting.updateSettings(req.body);
      res.json(updatedSettings);
  } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

// Get next cohort date
  getNextCohortDate: async (req, res) => {
    try {
      let settings = await Setting.findOne({});
      if (!settings) {
        settings = await Setting.create(defaultSettings);
      }
      res.json({ nextCohortDate: settings.nextCohortDate });
  } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = settingController; 
const Setting = require('../models/Setting');

const initializeSettings = async () => {
  try {
    // Check if settings exist
    const settingsExist = await Setting.findOne({});
    
    if (!settingsExist) {
      console.log('Creating default settings...');
      
      const defaultSettings = {
        nextCohortDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
        courseDuration: '8 weeks',
        sessionFrequency: 'twice per week',
        applicationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        maxStudentsPerCohort: 100
      };

      await Setting.create(defaultSettings);
      console.log('Default settings created');
    }
  } catch (error) {
    console.error('Error initializing settings:', error);
  }
};

module.exports = initializeSettings; 
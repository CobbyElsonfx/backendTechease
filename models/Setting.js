const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  nextCohortDate: {
    type: Date,
    required: true,
    get: function(date) {
      return date ? date.toISOString().split('T')[0] : null;
    }
  },
  courseDuration: {
    type: String,
    required: true
  },
  sessionFrequency: {
    type: String,
    required: true
  },
  applicationDeadline: {
    type: Date,
    required: true,
    get: function(date) {
      return date ? date.toISOString().split('T')[0] : null;
    }
  },
  maxStudentsPerCohort: {
    type: Number,
    required: true,
    default: 100
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Simple method to update settings
SettingSchema.statics.updateSettings = async function(newSettings) {
  try {
    const settings = await this.findOne({});
    if (!settings) {
      return await this.create(newSettings);
    }
    
    Object.keys(newSettings).forEach(key => {
      if (newSettings[key] !== undefined) {
        settings[key] = newSettings[key];
      }
    });
    
    return await settings.save();
  } catch (error) {
    throw new Error(`Error updating settings: ${error.message}`);
  }
};

module.exports = mongoose.model('Setting', SettingSchema); 
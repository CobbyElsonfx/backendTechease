const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  nextCohortDate: {
    type: Date,
    required: true
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
  },
  maxStudentsPerCohort: {
    type: Number,
  }
}, {
  timestamps: true  // Adds createdAt and updatedAt fields
});

// Pre-save middleware to validate date settings
SettingSchema.pre('save', function (next) {
  if (this.key === 'nextCohortDate') {
    // Ensure the value is a valid date
    const date = new Date(this.value);
    if (isNaN(date.getTime())) {
      next(new Error('Invalid date format for nextCohortDate'));
      return;
    }
    this.value = date;
  }
  this.lastModified = new Date();
  next();
});

// Static method to get next cohort date
SettingSchema.statics.getNextCohortDate = async function () {
  const setting = await this.findOne({ key: 'nextCohortDate' });
  return setting ? new Date(setting.value) : null;
};

// Static method to initialize default settings
SettingSchema.statics.initializeDefaultSettings = async function () {
  const defaults = [
    {
      key: 'nextCohortDate',
      value: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months from now
      description: 'Next cohort start date'
    },
    {
      key: 'courseDuration',
      value: '8 weeks',
      description: 'Duration of the course'
    },
    {
      key: 'sessionFrequency',
      value: 'twice per week',
      description: 'Frequency of sessions'
    },
    {
      key: 'applicationDeadline',
      value: new Date(new Date().setDate(new Date().getDate() + 14)), // Default to 2 weeks from now
      description: 'Deadline for submitting applications'
    },
    {
      key: 'maxStudentsPerCohort',
      value: 100,
      description: 'Maximum number of students allowed per cohort'
    }
  ];

  for (const setting of defaults) {
    await this.findOneAndUpdate(
      { key: setting.key },
      setting,
      { upsert: true, new: true }
    );
  }
};

module.exports = mongoose.model('Setting', SettingSchema); 
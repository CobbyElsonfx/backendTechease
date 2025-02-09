const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    enum: ['nextCohortDate', 'applicationDeadline', 'maxStudentsPerCohort', 'courseDuration', 'sessionFrequency']
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save middleware to validate date settings
settingSchema.pre('save', function(next) {
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
settingSchema.statics.getNextCohortDate = async function() {
  const setting = await this.findOne({ key: 'nextCohortDate' });
  return setting ? new Date(setting.value) : null;
};

// Static method to initialize default settings
settingSchema.statics.initializeDefaultSettings = async function() {
  const defaults = [
    {
      key: 'nextCohortDate',
      value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
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
      value: 50,
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

const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting; 
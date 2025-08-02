const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  otherName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  whatsappNumber: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  educationLevel: {
    type: String,
    required: true,
    trim: true
  },
  selectedCourse: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'unpaid'],
    default: 'unpaid'
  },
  isStudent: {
    type: Boolean,
    default: false
  },
  studentIdCard: {
    type: String, // File path/URL
    required: function() { return this.isStudent; }
  },
  scholarshipReason: {
    type: String,
    required: true,
    trim: true
  },
  applicationRef: {
    type: String,
    required: true,
    unique: true
  },
  cohortStartDate: {
    type: Date,
    required: true
  },
  cohortEndDate: {
    type: Date,
    required: true
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  },
  reviewedAt: {
    type: Date,
    required: false
  },
  reviewNotes: {
    type: String,
    trim: true
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: false
  }
}, {
  timestamps: true // This will add createdAt and updatedAt fields automatically
});

// Pre-save middleware to update lastModified
applicationSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Add a method to calculate cohort end date (8 weeks from start date)
applicationSchema.methods.calculateEndDate = function() {
  const endDate = new Date(this.cohortStartDate);
  endDate.setDate(endDate.getDate() + (8 * 7)); // 8 weeks * 7 days
  this.cohortEndDate = endDate;
};

// Static method to get upcoming cohorts
applicationSchema.statics.getUpcomingCohorts = function() {
  return this.aggregate([
    {
      $match: {
        cohortStartDate: { $gte: new Date() }
      }
    },
    {
      $group: {
        _id: '$cohortStartDate',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application; 
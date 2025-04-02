const mongoose = require('mongoose');

const curriculumItemSchema = new mongoose.Schema({
  week: Number,
  topic: String,
  description: String,
  learningOutcomes: [String]
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['primary', 'secondary'],
    required: true
  },
  duration: {
    type: String,
    default: '12 Weeks'
  },
  schedule: {
    type: String,
    default: 'Weekends Only'
  },
  image: {
    type: String,
    required: true
  }, 
  curriculum: [curriculumItemSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course; 
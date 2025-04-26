const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const adminRoutes = require('./routes/admin');
const courseRoutes = require('./routes/courses');
const settingRoutes = require('./routes/settings');
const emailRoutes = require('./routes/email');
const applicationRoutes = require('./routes/application');
const eventRoutes = require('./routes/events');

const app = express();

// Middleware
app.use(bodyParser.json());

// Apply CORS middleware before other middleware
app.use(cors());

// Add headers middleware
app.use((req, res, next) => {
  // Set headers that LiteSpeed might strip
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  next();
});

// Routesaa
app.use('/api/admin', adminRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/application', applicationRoutes);
app.use('/api/events', eventRoutes);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Initialize admin account
    require('./utils/initAdmin')();
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

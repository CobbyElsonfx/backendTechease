const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const adminRoutes = require('./routes/admin');
const courseRoutes = require('./routes/courses');
const settingRoutes = require('./routes/settings');
const emailRoutes = require('./routes/email');
const applicationRoutes = require('./routes/application');

const app = express();

// Connect to database
connectDB().then(async () => {
  try {
    const Setting = require('./models/Setting');
    await Setting.initializeDefaultSettings();
    console.log('Default settings initialized');
  } catch (error) {
    console.error('Error initializing settings:', error);
  }
});

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/application', applicationRoutes);

// Initialize admin account
const initializeAdmin = require('./utils/initAdmin');
(async () => {
  try {
    await initializeAdmin();
  } catch (error) {
    console.error('Failed to initialize admin:', error);
  }
})();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

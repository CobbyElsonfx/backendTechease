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

const app = express();

// Middleware
app.use(bodyParser.json());

// Configure CORS for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://techeaseafrica.onrender.com']  // Your frontend domain
    : 'http://localhost:3000', // Development frontend URL
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions)); 

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/application', applicationRoutes);

const PORT = process.env.PORT || 3001;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Initialize settings and admin after DB connection
    const Setting = require('./models/Setting');
    Setting.initializeDefaultSettings()
      .then(() => console.log('Default settings initialized'))
      .catch(error => console.error('Error initializing settings:', error));
    
    const initializeAdmin = require('./utils/initAdmin');
    initializeAdmin()
      .then(() => console.log('Admin initialized'))
      .catch(error => console.error('Failed to initialize admin:', error));

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

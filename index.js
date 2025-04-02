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
app.use('/api/applications', applicationRoutes);

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

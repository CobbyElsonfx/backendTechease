const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const initializeAdmin = async () => {
  try {
    // Check if admin exists
    const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (!adminExists) {
      console.log('Creating default admin account...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await Admin.create({
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword
      });
      
      console.log('Default admin account created');
    }
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
};

module.exports = initializeAdmin; 
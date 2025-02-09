const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const initializeAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ email: 'admin@techease.africa' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new Admin({
        email: 'admin@techease.africa',
        password: hashedPassword
      });
      await admin.save();
      console.log('Admin account created successfully');
    }
  } catch (error) {
    console.error('Error creating admin account:', error);
  }
};

module.exports = initializeAdmin; 
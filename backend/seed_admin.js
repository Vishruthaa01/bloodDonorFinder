const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    console.log('Connecting to database...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bloodDonorFinder';
    await mongoose.connect(mongoUri);
    console.log('Connected successfully!');

    const email = 'admin@lifeshare.com';
    
    // Check if admin already exists
    const adminExists = await User.findOne({ email });
    if (adminExists) {
      console.log('Admin account already exists in database.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('adminpassword', salt);

    const admin = await User.create({
      name: 'System Admin',
      phone: '9999999999',
      email,
      passwordHash,
      bloodGroup: 'O+',
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716] // Bangalore
      },
      isAvailable: false,
      age: 30,
      role: 'admin'
    });

    console.log('Admin account successfully seeded!');
    console.log('Email: admin@lifeshare.com');
    console.log('Password: adminpassword');

  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed.');
  }
};

seedAdmin();

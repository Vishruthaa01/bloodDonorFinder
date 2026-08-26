const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();
const User = require('./models/User');

const usersToCreate = [
  {
    name: 'System Admin',
    phone: '9999999999',
    email: 'admin@lifeshare.com',
    bloodGroup: 'O+',
    location: { type: 'Point', coordinates: [77.5874, 11.2760] },
    isAvailable: true,
    age: 35,
    role: 'admin',
    verified: true
  },
  {
    name: 'Aarav Sharma',
    phone: '9876543210',
    email: 'aarav.sharma@example.com',
    bloodGroup: 'O+',
    location: { type: 'Point', coordinates: [77.5828, 11.2742] },
    isAvailable: true,
    age: 28,
    role: 'donor',
    verified: true
  },
  {
    name: 'Priya Patel',
    phone: '9876543211',
    email: 'priya.patel@example.com',
    bloodGroup: 'A+',
    location: { type: 'Point', coordinates: [77.5950, 11.2850] },
    isAvailable: true,
    age: 25,
    role: 'donor',
    verified: false
  },
  {
    name: 'Rohan Verma',
    phone: '9876543212',
    email: 'rohan.verma@example.com',
    bloodGroup: 'B+',
    location: { type: 'Point', coordinates: [77.5650, 11.2680] },
    isAvailable: true,
    age: 32,
    role: 'donor',
    verified: true
  },
  {
    name: 'Ananya Reddy',
    phone: '9876543213',
    email: 'ananya.reddy@example.com',
    bloodGroup: 'O-',
    location: { type: 'Point', coordinates: [77.6050, 11.2710] },
    isAvailable: true,
    age: 24,
    role: 'donor',
    verified: false
  },
  {
    name: 'Vikram Singh',
    phone: '9876543214',
    email: 'vikram.singh@example.com',
    bloodGroup: 'AB+',
    location: { type: 'Point', coordinates: [77.6750, 11.3150] },
    isAvailable: true,
    age: 29,
    role: 'donor',
    verified: true
  },
  {
    name: 'Sneha Rao',
    phone: '9876543215',
    email: 'sneha.rao@example.com',
    bloodGroup: 'A-',
    location: { type: 'Point', coordinates: [77.6500, 11.3000] },
    isAvailable: true,
    age: 27,
    role: 'donor',
    verified: true
  },
  {
    name: 'Rahul Nair',
    phone: '9876543216',
    email: 'rahul.nair@example.com',
    bloodGroup: 'B-',
    location: { type: 'Point', coordinates: [77.6950, 11.3280] },
    isAvailable: true,
    age: 31,
    role: 'donor',
    verified: false
  },
  {
    name: 'Kavya Joshi',
    phone: '9876543217',
    email: 'kavya.joshi@example.com',
    bloodGroup: 'O+',
    location: { type: 'Point', coordinates: [77.7180, 11.3400] },
    isAvailable: true,
    age: 26,
    role: 'donor',
    verified: true
  },
  {
    name: 'Aditya Gupta',
    phone: '9876543218',
    email: 'aditya.gupta@example.com',
    bloodGroup: 'AB-',
    location: { type: 'Point', coordinates: [77.7260, 11.3320] },
    isAvailable: false,
    age: 34,
    role: 'donor',
    verified: false
  },
  {
    name: 'Meera Iyer',
    phone: '9876543219',
    email: 'meera.iyer@example.com',
    bloodGroup: 'A+',
    location: { type: 'Point', coordinates: [77.7100, 11.3200] },
    isAvailable: true,
    age: 23,
    role: 'donor',
    verified: true
  },
  {
    name: 'Siddharth Mehta',
    phone: '9876543220',
    email: 'siddharth.mehta@example.com',
    bloodGroup: 'B+',
    location: { type: 'Point', coordinates: [77.6700, 11.4100] },
    isAvailable: true,
    age: 30,
    role: 'donor',
    verified: true
  },
  {
    name: 'Diya Kulkarni',
    phone: '9876543221',
    email: 'diya.kulkarni@example.com',
    bloodGroup: 'O-',
    location: { type: 'Point', coordinates: [77.7300, 11.3150] },
    isAvailable: true,
    age: 27,
    role: 'donor',
    verified: true
  },
  {
    name: 'Arjun Deshmukh',
    phone: '9876543222',
    email: 'arjun.deshmukh@example.com',
    bloodGroup: 'O+',
    location: { type: 'Point', coordinates: [77.5450, 11.2250] },
    isAvailable: true,
    age: 28,
    role: 'donor',
    verified: true
  },
  {
    name: 'Neha Kapoor',
    phone: '9876543223',
    email: 'neha.kapoor@example.com',
    bloodGroup: 'A-',
    location: { type: 'Point', coordinates: [77.7500, 11.3050] },
    isAvailable: false,
    age: 33,
    role: 'donor',
    verified: false
  },
  {
    name: 'Karan Malhotra',
    phone: '9876543224',
    email: 'karan.malhotra@example.com',
    bloodGroup: 'B+',
    location: { type: 'Point', coordinates: [77.7050, 11.3100] },
    isAvailable: true,
    age: 29,
    role: 'donor',
    verified: true
  }
];

const connect = async () => {
  const uris = [
    process.env.MONGODB_URI,
    'mongodb://127.0.0.1:27017/bloodDonorFinder'
  ];

  for (const uri of uris) {
    if (!uri) continue;
    try {
      console.log('Attempting to connect to:', uri.includes('mongodb+srv') ? 'MongoDB Atlas' : uri);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log('Successfully connected!');
      return;
    } catch (err) {
      console.log('Failed connection to', uri.includes('mongodb+srv') ? 'MongoDB Atlas' : uri, 'Error:', err.message);
    }
  }
  throw new Error('All database connection attempts failed');
};

const seedUsers = async () => {
  try {
    await connect();

    console.log('Deleting existing users...');
    const deleteResult = await User.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing user(s).`);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    console.log(`Creating ${usersToCreate.length} users with password 'password123'...`);
    const usersWithHash = usersToCreate.map(u => ({
      ...u,
      passwordHash
    }));

    const createdUsers = await User.insertMany(usersWithHash);
    console.log(`Successfully updated ${createdUsers.length} users!`);

    console.log('\n--- Active Accounts ---');
    createdUsers.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.name} (${user.role}) - ${user.email} - Verified: ${user.verified}`);
    });
    console.log('-----------------------\n');
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed.');
  }
};

seedUsers();

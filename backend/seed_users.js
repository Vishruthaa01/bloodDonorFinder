const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

dotenv.config();
const User = require('./models/User');
const Hospital = require('./models/Hospital');

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

const hospitalsToCreate = [
  {
    name: 'Government Hospital - Perundurai',
    regId: 'GOV01',
    email: 'gh@gmail.com',
    address: 'Perundurai, Erode',
    location: { type: 'Point', coordinates: [77.587466, 11.276032] },
    contactPerson: 'Gov_Admin',
    phone: '4289653385',
    role: 'hospital',
    verified: true
  },
  {
    name: 'Dharan Hospital',
    regId: 'DHARAN02',
    email: 'dharanhospital@gmail.com',
    address: 'Salem',
    location: { type: 'Point', coordinates: [78.145247, 11.625033] },
    contactPerson: 'Dharan_Admin',
    phone: '4856320197',
    role: 'hospital',
    verified: true
  }
];

const connect = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const uris = [
    mongoUri,
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

const seedDatabase = async () => {
  try {
    await connect();

    console.log('Deleting existing users and hospitals...');
    await User.deleteMany({});
    await Hospital.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    console.log(`Creating ${usersToCreate.length} users with password 'password123'...`);
    const usersWithHash = usersToCreate.map(u => ({ ...u, passwordHash }));
    const createdUsers = await User.insertMany(usersWithHash);
    console.log(`Successfully created ${createdUsers.length} users!`);

    console.log(`Creating ${hospitalsToCreate.length} hospitals with password 'password123'...`);
    const hospitalsWithHash = hospitalsToCreate.map(h => ({ ...h, passwordHash }));
    const createdHospitals = await Hospital.insertMany(hospitalsWithHash);
    console.log(`Successfully created ${createdHospitals.length} hospitals!`);

    console.log('\n--- Active Hospital Accounts ---');
    createdHospitals.forEach((h, idx) => {
      console.log(`${idx + 1}. ${h.name} (${h.regId}) - ${h.email} - Password: password123`);
    });
    console.log('-------------------------------\n');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed.');
  }
};

seedDatabase();

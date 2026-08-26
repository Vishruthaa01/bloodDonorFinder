const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();
const User = require('./models/User');

// Coordinates around Perundurai (lng: ~77.58, lat: ~11.27) and Erode (lng: ~77.72, lat: ~11.34)
const usersToCreate = [
  {
    name: 'Aarav Sharma',
    phone: '9876543210',
    email: 'aarav.sharma@example.com',
    bloodGroup: 'O+',
    location: { type: 'Point', coordinates: [77.5828, 11.2742] }, // Perundurai Town
    isAvailable: true,
    age: 28,
    role: 'donor'
  },
  {
    name: 'Priya Patel',
    phone: '9876543211',
    email: 'priya.patel@example.com',
    bloodGroup: 'A+',
    location: { type: 'Point', coordinates: [77.5950, 11.2850] }, // Perundurai Medical College
    isAvailable: true,
    age: 25,
    role: 'donor'
  },
  {
    name: 'Rohan Verma',
    phone: '9876543212',
    email: 'rohan.verma@example.com',
    bloodGroup: 'B+',
    location: { type: 'Point', coordinates: [77.5650, 11.2680] }, // SIPCOT Perundurai
    isAvailable: true,
    age: 32,
    role: 'donor'
  },
  {
    name: 'Ananya Reddy',
    phone: '9876543213',
    email: 'ananya.reddy@example.com',
    bloodGroup: 'O-',
    location: { type: 'Point', coordinates: [77.6050, 11.2710] }, // Perundurai RS
    isAvailable: true,
    age: 24,
    role: 'donor'
  },
  {
    name: 'Vikram Singh',
    phone: '9876543214',
    email: 'vikram.singh@example.com',
    bloodGroup: 'AB+',
    location: { type: 'Point', coordinates: [77.6750, 11.3150] }, // Thindal, Erode Rd
    isAvailable: true,
    age: 29,
    role: 'donor'
  },
  {
    name: 'Sneha Rao',
    phone: '9876543215',
    email: 'sneha.rao@example.com',
    bloodGroup: 'A-',
    location: { type: 'Point', coordinates: [77.6500, 11.3000] }, // Veppampalayam
    isAvailable: true,
    age: 27,
    role: 'donor'
  },
  {
    name: 'Rahul Nair',
    phone: '9876543216',
    email: 'rahul.nair@example.com',
    bloodGroup: 'B-',
    location: { type: 'Point', coordinates: [77.6950, 11.3280] }, // Palayapalayam, Erode
    isAvailable: true,
    age: 31,
    role: 'donor'
  },
  {
    name: 'Kavya Joshi',
    phone: '9876543217',
    email: 'kavya.joshi@example.com',
    bloodGroup: 'O+',
    location: { type: 'Point', coordinates: [77.7180, 11.3400] }, // Erode Bus Stand
    isAvailable: true,
    age: 26,
    role: 'donor'
  },
  {
    name: 'Aditya Gupta',
    phone: '9876543218',
    email: 'aditya.gupta@example.com',
    bloodGroup: 'AB-',
    location: { type: 'Point', coordinates: [77.7260, 11.3320] }, // Erode Junction
    isAvailable: false,
    age: 34,
    role: 'donor'
  },
  {
    name: 'Meera Iyer',
    phone: '9876543219',
    email: 'meera.iyer@example.com',
    bloodGroup: 'A+',
    location: { type: 'Point', coordinates: [77.7100, 11.3200] }, // Surampatti, Erode
    isAvailable: true,
    age: 23,
    role: 'donor'
  },
  {
    name: 'Siddharth Mehta',
    phone: '9876543220',
    email: 'siddharth.mehta@example.com',
    bloodGroup: 'B+',
    location: { type: 'Point', coordinates: [77.6700, 11.4100] }, // Chithode, Erode
    isAvailable: true,
    age: 30,
    role: 'donor'
  },
  {
    name: 'Diya Kulkarni',
    phone: '9876543221',
    email: 'diya.kulkarni@example.com',
    bloodGroup: 'O-',
    location: { type: 'Point', coordinates: [77.7300, 11.3150] }, // Moolapalayam, Erode
    isAvailable: true,
    age: 27,
    role: 'donor'
  },
  {
    name: 'Arjun Deshmukh',
    phone: '9876543222',
    email: 'arjun.deshmukh@example.com',
    bloodGroup: 'O+',
    location: { type: 'Point', coordinates: [77.5450, 11.2250] }, // Ingur (Near Perundurai)
    isAvailable: true,
    age: 28,
    role: 'donor'
  },
  {
    name: 'Neha Kapoor',
    phone: '9876543223',
    email: 'neha.kapoor@example.com',
    bloodGroup: 'A-',
    location: { type: 'Point', coordinates: [77.7500, 11.3050] }, // Solar, Erode
    isAvailable: false,
    age: 33,
    role: 'donor'
  },
  {
    name: 'Karan Malhotra',
    phone: '9876543224',
    email: 'karan.malhotra@example.com',
    bloodGroup: 'B+',
    location: { type: 'Point', coordinates: [77.7050, 11.3100] }, // Kasipalayam, Erode
    isAvailable: true,
    age: 29,
    role: 'donor'
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

    console.log(`Creating ${usersToCreate.length} donor users...`);
    const usersWithHash = usersToCreate.map(u => ({
      ...u,
      passwordHash
    }));

    const createdUsers = await User.insertMany(usersWithHash);
    console.log(`Successfully updated ${createdUsers.length} donor users!`);

    console.log('\n--- Active Donor Accounts ---');
    createdUsers.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.name} (${user.bloodGroup}) - ${user.email}`);
    });
    console.log('------------------------------\n');
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed.');
  }
};

seedUsers();

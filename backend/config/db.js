const mongoose = require('mongoose');
const dns = require('dns');

// Fix SRV DNS lookup issues on cloud hosting
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('Could not set custom DNS servers:', e.message);
}

if (dns.setDefaultResultOrder) {
  try {
    dns.setDefaultResultOrder('ipv4first');
  } catch (e) {}
}

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('CRITICAL: Neither MONGODB_URI nor MONGO_URI environment variable is set!');
    console.error('Please add MONGODB_URI in your environment variables.');
  } else {
    const maskedUri = mongoUri.replace(/\/\/(.*):(.*)@/, '//$1:****@');
    console.log(`Attempting connection to: ${maskedUri}`);
  }

  const uris = [
    mongoUri,
    'mongodb://127.0.0.1:27017/bloodDonorFinder'
  ];

  for (const uri of uris) {
    if (!uri) continue;
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.warn(`Could not connect to ${uri.includes('mongodb+srv') ? 'MongoDB Atlas' : uri}: ${error.message}`);
    }
  }

  console.error('All MongoDB connection attempts failed');
  process.exit(1);
};

module.exports = connectDB;

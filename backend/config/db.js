const mongoose = require('mongoose');

const connectDB = async () => {
  const uris = [
    process.env.MONGODB_URI || process.env.MONGO_URI,
    'mongodb://127.0.0.1:27017/bloodDonorFinder'
  ];

  for (const uri of uris) {
    if (!uri) continue;
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
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

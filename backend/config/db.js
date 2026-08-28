const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bloodDonorFinder';

  try {
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB Connected (Compass/Local): ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

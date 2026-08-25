const mongoose = require('mongoose');
const dns = require('dns');

// Fallback DNS servers to resolve MongoDB Atlas SRV records if local ISP/Windows DNS fails
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore error if setServers is not supported in current environment
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

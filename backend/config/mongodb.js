const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Atlas connection configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/musicplayer';

let isConnected = false;

const connectToMongoDB = async () => {
  if (isConnected) {
    console.log('✅ Already connected to MongoDB');
    return mongoose.connection;
  }

  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    console.log('MongoDB URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Hide password in logs
    
    const connection = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    isConnected = true;
    console.log('✅ Connected to MongoDB Atlas successfully');
    console.log('📊 Database:', connection.connection.name);
    console.log('🌐 Host:', connection.connection.host);
    
    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('🔍 Connection details:');
    console.error('   - URI format should be: mongodb+srv://username:password@cluster.mongodb.net/database');
    console.error('   - Make sure your IP is whitelisted in MongoDB Atlas');
    console.error('   - Verify your username and password are correct');
    
    // Don't throw error, allow app to continue with fallback storage
    isConnected = false;
    return null;
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB Atlas');
  isConnected = false;
});

// Graceful shutdown
process.on('SIGINT', async () => {
  if (isConnected) {
    await mongoose.connection.close();
    console.log('🛑 MongoDB connection closed through app termination');
    process.exit(0);
  }
});

module.exports = {
  connectToMongoDB,
  isConnected: () => isConnected,
  mongoose
};
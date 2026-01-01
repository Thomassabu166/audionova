#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { connectToMongoDB } = require('../config/mongodb');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 MongoDB Atlas Setup Script');
console.log('===============================\n');

console.log('This script will help you configure MongoDB Atlas for your music player app.\n');

console.log('📋 Prerequisites:');
console.log('1. You should have a MongoDB Atlas account');
console.log('2. You should have created a cluster');
console.log('3. You should have created a database user');
console.log('4. Your IP should be whitelisted (or use 0.0.0.0/0 for all IPs)\n');

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setupMongoDB() {
  try {
    console.log('🔐 Please provide your MongoDB Atlas database password:');
    console.log('(This is the password for the user "thomassabu512_db_user")\n');
    
    const password = await askQuestion('Enter database password: ');
    
    if (!password) {
      console.log('❌ Password is required. Exiting...');
      process.exit(1);
    }
    
    // Update the MongoDB URI with the password
    const mongoUri = `mongodb+srv://your_username:${password}@your-cluster.mongodb.net/your-database?retryWrites=true&w=majority`;
    
    console.log('\n🔄 Testing MongoDB connection...');
    
    // Set the environment variable temporarily for testing
    process.env.MONGODB_URI = mongoUri;
    
    // Test the connection
    const connection = await connectToMongoDB();
    
    if (connection) {
      console.log('✅ MongoDB connection successful!');
      
      // Update the .env file
      const envPath = path.join(__dirname, '../.env');
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Replace the MongoDB URI line
      const mongoUriRegex = /MONGODB_URI=.*/;
      if (mongoUriRegex.test(envContent)) {
        envContent = envContent.replace(mongoUriRegex, `MONGODB_URI=${mongoUri}`);
      } else {
        envContent += `\nMONGODB_URI=${mongoUri}\n`;
      }
      
      fs.writeFileSync(envPath, envContent);
      
      console.log('✅ .env file updated successfully!');
      console.log('\n🎉 MongoDB Atlas setup complete!');
      console.log('\nYour app is now configured to use MongoDB Atlas.');
      console.log('You can restart your server to start using the cloud database.\n');
      
      // Test basic operations
      console.log('🧪 Testing basic database operations...');
      
      const User = require('../models/User');
      const testUser = await User.findOne().limit(1);
      
      if (testUser) {
        console.log('✅ Database read test successful');
      } else {
        console.log('ℹ️ Database is empty (this is normal for a new setup)');
      }
      
      console.log('\n📊 Database Information:');
      console.log(`   Database: ${connection.connection.name}`);
      console.log(`   Host: ${connection.connection.host}`);
      console.log(`   Status: Connected`);
      
    } else {
      console.log('❌ MongoDB connection failed!');
      console.log('\n🔍 Troubleshooting tips:');
      console.log('1. Check if your password is correct');
      console.log('2. Ensure your IP is whitelisted in MongoDB Atlas');
      console.log('3. Verify the cluster is running');
      console.log('4. Check if the database user has proper permissions');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🔍 Common issues:');
    console.log('1. Incorrect password');
    console.log('2. Network connectivity issues');
    console.log('3. IP not whitelisted in MongoDB Atlas');
    console.log('4. Database user permissions');
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Setup cancelled by user');
  rl.close();
  process.exit(0);
});

setupMongoDB();
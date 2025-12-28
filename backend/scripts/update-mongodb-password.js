#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔐 MongoDB Atlas Password Update Script');
console.log('=====================================\n');

// Get password from command line argument
const password = process.argv[2];

if (!password) {
  console.log('❌ Please provide your MongoDB Atlas password as an argument:');
  console.log('   npm run update-mongodb-password YOUR_PASSWORD');
  console.log('   or');
  console.log('   node scripts/update-mongodb-password.js YOUR_PASSWORD\n');
  console.log('📋 Your MongoDB Atlas connection string should be:');
  console.log('   mongodb+srv://thomassabu512_db_user:YOUR_PASSWORD@cluster0.5g8kgl1.mongodb.net/musicplayer?retryWrites=true&w=majority&appName=Cluster0\n');
  process.exit(1);
}

try {
  const envPath = path.join(__dirname, '../.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found at:', envPath);
    process.exit(1);
  }

  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Create the new MongoDB URI with the provided password
  const newMongoUri = `mongodb+srv://thomassabu512_db_user:${password}@cluster0.5g8kgl1.mongodb.net/musicplayer?retryWrites=true&w=majority&appName=Cluster0`;
  
  // Replace the MongoDB URI line
  const mongoUriRegex = /MONGODB_URI=.*/;
  if (mongoUriRegex.test(envContent)) {
    envContent = envContent.replace(mongoUriRegex, `MONGODB_URI=${newMongoUri}`);
    console.log('✅ Updated existing MONGODB_URI in .env file');
  } else {
    envContent += `\nMONGODB_URI=${newMongoUri}\n`;
    console.log('✅ Added MONGODB_URI to .env file');
  }
  
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ MongoDB Atlas password updated successfully!');
  console.log('\n🚀 Next steps:');
  console.log('1. Restart your backend server: npm run dev');
  console.log('2. Check the console for MongoDB connection success');
  console.log('3. Your app will now use MongoDB Atlas for data storage\n');
  
  console.log('🔍 Connection string (password hidden):');
  console.log(`   mongodb+srv://thomassabu512_db_user:***@cluster0.5g8kgl1.mongodb.net/musicplayer?retryWrites=true&w=majority&appName=Cluster0\n`);
  
} catch (error) {
  console.error('❌ Error updating .env file:', error.message);
  process.exit(1);
}
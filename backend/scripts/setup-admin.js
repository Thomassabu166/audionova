#!/usr/bin/env node

/**
 * Quick setup script for admin role management
 * This script helps you quickly set up your first admin user
 */

const { admin } = require('../config/firebase-admin');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupFirstAdmin() {
  console.log('🔧 Admin Setup Wizard');
  console.log('===================');
  console.log('');
  
  try {
    // Check if Firebase Admin is initialized
    if (!admin || !admin.auth) {
      console.error('❌ Firebase Admin SDK is not initialized.');
      console.error('Please check your Firebase configuration in backend/config/firebase-admin.js');
      console.error('');
      console.error('You need either:');
      console.error('1. A service account key file at backend/firebase-service-account.json');
      console.error('2. Environment variables: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
      process.exit(1);
    }

    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log('');

    // Get admin email
    const email = await question('Enter the email address for your first admin user: ');
    
    if (!email || !email.includes('@')) {
      console.error('❌ Please enter a valid email address');
      process.exit(1);
    }

    console.log('');
    console.log('🔍 Checking if user exists...');

    try {
      // Check if user exists
      const user = await admin.auth().getUserByEmail(email);
      console.log(`✅ User found: ${user.email} (UID: ${user.uid})`);
      
      // Check current role
      const userRecord = await admin.auth().getUser(user.uid);
      const currentRole = userRecord.customClaims?.role;
      
      if (currentRole === 'admin') {
        console.log('ℹ️  User already has admin role');
        const confirm = await question('Do you want to continue anyway? (y/N): ');
        if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
          console.log('Setup cancelled');
          process.exit(0);
        }
      }

      // Grant admin role
      console.log('');
      console.log('🔑 Granting admin role...');
      await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
      
      console.log('');
      console.log('🎉 Success! Admin role granted to ' + email);
      console.log('');
      console.log('⚠️  IMPORTANT: The user must sign out and sign back in for changes to take effect');
      console.log('');
      console.log('Next steps:');
      console.log('1. Ask the user to sign out of the application');
      console.log('2. Have them sign back in');
      console.log('3. They should now see "Admin Dashboard" in the sidebar');
      console.log('4. They can access the admin panel at /admin');
      console.log('');
      console.log('To manage more admin users, use:');
      console.log('  node scripts/manage-admin.js grant <email>');
      console.log('  node scripts/manage-admin.js list');
      console.log('  node scripts/manage-admin.js revoke <email>');

    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('❌ User not found in Firebase Auth');
        console.log('');
        console.log('The user must first register through your application:');
        console.log('1. Go to your app and create an account with this email');
        console.log('2. Complete the registration process');
        console.log('3. Then run this script again');
        console.log('');
        console.log('Or use the manage-admin.js script after they register:');
        console.log(`  node scripts/manage-admin.js grant ${email}`);
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    console.error('');
    console.error('Common issues:');
    console.error('- Firebase Admin SDK not properly configured');
    console.error('- Invalid service account credentials');
    console.error('- Network connectivity issues');
    console.error('- User does not exist in Firebase Auth');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\nSetup cancelled by user');
  rl.close();
  process.exit(0);
});

// Run the setup
setupFirstAdmin().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
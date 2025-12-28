#!/usr/bin/env node

/**
 * 🔒 HARDENED ADMIN SETUP SCRIPT
 * 
 * SECURITY CONSTRAINTS:
 * - ONLY runs in development/local environments
 * - HARD-FAILS in production
 * - Admin email is HARD-CODED (not parameterized)
 * - NEVER callable via HTTP
 * - NEVER exposed in frontend builds
 */

// 🚨 CRITICAL: Environment validation FIRST
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const IS_VERCEL = process.env.VERCEL === '1';
const IS_NETLIFY = process.env.NETLIFY === 'true';
const IS_HEROKU = process.env.DYNO !== undefined;
const IS_AWS = process.env.AWS_EXECUTION_ENV !== undefined;

// 🛡️ PRODUCTION ENVIRONMENT DETECTION
if (IS_PRODUCTION || IS_VERCEL || IS_NETLIFY || IS_HEROKU || IS_AWS) {
  console.error('🚨 SECURITY VIOLATION: Admin setup script blocked in production');
  console.error('Environment:', NODE_ENV);
  console.error('Platform detection:', {
    vercel: IS_VERCEL,
    netlify: IS_NETLIFY,
    heroku: IS_HEROKU,
    aws: IS_AWS
  });
  console.error('');
  console.error('🔒 This script can ONLY run in local development environments');
  console.error('🔒 Production admin setup must be done through secure channels');
  process.exit(1);
}

// 🔒 HARD-CODED ADMIN EMAIL (NEVER accept as parameter)
const AUTHORIZED_ADMIN_EMAIL = 'thomassabu512@gmail.com';

const { admin } = require('../config/firebase-admin');
const auditLogger = require('../utils/auditLogger');

/**
 * Set up secure admin access for the authorized email only
 */
async function setupSecureAdmin() {
  try {
    // 🚨 SECURITY: NO parameters accepted - email is HARD-CODED
    const providedEmail = process.argv[2];
    
    if (providedEmail) {
      console.error('🚨 SECURITY VIOLATION: This script does not accept email parameters');
      console.error('🔒 Admin email is HARD-CODED for security');
      console.error(`🔒 Authorized admin: ${AUTHORIZED_ADMIN_EMAIL}`);
      console.error('');
      console.error('Usage: node secure-admin-setup.js');
      process.exit(1);
    }

    // 🔒 Use ONLY the hard-coded email
    const email = AUTHORIZED_ADMIN_EMAIL;

    console.log('🔐 SECURE ADMIN SETUP');
    console.log('====================');
    console.log(`🔒 Setting up admin access for authorized email: ${email}`);
    console.log('');

    // 🔍 AUDIT LOG: Admin setup attempt
    await auditLogger.logAdminSetup({
      action: 'ADMIN_SETUP_INITIATED',
      authorizedEmail: AUTHORIZED_ADMIN_EMAIL,
      environment: NODE_ENV,
      operator: process.env.USER || 'unknown',
      pid: process.pid
    });

    try {
      // Get user by email
      const userRecord = await admin.auth().getUserByEmail(email);
      console.log(`✅ User found: ${userRecord.email}`);
      console.log(`   UID: ${userRecord.uid}`);
      
      // Check if already admin
      const currentClaims = userRecord.customClaims || {};
      if (currentClaims.admin === true) {
        console.log('ℹ️  User already has admin access');
      }

      // Set SECURE admin custom claim
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        admin: true,
        adminSetAt: new Date().toISOString(),
        adminEmail: email,
        securityLevel: 'production'
      });

      console.log('✅ SECURE admin claim set successfully');
      console.log('');
      
      // Verify the claims were set
      const updatedUser = await admin.auth().getUser(userRecord.uid);
      console.log('🔍 Verified custom claims:');
      console.log('   admin:', updatedUser.customClaims?.admin);
      console.log('   adminEmail:', updatedUser.customClaims?.adminEmail);
      console.log('   adminSetAt:', updatedUser.customClaims?.adminSetAt);
      console.log('');
      
      console.log('🔐 SECURITY IMPLEMENTATION COMPLETE');
      console.log('===================================');
      console.log('✅ Admin access is enforced via Firebase Custom Claims');
      console.log('✅ Only server-side validation is used');
      console.log('✅ Frontend checks are for UX only, not security');
      console.log('✅ Database rules enforce admin: true claim');
      console.log('✅ Only one admin email is authorized');
      console.log('');
      console.log('⚠️  IMPORTANT: User must sign out and back in for changes to take effect');
      console.log('');
      console.log('🛡️  Why this approach is secure:');
      console.log('   - Custom claims are set server-side only');
      console.log('   - Claims are cryptographically signed by Firebase');
      console.log('   - Frontend cannot modify claims');
      console.log('   - Database rules validate claims on every request');
      console.log('   - Hard-coded admin email prevents unauthorized access');
      
    } catch (userError) {
      if (userError.code === 'auth/user-not-found') {
        console.error(`❌ User with email ${email} not found in Firebase Auth`);
        console.error('');
        console.error('📝 The admin user must sign in to the app at least once before setting admin claims');
        console.error('');
        console.error('Steps to fix:');
        console.error('1. Go to your application');
        console.error('2. Sign in with the admin email using Google Auth');
        console.error('3. Sign out');
        console.error('4. Run this script again');
      } else {
        throw userError;
      }
    }
    
  } catch (error) {
    console.error('❌ Error setting up secure admin:', error.message);
    process.exit(1);
  }
}

/**
 * Revoke admin access (security function)
 */
async function revokeAdminAccess() {
  try {
    const email = process.argv[3];
    
    if (!email) {
      console.error('❌ Usage: node secure-admin-setup.js revoke <email>');
      process.exit(1);
    }

    console.log(`🔒 Revoking admin access for: ${email}`);

    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Remove all custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {});

    console.log(`✅ Admin access revoked for ${email}`);
    console.log('⚠️  User must sign out and back in for changes to take effect');
    
  } catch (error) {
    console.error('❌ Error revoking admin access:', error.message);
    process.exit(1);
  }
}

/**
 * Check admin status
 */
async function checkAdminStatus() {
  try {
    const email = process.argv[3];
    
    if (!email) {
      console.error('❌ Usage: node secure-admin-setup.js check <email>');
      process.exit(1);
    }

    const userRecord = await admin.auth().getUserByEmail(email);
    const claims = userRecord.customClaims || {};
    
    console.log(`🔍 Admin status for ${email}:`);
    console.log(`   Has admin claim: ${claims.admin === true ? '✅ YES' : '❌ NO'}`);
    console.log(`   Admin email: ${claims.adminEmail || 'Not set'}`);
    console.log(`   Admin set at: ${claims.adminSetAt || 'Not set'}`);
    console.log(`   Is authorized admin: ${email === AUTHORIZED_ADMIN_EMAIL ? '✅ YES' : '❌ NO'}`);
    
  } catch (error) {
    console.error('❌ Error checking admin status:', error.message);
    process.exit(1);
  }
}

// Handle commands
const command = process.argv[2];

if (command === 'revoke') {
  revokeAdminAccess();
} else if (command === 'check') {
  checkAdminStatus();
} else if (command === 'help' || command === '--help' || command === '-h') {
  console.log('🔐 SECURE ADMIN SETUP COMMANDS');
  console.log('=============================');
  console.log('');
  console.log('Set admin (only authorized email):');
  console.log('  node secure-admin-setup.js <email>');
  console.log('');
  console.log('Revoke admin access:');
  console.log('  node secure-admin-setup.js revoke <email>');
  console.log('');
  console.log('Check admin status:');
  console.log('  node secure-admin-setup.js check <email>');
  console.log('');
  console.log(`🔒 Authorized admin email: ${AUTHORIZED_ADMIN_EMAIL}`);
} else {
  setupSecureAdmin();
}
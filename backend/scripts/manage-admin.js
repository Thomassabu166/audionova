const { admin } = require('../config/firebase-admin');

/**
 * Script to manage admin roles
 * Usage: node scripts/manage-admin.js <action> <email>
 * Actions: grant, revoke, check
 */

async function grantAdminRole(email) {
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
    
    console.log(`✅ Admin role granted to ${email} (UID: ${user.uid})`);
    console.log('⚠️  User needs to sign out and sign back in for changes to take effect');
  } catch (error) {
    console.error('❌ Error granting admin role:', error.message);
  }
}

async function revokeAdminRole(email) {
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    
    // Remove custom claims
    await admin.auth().setCustomUserClaims(user.uid, { role: null });
    
    console.log(`✅ Admin role revoked from ${email} (UID: ${user.uid})`);
    console.log('⚠️  User needs to sign out and sign back in for changes to take effect');
  } catch (error) {
    console.error('❌ Error revoking admin role:', error.message);
  }
}

async function checkUserRole(email) {
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    
    // Get custom claims
    const userRecord = await admin.auth().getUser(user.uid);
    const customClaims = userRecord.customClaims || {};
    
    console.log(`👤 User: ${email} (UID: ${user.uid})`);
    console.log(`🔑 Role: ${customClaims.role || 'none'}`);
    console.log(`📧 Email verified: ${userRecord.emailVerified}`);
    console.log(`🕒 Created: ${new Date(userRecord.metadata.creationTime).toLocaleString()}`);
    console.log(`🕒 Last sign in: ${new Date(userRecord.metadata.lastSignInTime).toLocaleString()}`);
  } catch (error) {
    console.error('❌ Error checking user role:', error.message);
  }
}

async function listAllAdmins() {
  try {
    console.log('🔍 Searching for admin users...');
    
    const listUsersResult = await admin.auth().listUsers();
    const adminUsers = [];
    
    for (const userRecord of listUsersResult.users) {
      const customClaims = userRecord.customClaims || {};
      if (customClaims.role === 'admin') {
        adminUsers.push({
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          emailVerified: userRecord.emailVerified,
          creationTime: userRecord.metadata.creationTime,
          lastSignInTime: userRecord.metadata.lastSignInTime
        });
      }
    }
    
    if (adminUsers.length === 0) {
      console.log('📭 No admin users found');
    } else {
      console.log(`👥 Found ${adminUsers.length} admin user(s):`);
      adminUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.email}`);
        console.log(`   UID: ${user.uid}`);
        console.log(`   Name: ${user.displayName || 'Not set'}`);
        console.log(`   Email verified: ${user.emailVerified}`);
        console.log(`   Created: ${new Date(user.creationTime).toLocaleString()}`);
        console.log(`   Last sign in: ${user.lastSignInTime ? new Date(user.lastSignInTime).toLocaleString() : 'Never'}`);
      });
    }
  } catch (error) {
    console.error('❌ Error listing admin users:', error.message);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const action = args[0];
  const email = args[1];

  if (!action) {
    console.log('📖 Usage: node scripts/manage-admin.js <action> [email]');
    console.log('');
    console.log('Actions:');
    console.log('  grant <email>   - Grant admin role to user');
    console.log('  revoke <email>  - Revoke admin role from user');
    console.log('  check <email>   - Check user role and info');
    console.log('  list           - List all admin users');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/manage-admin.js grant admin@example.com');
    console.log('  node scripts/manage-admin.js check user@example.com');
    console.log('  node scripts/manage-admin.js list');
    process.exit(1);
  }

  switch (action) {
    case 'grant':
      if (!email) {
        console.error('❌ Email is required for grant action');
        process.exit(1);
      }
      await grantAdminRole(email);
      break;
      
    case 'revoke':
      if (!email) {
        console.error('❌ Email is required for revoke action');
        process.exit(1);
      }
      await revokeAdminRole(email);
      break;
      
    case 'check':
      if (!email) {
        console.error('❌ Email is required for check action');
        process.exit(1);
      }
      await checkUserRole(email);
      break;
      
    case 'list':
      await listAllAdmins();
      break;
      
    default:
      console.error(`❌ Unknown action: ${action}`);
      console.log('Valid actions: grant, revoke, check, list');
      process.exit(1);
  }
  
  process.exit(0);
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

main();
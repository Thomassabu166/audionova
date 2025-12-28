const admin = require('firebase-admin');
const path = require('path');

// Check if we're in test mode
const TEST_MODE = process.env.ADMIN_TEST_MODE === 'true';

// Mock Firebase Admin for testing
const mockAdmin = {
  auth: () => ({
    verifyIdToken: async (token) => {
      console.log('Mock Firebase: Verifying token:', token);
      
      if (token === 'demo-admin-token') {
        return {
          uid: 'demo-admin-uid',
          email: 'admin@demo.com',
          role: 'admin'
        };
      }
      if (token === 'demo-user-token') {
        return {
          uid: 'demo-user-uid',
          email: 'user@demo.com'
        };
      }
      
      // For demo mode, treat any token as valid user
      return {
        uid: 'demo-user-' + Math.random().toString(36).substr(2, 9),
        email: 'demo@example.com',
        role: token.includes('admin') ? 'admin' : 'user'
      };
    },
    setCustomUserClaims: async (uid, claims) => {
      console.log('Mock Firebase: Setting custom claims for', uid, claims);
      return Promise.resolve();
    },
    getUserByEmail: async (email) => {
      console.log('Mock Firebase: Getting user by email:', email);
      return {
        uid: 'demo-user-' + email.replace('@', '-').replace('.', '-'),
        email: email,
        emailVerified: true,
        customClaims: { role: 'admin' }
      };
    },
    getUser: async (uid) => {
      console.log('Mock Firebase: Getting user by UID:', uid);
      return {
        uid: uid,
        email: 'demo@example.com',
        emailVerified: true,
        customClaims: { role: 'admin' },
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        }
      };
    }
  })
};

// Initialize Firebase Admin SDK
let firebaseApp;
let adminInstance;

if (TEST_MODE) {
  console.log('🧪 Running in DEMO MODE - Firebase Admin SDK mocked');
  adminInstance = mockAdmin;
} else {
  try {
    // Try to use service account key file if available
    const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
    
    try {
      const serviceAccount = require(serviceAccountPath);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      adminInstance = admin;
      console.log('Firebase Admin initialized with service account key');
    } catch (fileError) {
      // Fallback to environment variables
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        const serviceAccount = {
          type: "service_account",
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
        };

        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
        adminInstance = admin;
        console.log('Firebase Admin initialized with environment variables');
      } else {
        console.error('Firebase Admin SDK not initialized: Missing service account key file or environment variables');
        console.error('Required env vars: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
        console.log('💡 Tip: Set ADMIN_TEST_MODE=true in .env to use demo mode');
      }
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error.message);
  }
}

module.exports = { 
  admin: adminInstance, 
  firebaseApp,
  TEST_MODE 
};
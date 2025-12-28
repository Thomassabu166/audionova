# 🔐 Security Setup Guide

## ⚠️ IMPORTANT: Credential Security

This project has been configured with **placeholder credentials** for security. You must replace these with your actual credentials before running the application.

## 🚨 Never Commit Real Credentials

The following files contain sensitive information and should **NEVER** be committed to version control:
- `.env`
- `backend/.env`
- `backend/firebase-service-account.json`

These files are already included in `.gitignore` to prevent accidental commits.

## 📋 Setup Instructions

### 1. Frontend Configuration (`.env`)

Copy `.env.example` to `.env` and replace the placeholder values:

```bash
cp .env.example .env
```

Get your Firebase credentials from:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings > General > Your apps
4. Copy the config values

### 2. Backend Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and replace the placeholder values:

```bash
cp backend/.env.example backend/.env
```

#### Firebase Admin SDK Setup

**Option 1: Service Account Key File (Recommended for Development)**
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save the JSON file as `backend/firebase-service-account.json`
4. Set `ADMIN_TEST_MODE=false` in `backend/.env`

**Option 2: Environment Variables (Recommended for Production)**
1. Extract values from the service account JSON
2. Set them in `backend/.env`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`
   - etc.

#### MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a cluster
3. Go to Database Access > Add Database User
4. Go to Network Access > Add IP Address
5. Go to Databases > Connect > Connect your application
6. Copy the connection string to `MONGODB_URI`

#### Spotify API Setup (Optional)

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create an app
3. Copy Client ID and Client Secret
4. Set redirect URI to `http://localhost:3000/callback`

## 🧪 Demo Mode

For development without real Firebase credentials, you can use demo mode:

```bash
# In backend/.env
ADMIN_TEST_MODE=true
```

This will use mock Firebase services for testing.

## 🔒 Production Security

### Environment Variables

For production deployment, use environment variables instead of files:

```bash
# Set these in your hosting platform (Vercel, Netlify, etc.)
VITE_FIREBASE_API_KEY=your_real_api_key
FIREBASE_PROJECT_ID=your_real_project_id
MONGODB_URI=your_real_mongodb_uri
# ... etc
```

### Security Best Practices

1. **Never commit real credentials** to version control
2. **Use different credentials** for development and production
3. **Rotate credentials regularly**
4. **Use least-privilege access** for service accounts
5. **Monitor access logs** for suspicious activity
6. **Use environment variables** in production
7. **Enable 2FA** on all service accounts

## 🚨 If Credentials Were Exposed

If you accidentally committed real credentials:

1. **Immediately revoke/rotate** all exposed credentials
2. **Remove from git history**: `git filter-branch` or BFG Repo-Cleaner
3. **Check access logs** for unauthorized usage
4. **Update all affected services**
5. **Notify your team** about the incident

## 📞 Support

If you need help with credential setup:
1. Check the service provider's documentation
2. Review the example files in this repository
3. Contact the development team

---

**Remember: Security is everyone's responsibility! 🛡️**
# 🚀 Demo Mode Quick Start Guide

## 🎯 Run AudioNova in Demo Mode (No Setup Required!)

Demo mode allows you to test the application immediately without configuring Firebase, MongoDB, or Spotify credentials.

## 📋 Prerequisites

- **Node.js 18+** and npm
- **Git** (to clone the repository)

## ⚡ Quick Start (5 minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/Thomassabu166/audionova.git
cd audionova
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Configure Demo Mode

**Frontend (.env):**
```bash
# Copy the example file
cp .env.example .env

# The .env file already has demo placeholders - no changes needed!
# It contains:
# VITE_FIREBASE_API_KEY=demo-api-key
# VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
# etc.
```

**Backend (backend/.env):**
```bash
# Copy the example file
cp backend/.env.example backend/.env

# Edit backend/.env and ensure demo mode is enabled:
echo "ADMIN_TEST_MODE=true" >> backend/.env
```

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5009

## 🎮 Demo Mode Features

### ✅ What Works in Demo Mode:

1. **Music Streaming** - Full JioSaavn API integration
2. **Search & Browse** - Search songs, artists, albums
3. **Playlists** - Create and manage playlists (local storage)
4. **Trending Songs** - View trending music
5. **New Releases** - Browse latest releases
6. **Audio Player** - Full-featured music player
7. **UI/UX** - Complete interface with themes
8. **Language Support** - Multi-language content

### ⚠️ Demo Mode Limitations:

1. **Authentication** - Mock Firebase auth (no real Google login)
2. **User Profiles** - Temporary demo profiles
3. **Data Persistence** - Limited to local storage
4. **Admin Features** - Mock admin dashboard
5. **Spotify Import** - Disabled (requires real API keys)

## 🔧 Demo Mode Configuration

The demo mode is automatically configured with these settings:

**Frontend (.env):**
```env
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_API_BASE_URL=http://localhost:5009
```

**Backend (backend/.env):**
```env
ADMIN_TEST_MODE=true
FIREBASE_PROJECT_ID=your-project-id
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

## 🎵 Testing the Demo

### 1. Music Search
- Go to http://localhost:5173
- Use the search bar to find songs
- Try searching: "Arijit Singh", "AR Rahman", "Bollywood"

### 2. Browse Features
- **Trending**: Check out trending songs
- **New Releases**: Browse latest music
- **Languages**: Filter by Malayalam, Tamil, Hindi, etc.

### 3. Player Features
- Click any song to play
- Test play/pause, skip, volume controls
- Try the expanded player view

### 4. Playlist Management
- Create new playlists
- Add songs to playlists
- Manage your music collection

## 🚨 Troubleshooting Demo Mode

### Common Issues:

**1. "Firebase not initialized" error:**
```bash
# Make sure VITE_FIREBASE_API_KEY=demo-api-key in .env
# This triggers demo mode in the frontend
```

**2. Backend authentication errors:**
```bash
# Ensure ADMIN_TEST_MODE=true in backend/.env
# This enables mock Firebase services
```

**3. API connection issues:**
```bash
# Check if backend is running on port 5009
# Check if VITE_API_BASE_URL=http://localhost:5009 in .env
```

**4. Songs not loading:**
```bash
# JioSaavn API might be temporarily down
# Try different search terms
# Check browser console for errors
```

## 🔄 Switching to Production Mode

When ready to use real credentials:

1. **Follow SECURITY_SETUP.md** for complete setup
2. **Set ADMIN_TEST_MODE=false** in backend/.env
3. **Configure real Firebase credentials**
4. **Set up MongoDB Atlas**
5. **Add Spotify API keys** (optional)

## 📱 Demo Mode Screenshots

The demo mode provides the full AudioNova experience:
- Modern, responsive UI
- Dark/light theme support
- Mobile-friendly design
- Smooth animations and transitions
- Professional music player interface

## 🎯 Perfect for:

- **Developers** - Testing and development
- **Reviewers** - Evaluating the application
- **Demos** - Showcasing features
- **Learning** - Understanding the codebase
- **Quick Testing** - No setup required

---

**🎉 Enjoy exploring AudioNova in demo mode!**

*For production setup with real credentials, see [SECURITY_SETUP.md](./SECURITY_SETUP.md)*
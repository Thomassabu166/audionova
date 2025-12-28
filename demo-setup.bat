@echo off
REM AudioNova Demo Mode Setup Script for Windows
REM Run this script to quickly set up demo mode

echo 🎵 AudioNova Demo Mode Setup
echo ==============================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Install dependencies
echo 📦 Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

cd backend
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..

echo ✅ Dependencies installed

REM Set up environment files
echo ⚙️  Setting up environment files...

REM Frontend .env
if not exist .env (
    copy .env.example .env
    echo ✅ Created .env file
) else (
    echo ℹ️  .env file already exists
)

REM Backend .env
if not exist backend\.env (
    copy backend\.env.example backend\.env
    echo ADMIN_TEST_MODE=true >> backend\.env
    echo ✅ Created backend/.env file with demo mode enabled
) else (
    echo ℹ️  backend/.env file already exists
    REM Ensure demo mode is enabled
    findstr /C:"ADMIN_TEST_MODE=true" backend\.env >nul
    if %errorlevel% neq 0 (
        echo ADMIN_TEST_MODE=true >> backend\.env
        echo ✅ Enabled demo mode in backend/.env
    )
)

echo.
echo 🎉 Demo mode setup complete!
echo.
echo To start the application:
echo 1. Terminal 1: cd backend ^&^& npm start
echo 2. Terminal 2: npm run dev
echo 3. Open: http://localhost:5173
echo.
echo 📖 For detailed instructions, see: DEMO_MODE_QUICKSTART.md
echo 🔧 For production setup, see: SECURITY_SETUP.md
pause
#!/bin/bash
# AudioNova Demo Mode Setup Script
# Run this script to quickly set up demo mode

echo "🎵 AudioNova Demo Mode Setup"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
cd ..

echo "✅ Dependencies installed"

# Set up environment files
echo "⚙️  Setting up environment files..."

# Frontend .env
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file"
else
    echo "ℹ️  .env file already exists"
fi

# Backend .env
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "ADMIN_TEST_MODE=true" >> backend/.env
    echo "✅ Created backend/.env file with demo mode enabled"
else
    echo "ℹ️  backend/.env file already exists"
    # Ensure demo mode is enabled
    if ! grep -q "ADMIN_TEST_MODE=true" backend/.env; then
        echo "ADMIN_TEST_MODE=true" >> backend/.env
        echo "✅ Enabled demo mode in backend/.env"
    fi
fi

echo ""
echo "🎉 Demo mode setup complete!"
echo ""
echo "To start the application:"
echo "1. Terminal 1: cd backend && npm start"
echo "2. Terminal 2: npm run dev"
echo "3. Open: http://localhost:5173"
echo ""
echo "📖 For detailed instructions, see: DEMO_MODE_QUICKSTART.md"
echo "🔧 For production setup, see: SECURITY_SETUP.md"
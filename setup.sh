#!/bin/bash
# Bailey's Gauge - Setup Script

echo "🎯 Bailey's Gauge SaaS Setup"
echo "============================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Backend setup
echo "📦 Setting up backend..."
cd backend
npm install
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Backend installation failed"
    exit 1
fi
cd ..
echo ""

# Frontend setup
echo "📦 Setting up frontend..."
cd frontend
npm install
if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Frontend installation failed"
    exit 1
fi
cd ..
echo ""

echo "✅ Setup complete!"
echo ""
echo "🚀 Start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend && npm start"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend && npm start"
echo ""
echo "Then open http://localhost:3000"
echo ""
echo "Test account:"
echo "  Email: test@example.com"
echo "  Password: password123"
echo ""
echo "Stock tickers to try: AAPL,MSFT,GOOGL,AMZN,TSLA"
echo ""

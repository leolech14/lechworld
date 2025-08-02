#!/bin/bash
# Bulletproof development server starter

set -e  # Exit on any error

echo "🚀 Starting Lech.world Development Server"
echo "=================================="

# 1. Clean up any existing processes
echo "🧹 Cleaning up old processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
pkill -f "tsx watch" 2>/dev/null || true
sleep 1

# 2. Check for PostgreSQL
echo "🐘 Checking PostgreSQL..."
if ! command -v psql >/dev/null 2>&1; then
    echo "❌ PostgreSQL is not installed!"
    echo "Install with: brew install postgresql@16"
    exit 1
fi

# 3. Start PostgreSQL if needed
if ! pg_isready -q; then
    echo "Starting PostgreSQL..."
    if command -v brew >/dev/null 2>&1; then
        brew services start postgresql@16 2>/dev/null || brew services start postgresql 2>/dev/null
    else
        echo "⚠️  Please start PostgreSQL manually"
    fi
    
    # Wait for PostgreSQL
    for i in {1..10}; do
        if pg_isready -q; then
            break
        fi
        echo "Waiting for PostgreSQL to start..."
        sleep 1
    done
fi

if pg_isready -q; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ Could not start PostgreSQL"
    exit 1
fi

# 4. Setup database
echo "📊 Setting up database..."
createdb lechworld 2>/dev/null || echo "Database already exists"

# 5. Check environment
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "📝 Created .env from example - please update it!"
    else
        echo "⚠️  No .env file found!"
    fi
fi

# 6. Install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# 7. Run migrations
echo "🔄 Running database migrations..."
npm run db:migrate 2>/dev/null || echo "Migrations may already be applied"

# 8. Show the current changes
echo ""
echo "📱 New Features Available:"
echo "  • Airline Guide at /guide"
echo "  • Portuguese documentation"
echo "  • Interactive program information"
echo ""

# 9. Start the server
echo "🌟 Starting server on port 3000..."
echo "=================================="
echo "📍 URL: http://localhost:3000"
echo "👤 Login: lech / world"
echo "🎯 Airline Guide: http://localhost:3000/guide"
echo "=================================="
echo ""

# Export environment variables and start
export PORT=3000
export NODE_ENV=development

# Start the server
exec npm run dev
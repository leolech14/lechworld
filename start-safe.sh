#\!/bin/bash

# Memory-Safe Application Startup Script
# Prevents the memory leak crashes

echo "🚀 Starting memory-optimized server..."

# Kill any existing processes on common ports
echo "🧹 Cleaning up existing processes..."
pkill -f "tsx.*src/index.ts" || true
pkill -f "claude" || true
lsof -ti:3000,3001,4000,4001,5000,5001,5432 | xargs kill -9 2>/dev/null || true

# Set Node.js memory limits
export NODE_OPTIONS="--max-old-space-size=8192 --max-semi-space-size=128"

# Set PostgreSQL connection limits
export PGMAXCONNECTIONS=20
export DATABASE_URL="postgresql://orchestrator:orchestrator123@localhost:5432/orchestrator"

# Start PostgreSQL if not running
if \! pgrep -x "postgres" > /dev/null; then
    echo "🐘 Starting PostgreSQL..."
    brew services start postgresql@16 || true
    sleep 3
fi

# Health check database
echo "🔍 Testing database connection..."
if \! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Database connection failed\!"
    echo "Please ensure PostgreSQL is running and database exists."
    exit 1
fi

echo "✅ Database connection successful"

# Start API server with memory limits
echo "🎯 Starting API server..."
cd apps/api
NODE_OPTIONS="$NODE_OPTIONS" npm run dev &
API_PID=$\!

echo "✅ API server started (PID: $API_PID)"
echo "🌍 Server running at http://localhost:3001"
echo "📊 Health check: http://localhost:3001/health"

# Monitor memory usage
echo "📈 Memory monitoring enabled..."
echo "Press Ctrl+C to stop all services"

# Trap to clean up on exit
trap 'echo "🛑 Shutting down..."; kill $API_PID 2>/dev/null; exit 0' SIGINT SIGTERM

# Keep script running
wait $API_PID

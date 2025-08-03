#!/bin/bash

# Start servers in background for lechworld

echo "🚀 Starting lechworld servers in background..."

# Kill any existing processes on ports 4444 and 4445
echo "📍 Clearing ports..."
pkill -f "tsx server/index.ts" 2>/dev/null || true
pkill -f "vite --port 4445" 2>/dev/null || true
lsof -ti:4444 | xargs kill -9 2>/dev/null || true
lsof -ti:4445 | xargs kill -9 2>/dev/null || true

# Start backend server
echo "🔧 Starting backend on port 4444..."
PORT=4444 nohup npx tsx server/index.ts > backend.log 2>&1 &
echo $! > backend.pid

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend on port 4445..."
cd client && PORT=4445 nohup npx vite --port 4445 --host > ../frontend.log 2>&1 &
echo $! > ../frontend.pid
cd ..

echo "✅ Servers started in background!"
echo "   Backend:  http://localhost:4444 (PID: $(cat backend.pid))"
echo "   Frontend: http://localhost:4445 (PID: $(cat frontend.pid))"
echo ""
echo "Logs: tail -f backend.log frontend.log"
echo "Stop: pkill -f 'tsx server/index.ts' && pkill -f 'vite --port 4445'"
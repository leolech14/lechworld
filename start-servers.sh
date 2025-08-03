#!/bin/bash

# Start servers for lechworld with Neon database

echo "🚀 Starting lechworld servers..."

# Kill any existing processes on ports 4444 and 4445
echo "📍 Clearing ports..."
lsof -ti:4444 | xargs -r kill -9 2>/dev/null || true
lsof -ti:4445 | xargs -r kill -9 2>/dev/null || true

# Start backend server
echo "🔧 Starting backend on port 4444..."
PORT=4444 npx tsx server/index.ts &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend on port 4445..."
cd client && PORT=4445 npx vite --port 4445 --host &
FRONTEND_PID=$!

echo "✅ Servers started!"
echo "   Backend:  http://localhost:4444"
echo "   Frontend: http://localhost:4445"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for interrupt
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
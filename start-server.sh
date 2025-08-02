#!/bin/bash

# Kill any existing process on port 5001
lsof -ti:5001 | xargs kill -9 2>/dev/null || true

# Start the server
echo "Starting LechWorld server on port 5001..."
cd /Users/lech/development_hub/PROJECT_lechworld
npm run dev
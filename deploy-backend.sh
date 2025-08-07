#!/bin/bash

# Deploy backend to Railway
set -e

echo "🚂 Deploying backend to Railway..."

# Set Railway project ID (from lechworld-backend)
export RAILWAY_PROJECT_ID="lechworld-backend"

# Create Railway configuration
cat > railway.toml << 'EOF'
[build]
builder = "nixpacks"
buildCommand = "cd apps/api && npm install && npm run build"

[deploy]
startCommand = "cd apps/api && npm run start"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[[services]]
name = "api"
type = "web"
port = 3001
EOF

echo "✅ Railway configuration created"

# Deploy using Railway CLI
echo "🚀 Deploying to Railway..."
railway up --detach --environment production || {
    echo "❌ Railway CLI deployment failed"
    echo ""
    echo "📋 Manual deployment steps:"
    echo "1. Go to https://railway.app/dashboard"
    echo "2. Select 'lechworld-backend' project"
    echo "3. Click 'New' → 'GitHub Repo'"
    echo "4. Select 'leolech14/lechworld' repository"
    echo "5. Set root directory to: /apps/api"
    echo "6. Railway will auto-deploy!"
}

echo ""
echo "🎯 Deployment initiated!"
echo "Check status at: https://railway.app/project/lechworld-backend"
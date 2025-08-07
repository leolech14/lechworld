#!/bin/bash

# Railway deployment script for lechworld
set -e

echo "🚂 Deploying LechWorld to Railway..."

# Check if logged in
if ! railway whoami > /dev/null 2>&1; then
    echo "❌ Not logged in to Railway. Please run: railway login"
    exit 1
fi

echo "✅ Logged in to Railway"

# Create project if it doesn't exist
echo "📦 Setting up Railway project..."

# Deploy using Railway config
echo "🚀 Deploying to Railway..."

# Use the existing railway.json config
railway up --detach

echo "✅ Deployment initiated!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://railway.app/dashboard to view your deployment"
echo "2. Add the following environment variables in Railway dashboard:"
echo "   - JWT_SECRET (from .env.production.secrets)"
echo "   - DATABASE_URL (will be auto-created with PostgreSQL)"
echo "   - REDIS_URL (will be auto-created with Redis)"
echo "3. Add PostgreSQL and Redis services in Railway"
echo "4. Your app will be available at: https://lechworld.railway.app"
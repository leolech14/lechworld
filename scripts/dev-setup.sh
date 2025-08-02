#!/bin/bash

# Development setup script for PROJECT_lechworld

echo "🚀 Setting up PROJECT_lechworld development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration"
fi

# Start PostgreSQL and Redis
echo "🐘 Starting PostgreSQL and Redis..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run database migrations
echo "🗄️ Setting up database schema..."
npx drizzle-kit push:pg

# Seed airlines data
echo "✈️ Seeding airlines data..."
npm run db:seed

echo "✅ Development environment setup complete!"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "The server will be available at http://localhost:5000"
echo ""
echo "To stop the database containers, run:"
echo "  docker-compose down"
# 🚀 Development Setup Guide - Never Fail Again!

This guide ensures your localhost development environment always works, regardless of who's running it or when.

## Quick Start (One Command)

```bash
./scripts/start-dev.sh
```

## The Complete Configuration Checklist

### 1. **Environment Variables** (.env)
```bash
# ALWAYS have these set correctly:
DATABASE_URL=postgresql://localhost:5432/lechworld
SESSION_SECRET=any-secret-string-here
PORT=3000  # Avoid 5000 (macOS uses it)
NODE_ENV=development
```

### 2. **Pre-flight Checks** (Run before starting)
```bash
# Kill conflicting processes
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
pkill -f "tsx watch" 2>/dev/null || true

# Ensure PostgreSQL is running
brew services start postgresql@16 || sudo systemctl start postgresql

# Ensure database exists
createdb lechworld 2>/dev/null || echo "DB exists"

# Run migrations
npm run db:migrate
```

### 3. **Common Issues & Solutions**

#### Port Already in Use
```bash
# Find what's using port 3000
lsof -i :3000

# Kill it
kill -9 $(lsof -ti:3000)
```

#### PostgreSQL Not Running
```bash
# macOS
brew services start postgresql@16

# Linux
sudo systemctl start postgresql

# Check if running
pg_isready
```

#### Database Connection Refused
```bash
# Check PostgreSQL is accepting connections
psql -U postgres -c "SELECT 1"

# Check DATABASE_URL format
echo $DATABASE_URL  # Should be postgresql://localhost:5432/lechworld
```

#### Missing Dependencies
```bash
npm install
```

### 4. **The Bulletproof Start Script**

Create this as `start-dev.sh`:

```bash
#!/bin/bash
set -e  # Exit on error

echo "🚀 Starting Lech.world Development Server"

# 1. Environment check
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Created .env - please update values!"
fi

# 2. Port cleanup
echo "🧹 Cleaning ports..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 3. Database setup
echo "🐘 Setting up database..."
if command -v psql >/dev/null; then
    createdb lechworld 2>/dev/null || true
    npm run db:migrate
else
    echo "❌ PostgreSQL not found! Install with: brew install postgresql@16"
    exit 1
fi

# 4. Dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# 5. Start with explicit config
export PORT=3000
export NODE_ENV=development

echo "
✅ Ready to start!
📍 URL: http://localhost:3000
👤 Login: lech / world
🎯 Airline Guide: http://localhost:3000/guide
"

npm run dev
```

### 5. **VS Code / Cursor Launch Config**

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Start Dev Server",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "env": {
        "PORT": "3000",
        "NODE_ENV": "development"
      },
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    }
  ]
}
```

### 6. **Docker Alternative** (Most Reliable)

Create `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: lechworld
      POSTGRES_HOST_AUTH_METHOD: trust
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres@postgres:5432/lechworld
      PORT: 3000
    depends_on:
      - postgres
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_data:
```

Then just run:
```bash
docker-compose -f docker-compose.dev.yml up
```

### 7. **Testing the Setup**

Run these commands to verify everything works:

```bash
# Test database connection
psql postgresql://localhost:5432/lechworld -c "SELECT NOW()"

# Test server is responding
curl -I http://localhost:3000

# Test API endpoint
curl http://localhost:3000/api/health
```

### 8. **Troubleshooting Commands**

```bash
# Full reset
npm run dev:reset

# Check all services
npm run dev:status

# View logs
npm run dev:logs
```

### 9. **NPM Scripts to Add**

Add these to `package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch server/index.ts",
    "dev:clean": "rm -rf node_modules dist && npm install",
    "dev:reset": "npm run dev:clean && npm run db:reset && npm run dev",
    "dev:status": "pg_isready && curl -s http://localhost:3000/api/health || echo 'Server not running'",
    "db:reset": "dropdb lechworld --if-exists && createdb lechworld && npm run db:migrate"
  }
}
```

## For Parallel Sessions

When multiple Claude Code instances work on the same project:

1. **Use different ports**: Set `PORT=3001`, `PORT=3002`, etc.
2. **Share the database**: All instances can use the same PostgreSQL
3. **Use file watchers carefully**: Only one instance should run `tsx watch`
4. **Commit frequently**: So all instances see changes

## The Nuclear Option

If nothing works:

```bash
# Stop everything
killall node
brew services stop --all

# Clean everything
rm -rf node_modules
rm -rf dist
rm .env

# Start fresh
cp .env.example .env
npm install
createdb lechworld
npm run db:migrate
PORT=3000 npm run dev
```

Remember: The most common issues are:
1. ❌ Wrong port (use 3000, not 5000)
2. ❌ PostgreSQL not running
3. ❌ Missing .env file
4. ❌ Old processes still running
5. ❌ Database not created

With this guide, localhost setup should work every time! 🎉
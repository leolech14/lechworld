#!/bin/bash
set -e

echo "🚀 Running LechWorld Migration"
echo "============================="
echo ""

cd /Users/lech/lechworld

# Credentials
SUPABASE_URL="https://ixzwjmbvmrefsivcmirz.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4endqbWJ2bXJlZnNpdmNtaXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzYyODksImV4cCI6MjA2ODU1MjI4OX0.iXHSX5MPP-3h8KJvEg5Rx0ccsaXyvE_RM7Qfgnzglps"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4endqbWJ2bXJlZnNpdmNtaXJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjk3NjI4OSwiZXhwIjoyMDY4NTUyMjg5fQ.xz_TEASFWMReLnVM76_U0JQ4DWXys6JUHBHlHXRJCyM"
DB_PASSWORD="7ZhBrHJb5BvceDWz"
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@db.ixzwjmbvmrefsivcmirz.supabase.co:5432/postgres"
MONGO_URL="mongodb+srv://leonardolech:MilhasLech2025@google.4qrky6q.mongodb.net/?retryWrites=true&w=majority&appName=google"
DB_NAME="milhaslech"

# Create .env
cat > .env << EOF
# Supabase
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY
DATABASE_URL=$DATABASE_URL

# Server
PORT=3000
NODE_ENV=production
SESSION_SECRET=$(openssl rand -hex 32)

# MongoDB (for migration)
MONGO_URL=$MONGO_URL
DB_NAME=$DB_NAME
EOF

echo "✓ Environment configured"

# First, create the database schema
echo ""
echo "📋 STEP 1: Create Database Schema"
echo "================================="
echo ""
echo "Please go to: https://ixzwjmbvmrefsivcmirz.supabase.co/sql/new"
echo ""
echo "Copy and paste ALL of this SQL, then click 'Run':"
echo ""
echo "----------------------------------------"
cat /Users/lech/lechworld/supabase-schema.sql
echo "----------------------------------------"
echo ""
read -p "Press Enter AFTER you've run the SQL..."

# Deploy to Fly.io
echo ""
echo "📋 STEP 2: Deploying to Fly.io"
echo "=============================="
fly secrets set \
  SUPABASE_URL="$SUPABASE_URL" \
  SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY" \
  DATABASE_URL="$DATABASE_URL" \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  --app lechworld

fly deploy --app lechworld

# Migrate data
echo ""
echo "📋 STEP 3: Migrating Data"
echo "========================"
npx tsx scripts/migrate-from-milhaslech.ts

echo ""
echo "✅ COMPLETE!"
echo ""
echo "App: https://lechworld.fly.dev"
echo "Login: admin@lechworld.com / lechworld2025"
echo "Dashboard: https://ixzwjmbvmrefsivcmirz.supabase.co"
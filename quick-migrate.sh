#!/bin/bash

# Quick migration script - just paste your credentials and go!

echo "🚀 LechWorld Quick Migration"
echo "=========================="
echo ""
echo "Get these from Doppler (https://dashboard.doppler.com):"
echo "- Project: milhaslech → Environment: prd"
echo ""

read -p "Paste SUPABASE_SERVICE_KEY: " SERVICE_KEY
read -s -p "Paste Database Password: " DB_PASS
echo ""

if [ -z "$SERVICE_KEY" ] || [ -z "$DB_PASS" ]; then
    echo "❌ Both credentials are required!"
    exit 1
fi

cd /Users/lech/lechworld

# Create .env
cat > .env << EOF
SUPABASE_URL=https://losjjureznviaoeefzet.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvc2pqdXJlem52aWFvZWZ6ZXQiLCJyb2xlIjoiYW5vbiIsImlhdDE6MTc1MDA0NzMyNywiZXhwIjoyMDY1NjIzMzI3fQ.jxfIuOkk9Mkd3n1dvI8sAq67-mDDDzwaaCPUUxywN98
SUPABASE_SERVICE_KEY=$SERVICE_KEY
DATABASE_URL=postgresql://postgres:${DB_PASS}@db.losjjureznviaoeefzet.supabase.co:5432/postgres
PORT=3000
NODE_ENV=production
SESSION_SECRET=$(openssl rand -hex 32)
MONGO_URL=mongodb+srv://leonardolech:MilhasLech2025@google.4qrky6q.mongodb.net/?retryWrites=true&w=majority&appName=google
DB_NAME=milhaslech
EOF

echo "✓ Config created"

# Deploy
echo "Deploying..."
fly secrets set \
  SUPABASE_URL="https://losjjureznviaoeefzet.supabase.co" \
  SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvc2pqdXJlem52aWFvZWZ6ZXQiLCJyb2xlIjoiYW5vbiIsImlhdDE6MTc1MDA0NzMyNywiZXhwIjoyMDY1NjIzMzI3fQ.jxfIuOkk9Mkd3n1dvI8sAq67-mDDDzwaaCPUUxywN98" \
  SUPABASE_SERVICE_KEY="$SERVICE_KEY" \
  DATABASE_URL="postgresql://postgres:${DB_PASS}@db.losjjureznviaoeefzet.supabase.co:5432/postgres" \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  --app lechworld

fly deploy --app lechworld

echo ""
echo "✅ Deployed! Now create the database schema:"
echo "1. Open: https://supabase.com/dashboard/project/losjjureznviaoeefzet/sql/new"
echo "2. Copy contents from: /Users/lech/lechworld/supabase-schema.sql"
echo "3. Click Run"
echo ""
read -p "Press Enter after creating schema..."

echo "Migrating data..."
npx tsx scripts/migrate-from-milhaslech.ts

echo ""
echo "✅ Done! Your app: https://lechworld.fly.dev"
echo "Login: admin@lechworld.com / lechworld2025"
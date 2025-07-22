#!/bin/bash
# Deploy lechworld to Fly.io

# 1. Supabase setup
echo "Create project at supabase.com"
echo "Run supabase-schema.sql in SQL Editor"

# 2. Fly setup
fly launch --name lechworld --region gru --no-deploy

# 3. Set secrets
read -p "SUPABASE_URL: " SUPABASE_URL
read -p "SUPABASE_SERVICE_KEY: " SUPABASE_SERVICE_KEY
read -p "DATABASE_URL: " DATABASE_URL

fly secrets set \
  SUPABASE_URL="$SUPABASE_URL" \
  SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY" \
  DATABASE_URL="$DATABASE_URL" \
  SESSION_SECRET="$(openssl rand -hex 32)"

# 4. Deploy
fly deploy

# 5. Migrate data
echo "Set MongoDB credentials:"
read -p "MONGO_URL: " MONGO_URL
export MONGO_URL DB_NAME=milhaslech
npx tsx scripts/migrate-from-milhaslech.ts

echo "Done. App at https://lechworld.fly.dev"
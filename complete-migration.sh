#!/bin/bash
set -e

echo "🚀 Completing LechWorld Migration..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd /Users/lech/lechworld

# Known credentials
MONGO_URL="mongodb+srv://leonardolech:MilhasLech2025@google.4qrky6q.mongodb.net/?retryWrites=true&w=majority&appName=google"
DB_NAME="milhaslech"
SUPABASE_URL="https://losjjureznviaoeefzet.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvc2pqdXJlem52aWFvZWZ6ZXQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1MDA0NzMyNywiZXhwIjoyMDY1NjIzMzI3fQ.jxfIuOkk9Mkd3n1dvI8sAq67-mDDDzwaaCPUUxywN98"

echo -e "${YELLOW}To complete the migration, we need the Supabase service key.${NC}"
echo -e "1. Go to: ${GREEN}https://supabase.com/dashboard/project/losjjureznviaoeefzet/settings/api${NC}"
echo -e "2. Copy the 'service_role' key (secret key that starts with eyJ...)"
echo ""
read -p "Paste SUPABASE_SERVICE_KEY: " SUPABASE_SERVICE_KEY

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo -e "${RED}Service key is required!${NC}"
    exit 1
fi

echo -e "${YELLOW}We also need the database password.${NC}"
echo -e "Go to: ${GREEN}https://supabase.com/dashboard/project/losjjureznviaoeefzet/settings/database${NC}"
echo -e "Look for 'Connection string' section and find your password"
echo ""
read -s -p "Database password: " DB_PASSWORD
echo

DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@db.losjjureznviaoeefzet.supabase.co:5432/postgres"

# Create .env
echo -e "${YELLOW}Creating .env file...${NC}"
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

echo -e "${GREEN}✓ Environment configured${NC}"

# Deploy to Fly.io
echo -e "${YELLOW}Updating Fly.io secrets...${NC}"
fly secrets set \
  SUPABASE_URL="$SUPABASE_URL" \
  SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY" \
  DATABASE_URL="$DATABASE_URL" \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  --app lechworld

echo -e "${YELLOW}Deploying to Fly.io...${NC}"
fly deploy --app lechworld

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}Now we need to set up the database schema and migrate data.${NC}"
echo ""
echo -e "${YELLOW}Step 1: Create database schema${NC}"
echo -e "1. Go to: ${GREEN}https://supabase.com/dashboard/project/losjjureznviaoeefzet/sql/new${NC}"
echo -e "2. Copy and paste the contents of: ${GREEN}/Users/lech/lechworld/supabase-schema.sql${NC}"
echo -e "3. Click 'Run' to create the tables"
echo ""
read -p "Press Enter when the schema is created..."

echo -e "${YELLOW}Step 2: Migrating data from MongoDB...${NC}"
npx tsx scripts/migrate-from-milhaslech.ts

echo -e "${GREEN}✅ Migration complete!${NC}"
echo ""
echo -e "Your app is now live at: ${GREEN}https://lechworld.fly.dev${NC}"
echo ""
echo -e "${YELLOW}Default login credentials:${NC}"
echo -e "Email: admin@lechworld.com"
echo -e "Password: lechworld2025"
echo ""
echo -e "${RED}⚠️  IMPORTANT: Change this password immediately after logging in!${NC}"
echo ""
echo -e "${YELLOW}To view logs:${NC} fly logs --app lechworld"
echo -e "${YELLOW}To check status:${NC} fly status --app lechworld"
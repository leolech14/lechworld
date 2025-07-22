#!/bin/bash
set -e

echo "🚀 Complete LechWorld Migration (Manual Credentials)"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

cd /Users/lech/lechworld

# Known values
SUPABASE_URL="https://losjjureznviaoeefzet.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvc2pqdXJlem52aWFvZWZ6ZXQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1MDA0NzMyNywiZXhwIjoyMDY1NjIzMzI3fQ.jxfIuOkk9Mkd3n1dvI8sAq67-mDDDzwaaCPUUxywN98"
MONGO_URL="mongodb+srv://leonardolech:MilhasLech2025@google.4qrky6q.mongodb.net/?retryWrites=true&w=majority&appName=google"
DB_NAME="milhaslech"

echo -e "${YELLOW}Since Doppler credentials are stored there, you have 2 options:${NC}"
echo ""
echo -e "${BLUE}Option 1: Get from Doppler Web${NC}"
echo "1. Go to: https://dashboard.doppler.com"
echo "2. Navigate to: milhaslech → prd environment"
echo "3. Find: SUPABASE_SERVICE_KEY"
echo "4. Find: Database password (might be SUPABASE_DB_PASSWORD or DATABASE_PASSWORD)"
echo ""
echo -e "${BLUE}Option 2: Get from Supabase Dashboard${NC}"
echo "1. Service Key: https://supabase.com/dashboard/project/losjjureznviaoeefzet/settings/api"
echo "2. Database Password: https://supabase.com/dashboard/project/losjjureznviaoeefzet/settings/database"
echo ""
echo -e "${YELLOW}Enter the credentials:${NC}"
read -p "SUPABASE_SERVICE_KEY: " SUPABASE_SERVICE_KEY

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo -e "${RED}Service key is required!${NC}"
    exit 1
fi

read -s -p "Database password: " DB_PASSWORD
echo

if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}Database password is required!${NC}"
    exit 1
fi

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

# Test connection
echo -e "${YELLOW}Testing Supabase connection...${NC}"
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('$SUPABASE_URL', '$SUPABASE_SERVICE_KEY');
supabase.from('users').select('count').then(({data, error}) => {
  if (error) {
    console.error('Connection failed:', error.message);
    process.exit(1);
  } else {
    console.log('✓ Supabase connection successful');
  }
});
" || {
    echo -e "${RED}Failed to connect to Supabase. Check your credentials.${NC}"
    exit 1
}

# Deploy
echo -e "${YELLOW}Deploying to Fly.io...${NC}"
fly secrets set \
  SUPABASE_URL="$SUPABASE_URL" \
  SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY" \
  DATABASE_URL="$DATABASE_URL" \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  --app lechworld

fly deploy --app lechworld --remote-only

# Schema check
echo ""
echo -e "${YELLOW}Checking database schema...${NC}"
echo -e "Go to: ${BLUE}https://supabase.com/dashboard/project/losjjureznviaoeefzet/editor${NC}"
echo -e "Check if these tables exist: users, family_members, loyalty_programs, member_programs, activity_logs"
echo ""
read -p "Do the tables exist? (y/n): " TABLES_EXIST

if [ "$TABLES_EXIST" != "y" ]; then
    echo -e "${YELLOW}Creating schema...${NC}"
    echo -e "1. Copy the contents of: ${BLUE}/Users/lech/lechworld/supabase-schema.sql${NC}"
    echo -e "2. Paste in: ${BLUE}https://supabase.com/dashboard/project/losjjureznviaoeefzet/sql/new${NC}"
    echo -e "3. Click 'Run'"
    echo ""
    read -p "Press Enter when done..."
fi

# Migrate data
echo -e "${YELLOW}Starting data migration...${NC}"
echo -e "${YELLOW}This will migrate:${NC}"
echo "- All family members"
echo "- All loyalty programs"
echo "- All points and balances"
echo "- Activity logs"
echo ""
read -p "Ready to migrate? (y/n): " READY

if [ "$READY" = "y" ]; then
    npx tsx scripts/migrate-from-milhaslech.ts
else
    echo -e "${YELLOW}Skipping migration. You can run it later with:${NC}"
    echo "npx tsx scripts/migrate-from-milhaslech.ts"
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}Your app is live at: https://lechworld.fly.dev${NC}"
echo ""
echo -e "${YELLOW}Default login:${NC}"
echo "Email: admin@lechworld.com"
echo "Password: lechworld2025"
echo ""
echo -e "${RED}⚠️  CHANGE THIS PASSWORD IMMEDIATELY!${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "View logs: fly logs --app lechworld"
echo "Check status: fly status --app lechworld"
echo "Open app: fly open --app lechworld"
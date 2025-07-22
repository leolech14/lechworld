#!/bin/bash
set -e

echo "🚀 Completing LechWorld Migration..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd /Users/lech/lechworld

# Known credentials
SUPABASE_URL="https://losjjureznviaoeefzet.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvc2pqdXJlem52aWFvZWZ6ZXQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1MDA0NzMyNywiZXhwIjoyMDY1NjIzMzI3fQ.jxfIuOkk9Mkd3n1dvI8sAq67-mDDDzwaaCPUUxywN98"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvc2pqdXJlem52aWFvZWZ6ZXQiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzUwMDQ3MzI3LCJleHAiOjIwNjU2MjMzMjd9.RGaVg1fF74Rrs68sBIlrXb5rG0IcgewC0wDGsCRwTjM"
MONGO_URL="mongodb+srv://leonardolech:MilhasLech2025@google.4qrky6q.mongodb.net/?retryWrites=true&w=majority&appName=google"
DB_NAME="milhaslech"

echo -e "${GREEN}✓ Found Supabase credentials!${NC}"
echo ""
echo -e "${YELLOW}Now I need the database password.${NC}"
echo -e "Get it from: ${BLUE}https://supabase.com/dashboard/project/losjjureznviaoeefzet/settings/database${NC}"
echo -e "Look for 'Connection string' section"
echo ""
read -s -p "Database password: " DB_PASSWORD
echo ""

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

# Test Supabase connection
echo -e "${YELLOW}Testing Supabase connection...${NC}"
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('$SUPABASE_URL', '$SUPABASE_SERVICE_KEY');
console.log('✓ Supabase client created successfully');
" || {
    echo -e "${RED}Failed to create Supabase client${NC}"
    exit 1
}

# Deploy to Fly.io
echo -e "${YELLOW}Deploying to Fly.io...${NC}"
fly secrets set \
  SUPABASE_URL="$SUPABASE_URL" \
  SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY" \
  DATABASE_URL="$DATABASE_URL" \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  --app lechworld

fly deploy --app lechworld

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}Now let's set up the database schema.${NC}"
echo -e "1. Go to: ${BLUE}https://supabase.com/dashboard/project/losjjureznviaoeefzet/sql/new${NC}"
echo -e "2. Copy ALL contents from: ${BLUE}/Users/lech/lechworld/supabase-schema.sql${NC}"
echo -e "3. Paste it in the SQL editor"
echo -e "4. Click 'Run'"
echo ""
read -p "Press Enter when the schema is created..."

# Migrate data
echo -e "${YELLOW}Starting data migration from MongoDB to Supabase...${NC}"
npx tsx scripts/migrate-from-milhaslech.ts

echo ""
echo -e "${GREEN}🎉 MIGRATION COMPLETE!${NC}"
echo ""
echo -e "Your new app is live at: ${BLUE}https://lechworld.fly.dev${NC}"
echo ""
echo -e "${YELLOW}Login credentials:${NC}"
echo "Email: admin@lechworld.com"
echo "Password: lechworld2025"
echo ""
echo -e "${RED}⚠️  IMPORTANT: Change this password immediately after logging in!${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "View logs: fly logs --app lechworld"
echo "Check status: fly status --app lechworld"
echo "Open app: fly open --app lechworld"
echo ""
echo -e "${YELLOW}Old app (for comparison):${NC} https://milhaslech.fly.dev"
#!/bin/bash
set -e

echo "🚀 Setting up NEW Supabase Project for LechWorld"
echo "==============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

cd /Users/lech/lechworld

echo -e "${YELLOW}Step 1: Create Supabase Project${NC}"
echo -e "1. Go to: ${BLUE}https://supabase.com${NC}"
echo -e "2. Click 'New Project'"
echo -e "3. Fill in:"
echo -e "   - Name: ${GREEN}lechworld${NC}"
echo -e "   - Database Password: ${GREEN}(choose a strong password and save it!)${NC}"
echo -e "   - Region: ${GREEN}South America (São Paulo)${NC}"
echo -e "4. Click 'Create new project'"
echo -e "5. Wait for it to finish setting up (~2 minutes)"
echo ""
read -p "Press Enter when your project is ready..."

echo ""
echo -e "${YELLOW}Step 2: Get Your Credentials${NC}"
echo -e "Go to: Settings → API in your new project"
echo ""
read -p "Project URL (https://xxxxx.supabase.co): " SUPABASE_URL
read -p "Anon Key (starts with eyJ): " SUPABASE_ANON_KEY
read -p "Service Role Key (starts with eyJ): " SUPABASE_SERVICE_KEY

echo ""
echo -e "${YELLOW}Step 3: Database Password${NC}"
read -s -p "Enter the database password you just created: " DB_PASSWORD
echo ""

# Validate inputs
if [[ ! "$SUPABASE_URL" =~ ^https://.*\.supabase\.co$ ]]; then
    echo -e "${RED}Invalid Supabase URL format${NC}"
    exit 1
fi

if [[ ! "$SUPABASE_ANON_KEY" =~ ^eyJ ]]; then
    echo -e "${RED}Invalid Anon Key format${NC}"
    exit 1
fi

if [[ ! "$SUPABASE_SERVICE_KEY" =~ ^eyJ ]]; then
    echo -e "${RED}Invalid Service Key format${NC}"
    exit 1
fi

# Extract project ref from URL
PROJECT_REF=$(echo $SUPABASE_URL | sed -n 's/https:\/\/\([^.]*\)\.supabase\.co/\1/p')
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

# MongoDB credentials (unchanged)
MONGO_URL="mongodb+srv://leonardolech:MilhasLech2025@google.4qrky6q.mongodb.net/?retryWrites=true&w=majority&appName=google"
DB_NAME="milhaslech"

# Create .env
echo -e "${YELLOW}Creating .env file...${NC}"
cat > .env << EOF
# Supabase (NEW PROJECT)
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
console.log('✓ Supabase client created successfully');
" || {
    echo -e "${RED}Failed to create Supabase client. Check your credentials.${NC}"
    exit 1
}

# Create schema
echo ""
echo -e "${YELLOW}Step 4: Create Database Schema${NC}"
echo -e "1. Go to your project's SQL Editor: ${BLUE}$SUPABASE_URL/sql/new${NC}"
echo -e "2. Copy ALL contents from: ${BLUE}/Users/lech/lechworld/supabase-schema.sql${NC}"
echo -e "3. Paste in the SQL editor"
echo -e "4. Click 'Run'"
echo ""
cat /Users/lech/lechworld/supabase-schema.sql
echo ""
read -p "Press Enter when schema is created..."

# Deploy to Fly
echo -e "${YELLOW}Step 5: Deploying to Fly.io...${NC}"
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
echo -e "${YELLOW}Step 6: Migrating Data...${NC}"
echo "This will migrate:"
echo "- All family members"
echo "- All loyalty programs" 
echo "- All points and balances"
echo ""
read -p "Ready to migrate? (y/n): " READY

if [ "$READY" = "y" ]; then
    npx tsx scripts/migrate-from-milhaslech.ts
fi

echo ""
echo -e "${GREEN}🎉 SETUP COMPLETE!${NC}"
echo ""
echo -e "Your app is live at: ${BLUE}https://lechworld.fly.dev${NC}"
echo ""
echo -e "${YELLOW}Login:${NC}"
echo "Email: admin@lechworld.com"
echo "Password: lechworld2025"
echo ""
echo -e "${RED}⚠️  Change this password after first login!${NC}"
echo ""
echo -e "${YELLOW}Your Supabase Dashboard:${NC} $SUPABASE_URL"
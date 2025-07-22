#!/bin/bash
set -e

echo "🚀 Starting Automated LechWorld Migration..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Credentials from milhaslech
MONGO_URL="mongodb+srv://leonardolech:MilhasLech2025@google.4qrky6q.mongodb.net/?retryWrites=true&w=majority&appName=google"
DB_NAME="milhaslech"
EXISTING_SUPABASE_URL="https://losjjureznviaoeefzet.supabase.co"
EXISTING_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvc2pqdXJlem52aWFvZWZ6ZXQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1MDA0NzMyNywiZXhwIjoyMDY1NjIzMzI3fQ.jxfIuOkk9Mkd3n1dvI8sAq67-mDDDzwaaCPUUxywN98"

cd /Users/lech/lechworld

echo -e "${YELLOW}Using existing Supabase project from milhaslech${NC}"
echo -e "${YELLOW}We need the service role key to continue.${NC}"
echo -e "Go to: https://supabase.com/dashboard/project/losjjureznviaoeefzet/settings/api"
echo -e "Copy the 'service_role' key (starts with eyJ...)"
read -p "SUPABASE_SERVICE_KEY: " SUPABASE_SERVICE_KEY

# Extract project ref
PROJECT_REF="losjjureznviaoeefzet"
echo -e "${YELLOW}Enter the database password for Supabase${NC}"
echo -e "Find it at: https://supabase.com/dashboard/project/losjjureznviaoeefzet/settings/database"
read -s -p "Database password: " DB_PASSWORD
echo

DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

# Create .env
echo -e "${YELLOW}Creating .env file...${NC}"
cat > .env << EOF
# Supabase
SUPABASE_URL=$EXISTING_SUPABASE_URL
SUPABASE_ANON_KEY=$EXISTING_SUPABASE_ANON_KEY
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

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Test build
echo -e "${YELLOW}Testing build...${NC}"
npm run build

# Deploy to Fly.io
echo -e "${YELLOW}Checking Fly.io authentication...${NC}"
if ! fly auth whoami &> /dev/null; then
    echo -e "${YELLOW}Please login to Fly.io${NC}"
    fly auth login
fi

# Create or update app
if fly status --app lechworld &> /dev/null; then
    echo -e "${YELLOW}App lechworld exists, updating...${NC}"
else
    echo -e "${YELLOW}Creating new Fly app...${NC}"
    fly launch --name lechworld --region gru --no-deploy --yes
fi

# Set secrets
echo -e "${YELLOW}Setting Fly secrets...${NC}"
fly secrets set \
  SUPABASE_URL="$EXISTING_SUPABASE_URL" \
  SUPABASE_ANON_KEY="$EXISTING_SUPABASE_ANON_KEY" \
  SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY" \
  DATABASE_URL="$DATABASE_URL" \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  --app lechworld

# Deploy
echo -e "${YELLOW}Deploying to Fly.io...${NC}"
fly deploy --app lechworld

# Wait for deployment
echo -e "${YELLOW}Waiting for deployment to complete...${NC}"
sleep 10

# Migrate data
echo -e "${YELLOW}Running database migration...${NC}"
echo -e "${YELLOW}First, let's check if the schema exists in Supabase${NC}"
echo -e "Go to: https://supabase.com/dashboard/project/losjjureznviaoeefzet/editor"
echo -e "Run the schema from: /Users/lech/lechworld/supabase-schema.sql"
echo -e "${YELLOW}Press Enter when schema is created...${NC}"
read

echo -e "${YELLOW}Migrating data from MongoDB to Supabase...${NC}"
npx tsx scripts/migrate-from-milhaslech.ts

echo -e "${GREEN}✅ Migration complete!${NC}"
echo -e "Your app is available at: ${GREEN}https://lechworld.fly.dev${NC}"
echo ""
echo -e "${YELLOW}Testing URLs:${NC}"
echo "- New app: https://lechworld.fly.dev"
echo "- Old app: https://milhaslech.fly.dev"
echo ""
echo -e "${YELLOW}To redirect milhaslech to lechworld:${NC}"
echo "1. Update milhaslech frontend to show migration notice"
echo "2. Or set up a redirect in Fly.io"
#!/bin/bash
set -e

echo "🚀 Starting LechWorld Migration Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v fly &> /dev/null; then
    echo -e "${RED}Fly CLI not found. Installing...${NC}"
    curl -L https://fly.io/install.sh | sh
    export PATH="$HOME/.fly/bin:$PATH"
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

# Step 2: Get MongoDB credentials from milhaslech
echo -e "${YELLOW}Getting MongoDB credentials from milhaslech...${NC}"
cd /Users/lech/milhaslech

# Extract secrets from fly (we'll need to parse these manually)
echo -e "${YELLOW}Please run these commands in another terminal to get the secrets:${NC}"
echo "cd /Users/lech/milhaslech"
echo "fly ssh console -C 'printenv MONGO_URL'"
echo "fly ssh console -C 'printenv DB_NAME'"
echo "fly ssh console -C 'printenv SUPABASE_URL'"
echo "fly ssh console -C 'printenv SUPABASE_ANON_KEY'"
echo ""
echo -e "${YELLOW}Press Enter when you have copied these values...${NC}"
read

# Step 3: Collect credentials
echo -e "${YELLOW}Enter the credentials you obtained:${NC}"
read -p "MONGO_URL: " MONGO_URL
read -p "DB_NAME: " DB_NAME
read -p "SUPABASE_URL (existing): " EXISTING_SUPABASE_URL
read -p "SUPABASE_ANON_KEY (existing): " EXISTING_SUPABASE_ANON_KEY

# Step 4: Create new Supabase project or use existing
echo -e "${YELLOW}Do you want to:${NC}"
echo "1) Use the existing Supabase project from milhaslech"
echo "2) Create a new Supabase project for lechworld"
read -p "Choose (1 or 2): " SUPABASE_CHOICE

if [ "$SUPABASE_CHOICE" = "1" ]; then
    SUPABASE_URL=$EXISTING_SUPABASE_URL
    SUPABASE_ANON_KEY=$EXISTING_SUPABASE_ANON_KEY
    echo -e "${YELLOW}Using existing Supabase project. You'll need the service key.${NC}"
    read -p "SUPABASE_SERVICE_KEY: " SUPABASE_SERVICE_KEY
    
    # Extract project ref and password from URL
    PROJECT_REF=$(echo $SUPABASE_URL | sed -n 's/https:\/\/\([^.]*\)\.supabase\.co/\1/p')
    read -p "Supabase database password: " DB_PASSWORD
    DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"
else
    echo -e "${YELLOW}Please create a new project at https://supabase.com${NC}"
    echo "Then provide the following:"
    read -p "SUPABASE_URL: " SUPABASE_URL
    read -p "SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
    read -p "SUPABASE_SERVICE_KEY: " SUPABASE_SERVICE_KEY
    read -p "DATABASE_URL: " DATABASE_URL
    
    echo -e "${YELLOW}Run the schema in Supabase SQL Editor:${NC}"
    echo "cat /Users/lech/lechworld/supabase-schema.sql"
    echo -e "${YELLOW}Press Enter when done...${NC}"
    read
fi

# Step 5: Setup lechworld environment
cd /Users/lech/lechworld

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

# Step 6: Test build
echo -e "${YELLOW}Testing build...${NC}"
npm run build

# Step 7: Deploy to Fly.io
echo -e "${YELLOW}Deploying to Fly.io...${NC}"
fly auth login

# Check if app exists
if fly status --app lechworld &> /dev/null; then
    echo -e "${YELLOW}App lechworld already exists${NC}"
else
    echo -e "${YELLOW}Creating new Fly app...${NC}"
    fly launch --name lechworld --region gru --no-deploy
fi

# Set secrets
echo -e "${YELLOW}Setting Fly secrets...${NC}"
fly secrets set \
  SUPABASE_URL="$SUPABASE_URL" \
  SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY" \
  DATABASE_URL="$DATABASE_URL" \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  --app lechworld

# Deploy
echo -e "${YELLOW}Deploying app...${NC}"
fly deploy --app lechworld

# Step 8: Migrate data
echo -e "${YELLOW}Migrating data from MongoDB to Supabase...${NC}"
npx tsx scripts/migrate-from-milhaslech.ts

# Step 9: Test the deployment
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "Your app is available at: ${GREEN}https://lechworld.fly.dev${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test the app at https://lechworld.fly.dev"
echo "2. Update DNS if you have a custom domain"
echo "3. Update milhaslech to redirect to lechworld"
echo ""
echo -e "${YELLOW}To view logs:${NC} fly logs --app lechworld"
echo -e "${YELLOW}To check status:${NC} fly status --app lechworld"
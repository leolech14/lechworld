#!/bin/bash
set -e

echo "🔑 Getting Supabase Credentials from Doppler..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd /Users/lech/lechworld

# Check if Doppler is installed
if ! command -v doppler &> /dev/null; then
    echo -e "${YELLOW}Doppler CLI not installed. Installing...${NC}"
    
    # Install Doppler CLI
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install dopplerhq/cli/doppler || {
            echo -e "${YELLOW}Installing via curl...${NC}"
            curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh | sudo sh
        }
    else
        # Linux
        curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh | sudo sh
    fi
fi

# Login to Doppler if needed
echo -e "${YELLOW}Checking Doppler authentication...${NC}"
if ! doppler me &> /dev/null; then
    echo -e "${YELLOW}Please login to Doppler:${NC}"
    doppler login
fi

# Try to get credentials from milhaslech project
echo -e "${YELLOW}Fetching Supabase credentials from Doppler...${NC}"

# Get credentials
echo -e "${BLUE}Getting SUPABASE_SERVICE_KEY...${NC}"
SUPABASE_SERVICE_KEY=$(doppler secrets get SUPABASE_SERVICE_KEY --plain --project milhaslech --config prd 2>/dev/null || echo "")

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo -e "${YELLOW}Service key not found in milhaslech project. Checking other projects...${NC}"
    
    # List all projects
    echo -e "${YELLOW}Available Doppler projects:${NC}"
    doppler projects list
    
    echo ""
    read -p "Enter the project name that contains Supabase credentials: " PROJECT_NAME
    read -p "Enter the config name (e.g., prd, dev): " CONFIG_NAME
    
    SUPABASE_SERVICE_KEY=$(doppler secrets get SUPABASE_SERVICE_KEY --plain --project $PROJECT_NAME --config $CONFIG_NAME 2>/dev/null || echo "")
fi

# Get database password
echo -e "${BLUE}Getting database password...${NC}"
DB_PASSWORD=$(doppler secrets get SUPABASE_DB_PASSWORD --plain --project milhaslech --config prd 2>/dev/null || \
              doppler secrets get DATABASE_PASSWORD --plain --project milhaslech --config prd 2>/dev/null || \
              doppler secrets get POSTGRES_PASSWORD --plain --project milhaslech --config prd 2>/dev/null || echo "")

if [ -z "$DB_PASSWORD" ]; then
    echo -e "${YELLOW}Database password not found. You may need to get it from Supabase dashboard.${NC}"
fi

# Get other credentials we already know
SUPABASE_URL="https://losjjureznviaoeefzet.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvc2pqdXJlem52aWFvZWZ6ZXQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1MDA0NzMyNywiZXhwIjoyMDY1NjIzMzI3fQ.jxfIuOkk9Mkd3n1dvI8sAq67-mDDDzwaaCPUUxywN98"
MONGO_URL="mongodb+srv://leonardolech:MilhasLech2025@google.4qrky6q.mongodb.net/?retryWrites=true&w=majority&appName=google"
DB_NAME="milhaslech"

# Display found credentials
echo ""
echo -e "${GREEN}Found Credentials:${NC}"
echo "SUPABASE_URL: $SUPABASE_URL"
echo "SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:0:20}..."

if [ ! -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_KEY:0:20}... ✓"
else
    echo -e "SUPABASE_SERVICE_KEY: ${YELLOW}Not found - manual input needed${NC}"
fi

if [ ! -z "$DB_PASSWORD" ]; then
    echo "Database Password: ****** ✓"
else
    echo -e "Database Password: ${YELLOW}Not found - manual input needed${NC}"
fi

# If we're missing credentials, ask for them
if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo ""
    echo -e "${YELLOW}Please get the service key from:${NC}"
    echo -e "${BLUE}https://supabase.com/dashboard/project/losjjureznviaoeefzet/settings/api${NC}"
    read -p "Paste SUPABASE_SERVICE_KEY: " SUPABASE_SERVICE_KEY
fi

if [ -z "$DB_PASSWORD" ]; then
    echo ""
    echo -e "${YELLOW}Please get the database password from:${NC}"
    echo -e "${BLUE}https://supabase.com/dashboard/project/losjjureznviaoeefzet/settings/database${NC}"
    read -s -p "Database password: " DB_PASSWORD
    echo
fi

DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@db.losjjureznviaoeefzet.supabase.co:5432/postgres"

# Create .env file
echo ""
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

# Now run the migration
echo ""
echo -e "${YELLOW}Ready to continue with migration?${NC}"
read -p "Press Enter to deploy and migrate, or Ctrl+C to cancel..."

# Deploy to Fly
echo -e "${YELLOW}Deploying to Fly.io...${NC}"
fly secrets set \
  SUPABASE_URL="$SUPABASE_URL" \
  SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY" \
  DATABASE_URL="$DATABASE_URL" \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  --app lechworld

fly deploy --app lechworld

# Create schema
echo ""
echo -e "${YELLOW}Now create the database schema:${NC}"
echo -e "1. Go to: ${BLUE}https://supabase.com/dashboard/project/losjjureznviaoeefzet/sql/new${NC}"
echo -e "2. Copy and paste from: ${BLUE}/Users/lech/lechworld/supabase-schema.sql${NC}"
echo -e "3. Click 'Run'"
echo ""
read -p "Press Enter when schema is created..."

# Migrate data
echo -e "${YELLOW}Migrating data...${NC}"
npx tsx scripts/migrate-from-milhaslech.ts

echo ""
echo -e "${GREEN}✅ Migration complete!${NC}"
echo -e "App: ${BLUE}https://lechworld.fly.dev${NC}"
echo -e "Login: admin@lechworld.com / lechworld2025"
#!/bin/bash

echo "🔍 Checking LechWorld Migration Status..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check Node.js
echo -n "Node.js: "
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓ $(node --version)${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
fi

# Check Fly CLI
echo -n "Fly CLI: "
if command -v fly &> /dev/null; then
    echo -e "${GREEN}✓ Installed${NC}"
    echo -n "  Auth: "
    if fly auth whoami &> /dev/null; then
        echo -e "${GREEN}✓ $(fly auth whoami 2>&1 | head -1)${NC}"
    else
        echo -e "${RED}✗ Not authenticated${NC}"
    fi
else
    echo -e "${RED}✗ Not installed${NC}"
fi

# Check lechworld app status
echo -n "LechWorld App: "
if fly status --app lechworld &> /dev/null; then
    echo -e "${GREEN}✓ Created${NC}"
    STATUS=$(fly status --app lechworld 2>&1 | grep "STATE" -A1 | tail -1 | awk '{print $4}')
    echo "  Status: $STATUS"
    echo "  URL: https://lechworld.fly.dev"
else
    echo -e "${YELLOW}⚠ Not created yet${NC}"
fi

# Check milhaslech app
echo -n "MilhasLech App: "
if fly status --app milhaslech &> /dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
    echo "  URL: https://milhaslech.fly.dev"
else
    echo -e "${RED}✗ Not found${NC}"
fi

# Check local files
echo ""
echo "Local Files:"
FILES=(
    ".env:Environment config"
    "supabase-schema.sql:Database schema"
    "complete-migration.sh:Migration script"
    "scripts/migrate-from-milhaslech.ts:Data migration"
)

for file_desc in "${FILES[@]}"; do
    IFS=':' read -r file desc <<< "$file_desc"
    echo -n "  $desc: "
    if [ -f "/Users/lech/lechworld/$file" ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
    fi
done

# Check build
echo ""
echo -n "Build Status: "
cd /Users/lech/lechworld
if npm run build &> /dev/null; then
    echo -e "${GREEN}✓ Builds successfully${NC}"
else
    echo -e "${RED}✗ Build fails${NC}"
fi

echo ""
echo "Known Credentials:"
echo "  MongoDB: ${GREEN}✓${NC} (from milhaslech)"
echo "  Supabase URL: ${GREEN}✓${NC}"
echo "  Supabase Anon Key: ${GREEN}✓${NC}"
echo "  Supabase Service Key: ${YELLOW}⚠ Needed${NC}"
echo "  Database Password: ${YELLOW}⚠ Needed${NC}"

echo ""
echo "📋 Next Steps:"
echo "1. Get Supabase service key from: https://supabase.com/dashboard/project/losjjureznviaoeefzet/settings/api"
echo "2. Get database password from: https://supabase.com/dashboard/project/losjjureznviaoeefzet/settings/database"
echo "3. Run: ./complete-migration.sh"

echo ""
echo "Ready to migrate? You just need the Supabase credentials above."
#!/bin/bash

echo "🚂 Railway Deployment Verification Script"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not installed${NC}"
    echo "Install with: npm install -g @railway/cli"
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI installed${NC}"

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Railway${NC}"
    echo "Run: railway login"
    exit 1
fi

echo -e "${GREEN}✅ Logged in to Railway${NC}"

# Test local build
echo -e "\n${YELLOW}Testing local build...${NC}"
if npm install && npm run build:api; then
    echo -e "${GREEN}✅ Local build successful${NC}"
else
    echo -e "${RED}❌ Local build failed${NC}"
    exit 1
fi

# Test local API start
echo -e "\n${YELLOW}Testing local API start...${NC}"
timeout 5 npm run start:api &> /dev/null &
API_PID=$!
sleep 3

if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✅ Local API health check passed${NC}"
    kill $API_PID 2>/dev/null
else
    echo -e "${RED}❌ Local API health check failed${NC}"
    kill $API_PID 2>/dev/null
    exit 1
fi

# Check Railway configuration
echo -e "\n${YELLOW}Checking Railway configuration...${NC}"

if [ -f "railway.toml" ]; then
    echo -e "${GREEN}✅ railway.toml found${NC}"
    
    # Check for required fields
    if grep -q "buildCommand" railway.toml && grep -q "startCommand" railway.toml; then
        echo -e "${GREEN}✅ Build and start commands configured${NC}"
    else
        echo -e "${RED}❌ Missing build or start commands${NC}"
        exit 1
    fi
    
    if grep -q "healthcheckPath" railway.toml; then
        echo -e "${GREEN}✅ Health check path configured${NC}"
    else
        echo -e "${YELLOW}⚠️  No health check path configured${NC}"
    fi
else
    echo -e "${RED}❌ railway.toml not found${NC}"
    exit 1
fi

# Check environment variables
echo -e "\n${YELLOW}Required environment variables:${NC}"
echo "- PORT (provided by Railway)"
echo "- NODE_ENV (optional, defaults to 'production')"
echo "- CORS_ORIGIN (optional, defaults to '*')"

echo -e "\n${GREEN}✅ All local checks passed!${NC}"
echo -e "\n${YELLOW}To deploy to Railway:${NC}"
echo "1. Ensure you're in the correct Railway project:"
echo "   railway link"
echo "2. Deploy:"
echo "   railway up"
echo "3. Check logs:"
echo "   railway logs"
echo "4. Open deployed app:"
echo "   railway open"

echo -e "\n${YELLOW}Troubleshooting tips:${NC}"
echo "- If build fails: Check 'railway logs' for dependency issues"
echo "- If health check fails: Ensure PORT env var is used correctly"
echo "- If start fails: Verify 'npm run start:api' works locally"
echo "- If monorepo issues: Ensure npm workspaces are properly configured"
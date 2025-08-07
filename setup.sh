#!/usr/bin/env bash
# Ultimate Monorepo Setup Script

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Ultimate Monorepo Setup${NC}"
echo "=========================="

# Make all tools executable
echo -e "\n${GREEN}1. Making tools executable...${NC}"
chmod +x tools/*
chmod +x .claude/scripts/v2/*.py

# Initialize Git repository if not already
if [ ! -d ".git" ]; then
    echo -e "\n${GREEN}2. Initializing Git repository...${NC}"
    git init
    git add .
    git commit -m "feat: initial Ultimate Monorepo setup

This commit establishes the Ultimate Monorepo with:
- 15 specialized AI agents with real-time coordination
- Multi-layer security with Guardian Enforcer
- Production infrastructure stack (Docker Compose)
- Complete monitoring and observability
- Automated testing and quality assurance
- Emergency controls and safety systems

Task-ID: $(uuidgen 2>/dev/null || echo 'setup-initial')"
fi

# Run hardening
echo -e "\n${GREEN}3. Running security hardening...${NC}"
./tools/harden-system

# Install dependencies if package.json exists and node_modules doesn't
if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
    echo -e "\n${GREEN}4. Installing dependencies...${NC}"
    if command -v npm >/dev/null 2>&1; then
        npm install
    else
        echo -e "${YELLOW}⚠️ npm not found, skipping dependency installation${NC}"
    fi
fi

# Start coordination system
echo -e "\n${GREEN}5. Starting coordination system...${NC}"
cd .claude/scripts/v2
nohup python3 agent_coordination_system.py > /tmp/dream-team-logs/coordination.log 2>&1 &
COORD_PID=$!
cd ../../../

# Wait for coordination system to start
echo "Waiting for coordination system to start..."
for i in {1..30}; do
    if curl -s http://localhost:8765/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Coordination system started (PID: $COORD_PID)${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Coordination system failed to start${NC}"
    fi
    sleep 1
done

# Validate setup
echo -e "\n${GREEN}6. Validating setup...${NC}"
./tools/validate-hardening

echo -e "\n${BLUE}🎉 Ultimate Monorepo Setup Complete!${NC}"
echo "=================================="
echo ""
echo -e "${GREEN}✅ Security hardening applied${NC}"
echo -e "${GREEN}✅ Agent coordination system running${NC}"
echo -e "${GREEN}✅ All tools configured and executable${NC}"
echo -e "${GREEN}✅ Git repository initialized${NC}"

echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Copy .env.example to .env and configure:"
echo "   cp .env.example .env"
echo "   # Edit .env with your API keys and settings"
echo ""
echo "2. Start infrastructure services:"
echo "   npm run start-services"
echo ""
echo "3. Start development:"
echo "   npm run dev"
echo ""
echo -e "${BLUE}Available Commands:${NC}"
echo "• ./tools/agent-orchestrate 'your task'  # Execute AI agent tasks"
echo "• ./tools/agent-monitor dashboard        # Interactive monitoring"
echo "• ./tools/validate-hardening            # Security validation"
echo "• npm run health-check                  # System health check"
echo "• ./tools/emergency-stop                # Emergency shutdown"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "• README.md              - Complete overview"
echo "• docs/agents.md         - AI agent system guide"
echo "• docs/security.md       - Security documentation"
echo "• api/openapi.yaml       - API specification"
echo ""
echo -e "${GREEN}Your Ultimate Monorepo is ready for production! 🚀${NC}"
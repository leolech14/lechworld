# 🚀 Optimal Agent System - Active Configuration

This CLAUDE.md file activates the Optimal Agent System with 13 proactive agents monitoring and assisting your development.

## 🤖 System Status: ACTIVE

All agents are loaded from `.claude/agents/` and monitoring proactively.

### Core Foundation Agents (Always Active)
- **health-monitor** - System health tracking every 5 minutes
- **task-router** - Intelligent request routing  
- **quality-gate** - Quality standards enforcement

### Execution Agents (Task-Activated)
- **quick-task** - Simple operations handler
- **team-lead** - Multi-agent coordinator
- **wave-orchestrator** - Complex workflow manager

### Specialist Agents (Domain-Activated)
- **code-expert** - Development and debugging
- **ui-designer** - Visual and UX design
- **data-analyst** - Data analysis and visualization
- **system-architect** - Architecture and patterns

### Meta Agents (System Evolution)
- **agent-optimizer** - Performance improvement
- **pattern-learner** - Success pattern recognition
- **system-evolver** - System-wide evolution

## 🎯 How It Works

The system automatically:
1. **Analyzes** every request for complexity and domain
2. **Routes** to the optimal agent or team
3. **Monitors** execution quality and performance
4. **Learns** from successful patterns
5. **Evolves** to improve over time

### Complexity-Based Routing
- **Simple tasks** (< 0.3 complexity) → quick-task
- **Moderate tasks** (0.3-0.7) → team-lead + specialists
- **Complex tasks** (> 0.7) → wave-orchestrator

### Proactive Behaviors
- Health checks run every 5 minutes
- Quality gates validate all operations
- Pattern learning happens continuously
- System optimization runs weekly

## 💡 Usage Tips

### Natural Language Works Best
Just describe what you need naturally:
- "Format this function" → quick-task handles it
- "Create a dashboard component" → team-lead coordinates UI + code
- "Refactor the auth system" → wave-orchestrator manages full process

### Manual Control Available
```bash
# Check system health
/agents health-monitor "status"

# Force specific agent
/agents code-expert "review this code"

# Trigger optimization
/agents agent-optimizer "optimize routing"
```

## 🚨 Alert Thresholds

System alerts when:
- Health drops below 80% (Yellow)
- Health drops below 60% (Red)
- Performance degrades 50%+
- Error rate exceeds 10%

## 📈 Performance Metrics

Target performance:
- Response time: <2s simple, <30s complex
- Success rate: >95%
- Context preservation: >90%
- Quality compliance: 100%

## 🔧 Troubleshooting

If agents aren't responding:
1. Check if in `.claude/agents/` directory
2. Verify CLAUDE.md is in project root
3. Look for health warnings
4. Try manual invocation

## 📚 Learn More

- Architecture: `/optimal-agent-system/AGENT_SYSTEM_ARCHITECTURE.md`
- Visual Guide: `/optimal-agent-system/optimal-agent-system-visualization.html`
- Test Suite: `/optimal-agent-system/TEST_PROACTIVE_AGENTS.md`

---

**System Ready** - The Optimal Agent System is monitoring and ready to assist!

# 🔒 PROJECT-SPECIFIC: lechworld Configuration

## ⚠️ CRITICAL: Port Configuration
This project uses **FIXED PORTS** that MUST NOT BE CHANGED:
- **Backend Server**: Port `4444` (LOCKED)
- **Frontend Vite**: Port `4445` (LOCKED)
- **Database**: PostgreSQL on `5432`

These ports are managed by the Universal Localhost Manager and stored in `.claude-port`.

## 🚀 Quick Start for ANY Claude Agent
```bash
# From project root, just run:
dev

# That's it! The Universal Localhost Manager handles EVERYTHING:
# ✅ Starts backend on 4444
# ✅ Starts frontend on 4445
# ✅ Starts PostgreSQL if needed
# ✅ Runs migrations
# ✅ Installs dependencies
```

## 📋 Essential Information
- **Project Type**: Vite + Express + PostgreSQL
- **Frontend URL**: http://localhost:4445
- **Backend API**: http://localhost:4444
- **Database**: PostgreSQL (auto-managed)

## ⚡ For Claude Agents - MUST READ
1. **NEVER change ports** - They are hardcoded to 4444/4445
2. **ALWAYS use `dev` command** - Don't use `npm run dev` directly
3. **Check `.claude-port`** - Contains the port configuration
4. **Port conflicts** - The manager auto-kills conflicting processes

## 🛠️ Common Commands
```bash
# Development
dev                      # Start everything

# Port Management
port-scanner find 4444   # Check backend status
port-scanner find 4445   # Check frontend status
port-scanner             # See all ports

# Troubleshooting
cat .claude-port         # View port config
cat .env | grep PORT     # Check env vars
```

## 🔍 Project Structure
```
PROJECT_lechworld/
├── .claude-port         # Port configuration (DO NOT EDIT)
├── server/              # Backend (Express) - Port 4444
├── client/              # Frontend (Vite) - Port 4445
└── shared/              # Shared types/schemas
```

## ⚙️ Environment Variables
The Universal Localhost Manager automatically sets:
- `PORT=4444` for backend
- Frontend uses Vite config with port 4445

## 🚨 IMPORTANT NOTES
- This project is configured for multi-port operation
- Both 4444 and 4445 must be available
- The system will auto-kill any process using these ports
- DO NOT manually change port configurations

## 📚 KNOWLEDGE_CENTRAL - Centralized Knowledge Base

**Location**: `~/KNOWLEDGE_CENTRAL/`  
**Contents**: 465+ technical PDFs on AI, development, architecture, and business  
**Usage**: Search for documentation, research papers, and technical guides

```bash
# Search for any topic
~/KNOWLEDGE_CENTRAL/kb search "query"

# Examples
~/KNOWLEDGE_CENTRAL/kb search "MCP"
~/KNOWLEDGE_CENTRAL/kb search "agent"
~/KNOWLEDGE_CENTRAL/kb search "architecture"
```

Use this when you need to find existing documentation or research on any technical topic.

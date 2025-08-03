# Claude Code SDK Agents - PROJECT_media

This directory contains specialized AI agents optimized for media project development tasks.

## 🎯 Core Media Development Agents

### 🎨 UI/UX Specialists
- **ui-component-expert** - Master of all modern UI frameworks (React, Vue, Angular, Svelte)
  - Component architecture, performance optimization, accessibility
  - Tools: Read, Write, Edit, MultiEdit, Grep, Glob, LS, Bash
  
- **ui-color-expert** - Color theory, accessibility, and design systems specialist
  - WCAG compliance, color palettes, dark mode theming
  - Tools: Read, Write, Edit, MultiEdit, Grep, WebFetch, WebSearch
  
- **codebase-diagram-creator** - Creates stunning dark mode interactive visualizations
  - D3.js, force-directed graphs, modern UI, real-time interactivity
  - Tools: Read, Write, Grep, Glob, LS, Bash, WebSearch

### 🔗 Integration & Infrastructure
- **frontend-backend-connector** - API design and full-stack integration expert
  - REST, GraphQL, WebSockets, tRPC, authentication, caching
  - Tools: Read, Write, Edit, MultiEdit, Grep, Glob, LS, Bash, WebFetch
  
- **database-configuration-expert** - Database optimization and configuration master
  - SQL/NoSQL, migrations, performance tuning, scaling strategies
  - Tools: Read, Write, Edit, MultiEdit, Bash, Grep, LS, WebFetch, WebSearch
  
- **bug-finder** - Elite debugging and issue detection specialist
  - Static analysis, runtime debugging, security vulnerabilities
  - Tools: Read, Grep, Glob, LS, Bash, Edit, MultiEdit, WebSearch

### 🛡️ System Management
- **hub-keeper** - Master orchestrator of the development hub
  - Conflict resolution, hub awareness, project coordination
  - Tools: Read, Write, Edit, MultiEdit, Bash, Grep, Glob, LS, TodoWrite, Task
  
- **guardian-enforcer** - Enforces development rules and standards
  - Rule compliance, validation, best practices enforcement
  - Tools: Bash, Read, Grep, LS
  
- **file-cleaner** - Safe file cleanup and organization
  - Removes temp files, maintains project hygiene
  - Tools: Bash, LS, Glob, Read
  
- **watchdog** - 24/7 monitoring for system health
  - Violation detection, health monitoring, continuous scanning
  - Tools: Read, Bash, Grep, Glob, LS
  
- **context-health-manager** - Maintains context system integrity
  - Reference validation, redundancy removal, health optimization
  - Tools: Read, Edit, Bash, Grep, LS

## 💡 Usage Examples

```bash
# UI Development
Task(subagent_type="ui-component-expert", prompt="create accessible modal component")
Task(subagent_type="ui-color-expert", prompt="generate WCAG AAA color palette")

# Integration Work
Task(subagent_type="frontend-backend-connector", prompt="implement GraphQL API")
Task(subagent_type="database-configuration-expert", prompt="optimize PostgreSQL for media")

# Debugging & Visualization
Task(subagent_type="bug-finder", prompt="find memory leaks in video player")
Task(subagent_type="codebase-diagram-creator", prompt="visualize component relationships")

# System Maintenance
Task(subagent_type="guardian-enforcer", prompt="validate project standards")
Task(subagent_type="file-cleaner", prompt="remove old draft files")
```

## 🔄 Agent Workflows

### Media Feature Development
1. `ui-component-expert` designs the component structure
2. `ui-color-expert` ensures accessible color choices
3. `frontend-backend-connector` integrates with APIs
4. `bug-finder` validates implementation
5. `guardian-enforcer` checks compliance

### Performance Optimization
1. `codebase-diagram-creator` visualizes bottlenecks
2. `database-configuration-expert` optimizes queries
3. `frontend-backend-connector` improves API calls
4. `bug-finder` identifies performance issues

### System Maintenance
1. `watchdog` detects issues
2. `guardian-enforcer` validates fixes
3. `file-cleaner` removes unnecessary files
4. `context-health-manager` updates documentation

## 📝 Notes

- All agents follow PROJECT_guardian rules
- Knowledge documentation moved to ~/KNOWLEDGE_CENTRAL/agents_knowledge/
- Agents are invoked via Claude's Task tool
- Each agent has specialized expertise and restricted tools for safety
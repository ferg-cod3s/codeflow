# Codeflow: AI Agent & Command Distribution Platform

**Distribute specialized AI agents and workflow commands across your development projects and teams.**

Codeflow provides **33+ ready-to-use AI agents** and **8 workflow commands** that instantly enhance any codebase with AI-powered development capabilities. Install once, deploy everywhere.

## 🚀 Why Codeflow?

### **Instant AI Agent Deployment**
- **One command setup** - `codeflow setup` installs all agents and commands in any project
- **33+ specialized agents** - From database experts to security scanners to UX optimizers
- **8 workflow commands** - Complete development lifecycle from research to deployment
- **Universal compatibility** - Works with Claude Code, OpenCode.ai, and MCP protocols

### **For Development Teams**
- **Standardize AI workflows** across all your projects
- **Share specialized knowledge** through expert AI agents
- **Accelerate onboarding** - New projects get full AI assistance immediately
- **Maintain consistency** - Same agents, same quality across all codebases

### **For Individual Developers**
- **Instantly upgrade any project** with AI-powered development tools
- **Access specialized expertise** you don't have (security, performance, SEO, etc.)
- **Consistent workflow** across all your personal and work projects
- **Always up-to-date** - Sync latest agents and commands with one command

## 📦 What You Get

### **Specialized AI Agents (33+)**
Ready-to-use expert agents that understand your codebase:

**🔍 Code Analysis Agents:**
- `codebase-locator` - Find files and components instantly
- `codebase-analyzer` - Understand how specific code works
- `codebase-pattern-finder` - Discover reusable patterns
- `performance-engineer` - Identify bottlenecks and optimize code

**🚀 Operations Agents:**
- `operations-incident-commander` - Lead incident response
- `database-expert` - Design schemas and optimize queries
- `security-scanner` - Find vulnerabilities and security issues
- `infrastructure-builder` - Design scalable cloud architecture

**📈 Business & Growth Agents:**
- `growth-engineer` - Optimize conversion and user acquisition
- `programmatic-seo-engineer` - Build SEO at scale
- `analytics-engineer` - Design tracking and metrics
- `ux-optimizer` - Improve user experience and accessibility

**🛠 Development Agents:**
- `full-stack-developer` - End-to-end feature development
- `api-builder` - Design and build robust APIs
- `ai-integration-expert` - Add AI/ML capabilities
- `test-generator` - Create comprehensive test suites

[→ See all 33+ agents in AGENT_REGISTRY.md](AGENT_REGISTRY.md)

### **Workflow Commands (8)**
Complete development lifecycle automation:
- **`/research`** - Deep codebase and market research
- **`/plan`** - Create detailed implementation plans
- **`/execute`** - Implement plans with expert guidance
- **`/test`** - Generate comprehensive test coverage
- **`/document`** - Create user guides and technical docs
- **`/commit`** - Generate structured commit messages
- **`/review`** - Validate implementations against requirements
- **`/project-docs`** - Generate complete project documentation

## 🎯 Quick Start

### Install Codeflow
```bash
git clone https://github.com/your-org/codeflow
cd codeflow
bun install && bun run install
```

### Add to Any Project
```bash
# Navigate to your project
cd /path/to/your/project

# Install all agents and commands (takes 30 seconds)
codeflow setup

# Start using immediately
```

### Instant AI-Powered Development
```bash
# Research a feature (works in any project now!)
/research "implement user authentication"

# Get implementation plan from expert agents
/plan "Add OAuth2 login with JWT tokens"

# Execute with specialized guidance
/execute "Follow the authentication plan"

# Generate tests automatically
/test "Create comprehensive auth tests"
```

## 🌐 Universal Platform Support

Deploy to your preferred AI development platform:

### **Claude Code Integration**
```bash
codeflow setup --type claude-code
# Adds agents to .claude/agents/
# Adds commands to .claude/commands/
```

### **OpenCode.ai Integration**
```bash
codeflow setup --type opencode
# Adds agents to .opencode/agent/
# Adds commands to .opencode/command/
```

### **Multi-Platform (Recommended)**
```bash
codeflow setup
# Supports both Claude Code AND OpenCode.ai
# Switch between platforms seamlessly
```

## 🏗️ Architecture

Codeflow maintains a **source of truth** for all agents and commands, then deploys them in platform-specific formats:

```
codeflow/
├── codeflow-agents/          # 📁 Base format agents (33+)
│   ├── development/          #    Development specialists
│   ├── operations/           #    Operations experts
│   ├── business-analytics/   #    Growth & SEO agents
│   └── ...                   #    More domains
├── command/                  # 📁 Base workflow commands (8)
├── .claude/                  # 📁 Claude Code format output
│   ├── commands/            #    Slash commands
│   └── agents/              #    Agent definitions
└── .opencode/               # 📁 OpenCode format output
    ├── command/             #    OpenCode commands
    └── agent/               #    OpenCode agents
```

## 📋 Command Reference

### **Management Commands**
```bash
codeflow setup [path]         # Install agents & commands in project
codeflow status [path]        # Check project sync status
codeflow sync [path]          # Update agents & commands
codeflow catalog list         # Browse available agents
codeflow catalog search       # Find specific agents
```

### **Development Commands**
```bash
codeflow convert             # Convert between formats
codeflow validate            # Verify agent/command integrity
codeflow watch start         # Auto-sync on changes
```

## 📚 Platform Setup Guides

### **Setting Up Claude Code**
1. Install Codeflow agents: `codeflow setup --type claude-code`
2. Open your project in Claude Code
3. Use slash commands: `/research`, `/plan`, `/execute`, etc.

### **Setting Up OpenCode.ai**
**📖 [OpenCode Documentation](https://opencode.ai/docs)** - Complete command reference and agent format guide

**🔧 [Platform Arguments Guide](docs/PLATFORM_ARGUMENTS.md)** - How arguments and defaults work across Claude Code, OpenCode, and MCP clients

1. Install agents and commands: `codeflow setup --type opencode`
2. [Install OpenCode](https://opencode.ai) in your project directory
3. Run `opencode` to start
4. Use `/init` to analyze project and create `AGENTS.md`
5. Access all agents via `@` search and commands directly

### **Advanced: Multi-Platform**
```bash
# Set up for both platforms
codeflow setup

# Your project now supports:
# - Claude Code (.claude/ directory)
# - OpenCode.ai (.opencode/ directory)
# - Custom MCP integrations
```

## 🔧 Development & Customization

### **Adding Custom Agents**
1. Create agent in `codeflow-agents/[domain]/your-agent.md`
2. Use base format with YAML frontmatter
3. Run `codeflow sync` to deploy to all platforms

### **Creating Custom Commands**
1. Add command to `command/your-command.md`
2. Define workflow and agent orchestration
3. Sync automatically deploys to all platforms

### **Format Conversion**
Codeflow automatically converts between formats:
- **Base format** → **Claude Code format** (YAML frontmatter)
- **Base format** → **OpenCode format** (with model specs)
- **Custom formats** via adapter plugins

## 📖 Documentation

- **[Agent Registry](AGENT_REGISTRY.md)** - Complete catalog of all 33+ agents
- **[Migration Guide](docs/MIGRATION.md)** - Upgrading between versions
- **[Model Configuration](docs/MODEL_CONFIGURATION.md)** - AI model settings
- **[Development Guide](docs/DEVELOPMENT.md)** - Contributing and customization

## 🤝 Use Cases

### **Startup Team (5 developers)**
```bash
# Set up once in your main repo
codeflow setup

# Every new microservice/project gets instant AI
cd new-service && codeflow setup
# → Full agent suite available immediately
```

### **Enterprise Organization**
```bash
# Standardize AI workflows across 50+ repositories
# Each team gets the same expert agents
# Maintain consistency and knowledge sharing
```

### **Individual Developer**
```bash
# Upgrade all your side projects instantly
cd project1 && codeflow setup
cd project2 && codeflow setup
# → Every project gets full AI development suite
```

### **Open Source Maintainer**
```bash
# Add agents to your popular repo
# Contributors get AI assistance for complex tasks
# Maintain code quality with expert AI review
```

## 📊 Agent Distribution Stats

- **33+ specialized AI agents** across 6 domains
- **8 workflow commands** covering full development lifecycle
- **2 platform formats** (Claude Code, OpenCode) with 1 command
- **1 source of truth** - Base format that converts to all platforms
- **100% compatibility** - Works with any codebase, any language

## 🎉 Getting Started

**Ready to supercharge your development workflow?**

```bash
# 1. Install Codeflow
git clone https://github.com/your-org/codeflow
cd codeflow && bun install && bun run install

# 2. Add to your project (30 seconds)
cd /your/awesome/project
codeflow setup

# 3. Start using expert AI agents immediately!
/research "optimize database performance"
```

**Questions?** Check our [documentation](docs/) or [open an issue](https://github.com/your-org/codeflow/issues).

---

**License:** MIT | **Maintained by:** Codeflow Team | **Contributing:** See [CONTRIBUTING.md](CONTRIBUTING.md)
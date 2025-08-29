# Codeflow - Intelligent AI Workflow Management

Codeflow is a comprehensive automation system that provides intelligent AI workflow management with dynamic tooling, agent orchestration, and seamless multi-platform integrations.

## 🚀 Quick Installation

```bash
# Clone and install globally
git clone https://github.com/your-org/codeflow.git
cd codeflow
bun install && bun run install

# Verify installation
codeflow --version
codeflow --help
```

## 🎯 Core Features

- **🤖 Agent Orchestration**: 54+ specialized agents for different domains
- **⚡ Automatic Synchronization**: Real-time file watching and format conversion
- **🌐 Cross-Platform**: Works on macOS, Windows, and Linux
- **🔧 Multiple Integrations**: Claude Code, MCP Protocol, Universal NPM package
- **📊 Format Conversion**: Automatic conversion between Base, Claude Code, and OpenCode formats
- **🔍 Global Agent Access**: Agents available across all projects

## CLI Usage

### Push files to a project
```bash
codeflow setup ~/projects/my-app
codeflow setup ../other-project --dry-run
```

### Check status of files
```bash
codeflow status ~/projects/my-app
```

## Platform Integration

The codeflow automation system supports **multiple integration approaches**:

### **MCP Clients** (Claude Desktop, Warp, Cursor)
- Use Model Context Protocol for tool access
- Configure with: `codeflow mcp configure <client>`
- Supported clients: `claude-desktop`, `warp`, `cursor`

### **Claude.ai (Web)**: Native Slash Commands
- Built-in `/research`, `/plan`, `/execute` commands
- Setup with: `codeflow setup . --type claude-code`
- Commands stored in `.claude/commands/`

### **OpenCode**: Direct Commands
- Uses `.opencode/command/` directory
- Setup with: `codeflow setup . --type opencode`
- No MCP configuration needed

### **Bunx**: Universal MCP Server
- **Quick start**: `bun x @codeflow/mcp-server`
- Works with any MCP-compatible client
- Privacy-safe built-in templates
- No project setup required

## Quick Start Options

### Option 1: MCP Clients (Claude Desktop, Warp, Cursor)
```bash
# Configure for your MCP client
codeflow mcp configure claude-desktop  # For Claude Desktop
codeflow mcp configure warp           # For Warp Terminal
codeflow mcp configure cursor         # For Cursor IDE

# Start MCP server
codeflow mcp start

# Or start in background
codeflow mcp start --background
```

### Option 2: Project-Aware Setup
```bash
# Intelligent setup - detects Claude Code vs MCP needs automatically
codeflow setup ~/my-project

# Or force specific type
codeflow setup ~/my-project --type claude-code   # Claude Code only
codeflow setup ~/my-project --type opencode      # MCP integration only  
codeflow setup ~/my-project --type general       # Both (default)
```

### Option 3: Full CLI Management
```bash
# Start MCP server for current project
codeflow mcp start

# Start in background
codeflow mcp start --background

# Configure Claude Desktop automatically
codeflow mcp configure claude-desktop

# Check status
codeflow mcp status
```

## Integration Comparison

| Approach | Setup Time | Customization | Use Case |
|----------|------------|---------------|----------|
| **NPX** | 30 seconds | Generic templates | Quick start, universal compatibility |
| **Project-Aware** | 2 minutes | Project-specific | Team projects, customized workflows |
| **Claude Code** | Instant | Per-project | Claude Code users, native experience |

### Available Workflow Commands

**Core Commands** (available in all approaches):
- `research` - Comprehensive research and analysis
- `plan` - Implementation planning
- `execute` - Code execution and implementation
- `test` - Test generation and validation
- `document` - Documentation generation
- `commit` - Git commit management
- `review` - Implementation review and validation

**Intelligent Automation**: Commands automatically orchestrate 50+ specialized agents for comprehensive analysis and implementation.

**Documentation**:
- 🏗️ [Architecture Overview](./ARCHITECTURE_OVERVIEW.md) - Native slash commands vs MCP integration
- 📦 [NPM Package](./packages/agentic-mcp/README.md) - Standalone MCP server via NPX
- 🚀 [Quick Start Guide](./MCP_QUICKSTART.md) - Get running in 5 minutes
- 📖 [Complete Integration Guide](./MCP_INTEGRATION.md) - Full technical documentation
- 💡 [Usage Examples](./MCP_USAGE_EXAMPLES.md) - Practical workflow examples
- 🔧 [Cross-Repository Setup](./CROSS_REPO_SETUP.md) - Use codeflow from any project
- 🚨 [Troubleshooting Guide](./TROUBLESHOOTING.md) - Fix common issues

## Setup

There's a couple of small tools that really help to make this work more smoothly, though the issue tracker is optional, I advise not using MCP or similar type APIs from an agent as they are absurdly noisy. And JSON is generally bad for inference.

### Thoughts

Thoughts are a place to store notes that are helpful context for the LLM to perform it's job accurately. They include the following categories of thoughts, each with their own purpose in the overall workflow.

#### Architecture (/thoughts/architecure)

The architecture files contain the overall design and decisions made that will guide the project as a whole. This contains several documents that may be unique to each project, these generally include:
* overview.md - an outline of the whole architecture and synopsis of each document and how they relate to other documents.
* system-architecture.md - deeper dive into the languages, frameworks, libraries, tooling and the overall core infrasturcutre of the application
* domain-model.md - describes the actual application domains beyond the core achitecture, diving into specifics of business logic and feature designs
* testing-strategy.md - covers various testing methods used through the project and where they are applicable
* development-workflow.md - describes the phases of development and how each ticket is expected to progress, and how archtecture changes are handled
* persistance.md - how data is persisted from the domain model. This should include all data stores used like sql dbs, search dbs, assets stores, etc

Other more optional architecure components may include
* api-design.md - where the project has direct external interfaces that drive query and mutation actions within the core domain models
* cli-design.md - for command line interfaces to the application
* event-bus.md - for projects that implement an async event bus to pump events to clients, usually coupled with api-design.md

And any other major dependencies or integral components that an agent would need to know exists to understand how to interact with it.

#### Documentation (/thoughts/docs)

These docs are not for the project itself but rather for external tools, libraries or services. These are not the full documentation from their website, but rather a distilled version that contains the most relevant information for the projects use cases. The purpose is to create a highly greppable set of docs that contains only the specific API endpoints or functions that are used. This prevents having to fetch large websites and 

#### Tickets (/thoughts/tickets)

Tickets hold information on work that needs to be completed. A ticket may be an issue with the software, a feature request, or an architecural delta that needs to be resolved. In the beginning most tickets would be architecure deltas, and typically these occur when the architecture undergoes changes. The differnce with feature requests is they are more typical in the user interface projects where the architectural details are often less specific and more user-centric or personalized.

Ideally these are linked to an issue tracker like linear or github for integration with external systems like slack.

#### Research (/thoughts/research)

Research notes are gathered with respect to a specific ticket and are an analysis of the codebase, the thoughtbase, and relevant web documentation. Each research file is timestampped as to when it was triggered and provides frontmatter metadata on the report as well. These reports form the initial analysis of where related concepts of a ticket are located, and previous thoughts that are relevant, especially architecural info, and may trigger web searches for documentation for relevant libraries, tools or services that are missing.

#### Planning (/thoughts/plans)

Planning documnts are much more specific and pull together a ticket with it's associted research to determine an implementation plan. The research may have discovered that the ticket requires more

#### Review (/thoughts/review)

## Commands

The process really start with the commands, as the subagents are laregely used by the commands themselves. The commands are each designed to be run from a fresh context window to maximize the inference latency and quality. Each phase and subagent performs a form of context compression, feeding the next phase or suagent with only the optimial chunks of tokens necessary to complete it's task.

### Research

Whether it's a an issue, feature request or larger piece of work, each workflow should start with doing codebase and thought analysis. Thought analsis will build up over time as you start with very little, so initially this focuses more heavily on the codebase analysis. If you want the research to include web searches, instruct the agent to do so when giving it instructions on what to research. Any files mentioned will be read fully, otherwise the subagents will perform a combination keyword lookups and pattern matching to find relevant parts of the codebase before analyzing.

```
/research thoughts/shared/tickets/web-042.md wants to add google oauth provider, find all the relevant information about the authentication system currently in place. Then review the documentation for someAuth.js to determine how to properly add google oauth.
```

This will produce a concise report on everything that is needed to further plan out updates to the auth system.

> It is important to review the details of this research. DO NOT BLINDLY ACCEPT IT. Any errors or hallucations at this point will flow downstream and lead to incorrect and buggy implementations that are much easier to correct here while you're still dealing with mostly natural language. The models are good at following instructions, make sure it has the right ones!

### Create Plan

Once you have research we can then create an implementation plan. This one is generally much simpler, simply cite the relevant ticket again along with the research above.

Create a new context window then run the following command

```
/plan read thoughts/shared/tickets/web-042.md and thoughts/shared/research/TIMESTAMP_google-oauth-research.md and prepare an implementation plan.
```

This is the same as the research phase, let it run, then review the results. This output will be far more specific with files and line numbers and descriptions of what is being changed at each spot. This is just short of actual code gen, but still reviewable to ensure that the implementation goes smoothly.

### Implement Plan

This one is pretty straightforward, you have the plan, let it rip.

Create a new context window and run:

```
/execute thoughts/shared/plans/the-plan.md
```

Once it's done, you should review the work, but we will have additional quality assurance phases.

### Test

Before committing, generate comprehensive tests for the implemented features to ensure quality and prevent regressions.

```
/test thoughts/shared/plans/the-plan.md
```

This creates unit tests, integration tests, and end-to-end tests following the project's testing patterns and frameworks.

### Document

Create comprehensive documentation for the implemented features, including user guides, API documentation, and technical specifications.

```
/document thoughts/shared/plans/the-plan.md
```

This generates user-facing documentation, developer docs, API specifications, and updates existing documentation.

### Commit

After testing and documentation, commit the work. We want it in the git history so that the agent can make use of git for helping with analysis.

```
/commit
```

The agent will stop before doing the final commit to confirm the details, just tell it to continue once you review the commit details.

### Review

As a final pass before pushing upstream, the agent can review the implementation to ensure that it actually adhered to the details of the original plan, or inform you of any drift that occurred.

```
/review thoughts/shared/plans/the-plan.md
```

If you're good with the results push and close your issue!
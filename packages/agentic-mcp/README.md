# @agentic-codeflow/mcp

A Model Context Protocol (MCP) server providing AI-assisted development workflow commands for any MCP-compatible AI client.

## Features

🎯 **7 Core Workflow Commands**

- `research` - Comprehensive codebase and documentation analysis
- `plan` - Create detailed implementation plans
- `execute` - Implement plans with systematic verification
- `test` - Generate comprehensive test suites
- `document` - Create user guides and API documentation
- `commit` - Create structured git commits
- `review` - Validate implementations against requirements

🔒 **Privacy-Safe**

- No PII collection or transmission
- Processes only the content you provide as input
- Commands are generic templates focused on development workflows
- No external API calls or data storage

🚀 **Easy Integration**

- Works with Claude Desktop, OpenCode, and any MCP-compatible client
- Zero configuration required - works out of the box
- Automatic fallback to built-in templates
- Project-aware when used with codeflow CLI

## Quick Start

### NPX Usage (Recommended)

```bash
# Start MCP server directly with npx
npx @agentic-codeflow/mcp
```

### Installation

```bash
# Global installation
npm install -g @agentic-codeflow/mcp

# Or use with npx (no installation required)
npx @agentic-codeflow/mcp
```

### Claude Desktop Setup

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "codeflow-workflows": {
      "command": "npx",
      "args": ["@agentic-codeflow/mcp"]
    }
  }
}
```

**Configuration file locations:**

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

## Usage

Once configured, you'll have access to workflow tools in your AI client:

### Basic Research

```
Use tool: research
Input: "Analyze the authentication system in this codebase and identify potential security improvements"
```

### Implementation Planning

```
Use tool: plan
Input: "Create a plan to add OAuth2 authentication based on the research findings"
```

### Code Implementation

```
Use tool: execute
Input: "Implement the OAuth2 authentication following the plan step by step"
```

### Test Generation

```
Use tool: test
Input: "Generate comprehensive tests for the OAuth2 authentication implementation"
```

### Documentation Creation

```
Use tool: document
Input: "Create user documentation for the new OAuth2 authentication feature"
```

### Git Commit Management

```
Use tool: commit
Input: "Create proper git commits for the OAuth2 authentication implementation"
```

### Implementation Review

```
Use tool: review
Input: "Review the OAuth2 implementation against the original requirements"
```

### Get Command Help

```
Use tool: get_command
Input: { "name": "research" }
```

## Command Details

### `research`

Conducts comprehensive analysis of codebases, documentation, and specific topics. Provides structured findings with actionable insights.

### `plan`

Creates detailed implementation plans with phases, tasks, dependencies, and success criteria. Includes risk assessment and timeline estimates.

### `execute`

Systematically implements plans with incremental testing and documentation. Follows coding standards and best practices.

### `test`

Generates comprehensive test suites including unit, integration, and end-to-end tests. Ensures good coverage and reliability.

### `document`

Creates user guides, API documentation, and technical specifications. Tailored for different audiences with clear examples.

### `commit`

Creates well-structured git commits following conventional commit format. Groups related changes logically.

### `review`

Validates implementations against requirements and quality standards. Provides detailed assessment and recommendations.

## Integration with CodeFlow CLI

This MCP server works seamlessly with the [codeflow CLI](https://github.com/ferg-cod3s/codeflow) for enhanced project-specific workflows:

```bash
# Set up project with codeflow CLI
npm install -g codeflow-cli
codeflow setup my-project

# Start MCP server (will use project-specific commands)
cd my-project
npx @agentic-codeflow/mcp
```

When used with codeflow CLI, the server will:

- Use project-specific command customizations if available
- Fall back to built-in templates otherwise
- Respect project structure and conventions

## Supported AI Clients

- **Claude Desktop** - Full MCP integration
- **OpenCode** - Native MCP support
- **Custom AI Clients** - Any client supporting MCP protocol
- **Development Tools** - IDEs and editors with MCP plugins

## Privacy & Security

✅ **What we do:**

- Provide generic development workflow templates
- Process only the content you explicitly provide as input
- Run entirely locally on your machine

❌ **What we don't do:**

- Collect or store any personal information
- Make external API calls
- Access files without explicit input
- Store conversation history or data

## Troubleshooting

### Server Won't Start

```bash
# Check Node.js version (requires 18+)
node --version

# Test direct execution
npx @agentic-codeflow/mcp

# Check for port conflicts
lsof -i :3000
```

### Tools Not Appearing in Claude Desktop

1. **Restart Claude Desktop completely** (not just minimize)
2. **Check MCP configuration** - ensure correct JSON format
3. **Verify server starts** - test with `npx @agentic-codeflow/mcp`
4. **Check file permissions** - ensure config file is writable

### Commands Return Generic Content

This is expected behavior! The MCP server provides generic, privacy-safe command templates. For project-specific customization, use the [codeflow CLI](https://github.com/ferg-cod3s/codeflow).

## Development

```bash
# Clone and setup
git clone https://github.com/ferg-cod3s/codeflow.git
cd codeflow/packages/agentic-codeflow-mcp
npm install

# Development with hot reload
npm run dev

# Build for production
npm run build

# Test locally
npm start
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/ferg-cod3s/codeflow/blob/main/CONTRIBUTING.md) for details.

## License

MIT - see [LICENSE](./LICENSE) file for details.

## Related Projects

- [codeflow CLI](https://github.com/ferg-cod3s/codeflow) - Full codeflow workflow system with project customization
- [Model Context Protocol](https://github.com/anthropics/mcp) - The protocol specification this server implements

---

**Made with ❤️ for AI-assisted development workflows**

# test-setup

## Codeflow Workflow - MCP Integration

This project is set up for MCP integration with OpenCode and other compatible AI clients.

### Available Tools

- `research` - Comprehensive codebase and documentation analysis
- `plan` - Create detailed implementation plans
- `execute` - Implement plans with verification
- `test` - Generate comprehensive test suites
- `document` - Create user guides and API documentation
- `commit` - Create structured git commits
- `review` - Validate implementations against plans

### MCP Server Setup

1. **Start MCP Server**:
   ```bash
   # From this project directory
   bun run /path/to/codeflow/mcp/codeflow-server.mjs
   ```

2. **Configure AI Client** (e.g., Claude Desktop):
   ```json
   {
     "mcpServers": {
       "codeflow-tools": {
         "command": "bun",
         "args": ["run", "/path/to/codeflow/mcp/codeflow-server.mjs"]
       }
     }
   }
   ```

### Usage

Use MCP tools in your AI client:

```
Use tool: research
Input: "Analyze the authentication system for potential OAuth integration"

Use tool: plan
Input: "Create implementation plan based on the research findings"

Use tool: execute
Input: "Implement the OAuth integration following the plan"
```

Commands are located in `.opencode/command/` and can be customized for this project.

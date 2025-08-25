# MCP Usage Examples

This document provides practical examples for using the Agentic Workflow System through Model Context Protocol (MCP) integration.

## Prerequisites

1. **Start the MCP Server**:
   ```bash
   cd /path/to/agentic
   bun run mcp/agentic-server.mjs
   ```

2. **Configure Claude Desktop** (add to settings):
   ```json
   {
     "mcpServers": {
       "agentic-tools": {
         "command": "bun",
         "args": ["run", "/path/to/agentic/mcp/agentic-server.mjs"],
         "env": {}
       }
     }
   }
   ```

## Example Workflows

### 1. Complete Feature Development

#### Research Phase
```
I need to add OAuth authentication to my Node.js app. Let me start by researching the current authentication system.

Use tool: research
```

**Input**: "Analyze the current authentication system in src/auth/ and find patterns for adding OAuth providers. Look for existing user models, session handling, and authentication middleware."

#### Planning Phase
```
Based on the research, create an implementation plan.

Use tool: plan
```

**Input**: Use the research document path from the previous step to create a detailed implementation plan.

#### Implementation Phase
```
Execute the implementation plan step by step.

Use tool: execute
```

**Input**: Path to the plan document created in the previous step.

#### Testing Phase
```
Generate comprehensive tests for the OAuth implementation.

Use tool: test
```

**Input**: Path to the implementation plan or description of the OAuth feature implemented.

#### Documentation Phase
```
Create user documentation and API docs for OAuth integration.

Use tool: document
```

**Input**: "Create user guide and API documentation for OAuth authentication feature, including setup instructions and troubleshooting."

#### Commit Phase
```
Create a proper commit for the OAuth implementation.

Use tool: commit
```

**Input**: (No input needed - analyzes current git state)

### 2. Focused Research

#### Research Authentication System
```
I need a comprehensive analysis of the authentication system.

Use tool: research
```

**Input**: "Analyze the entire authentication system including user models, session handling, middleware, existing integrations, and security patterns. Find all relevant code locations and implementation patterns."

**Note**: The research command automatically uses internal agents (codebase-locator, codebase-analyzer, pattern-finder) to provide comprehensive analysis without needing to call them individually.

### 3. Complete Testing Workflow

#### Generate Comprehensive Tests
```
Create tests for the OAuth implementation.

Use tool: test
```

**Input**: "Generate comprehensive test suite for OAuth authentication including unit tests for user linking, integration tests for OAuth flow, and end-to-end tests for complete authentication workflow."

### 4. Documentation Generation  

#### Create User Documentation
```
Generate documentation for the OAuth feature.

Use tool: document
```

**Input**: "Create user guide for OAuth authentication setup, API documentation for OAuth endpoints, and developer notes for extending OAuth providers."

## Direct Tool Access Examples

### Get Specific Command
```
Retrieve the research command documentation.

Use tool: get_command
Input: { "name": "research" }
```

### List Available Commands
```
Get a list of all available workflow commands.

Use tool: get_command
Input: { "name": "invalid" }
```

This will return an error message showing all available commands: research, plan, execute, test, document, commit, review.

## Advanced Workflows

### 1. Complete Feature Development Cycle

For complex features requiring multiple phases:

```
1. Use: research
   Input: "Comprehensive analysis of OAuth integration requirements across frontend, backend, database, and security considerations"

2. Use: plan  
   Input: "Create detailed implementation plan based on research findings"

3. Use: execute
   Input: "Implement the OAuth integration following the plan"

4. Use: test
   Input: "Generate security tests, performance tests, and comprehensive test coverage"

5. Use: document
   Input: "Create user guides, API docs, and security documentation"

6. Use: review
   Input: "Final review against original plan and requirements"
```

### 2. Security-Focused Development

```
1. Use: research
   Input: "Security-focused analysis of authentication system, identify vulnerabilities, compliance requirements, and security best practices"

2. Use: test
   Input: "Generate security tests including CSRF protection, token validation, session security, and penetration testing scenarios"

3. Use: review
   Input: "Review implementation against OWASP guidelines and OAuth 2.0 security best practices"
```

### 3. Performance-Critical Features

```
1. Use: research
   Input: "Performance analysis of authentication system, identify bottlenecks, and establish baseline metrics"

2. Use: plan
   Input: "Create optimization plan based on performance findings"

3. Use: test
   Input: "Generate performance tests and benchmarks to validate optimizations"
```

## Integration Patterns

### Claude Desktop Workflow

1. **Start Research**: Use MCP tools directly in Claude Desktop conversation
2. **Review Outputs**: Manually review generated research and plans
3. **Iterate**: Use follow-up tools to refine or expand analysis
4. **Implementation**: Execute plans and validate results
5. **Documentation**: Generate user guides and technical docs

### OpenCode Integration

1. **Research Phase**: Use research command for comprehensive analysis
2. **Implementation**: Use execute command for systematic implementation
3. **Quality Assurance**: Use test and review commands for validation

### Custom AI Client

```javascript
// Example integration with custom MCP client
const client = new McpClient();

// Research phase
const research = await client.callTool('research', {
  query: 'OAuth authentication implementation'
});

// Planning phase  
const plan = await client.callTool('plan', {
  research: research.content
});

// Implementation
const implementation = await client.callTool('execute', {
  plan: plan.content
});
```

## Troubleshooting Examples

### Tool Not Found
```
# If you get "Tool not found" errors:

1. Check available tools:
   Use tool: get_command
   Input: { "name": "research" }

2. Verify server is running:
   bun run mcp/agentic-server.mjs

3. Check MCP client configuration
```

### Command Not Found
```
# If command not found, check available commands:

Use tool: get_command
Input: { "name": "invalid-command-name" }

# This will list all available commands in the error message
```

### Missing Dependencies
```
# Ensure all dependencies are installed:
cd /path/to/agentic
bun install

# Verify MCP SDK is available:
bun run mcp/agentic-server.mjs --version
```

## Best Practices

### 1. Workflow Sequencing
- Always start with research for new features
- Use planning before implementation
- Generate tests before committing
- Create documentation for maintainability

### 2. Command Selection
- Start with research for understanding existing systems
- Use plan to create detailed implementation roadmaps
- Execute implements the plan systematically
- Test generates comprehensive test coverage
- Document creates user guides and technical docs
- Use review to validate against original requirements

### 3. Error Handling
- Review all generated content for accuracy
- Validate implementation against plans
- Run tests before finalizing changes
- Use review tools for quality assurance

### 4. Tool Usage
- Use stable command names (agentic.command.X) for reliability
- Leverage get_command for dynamic access to command documentation
- Commands automatically orchestrate internal agents - no need to call them separately

This comprehensive example set demonstrates the power of MCP integration for seamless AI-assisted development workflows.
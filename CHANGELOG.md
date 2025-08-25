# Changelog

All notable changes to the Agentic Workflow system will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-08-25

### Added

#### MCP Integration
- **Model Context Protocol (MCP) Server** (`mcp/agentic-server.mjs`)
  - Dynamic tool discovery and registration from filesystem
  - Stable semantic naming for all commands and agents
  - Parameterized tool access (`agentic.get_command`, `agentic.get_agent`)
  - Support for both core and opencode agent scopes
  - Compatible with Claude Desktop, OpenCode, and other MCP clients

#### New Commands
- **`/test`** command for comprehensive test generation
  - Unit, integration, and end-to-end test creation
  - Follows project testing patterns and frameworks
  - Comprehensive coverage of functionality and edge cases

- **`/document`** command for documentation generation  
  - User guides, API documentation, and technical specifications
  - Inline code comments and README updates
  - Multiple audience support (user, api, developer, mixed)

#### Dependencies
- `@modelcontextprotocol/sdk@^1.17.4` - Official MCP SDK for server implementation
- `zod@^4.1.1` - Schema validation and type safety for MCP operations

#### Scripts
- `npm run mcp:server` - Start MCP server in production mode
- `npm run mcp:dev` - Start MCP server with auto-restart on changes

### Enhanced

#### Documentation
- **Comprehensive MCP documentation suite**:
  - `MCP_INTEGRATION.md` - Complete technical integration guide
  - `MCP_QUICKSTART.md` - 5-minute setup guide
  - `MCP_USAGE_EXAMPLES.md` - Practical workflow examples
- **Updated existing documentation**:
  - Enhanced `README.md` with MCP integration overview
  - Updated `CLAUDE.md` with MCP architecture details  
  - Enhanced `SLASH_COMMANDS.md` with MCP tool references

#### Tool Access
- **50+ MCP Tools Available**:
  - 7 workflow commands (research, plan, execute, test, document, commit, review)
  - 6+ core agents (codebase analysis, documentation, web research)
  - 5+ domain specialist agents (operations, migrations, performance, SEO, localization)
  - 25+ OpenCode agents (full-stack development, API building, security, UX)
  - 2 utility tools (parameterized access by name/scope)

#### Naming Convention
- **Stable Tool Names**:
  - Commands: `agentic.command.{name}` (e.g., `agentic.command.research`)
  - Core Agents: `agentic.agent.{name}` (e.g., `agentic.agent.codebase_locator`)
  - OpenCode Agents: `agentic.agent.opencode.{name}` (e.g., `agentic.agent.opencode.api_builder`)

### Technical Implementation

#### MCP Server Architecture
- **Dynamic File System Scanning**: Automatically discovers `.md` files in `/command` and `/agent` directories
- **Unique ID Generation**: SHA1-based collision prevention with semantic fallbacks
- **Scope Detection**: Automatic categorization of core vs. opencode agents
- **Error Handling**: Comprehensive error handling for missing files, registration conflicts, client communication
- **Process Management**: Persistent connection handling with graceful shutdown

#### Platform Compatibility
- **Bun Runtime**: Optimized for Bun's fast TypeScript execution
- **Node.js Compatible**: Works with standard Node.js environments
- **Cross-Platform**: Supports Windows, macOS, and Linux

### Fixed

#### CLI Commands
- Corrected documentation references from `push` to `pull` command in README

### Changed

#### Workflow Enhancement
- Extended workflow to include testing and documentation phases
- Complete workflow now: research → plan → execute → test → document → commit → review

#### Package Structure
- MCP server code added to dedicated `/mcp` directory
- Enhanced TypeScript configuration for ES modules with MCP types

## [0.1.0] - Previous Release

### Added
- Initial Agentic Workflow CLI implementation
- Core workflow commands (research, plan, execute, commit, review)
- Specialized agents for codebase analysis and domain expertise
- CLI commands for project setup (`pull`, `status`, `version`)
- Comprehensive agent registry and documentation system

---

## Upgrade Guide

### From 0.1.0 to 0.2.0

1. **Install New Dependencies**:
   ```bash
   bun install  # Installs @modelcontextprotocol/sdk and zod
   ```

2. **Configure MCP Client** (Optional - for Claude Desktop integration):
   ```json
   {
     "mcpServers": {
       "agentic-tools": {
         "command": "bun",
         "args": ["run", "/path/to/agentic/mcp/agentic-server.mjs"]
       }
     }
   }
   ```

3. **Start Using New Commands**:
   - Try `/test` for comprehensive test generation
   - Try `/document` for documentation creation
   - Use MCP tools directly in compatible AI clients

4. **Update Workflows**:
   - Include testing and documentation phases in development workflow
   - Leverage MCP integration for seamless AI client access

### Breaking Changes
- None. All existing CLI functionality remains unchanged.

### Deprecations
- None in this release.

---

**For complete setup instructions, see [MCP_QUICKSTART.md](./MCP_QUICKSTART.md)**
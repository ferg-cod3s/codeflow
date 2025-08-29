# Changelog

All notable changes to the Agentic Workflow system will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-08-29

### Added

#### OpenCode Model Format Support
- **Automatic Model Format Conversion** for OpenCode agents
  - Converts models to proper `providerId/modelId` format required by models.dev
  - Automatically upgrades Claude models to latest `anthropic/claude-sonnet-4-20250514`
  - Supports OpenAI, Google, GitHub Copilot, and other providers
  - Applied during sync operations to ensure compatibility

#### Enhanced YAML Parser
- **Proper handling of undefined and null values**
  - Converts string "undefined" to JavaScript `undefined`
  - Converts string "null" to JavaScript `null`
  - Fixes validation errors for agents with `tools: undefined`

#### Improved Agent Sync System
- **100% Agent Sync Success Rate**
  - All 54 agents now sync successfully across all formats (base, claude-code, opencode)
  - Fixed validation failures that previously blocked 39 agents
  - Enhanced reliability and error handling

#### MCP Integration
- **Model Context Protocol (MCP) Server** (`mcp/codeflow-server.mjs`)
  - Dynamic tool discovery and registration from filesystem
  - Stable semantic naming for all commands and agents
  - Parameterized tool access (`codeflow.get_command`, `codeflow.get_agent`)
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

### Enhanced

#### Format Converter
- **Smart Model Format Detection and Conversion**
  - `convertModelForOpenCode()` method with comprehensive provider support
  - Handles Anthropic, OpenAI, Google, and GitHub Copilot models
  - Ensures models.dev compatibility for OpenCode format
  - Preserves existing correct formats while upgrading incorrect ones

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
  - Commands: `codeflow.command.{name}` (e.g., `codeflow.command.research`)
  - Core Agents: `codeflow.agent.{name}` (e.g., `codeflow.agent.codebase_locator`)
  - OpenCode Agents: `codeflow.agent.opencode.{name}` (e.g., `codeflow.agent.opencode.api_builder`)

### Fixed

#### Agent Validation Issues
- **YAML Parser Improvements**
  - Fixed parsing of `undefined` and `null` string values
  - Resolves validation errors where tools field was incorrectly parsed
  - Enables successful validation and sync of all agents

#### OpenCode Model Compatibility  
- **Corrected Model Format Issues**
  - Fixed OpenCode agents using incorrect model format (missing provider prefix)
  - Ensures compatibility with OpenCode and models.dev standards
  - Automatic conversion during sync operations

#### CLI Commands
- Corrected documentation references from `push` to `pull` command in README

### Changed

#### Workflow Enhancement
- Extended workflow to include testing and documentation phases
- Complete workflow now: research → plan → execute → test → document → commit → review

#### Package Structure
- MCP server code added to dedicated `/mcp` directory
- Enhanced TypeScript configuration for ES modules with MCP types

#### Agent Sync Process
- **Improved Reliability**: 486 total agents now sync successfully (54 agents × 3 formats × 3 directories)
- **Better Error Handling**: Clear validation messages and automatic format corrections
- **Enhanced Performance**: Streamlined sync process with better validation

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
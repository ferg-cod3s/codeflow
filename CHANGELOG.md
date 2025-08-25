# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-20

### Added
- Initial release of Agentic CLI system
- Core CLI infrastructure with Bun runtime support
- Specialized subagents for enhanced OpenCode capabilities:
  - `codebase-analyzer`: Analyzes codebase implementation details
  - `codebase-locator`: Locates files and components using natural language
  - `codebase-pattern-finder`: Finds similar implementations and usage patterns
  - `thoughts-analyzer`: Deep dive research analysis
  - `thoughts-locator`: Discovers relevant documentation
  - `web-search-researcher`: Web search and content analysis
- Command system for complex operations:
  - `commit`: Enhanced git commit workflow
  - `execute`: Task execution management
  - `plan`: Project planning capabilities
  - `research`: Research automation
  - `review`: Code review assistance
- CLI commands:
  - `agentic pull`: Sync latest agents and commands from repository
  - `agentic status`: Display current configuration and version
  - `agentic metadata`: Generate research documentation
- Comprehensive documentation system
- OpenCode compatibility for all subagents
- MIT License

### Security
- Fixed shell injection vulnerability in commit and research commands

### Documentation
- Added comprehensive usage documentation
- Added architecture documentation
- Added workflow guides
- Added README with setup instructions

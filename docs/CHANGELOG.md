## [0.3.0](https://github.com/ferg-cod3s/codeflow/compare/v0.2.1...v0.3.0) (2025-08-31)

# Changelog

## [0.5.0] - 2025-08-31

### 🎯 **Major Architecture Changes**

- **BREAKING CHANGE**: Migrate to single source of truth architecture
- **BREAKING CHANGE**: Deprecate `claude-agents/` and `opencode-agents/` directories
- **BREAKING CHANGE**: All agents now sourced from `codeflow-agents/` with on-demand conversion

### ✨ **New Features**

- **Modular Setup Agents**: Complete rewrite of setup command with strategy pattern
- **Single Source of Truth**: `codeflow-agents/` as authoritative agent source
- **On-Demand Conversion**: Automatic format conversion during setup (no storage bloat)
- **Strategy Pattern**: Extensible setup logic for different agent and command types
- **Configuration-Driven**: Format mappings allow easy addition of new AI client formats
- **Performance Optimized**: Batch processing and streaming for large agent sets

### 🔧 **Improvements**

- **Setup Command Enhancement**: Now copies both commands AND agents automatically
- **Error Handling**: Comprehensive validation and structured error reporting
- **Backward Compatibility**: Deprecated directories preserved with migration warnings
- **Type Safety**: Full TypeScript coverage with proper interfaces
- **Test Coverage**: 100% test coverage for new functionality

### 🐛 **Bug Fixes**

- **Setup Agents Issue**: Fixed `codeflow setup` not copying agents for Claude Code projects
- **Directory Management**: Proper handling of deprecated vs active directories
- **MCP Compatibility**: Updated MCP server to work with new directory structure

### 📚 **Documentation**

- **User Guide**: Complete setup and usage documentation
- **Developer Notes**: Architecture overview and extension points
- **API Reference**: CLI command specifications and examples
- **Migration Guide**: Instructions for upgrading from multi-format to single-source

---

## [0.4.0] - 2025-08-31

### 🎯 **Major Architecture Changes**

- **BREAKING CHANGE**: Implement single-format architecture with BaseAgent as source of truth
- **BREAKING CHANGE**: Consolidate all agent formats into unified BaseAgent interface
- **BREAKING CHANGE**: Update agent validation to require name field and support 'agent' mode

### ✨ **New Features**

- Add unified BaseAgent interface that serves as single source of truth
- Implement automatic format conversion between base, claude-code, and opencode formats
- Add comprehensive validation system for all agent formats
- Support for 'agent' mode value in addition to 'subagent' and 'primary'
- Add round-trip conversion testing for data integrity validation

### 🔧 **Improvements**

- Refactor FormatConverter to use BaseAgent as central format
- Update agent parser to automatically populate name field from filename
- Enhance validation rules with format-specific recommendations
- Improve test coverage with new single-format architecture tests
- Update documentation to reflect new architecture

### 🐛 **Bug Fixes**

- Fix CLI convert command by adding missing convertBatch method
- Fix agent validation failures by ensuring name field is present
- Fix test failures related to missing methods and validation issues
- Resolve type mismatches in format conversion system

### 📚 **Documentation**

- Update README.md with single-format architecture details
- Create comprehensive MIGRATION_GUIDE.md for users
- Update ARCHITECTURE_OVERVIEW.md with new system design
- Update AGENT_REGISTRY.md to reflect unified format approach

### 🧪 **Testing**

- Add new test suite for single-format architecture validation
- Test round-trip conversion data integrity
- Validate cross-format consistency
- Performance testing for conversion and validation

---

## [0.2.1](https://github.com/ferg-cod3s/codeflow/compare/v0.2.0...v0.2.1) (2025-08-29)

### Bug Fixes

- correct all OpenCode agent model formats for models.dev compatibility ([e9ffe06](https://github.com/ferg-cod3s/codeflow/commit/e9ffe0656c288b779491715282f111c378b22ce8))
- correct Claude Code global agent directory path ([eb7478c](https://github.com/ferg-cod3s/codeflow/commit/eb7478cfe90cac2c0d21fabbb0da960e40a1a5c1))
- update agent files and fix test expectations ([ff8d6ad](https://github.com/ferg-cod3s/codeflow/commit/ff8d6ad83926d3602473bc8c8c6378413d939ad6))
- update Husky hooks to use modern format ([8b07e69](https://github.com/ferg-cod3s/codeflow/commit/8b07e69d0a2a690b0b21b6e97157d190c0999947))
- update MCP server to support new global agent directory structure ([3a64a2c](https://github.com/ferg-cod3s/codeflow/commit/3a64a2c7594a4124fd65e47de09cced770e8171a))

### Features

- setup Husky with automated changelog generation ([9b76509](https://github.com/ferg-cod3s/codeflow/commit/9b76509168955ccf1e84dbd74e5481718b3a2664))

### BREAKING CHANGES

- Global agent directory structure updated for Claude Code compatibility

# [0.2.0](https://github.com/ferg-cod3s/codeflow/compare/a7cbf1b46124ab6ae508b217e965a6b6f91f63e8...v0.2.0) (2025-08-29)

### Bug Fixes

- handle undefined and null values properly in YAML parser ([1f7b526](https://github.com/ferg-cod3s/codeflow/commit/1f7b52672d8832eb2a55fbce450837647f7c39ca))
- update binary name to agentic-codeflow-mcp in v0.1.1 ([558eab3](https://github.com/ferg-cod3s/codeflow/commit/558eab3e6443128e17e710088dc33c1c88f934d2))
- update package name to non-scoped codeflow-mcp-server ([a7cbf1b](https://github.com/ferg-cod3s/codeflow/commit/a7cbf1b46124ab6ae508b217e965a6b6f91f63e8))

### Features

- add proper model format conversion for OpenCode agents ([538f84a](https://github.com/ferg-cod3s/codeflow/commit/538f84ac6ddab9742c877d8b30f2c2cbcc0c6de8))
- complete Phase 4 - Automatic Synchronization system ([c9934f3](https://github.com/ferg-cod3s/codeflow/commit/c9934f36e624616ce8ea66214ecae49f353f4e01))
- complete Phase 6 - Cross-Platform Testing Framework ([a5da21d](https://github.com/ferg-cod3s/codeflow/commit/a5da21d21267682579560f1cf32b527e53a3fc12))
- complete Phase 7 - Integration and Validation ✅ ([48803c8](https://github.com/ferg-cod3s/codeflow/commit/48803c8c703f294e7521c4dad7ee79c71860ba3a))
- implement agent format conversion system - Phase 2 complete ([cd38201](https://github.com/ferg-cod3s/codeflow/commit/cd382019e63ef3f0f899b7b7643a6954795b676b))
- implement global agent distribution and format sync - Phase 3 complete ([1b8f0cc](https://github.com/ferg-cod3s/codeflow/commit/1b8f0cc968578bd76d953c72a1886cec9ffa2d69))
- migrate to @agentic-codeflow/mcp scoped package ([6ad03da](https://github.com/ferg-cod3s/codeflow/commit/6ad03daf1cc0f3a7f09c578c0b73d67ff6fce1b1))
- rename CLI from 'agentic' to 'codeflow' - Phase 1 complete ([648febd](https://github.com/ferg-cod3s/codeflow/commit/648febd5687879379d061f25bac6bffe20192250))
- synchronize commands across all locations for consistency ([bc35e84](https://github.com/ferg-cod3s/codeflow/commit/bc35e840d6616bd403346f4101ac168134ab4801))
- update Cursor MCP config to use published package ([39d24b3](https://github.com/ferg-cod3s/codeflow/commit/39d24b3dda1a6a7475374a7dea3ffc320179d849))
- update OpenCode agents to use Claude Sonnet 4 with correct provider format ([dac6526](https://github.com/ferg-cod3s/codeflow/commit/dac65262b724e64e33deda1907c8d14c3fb4ddad))

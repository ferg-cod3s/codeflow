## [0.6.0](https://github.com/ferg-cod3s/codeflow/compare/v0.5.3...v0.6.0) (2025-09-01)

### Features

* **sync-global**: Add multi-source agent synchronization with auto-format detection ([implementation](https://github.com/ferg-cod3s/codeflow/commit/sync-global-multidir))
  - Processes agents from both `codeflow-agents/` and `.opencode/agent/` directories
  - Auto-detects agent formats (base, claude-code, opencode) for mixed directories
  - Implements intelligent deduplication to prevent duplicate agents
  - Supports 29 specialized agents across all platforms (MCP, Claude Code, OpenCode)

* **opencode**: Full OpenCode format compliance and validation ([validation-fix](https://github.com/ferg-cod3s/codeflow/commit/opencode-compliance))
  - Updated agent validation to support official OpenCode modes (`primary`, `subagent`, `all`)
  - Enhanced YAML parser with array support for `tags: [item1, item2]` format
  - Proper mode assignments: orchestrator=`primary`, all others=`subagent`
  - Custom extensions preserved: `category`, `tags` fields supported

* **orchestration**: Enhanced smart-subagent-orchestrator with comprehensive agent awareness ([orchestrator-update](https://github.com/ferg-cod3s/codeflow/commit/orchestrator-enhancement))
  - Platform-agnostic agent routing (MCP, Claude Code, OpenCode)
  - Complete catalog of 29+ specialized agents with capabilities and usage patterns
  - Advanced orchestration patterns and best practices for complex multi-domain projects
  - Cross-platform compatibility for seamless agent coordination

### Bug Fixes

* **validation**: Resolve OpenCode agent validation errors that prevented sync-global from working
* **types**: Fix TypeScript compilation errors in agent parser and format converter
* **modes**: Remove invalid `agent` mode and standardize on official OpenCode modes
* **yaml**: Add proper array parsing for tags and other array fields in agent frontmatter

### BREAKING CHANGES

* Agent mode `agent` is no longer valid - use `subagent` for specialized agents and `primary` for orchestrators
* OpenCode agents now require compliance with official OpenCode specification
* sync-global now processes multiple source directories by default

## [0.5.3](https://github.com/ferg-cod3s/codeflow/compare/v0.2.0...v0.5.3) (2025-08-31)


### Bug Fixes

* correct all OpenCode agent model formats for models.dev compatibility ([e9ffe06](https://github.com/ferg-cod3s/codeflow/commit/e9ffe0656c288b779491715282f111c378b22ce8))
* correct Claude Code global agent directory path ([eb7478c](https://github.com/ferg-cod3s/codeflow/commit/eb7478cfe90cac2c0d21fabbb0da960e40a1a5c1))
* resolve TypeScript validation errors and format conversion issues ([b53d1cc](https://github.com/ferg-cod3s/codeflow/commit/b53d1ccda8d1b1cb6b56eb84811c3704c273d9a9))
* update agent files and fix test expectations ([ff8d6ad](https://github.com/ferg-cod3s/codeflow/commit/ff8d6ad83926d3602473bc8c8c6378413d939ad6))
* update Husky hooks to use modern format ([8b07e69](https://github.com/ferg-cod3s/codeflow/commit/8b07e69d0a2a690b0b21b6e97157d190c0999947))
* update MCP server to support new global agent directory structure ([3a64a2c](https://github.com/ferg-cod3s/codeflow/commit/3a64a2c7594a4124fd65e47de09cced770e8171a))


### Features

* major v0.4.0 architecture refinement and platform integration clarification ([4922962](https://github.com/ferg-cod3s/codeflow/commit/49229621ffb2932108659cd63de525689f83e168))
* setup Husky with automated changelog generation ([9b76509](https://github.com/ferg-cod3s/codeflow/commit/9b76509168955ccf1e84dbd74e5481718b3a2664))


### BREAKING CHANGES

* Global agent directory structure updated for Claude Code compatibility



# [0.2.0](https://github.com/ferg-cod3s/codeflow/compare/a7cbf1b46124ab6ae508b217e965a6b6f91f63e8...v0.2.0) (2025-08-29)


### Bug Fixes

* handle undefined and null values properly in YAML parser ([1f7b526](https://github.com/ferg-cod3s/codeflow/commit/1f7b52672d8832eb2a55fbce450837647f7c39ca))
* update binary name to agentic-codeflow-mcp in v0.1.1 ([558eab3](https://github.com/ferg-cod3s/codeflow/commit/558eab3e6443128e17e710088dc33c1c88f934d2))
* update package name to non-scoped codeflow-mcp-server ([a7cbf1b](https://github.com/ferg-cod3s/codeflow/commit/a7cbf1b46124ab6ae508b217e965a6b6f91f63e8))


### Features

* add proper model format conversion for OpenCode agents ([538f84a](https://github.com/ferg-cod3s/codeflow/commit/538f84ac6ddab9742c877d8b30f2c2cbcc0c6de8))
* complete Phase 4 - Automatic Synchronization system ([c9934f3](https://github.com/ferg-cod3s/codeflow/commit/c9934f36e624616ce8ea66214ecae49f353f4e01))
* complete Phase 6 - Cross-Platform Testing Framework ([a5da21d](https://github.com/ferg-cod3s/codeflow/commit/a5da21d21267682579560f1cf32b527e53a3fc12))
* complete Phase 7 - Integration and Validation ✅ ([48803c8](https://github.com/ferg-cod3s/codeflow/commit/48803c8c703f294e7521c4dad7ee79c71860ba3a))
* implement agent format conversion system - Phase 2 complete ([cd38201](https://github.com/ferg-cod3s/codeflow/commit/cd382019e63ef3f0f899b7b7643a6954795b676b))
* implement global agent distribution and format sync - Phase 3 complete ([1b8f0cc](https://github.com/ferg-cod3s/codeflow/commit/1b8f0cc968578bd76d953c72a1886cec9ffa2d69))
* migrate to @agentic-codeflow/mcp-server scoped package ([6ad03da](https://github.com/ferg-cod3s/codeflow/commit/6ad03daf1cc0f3a7f09c578c0b73d67ff6fce1b1))
* rename CLI from 'agentic' to 'codeflow' - Phase 1 complete ([648febd](https://github.com/ferg-cod3s/codeflow/commit/648febd5687879379d061f25bac6bffe20192250))
* synchronize commands across all locations for consistency ([bc35e84](https://github.com/ferg-cod3s/codeflow/commit/bc35e840d6616bd403346f4101ac168134ab4801))
* update Cursor MCP config to use published package ([39d24b3](https://github.com/ferg-cod3s/codeflow/commit/39d24b3dda1a6a7475374a7dea3ffc320179d849))
* update OpenCode agents to use Claude Sonnet 4 with correct provider format ([dac6526](https://github.com/ferg-cod3s/codeflow/commit/dac65262b724e64e33deda1907c8d14c3fb4ddad))




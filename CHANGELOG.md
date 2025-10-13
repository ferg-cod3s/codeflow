## [0.1.9](https://github.com/ferg-cod3s/codeflow/compare/v0.1.8...v0.1.9) (2025-09-02)


### Bug Fixes

* include agent/command/docs dirs in platform packages ([bac1269](https://github.com/ferg-cod3s/codeflow/commit/bac1269cbad334760c7333f9cb76816fd1ea8b38))



## [0.1.8](https://github.com/ferg-cod3s/codeflow/compare/v0.6.0...v0.1.8) (2025-09-02)


### Features

* add --ignore-frontmatter flag to ignore YAML frontmatter ([8c70654](https://github.com/ferg-cod3s/codeflow/commit/8c7065457073dc0274a738a57f1c54153f15db12))
* Add init command for project-specific agentic setup ([bb3e7b4](https://github.com/ferg-cod3s/codeflow/commit/bb3e7b4a318b01f296ae16bfd2530c0d681f20cb))



## 0.1.7 (2025-08-26)



## [0.12.4](https://github.com/ferg-cod3s/codeflow/compare/v0.12.3...v0.12.4) (2025-10-01)


### Features

* add comprehensive CLI commands - validate, list, info, update, clean, export ([610eadb](https://github.com/ferg-cod3s/codeflow/commit/610eadb82538cb148534df2c7b2aa766445447fd))
* add help commands and update command metadata ([b53d309](https://github.com/ferg-cod3s/codeflow/commit/b53d30924218abd38734245e7db9be8c349a8076))



## [0.12.3](https://github.com/ferg-cod3s/codeflow/compare/v0.12.2...v0.12.3) (2025-09-28)



## [0.12.2](https://github.com/ferg-cod3s/codeflow/compare/v0.12.1...v0.12.2) (2025-09-28)



## [0.12.1](https://github.com/ferg-cod3s/codeflow/compare/v0.10.10...v0.12.1) (2025-09-28)



## [0.10.10](https://github.com/ferg-cod3s/codeflow/compare/v0.10.9...v0.10.10) (2025-09-27)


### Features

* add automated release script with version tagging ([2d118c3](https://github.com/ferg-cod3s/codeflow/commit/2d118c3b092ff9e078e8fd7fd461a627fa7ce58f))



## [0.10.9](https://github.com/ferg-cod3s/codeflow/compare/v1.2.0...v0.10.9) (2025-09-26)



# [1.2.0](https://github.com/ferg-cod3s/codeflow/compare/v0.10.7...v1.2.0) (2025-09-24)


### Features

* implement comprehensive CLI error handling improvements ([5358b7d](https://github.com/ferg-cod3s/codeflow/commit/5358b7d47a7d7617320280e713b6badf28dd9792))
* major release v1.2.0 - migrate thoughts to docs, add comprehensive testing ([d37b17b](https://github.com/ferg-cod3s/codeflow/commit/d37b17b7d1229c20d233084fb570197793f06954))



## [0.10.7](https://github.com/ferg-cod3s/codeflow/compare/v0.10.6...v0.10.7) (2025-09-21)


### Bug Fixes

* update all agent models to use correct github-copilot/gpt-4.1 format ([16b63b1](https://github.com/ferg-cod3s/codeflow/commit/16b63b104f192e3798567adadc25a62d79f6de5e))
* update all agent models to use correct provider/model format ([438b0f9](https://github.com/ferg-cod3s/codeflow/commit/438b0f92510a3e141efcb16138fbec8a72f89292))
* update all agent models to use correct provider/model identifiers ([69f7375](https://github.com/ferg-cod3s/codeflow/commit/69f7375d5537d0ef819b4545381f66a10c0fc50e))


### Features

* reorganize OpenCode structure and publish v0.10.7 ([a28b197](https://github.com/ferg-cod3s/codeflow/commit/a28b19768855f672ace2548ec616e1a5ba4af425))



## [0.10.6](https://github.com/ferg-cod3s/codeflow/compare/v0.10.2...v0.10.6) (2025-09-21)


### Bug Fixes

* replace js-yaml import with yaml package to resolve import error ([a91db80](https://github.com/ferg-cod3s/codeflow/commit/a91db80c87258930661d84dd3d00c5be9637816a))
* update validation script to accept optimized model assignments ([5c643c7](https://github.com/ferg-cod3s/codeflow/commit/5c643c7b92550712d1e4b49ecf10789c98bf645a))



## [0.10.2](https://github.com/ferg-cod3s/codeflow/compare/v0.9.5...v0.10.2) (2025-09-13)


### Bug Fixes

* **sync:** resolve global sync command issue and update build artifacts ([9c39ad9](https://github.com/ferg-cod3s/codeflow/commit/9c39ad9383a3546df32c0ce8a47cca6a7190e76a))


### Features

* **agent:** api-builder upgraded to UATS v1.0 with structured output + contract/DX spec ([eb03e79](https://github.com/ferg-cod3s/codeflow/commit/eb03e79d09bc78899ee1eedc3ca7fccd66569239))
* **agent:** uats v1.0 upgrade for codebase-analyzer ([a41c3d1](https://github.com/ferg-cod3s/codeflow/commit/a41c3d1981fa1a39c07d5cc7b9406c98c72ad873))
* **agent:** uats v1.0 upgrade for thoughts-locator with structured discovery schema ([594dc3c](https://github.com/ferg-cod3s/codeflow/commit/594dc3c0d03fe3af5114cfa9387cfcf9e7b64e16))
* **agent:** uats v1.0 upgrade web-search-researcher with structured taxonomy & evidence schema ([c3c0205](https://github.com/ferg-cod3s/codeflow/commit/c3c0205de46fb38b7c014364b2a0e084431a4e1a))
* **agent:** upgrade code-reviewer to UATS v1.0 with structured output & clear boundaries ([cc27c9b](https://github.com/ferg-cod3s/codeflow/commit/cc27c9bc043714edb92c1be86ee7b9e04265686c))
* **agent:** upgrade security-scanner to UATS v1.0 with structured output & scope boundaries ([0737bcf](https://github.com/ferg-cod3s/codeflow/commit/0737bcf62a6452fce7786da101a28f5a32bacec6))



## [0.9.5](https://github.com/ferg-cod3s/codeflow/compare/v0.9.2...v0.9.5) (2025-09-06)


### Bug Fixes

* resolve agent parsing issues and update setup functionality ([6d6e9ef](https://github.com/ferg-cod3s/codeflow/commit/6d6e9ef73e2599fb69856350290c728f1e637545))
* standardize command descriptions across directories ([9019bee](https://github.com/ferg-cod3s/codeflow/commit/9019bee34bb07675875857705eba3ee1fa01cfe7))



## [0.9.2](https://github.com/ferg-cod3s/codeflow/compare/v0.9.0...v0.9.2) (2025-09-05)


### Bug Fixes

* resolve setup.ts syntax error and missing import ([a6ba80c](https://github.com/ferg-cod3s/codeflow/commit/a6ba80c3555e45fdae73c08234080ff81bf92dad))



# [0.9.0](https://github.com/ferg-cod3s/codeflow/compare/v0.1.9...v0.9.0) (2025-09-02)


### Bug Fixes

* quote YAML description in programmatic-seo-engineer to resolve OpenCode parsing error ([5464de1](https://github.com/ferg-cod3s/codeflow/commit/5464de126a17b8db3bb9fe67c18457d235c80fae))
* update setup agent tests to handle command directory structure ([7e382c6](https://github.com/ferg-cod3s/codeflow/commit/7e382c6ca2bd882a78bc4f4d479920a47deec789))


### Features

* add proper YAML quoting in agent serialization ([b2dfb78](https://github.com/ferg-cod3s/codeflow/commit/b2dfb786ff58577d8d569988052b21834e070077))
* implement comprehensive agent permissions audit and security framework ([d6c21dc](https://github.com/ferg-cod3s/codeflow/commit/d6c21dcace0d17a27fcd900c52b3c5014f005ab7))
* v0.7.0 - Fix sync-global command and implement MCP security controls ([3a3befd](https://github.com/ferg-cod3s/codeflow/commit/3a3befd1dc72cd7e4ea2721b85d478b5c1e6f1cd))



# [0.6.0](https://github.com/ferg-cod3s/codeflow/compare/v0.2.0...v0.6.0) (2025-09-01)


### Bug Fixes

* correct all OpenCode agent model formats for models.dev compatibility ([e9ffe06](https://github.com/ferg-cod3s/codeflow/commit/e9ffe0656c288b779491715282f111c378b22ce8))
* correct Claude Code global agent directory path ([eb7478c](https://github.com/ferg-cod3s/codeflow/commit/eb7478cfe90cac2c0d21fabbb0da960e40a1a5c1))
* resolve TypeScript validation errors and format conversion issues ([b53d1cc](https://github.com/ferg-cod3s/codeflow/commit/b53d1ccda8d1b1cb6b56eb84811c3704c273d9a9))
* update agent files and fix test expectations ([ff8d6ad](https://github.com/ferg-cod3s/codeflow/commit/ff8d6ad83926d3602473bc8c8c6378413d939ad6))
* update Husky hooks to use modern format ([8b07e69](https://github.com/ferg-cod3s/codeflow/commit/8b07e69d0a2a690b0b21b6e97157d190c0999947))
* update MCP server to support new global agent directory structure ([3a64a2c](https://github.com/ferg-cod3s/codeflow/commit/3a64a2c7594a4124fd65e47de09cced770e8171a))


### Features

* major v0.4.0 architecture refinement and platform integration clarification ([4922962](https://github.com/ferg-cod3s/codeflow/commit/49229621ffb2932108659cd63de525689f83e168))
* major v0.6.0 - OpenCode compliance and multi-source sync-global ([3b89045](https://github.com/ferg-cod3s/codeflow/commit/3b890450e78967fd25a8514c55aff2d6ae154995))
* setup Husky with automated changelog generation ([9b76509](https://github.com/ferg-cod3s/codeflow/commit/9b76509168955ccf1e84dbd74e5481718b3a2664))


### BREAKING CHANGES

* Global agent directory structure updated for Claude Code compatibility



# [0.2.0](https://github.com/ferg-cod3s/codeflow/compare/v0.1.7...v0.2.0) (2025-08-29)


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



## [0.1.9](https://github.com/ferg-cod3s/codeflow/compare/v0.1.8...v0.1.9) (2025-09-02)


### Bug Fixes

* include agent/command/docs dirs in platform packages ([bac1269](https://github.com/ferg-cod3s/codeflow/commit/bac1269cbad334760c7333f9cb76816fd1ea8b38))



## [0.1.8](https://github.com/ferg-cod3s/codeflow/compare/v0.6.0...v0.1.8) (2025-09-02)


### Features

* add --ignore-frontmatter flag to ignore YAML frontmatter ([8c70654](https://github.com/ferg-cod3s/codeflow/commit/8c7065457073dc0274a738a57f1c54153f15db12))
* Add init command for project-specific agentic setup ([bb3e7b4](https://github.com/ferg-cod3s/codeflow/commit/bb3e7b4a318b01f296ae16bfd2530c0d681f20cb))



## 0.1.7 (2025-08-26)



# [0.6.0](https://github.com/ferg-cod3s/codeflow/compare/v0.2.0...v0.6.0) (2025-09-01)


### Bug Fixes

* correct all OpenCode agent model formats for models.dev compatibility ([e9ffe06](https://github.com/ferg-cod3s/codeflow/commit/e9ffe0656c288b779491715282f111c378b22ce8))
* correct Claude Code global agent directory path ([eb7478c](https://github.com/ferg-cod3s/codeflow/commit/eb7478cfe90cac2c0d21fabbb0da960e40a1a5c1))
* resolve TypeScript validation errors and format conversion issues ([b53d1cc](https://github.com/ferg-cod3s/codeflow/commit/b53d1ccda8d1b1cb6b56eb84811c3704c273d9a9))
* update agent files and fix test expectations ([ff8d6ad](https://github.com/ferg-cod3s/codeflow/commit/ff8d6ad83926d3602473bc8c8c6378413d939ad6))
* update Husky hooks to use modern format ([8b07e69](https://github.com/ferg-cod3s/codeflow/commit/8b07e69d0a2a690b0b21b6e97157d190c0999947))
* update MCP server to support new global agent directory structure ([3a64a2c](https://github.com/ferg-cod3s/codeflow/commit/3a64a2c7594a4124fd65e47de09cced770e8171a))


### Features

* major v0.4.0 architecture refinement and platform integration clarification ([4922962](https://github.com/ferg-cod3s/codeflow/commit/49229621ffb2932108659cd63de525689f83e168))
* major v0.6.0 - OpenCode compliance and multi-source sync-global ([3b89045](https://github.com/ferg-cod3s/codeflow/commit/3b890450e78967fd25a8514c55aff2d6ae154995))
* setup Husky with automated changelog generation ([9b76509](https://github.com/ferg-cod3s/codeflow/commit/9b76509168955ccf1e84dbd74e5481718b3a2664))


### BREAKING CHANGES

* Global agent directory structure updated for Claude Code compatibility



# [0.2.0](https://github.com/ferg-cod3s/codeflow/compare/v0.1.7...v0.2.0) (2025-08-29)


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



## 0.1.7 (2025-08-26)




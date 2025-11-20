# Anthropic Plugin Catalog

This document catalogs all official Anthropic Claude Code plugins for conversion planning to OpenCode format.

## Plugin Categories

### Output Style Plugins
- **explanatory-output-style** ✅ *Already converted*
- **learning-output-style** ✅ *Already converted*
- **walkthrough-output-style** ✅ *New implementation*

### Development Tools
- **agent-sdk-dev** - Agent SDK development utilities
- **plugin-dev** - Plugin development toolkit
- **feature-dev** - Feature development workflow
- **hookify** - Hook creation and management

### Code Quality & Review
- **code-review** - Automated code review assistance
- **pr-review-toolkit** - Pull request review tools
- **security-guidance** - Security best practices and scanning

### Specialized Tools
- **commit-commands** - Git commit automation and standards
- **frontend-design** - Frontend design system utilities
- **ralph-wiggum** - Code quality and linting enforcement

## Conversion Priority Matrix

| Plugin | Priority | Complexity | Dependencies | Status |
|---------|----------|-------------|--------------|---------|
| agent-sdk-dev | High | Medium | OpenCode agent system | 🔄 Planning |
| plugin-dev | High | Low | Basic plugin system | 🔄 Planning |
| code-review | Medium | High | Code analysis tools | 📋 Backlog |
| feature-dev | Medium | Medium | Workflow automation | 📋 Backlog |
| security-guidance | High | High | Security scanning | 📋 Backlog |
| commit-commands | Low | Low | Git integration | 📋 Backlog |
| frontend-design | Medium | Medium | UI framework | 📋 Backlog |
| hookify | Medium | High | Event system | 📋 Backlog |
| pr-review-toolkit | Medium | High | GitHub integration | 📋 Backlog |
| ralph-wiggum | Low | Medium | Linting tools | 📋 Backlog |

## Conversion Strategy

### Phase 1: Core Development Tools (High Priority)
1. **agent-sdk-dev** - Essential for OpenCode agent ecosystem
2. **plugin-dev** - Needed for plugin development workflow
3. **security-guidance** - Critical for secure development

### Phase 2: Workflow Automation (Medium Priority)
4. **feature-dev** - Feature development workflow
5. **code-review** - Code quality automation
6. **frontend-design** - UI/UX development tools

### Phase 3: Specialized Tools (Low Priority)
7. **commit-commands** - Git workflow enhancement
8. **hookify** - Advanced event handling
9. **pr-review-toolkit** - GitHub integration
10. **ralph-wiggum** - Code quality enforcement

## Technical Considerations

### OpenCode Compatibility
- **Commands**: Direct compatibility (markdown format)
- **Agents**: Need wrapper as custom tools
- **Hooks**: Require TypeScript event handlers
- **MCP Integration**: Can be wrapped as plugins

### Conversion Challenges
1. **Hook System**: Claude Code uses JSON hooks → OpenCode needs TypeScript
2. **Agent System**: Different agent architectures
3. **Event Handling**: Different event models
4. **Configuration**: Varying config formats

### Infrastructure Needs
1. **Plugin Registry**: Central plugin management
2. **Conversion Utilities**: Automated conversion tools
3. **Validation System**: Plugin compatibility checking
4. **Documentation**: Conversion guides and examples

## Next Steps

1. **Research**: Deep dive into each plugin's implementation
2. **Prioritize**: Focus on high-impact, low-complexity plugins
3. **Convert**: Start with core development tools
4. **Test**: Comprehensive testing of converted plugins
5. **Document**: Create conversion guides and best practices

## Resources

- [Claude Code Plugin Repository](https://github.com/anthropics/claude-code/tree/main/plugins)
- [Plugin Documentation](https://code.claude.com/docs/en/plugins)
- [OpenCode Plugin System](./src/plugins/)
- [Conversion Examples](../examples/poc-anthropic-plugins/)
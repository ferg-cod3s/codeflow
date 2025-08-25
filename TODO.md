# TODO

## Documentation
- [x] Create /docs directory structure
- [x] Write comprehensive documentation
- [x] Update README with table of contents

## CLI Enhancements

### Core Features
- [ ] Add validation for agent/command markdown files
- [ ] Add update notifications when new versions available
- [ ] Add templates for creating new agents/commands
- [ ] Add init command for new projects

### Error Handling Improvements
- [ ] Add retry logic for file operations
- [ ] Improve error messages with suggested fixes
- [ ] Add verbose mode for debugging
- [ ] Handle corrupted/malformed agent files gracefully

## Workflow Features

### Ticket Management
- [ ] Local ticket management system
- [ ] Ticket status tracking (open/in-progress/closed)
- [ ] Ticket dependencies and relationships
- [ ] External tracker sync (future - GitHub, Linear, etc.)

### Thoughts Management
- [ ] Assisted archiving of outdated thoughts documents
- [ ] Archive summary generation before deletion
- [ ] Cross-reference validation
- [ ] Duplicate detection

## Agent System

### New Agents
- [ ] Architecture documentation locator subagent - Specifically locates architecture docs relevant to tasks (separate from thoughts-locator/analyzer)

### Testing & Validation
- [ ] Agent frontmatter validator
- [ ] Command frontmatter validator

### Agent Management
- [ ] Agent dependency management
- [ ] Agent versioning system
- [ ] Agent marketplace/registry (future)

## Quality of Life

### Developer Experience
- [ ] Interactive setup wizard
- [ ] Configuration profiles for different project types
- [ ] Shell completions for agentic CLI
- [ ] VS Code extension for thoughts management

### Example & Learning
- [ ] Create example project demonstrating full workflow (simple todo or notes app)
- [ ] Video tutorials for each workflow phase
- [ ] Best practices guide
- [ ] Troubleshooting guide

## Future Considerations

### Advanced Features
- [ ] Multi-project support
- [ ] Team collaboration features (future)
- [ ] Metrics and analytics
- [ ] Workflow automation hooks

### Integrations
- [ ] GitHub Actions integration
- [ ] Pre-commit hooks
- [ ] CI/CD pipeline templates
- [ ] IDE plugins

## Notes

Priority order:
1. Core functionality and stability
2. Developer experience improvements
3. Advanced features and integrations

Target audience: Solo developers first, team features later.

# Publishing Guide



<!-- VERBALIZED SAMPLING INTEGRATION -->
<!-- ================================ -->

**Selected Strategy**: Code-Path Analysis
**Confidence**: 71.0%

**Available Strategies**:
1. **Code-Path Analysis** (Confidence: 71.0%)
   - Plan: Identify entry points and main execution flows, Trace key decision branches and conditional logic...
2. **Pattern Discovery** (Confidence: 71.0%)
   - Plan: Scan codebase for repeated code structures, Identify naming conventions and architectural patterns...
3. **Architecture Mapping** (Confidence: 71.0%)
   - Plan: Identify major components and modules, Map data flow and dependencies between components...


CodeFlow CLI is distributed as an NPM package. This guide covers the simplified publishing process.

## Quick Publishing

```bash
# Bump version and create release (patch/minor/major)
./scripts/release.sh --bump-patch --publish

# Or just tag current version
./scripts/release.sh --publish
```

## Manual Publishing Steps

### 1. Quality Checks

```bash
bun run typecheck
bun run test
bun run lint
```

### 2. Version Management

```bash
# Update version (patch, minor, or major)
npm version patch  # or minor/major
```

### 3. Create Git Tag

```bash
git tag v$(node -p "require('./package.json').version")
git push origin --tags
```

### 4. Publish to NPM

```bash
npm publish --access public
```

### 5. Create GitHub Release (Optional)

The release script handles this automatically if you have `gh` CLI installed:

```bash
# Manual creation if needed
gh release create v$(node -p "require('./package.json').version") \
  --title "CodeFlow CLI v$(node -p "require('./package.json').version")" \
  --notes "Release notes here"
```

## Release Script Features

The `scripts/release.sh` script automates:

- ✅ Version bumping in package.json
- ✅ Git tag creation and pushing
- ✅ NPM publishing (with `--publish` flag)
- ✅ Automatic GitHub release creation
- ✅ Release notes generation from commit history

### Usage Examples

```bash
# Patch release with publishing
./scripts/release.sh --bump-patch --publish

# Minor release without publishing
./scripts/release.sh --bump-minor

# Major release with publishing
./scripts/release.sh --bump-major --publish

# Just tag and publish current version
./scripts/release.sh --publish
```

## Pre-publish Checklist

- [ ] All tests passing: `bun run test`
- [ ] Type checking passes: `bun run typecheck`
- [ ] Linting passes: `bun run lint`
- [ ] Working directory is clean
- [ ] Version follows semantic versioning
- [ ] CHANGELOG.md updated (if applicable)

## Post-publish Verification

```bash
# Verify package is available
npm view @agentic-codeflow/cli

# Test installation
npx @agentic-codeflow/cli --version

# Check GitHub release
# Visit: https://github.com/ferg-cod3s/codeflow/releases
```

## Troubleshooting

### "Working directory is not clean"

```bash
git status
git add .
git commit -m "Pre-release cleanup"
```

### "Tag already exists"

```bash
# Check existing tags
git tag -l

# Delete and recreate if needed
git tag -d v1.2.3
git push origin :refs/tags/v1.2.3
```

### NPM publish fails

```bash
# Check authentication
npm whoami

# Login if needed
npm login
```

### GitHub CLI not found

```bash
# macOS
brew install gh

# Ubuntu/Debian
sudo apt install gh

# Authenticate
gh auth login
```

## Files Included in Package

The `package.json` `files` array includes:

- `src/cli/**/*` - Main CLI entry point
- `src/config/**/*` - Configuration utilities
- `src/utils/**/*` - Utility functions
- `src/sync/**/*` - Synchronization logic
- `src/catalog/**/*` - Agent catalog
- `src/adapters/**/*` - Platform adapters
- `src/conversion/**/*` - Format conversion
- `src/yaml/**/*` - YAML processing
- `.claude/commands/**/*` - Claude Code commands
- `.opencode/command/**/*` - OpenCode commands
- `codeflow-agents/**/*` - Agent definitions
- `command/**/*` - Command workflows
- `AGENT_MANIFEST.json` - Agent registry
- Key documentation files

## Environment Variables

- `NPM_TOKEN` - For CI/CD publishing automation
- `GITHUB_TOKEN` - For automated GitHub releases in CI

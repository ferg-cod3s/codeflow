# NPM Deployment Guide



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


This guide explains how to deploy the `@agentic/mcp-server` package to npmjs.org.

## Pre-Deployment Checklist

### ✅ Security & Privacy Verification

**Confirmed secure aspects:**
- ✅ **No API keys, secrets, or tokens** in the code
- ✅ **No external HTTP requests** or network calls
- ✅ **No environment variable dependencies**
- ✅ **No PII collection or transmission**
- ✅ **Only local file system access** for command templates
- ✅ **Generic workflow templates** only - no project-specific data

**Code audit results:**
```bash
# Verified no sensitive patterns found:
grep -r -i "key\|secret\|token\|password\|api.*key" packages/agentic-mcp/src/
grep -r "fetch\|http\|https\|axios" packages/agentic-mcp/src/
grep -r "process\.env" packages/agentic-mcp/src/
```

### ✅ Package Quality Checks

Run these commands in `packages/agentic-mcp/`:

```bash
# 1. Clean build
rm -rf dist/ node_modules/
npm install
npm run build

# 2. Test the built package
npm start  # Should start without errors

# 3. Test as if installed globally
npm pack  # Creates .tgz file
npm install -g ./agentic-mcp-server-0.1.0.tgz
agentic-mcp  # Should work globally

# 4. Clean up test installation
npm uninstall -g @agentic/mcp-server
rm *.tgz
```

### ✅ Package Information

**Current package details:**
- **Name**: `@agentic/mcp-server`
- **Version**: `0.1.0`
- **License**: MIT
- **Main**: `dist/server.js`
- **Binary**: `agentic-mcp`
- **Node requirement**: `>=18.0.0`

## Deployment Steps

### 1. NPM Authentication

```bash
# Log in to your npmjs account
npm login

# Verify authentication
npm whoami
```

### 2. Final Pre-Publication Checks

```bash
cd packages/agentic-mcp

# Check what will be published
npm pack --dry-run

# Verify package contents
npm publish --dry-run
```

**Expected output should include:**
- `dist/` directory with compiled JavaScript
- `README.md` with comprehensive documentation
- `LICENSE` file
- `package.json` with correct metadata

### 3. Publish to NPM

```bash
# First publication (public package)
npm publish --access public

# For subsequent updates, just:
npm publish
```

### 4. Verify Publication

```bash
# Check package is live
npm view @agentic/mcp-server

# Test installation from NPM
npx @agentic/mcp-server
```

## Version Management

### Updating Versions

```bash
# Patch version (0.1.0 -> 0.1.1)
npm version patch

# Minor version (0.1.0 -> 0.2.0)  
npm version minor

# Major version (0.1.0 -> 1.0.0)
npm version major

# Custom version
npm version 0.1.1

# Then publish
npm publish
```

### Version Strategy

- **0.1.x** - Initial releases, bug fixes
- **0.x.0** - New features, non-breaking changes
- **x.0.0** - Breaking changes, major revisions

## Post-Publication Checklist

### ✅ Test Installation

```bash
# Test npx usage (most important)
npx @agentic/mcp-server

# Test global installation
npm install -g @agentic/mcp-server
agentic-mcp

# Test local installation
mkdir test-project && cd test-project
npm install @agentic/mcp-server
npx @agentic/mcp-server
```

### ✅ Verify Documentation

- [ ] NPM page shows correct README
- [ ] Links work correctly
- [ ] Installation instructions are accurate
- [ ] License is displayed properly

### ✅ Update Main Repository

```bash
# Update main README to reference published package
# Update documentation links
# Create release notes
```

## Maintenance

### Monitoring

- **NPM Stats**: Check download counts at https://npmjs.com/package/@agentic/mcp-server
- **Issues**: Monitor GitHub issues for bug reports
- **Security**: Watch for security advisories

### Updates

Common update scenarios:
1. **Bug fixes** - Patch version, quick release
2. **New command templates** - Minor version
3. **MCP protocol updates** - Minor/major depending on breaking changes
4. **Security updates** - Immediate patch release

### Deprecation (if needed)

```bash
# Deprecate a specific version
npm deprecate @agentic/mcp-server@0.1.0 "Use version 0.1.1 instead"

# Deprecate entire package (extreme case)
npm deprecate @agentic/mcp-server "Package has been superseded"
```

## Troubleshooting

### Common Publication Issues

**"Package already exists"**:
- Update version number in package.json
- Use `npm version patch` to auto-increment

**"Access denied"**:
- Verify npm login: `npm whoami`
- Check package scope ownership
- Use `--access public` for scoped packages

**"Validation failed"**:
- Ensure package.json has required fields
- Check that `dist/` directory exists and is built
- Verify Node.js version compatibility

**"Binary not found"**:
- Ensure `bin` field in package.json is correct
- Check that `dist/server.js` has shebang line
- Verify file permissions are executable

### Testing Issues

**"Module not found"**:
- Run `npm run build` to compile TypeScript
- Check that all dependencies are in dependencies (not devDependencies)

**"Command not working"**:
- Test the exact NPX command that users will run
- Verify MCP protocol compatibility
- Check Node.js version on test environment

## Security Considerations

### Package Security

- ✅ **No credentials** embedded in code
- ✅ **No external network calls**
- ✅ **Minimal dependencies** (only MCP SDK and Zod)
- ✅ **No filesystem writes** outside of normal log output
- ✅ **MIT license** allows commercial use

### User Privacy

- ✅ **No data collection** - server processes only user input
- ✅ **No telemetry** or analytics
- ✅ **No external API calls** or data transmission
- ✅ **Generic templates** contain no project-specific information

This package is safe for publication and will provide valuable functionality to the AI development community while maintaining complete privacy and security standards.
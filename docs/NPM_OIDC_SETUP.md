# NPM OIDC Trusted Publishing Setup

This document explains how the GitHub Actions workflow is configured for NPM trusted publishing using OpenID Connect (OIDC).

## Overview

The `.github/workflows/publish.yml` workflow uses modern OIDC authentication to publish to NPM without storing long-lived tokens as secrets.

## Prerequisites

### 1. NPM Package Configuration

Your package.json must include:
- Proper package name (`@agentic-codeflow/cli`)
- Public access setting
- Repository information

### 2. NPM Organization Setup

Ensure your NPM organization is configured for OIDC:

1. Go to [NPM Organization Settings](https://www.npmjs.com/org/your-org/settings)
2. Navigate to "Publishing access"
3. Add your GitHub repository as a trusted publisher

### 3. GitHub Repository Settings

The workflow requires these permissions:
```yaml
permissions:
  id-token: write  # Required for OIDC
  contents: write  # Required for releases
  packages: write  # Required for GitHub Packages
```

## Workflow Features

### Modern Actions
- ✅ Uses `softprops/action-gh-release@v2` (latest)
- ✅ Uses `actions/setup-node@v4` (latest)
- ✅ Uses `actions/checkout@v4` (latest)

### OIDC Authentication
- ✅ No NPM_TOKEN secret required for publishing (if OIDC is configured)
- ✅ Automatic token generation and exchange
- ✅ Enhanced security with short-lived tokens

### Publishing with Provenance
- ✅ Uses `--provenance` flag for package transparency
- ✅ Meets NPM's security requirements
- ✅ Enables package verification

### Release Management
- ✅ Automatic GitHub release creation
- ✅ Release notes generation
- ✅ Asset attachment (dist files, docs)

## Setup Instructions

### Option 1: Full OIDC Setup (Recommended)

1. **Configure NPM Organization**:
   ```bash
   # Add your GitHub repo as trusted publisher in NPM org settings
   # Repository: https://github.com/ferg-cod3s/codeflow
   # Workflow: .github/workflows/publish.yml
   # Environment: (leave blank for all environments)
   ```

2. **Remove NPM_TOKEN Secret**:
   ```bash
   # In GitHub repo settings > Secrets and variables > Actions
   # Remove or rename NPM_TOKEN if OIDC is configured
   ```

3. **Test the Workflow**:
   ```bash
   git tag v0.22.3
   git push origin v0.22.3
   ```

### Option 2: Traditional Token Setup (Fallback)

If OIDC is not configured, the workflow falls back to NPM_TOKEN:

1. **Create NPM Automation Token**:
   - Go to [NPM Account Settings](https://www.npmjs.com/settings/your-user/tokens)
   - Create "Automation" token
   - Set appropriate permissions for `@agentic-codeflow/cli`

2. **Add to GitHub Secrets**:
   - Go to repo Settings > Secrets and variables > Actions
   - Add `NPM_TOKEN` with the automation token value

## Workflow Triggers

The workflow triggers on:
```yaml
on:
  push:
    tags:
      - 'v*'  # Any tag starting with 'v'
```

## Verification Steps

After publishing, the workflow:
1. Installs the published package globally
2. Runs `codeflow --version` to verify installation
3. Runs `codeflow --help` to verify functionality

## Security Best Practices

1. **OIDC Preferred**: Use OIDC instead of long-lived tokens
2. **Minimal Permissions**: Grant only necessary permissions
3. **Provenance**: Always publish with `--provenance`
4. **Verification**: Verify package installation after publish
5. **Dependency Updates**: Keep GitHub Actions up to date

## Troubleshooting

### OIDC Issues
- Ensure `id-token: write` permission is set
- Verify NPM organization OIDC configuration
- Check workflow logs for token exchange errors

### Publishing Issues
- Verify package name and version in package.json
- Ensure `--access public` for scoped packages
- Check NPM token permissions (if using fallback)

### Release Issues
- Verify `contents: write` permission
- Check tag format matches trigger pattern
- Ensure GITHUB_TOKEN has release permissions

## Migration from Old Workflow

The new workflow replaces:
- ❌ `actions/create-release@v1` (deprecated)
- ❌ Basic NPM_TOKEN authentication
- ❌ No provenance tracking

With:
- ✅ `softprops/action-gh-release@v2` (modern)
- ✅ OIDC trusted publishing
- ✅ Package provenance
- ✅ Verification job
- ✅ Enhanced security

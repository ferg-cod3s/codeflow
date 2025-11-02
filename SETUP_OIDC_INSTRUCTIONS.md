# OIDC Trusted Publisher Setup Instructions



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


## Step 1: Configure npmjs.com Trusted Publisher

For each package, you need to configure trusted publishing on npmjs.com:

### For @agentic-codeflow/cli

1. Go to: https://www.npmjs.com/package/@agentic-codeflow/cli/settings
2. Scroll to "Trusted Publisher" section
3. Click "GitHub Actions" button
4. Fill in these exact values:
   - **Organization or user**: `ferg-cod3s`
   - **Repository**: `codeflow`
   - **Workflow filename**: `release.yml`
   - **Environment name**: (leave empty)
5. Click "Add trusted publisher"

### For @agentic-codeflow/mcp-server

1. Go to: https://www.npmjs.com/package/@agentic-codeflow/mcp-server/settings
2. Scroll to "Trusted Publisher" section
3. Click "GitHub Actions" button
4. Fill in these exact values:
   - **Organization or user**: `ferg-cod3s`
   - **Repository**: `codeflow`
   - **Workflow filename**: `release.yml`
   - **Environment name**: (leave empty)
5. Click "Add trusted publisher"

## Step 2: Verify Configuration

The workflow has been updated with:

- ✅ `id-token: write` permission
- ✅ npm CLI update to latest version (11.5.1+)
- ✅ Removed manual token handling
- ✅ OIDC authentication will work automatically

## Step 3: Test Publishing

Once trusted publishers are configured on npmjs.com:

1. Create and push a version tag:

   ```bash
   git tag v0.16.4
   git push origin v0.16.4
   ```

2. The GitHub Actions release workflow will:
   - Update package.json version
   - Create git tag
   - Publish to npm using OIDC
   - Create GitHub release

## Step 4: Optional Security Enhancement

After confirming OIDC works, you can restrict token-based publishing:

1. Go to package settings on npmjs.com
2. Navigate to "Publishing access"
3. Select "Require two-factor authentication and disallow tokens"
4. Save changes

## Troubleshooting

If publishing fails:

1. Verify workflow filename matches exactly (`release.yml`)
2. Ensure repository name is correct (`codeflow`)
3. Check that npm CLI is version 11.5.1+
4. Confirm `id-token: write` permission is set

The OIDC token exchange happens automatically during `npm publish` - no manual token management needed.

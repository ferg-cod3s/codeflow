# NPM Trusted Publishers Alignment

This document outlines the changes required to align `.github/workflows/publish.yml` with npm's [Trusted Publishers](https://docs.npmjs.com/trusted-publishers) requirements.

## Current State Analysis

The current `publish.yml` workflow is **partially compliant** with npm Trusted Publishers but uses a hybrid approach that still relies on `NPM_TOKEN`.

### What's Already Correct

| Requirement | Status | Notes |
|------------|--------|-------|
| `id-token: write` permission | ✅ | Line 9 |
| `actions/checkout@v4` | ✅ | Line 18 |
| `actions/setup-node@v4` | ✅ | Line 22-27 |
| `registry-url` configured | ✅ | Line 26 |
| `--provenance` flag | ✅ | Line 45 |
| Tag-based triggers | ✅ | Lines 4-6 |

### Issues to Address

| Issue | Current | Required |
|-------|---------|----------|
| npm version | `npm install -g npm@latest` | Must be npm **11.5.1+** |
| Authentication | Uses `NODE_AUTH_TOKEN` from secret | Should use OIDC (no token needed) |
| Permissions | Has `contents: write`, `packages: write` | Only `id-token: write` and `contents: read` needed for publishing |
| Provenance | Explicit `--provenance` flag | Automatic with trusted publishing |

---

## Required Changes

### 1. Remove NODE_AUTH_TOKEN from Publish Step

**Current (lines 44-47):**
```yaml
- name: Publish to NPM
  run: npm publish --access public --provenance
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Required:**
```yaml
- name: Publish to NPM
  run: npm publish --access public
```

**Why:** With trusted publishing, OIDC handles authentication automatically. The `--provenance` flag is also no longer needed as provenance is generated automatically when using OIDC.

### 2. Update npm Version Comment

**Current (lines 29-30):**
```yaml
- name: Install npm
  run: npm install -g npm@latest
```

**Required:**
```yaml
- name: Ensure npm 11.5.1+ for trusted publishing
  run: npm install -g npm@latest
```

**Why:** npm 11.5.1 or later is **required** for trusted publishing. Adding a clear comment documents this requirement.

### 3. Reduce Permissions (Optional but Recommended)

**Current (lines 8-11):**
```yaml
permissions:
  id-token: write  # IMPORTANT: this is required for OIDC
  contents: write  # Required for creating releases
  packages: write  # Required if publishing to GitHub Packages
```

**Required for pure trusted publishing:**
```yaml
permissions:
  id-token: write   # Required for OIDC trusted publishing
  contents: read    # Sufficient for checkout (use 'write' only if creating releases)
```

**Note:** Keep `contents: write` if you need to create GitHub releases (which this workflow does).

### 4. Remove NODE_AUTH_TOKEN from Verify Step

**Current (lines 88-94):**
```yaml
- name: Verify package installation
  run: |
    npm install -g @agentic-codeflow/cli@${{ github.ref_name }}
    codeflow --version
    codeflow --help
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Required:**
```yaml
- name: Verify package installation
  run: |
    npm install -g @agentic-codeflow/cli@${{ github.ref_name }}
    codeflow --version
    codeflow --help
```

**Why:** Installing public packages doesn't require authentication. The `NODE_AUTH_TOKEN` is unnecessary here.

---

## npmjs.com Configuration Required

**Critical:** Before the workflow changes will work, you must configure the trusted publisher on npmjs.com:

1. Navigate to: `https://www.npmjs.com/package/@agentic-codeflow/cli/access`
2. Find the **"Trusted Publisher"** section
3. Click **"GitHub Actions"**
4. Configure:

| Field | Value |
|-------|-------|
| Organization or user | `ferg-cod3s` (or your GitHub org/username) |
| Repository | `codeflow` |
| Workflow filename | `publish.yml` |
| Environment name | *(leave blank unless using GitHub environments)* |

---

## Recommended: Restrict Token Access After Migration

After verifying trusted publishing works:

1. Go to package Settings → **Publishing access**
2. Select **"Require two-factor authentication and disallow tokens"**
3. **Revoke** any existing automation tokens that are no longer needed

---

## Updated Workflow

Here's the complete updated `publish.yml`:

```yaml
name: Publish to NPM

on:
  push:
    tags:
      - 'v*'

permissions:
  id-token: write   # Required for OIDC trusted publishing
  contents: write   # Required for creating releases

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      # npm 11.5.1+ is required for trusted publishing
      - name: Ensure npm 11.5.1+ for trusted publishing
        run: npm install -g npm@latest

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Type check
        run: npm run typecheck

      - name: Build CLI
        run: npm run build:cli

      # No NODE_AUTH_TOKEN needed - OIDC handles authentication
      # Provenance is automatically generated with trusted publishing
      - name: Publish to NPM
        run: npm publish --access public

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ github.ref_name }}
          name: Release ${{ github.ref_name }}
          body: |
            ## Changes in ${{ github.ref_name }}
            
            This release was automatically created when the tag was pushed.
            
            ### Installation
            ```bash
            npm install -g @agentic-codeflow/cli
            ```
            
            ### Verification
            This package is published with provenance via npm Trusted Publishers.
          draft: false
          prerelease: false
          generate_release_notes: true
          files: |
            dist/**
            plugins/**
            README.md
            LICENSE
            PLUGIN_ECOSYSTEM.md
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  verify-publish:
    runs-on: ubuntu-latest
    needs: publish
    steps:
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      # No authentication needed for installing public packages
      - name: Verify package installation
        run: |
          npm install -g @agentic-codeflow/cli@${{ github.ref_name }}
          codeflow --version
          codeflow --help
```

---

## Migration Checklist

- [ ] **Step 1:** Configure trusted publisher on npmjs.com (see section above)
- [ ] **Step 2:** Update `publish.yml` with changes above
- [ ] **Step 3:** Create a test release to verify OIDC works
- [ ] **Step 4:** After successful publish, restrict token access on npmjs.com
- [ ] **Step 5:** Revoke the old `NPM_TOKEN` from GitHub Secrets
- [ ] **Step 6:** Update `docs/NPM_OIDC_SETUP.md` to reflect trusted publishers

---

## Key Differences: Current vs. Trusted Publishers

| Aspect | Current Approach | Trusted Publishers |
|--------|------------------|-------------------|
| Authentication | Long-lived `NPM_TOKEN` secret | Short-lived OIDC tokens |
| Token management | Manual creation/rotation | Automatic, per-publish |
| Security risk | Token can be leaked/compromised | Tokens cannot be extracted |
| Provenance | Explicit `--provenance` flag | Automatic |
| npm version | Any recent version | **11.5.1+ required** |
| Setup complexity | Add secret to GitHub | Configure on npmjs.com |

---

## Troubleshooting

### "Unable to authenticate" error
- Verify workflow filename matches exactly (case-sensitive, include `.yml`)
- Ensure using GitHub-hosted runners (self-hosted not supported)
- Check `id-token: write` permission is set

### Provenance not generated
- Only works for public repositories
- Only works for public packages
- Private repos cannot generate provenance

### Workflow filename mismatch
- npm does **not** validate configuration when saving
- Double-check: `publish.yml` (not `publish.yaml`, not `Publish.yml`)

---

## References

- [npm Trusted Publishers Documentation](https://docs.npmjs.com/trusted-publishers)
- [npm Provenance Documentation](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub Actions OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [OpenSSF Trusted Publishers Specification](https://repos.openssf.org/trusted-publishers-for-all-package-repositories)

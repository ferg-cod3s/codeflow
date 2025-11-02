# Auto Releases

CodeFlow now supports automatic releases when you push version tags to the repository.

## How it works

1. **Automatic Trigger**: When you push a tag that matches the pattern `v*` (e.g., `v1.0.0`, `v0.16.4`), the release workflow will automatically trigger.

2. **What happens automatically**:
   - Extracts the version from the tag (removes the `v` prefix)
   - Runs type checking and tests
   - Publishes the package to npm
   - Creates a GitHub release with auto-generated release notes

3. **Manual releases**: You can still trigger releases manually using the "Release" workflow in GitHub Actions, specifying the version manually.

## Creating a release

### Option 1: Using the release script (Recommended)

```bash
# Bump patch version and create tag
./scripts/release.sh --bump-patch

# Bump minor version and create tag
./scripts/release.sh --bump-minor

# Bump major version and create tag
./scripts/release.sh --bump-major

# Just create a tag for current version
./scripts/release.sh
```

### Option 2: Manual tag creation

```bash
# Make sure your package.json has the correct version
# Then create and push a tag

git tag v1.0.0
git push origin v1.0.0
```

## Requirements

- **NPM_TOKEN**: Must be configured in GitHub repository secrets for npm publishing
- **GITHUB_TOKEN**: Automatically provided by GitHub Actions for creating releases

## Workflow permissions

The release workflow requires:

- `contents: write` - to create GitHub releases
- `packages: write` - to publish to npm registry

## Release notes

The workflow automatically generates release notes using GitHub's `generate_release_notes` feature, which includes:

- Commits since the last release
- Pull requests merged
- Contributors

The release description also includes:

- Installation instructions
- Quick start guide
- Link to full changelog

## Testing

Before creating a release tag, you can test the workflow:

1. Go to the "Actions" tab in GitHub
2. Select "Release" workflow
3. Click "Run workflow"
4. Enter a test version (this won't create a tag or GitHub release, but will test the publishing process)

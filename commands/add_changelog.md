---
name: add_changelog
mode: command
description: Generate and maintain project changelog following Keep a Changelog format
version: 1.0.0
last_updated: 2025-10-29
command_schema_version: 1.0
inputs:
  - name: format
    type: string
    required: false
    default: "keepachangelog"
    description: Changelog format (keepachangelog, conventional)
  - name: version
    type: string
    required: false
    description: Version number to add (defaults to unreleased)
outputs:
  - name: changelog_file
    type: file
    format: CHANGELOG.md
    description: Updated or created changelog file
cache_strategy:
  type: agent_specific
  ttl: 0
  invalidation: content_based
  scope: command
success_signals:
  - 'Changelog created successfully'
  - 'Changelog updated with new entries'
  - 'Version section added'
failure_modes:
  - 'No git history available'
  - 'Invalid version format'
  - 'Conflicting changelog entries'
---

# Add/Update Changelog

**Input**: $ARGUMENTS (optional: format, version)

Generate and maintain a project changelog following the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format, with support for [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Purpose

Create or update a CHANGELOG.md file that tracks all notable changes to the project in a human-readable format, organized by version and change type.

## Inputs

- **format** (optional): Changelog format to use
  - `keepachangelog` (default): Keep a Changelog format
  - `conventional`: Generated from conventional commits

- **version** (optional): Version number to add
  - Format: `X.Y.Z` (semantic versioning)
  - If omitted, creates/updates "Unreleased" section

## Changelog Structure

### Keep a Changelog Format

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New features added but not yet released

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Now removed features

### Fixed
- Bug fixes

### Security
- Security vulnerability fixes

## [1.0.0] - 2025-10-29

### Added
- Initial release
- Feature X implementation
- Feature Y implementation

### Fixed
- Bug #123: Description of bug fix

[Unreleased]: https://github.com/user/repo/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/user/repo/releases/tag/v1.0.0
```

## Workflow

### 1. Check for Existing Changelog

```bash
if [ -f CHANGELOG.md ]; then
  echo "Changelog exists, will update"
else
  echo "Creating new changelog"
fi
```

### 2. Analyze Git History

```bash
# Get commits since last release
git log --pretty=format:"%h %s" $(git describe --tags --abbrev=0)..HEAD

# Or all commits if no tags
git log --pretty=format:"%h %s"
```

### 3. Categorize Changes

Parse commit messages for conventional commit prefixes:
- `feat:` → **Added**
- `fix:` → **Fixed**
- `docs:` → **Documentation** (or Changed)
- `style:` → **Changed**
- `refactor:` → **Changed**
- `perf:` → **Changed** (performance improvements)
- `test:` → **Testing** (usually not in changelog)
- `chore:` → **Maintenance** (usually not in changelog)
- `security:` → **Security**
- `BREAKING CHANGE:` → **Changed** (with notice)

### 4. Generate or Update Changelog

**For New Changelog:**
1. Create CHANGELOG.md with standard header
2. Add Unreleased section with categories
3. Add version sections from git history
4. Add comparison links at bottom

**For Existing Changelog:**
1. Read current CHANGELOG.md
2. Update Unreleased section with new entries
3. If version provided, convert Unreleased to versioned section
4. Maintain chronological order (newest first)
5. Update comparison links

### 5. Format Entries

Each entry should be:
- Clear and concise
- User-facing (not implementation details)
- Actionable (what changed, not how)
- Linked to issues/PRs when relevant

Example:
```markdown
### Added
- User authentication via OAuth2 (#123)
- Dark mode support for all pages (#145)
- Export functionality for reports (#167)

### Fixed
- Navigation menu not closing on mobile (#142)
- Database connection timeout in production (#158)
```

## Automation Options

### Using conventional-changelog-cli

```bash
npm install -g conventional-changelog-cli

# Generate/update changelog
conventional-changelog -p angular -i CHANGELOG.md -s

# For specific version
conventional-changelog -p angular -i CHANGELOG.md -s -r 2
```

### Using auto-changelog

```bash
npm install -g auto-changelog

# Generate changelog
auto-changelog

# With options
auto-changelog --latest-version 2.0.0 --commit-limit 10
```

### Using Standard Version

```bash
npm install -g standard-version

# Bump version and update changelog
standard-version

# Dry run
standard-version --dry-run
```

## Release Integration

### Pre-Release Checklist

1. **Review Unreleased Section**: Ensure all changes are documented
2. **Categorize Properly**: Move entries to correct sections
3. **Add Version Header**: Convert Unreleased to version number
4. **Add Date**: Use format YYYY-MM-DD
5. **Update Links**: Add version comparison link
6. **Commit Changelog**: `git commit -m "chore: update changelog for v1.0.0"`

### Version Bump Process

```bash
# 1. Update changelog
# (This command does it)

# 2. Update version in package.json (or equivalent)
npm version patch|minor|major

# 3. Create git tag
git tag -a v1.0.0 -m "Release v1.0.0"

# 4. Push changes and tags
git push && git push --tags

# 5. Create GitHub release
gh release create v1.0.0 --notes-file CHANGELOG.md
```

## Best Practices

### Writing Guidelines

1. **Focus on User Impact**: What changed from user perspective
2. **Be Specific**: Include details and context
3. **Group Related Changes**: Keep similar changes together
4. **Link Issues**: Reference GitHub issues/PRs
5. **Breaking Changes**: Clearly mark with BREAKING CHANGE prefix
6. **Migration Guides**: Link to upgrade docs for breaking changes

### Maintenance

1. **Update Regularly**: Don't let changelog get stale
2. **Review Before Release**: Ensure accuracy and completeness
3. **Keep Consistent Format**: Follow established patterns
4. **Preserve History**: Don't delete old versions
5. **Comparison Links**: Always include version comparison URLs

### Commit Message Standards

Encourage team to use conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: feat, fix, docs, style, refactor, perf, test, chore, security

Example:
```
feat(auth): add OAuth2 authentication

Implements OAuth2 authentication flow with Google provider.
Includes login, callback, and token refresh mechanisms.

Closes #123
BREAKING CHANGE: Old session-based auth removed
```

## Output

The command will:

1. **Create or Update** CHANGELOG.md in project root
2. **Categorize Changes** from git history
3. **Format Entries** according to Keep a Changelog
4. **Add Version Section** if version provided
5. **Update Links** for version comparisons
6. **Validate Format** and structure

## Example Output

```markdown
# Changelog

## [Unreleased]

### Added
- New feature X from commit abc123
- New feature Y from commit def456

### Fixed
- Bug fix for issue #789

## [1.0.0] - 2025-10-29

### Added
- Initial release
- Core functionality

[Unreleased]: https://github.com/user/repo/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/user/repo/releases/tag/v1.0.0
```

## Notes

- Requires git repository with commit history
- Works best with conventional commit messages
- Can be automated in CI/CD pipeline
- Should be reviewed before releases
- Follows semantic versioning principles

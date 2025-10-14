#!/bin/bash
# Codeflow Directory Setup Script
# Creates standard directory structure for Codeflow projects

set -e

PROJECT_DIR="${1:-.}"
VERBOSE="${VERBOSE:-0}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}✅${NC} $1"
}

info() {
    echo -e "${BLUE}ℹ️${NC}  $1"
}

warn() {
    echo -e "${YELLOW}⚠️${NC}  $1"
}

echo ""
echo "🚀 Setting up Codeflow directories in: $PROJECT_DIR"
echo ""

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    warn "Directory $PROJECT_DIR does not exist. Creating it..."
    mkdir -p "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# Create output directories
mkdir -p "docs/research"
mkdir -p "docs/plans"
mkdir -p "docs/architecture"

# Create input directories
mkdir -p "docs/tickets"
mkdir -p "thoughts"

# Create .gitkeep files to preserve directories in git
touch "docs/research/.gitkeep"
touch "docs/plans/.gitkeep"
touch "docs/tickets/.gitkeep"
touch "thoughts/.gitkeep"

log "Created directory structure:"
echo "   📁 docs/research      (output: research findings)"
echo "   📁 docs/plans         (output: implementation plans)"
echo "   📁 docs/architecture  (optional: architecture docs)"
echo "   📁 docs/tickets       (input: feature tickets)"
echo "   📁 thoughts           (input: knowledge base)"

# Create README in thoughts/ directory if it doesn't exist
if [ ! -f "thoughts/README.md" ]; then
cat > "thoughts/README.md" << 'README'
# Knowledge Base (Thoughts)

This directory stores project knowledge, decisions, and documentation that the `/research` command can reference.

## Structure

Organize your files however makes sense for your project. Common patterns:

```
thoughts/
├── architecture/           # Architecture decisions
├── decisions/              # Technical decisions (ADRs)
├── research/              # Background research
├── meetings/              # Meeting notes
└── YYYY-MM-DD-topic.md   # Dated entries
```

## Usage

When you run `/research`, it will search through this directory to find relevant information to help answer your questions.

## Tips

- Use descriptive filenames with dates: `2025-10-13-authentication-approach.md`
- Tag your documents in frontmatter for better searchability
- Keep historical context - don't delete old decisions
- Link related documents together
README

log "Created thoughts/README.md with usage guide"
fi

# Create a sample .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
cat > ".gitignore" << 'GITIGNORE'
# Codeflow
.codeflow/cache/
.codeflow/*.log

# Generated artifacts (optional - uncomment if you don't want to version these)
# docs/research/
# docs/plans/

# IDE
.vscode/
.idea/
*.swp
*.swo

# Dependencies
node_modules/
.DS_Store
GITIGNORE

log "Created .gitignore with Codeflow defaults"
else
    info ".gitignore already exists, skipping"
fi

# Optionally create example files
if [ "$VERBOSE" = "1" ] || [ "${CREATE_EXAMPLES:-0}" = "1" ]; then
    # Create example ticket
    cat > "docs/tickets/example-feature.md" << 'TICKET'
---
title: Example Feature
status: draft
priority: medium
created: 2025-10-13
---

# Example Feature Ticket

## Problem

Describe the problem or opportunity this feature addresses.

## Requirements

- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

## Success Criteria

- Users can do X
- System performs Y
- Metrics show Z

## Notes

Additional context, constraints, or considerations.
TICKET

    # Create example thoughts document
    cat > "thoughts/2025-10-13-example-decision.md" << 'THOUGHT'
---
date: 2025-10-13
type: decision
tags: [example, getting-started]
---

# Example Technical Decision

## Context

Describe the situation that requires a decision.

## Decision

We will do X instead of Y.

## Rationale

- Reason 1
- Reason 2
- Reason 3

## Consequences

### Positive
- Benefit 1
- Benefit 2

### Negative
- Tradeoff 1
- Tradeoff 2

## References

- [Link to related discussion](#)
- [Link to research](#)
THOUGHT

    log "Created example files (ticket and thoughts document)"
fi

echo ""
info "💡 Next steps:"
echo "   1. Add your existing documentation to thoughts/ directory"
echo "   2. Create feature tickets in docs/tickets/"
echo "   3. Run: /research <your first question>"
echo "   4. Check docs/research/ for the generated research document"
echo ""
info "📚 For more configuration options, see:"
echo "   docs/CONFIGURATION_GUIDE.md"
echo "   docs/examples/config/"
echo ""
log "Setup complete! Happy coding with Codeflow! 🎉"
echo ""

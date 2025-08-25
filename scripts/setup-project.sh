#!/bin/bash

# Agentic Project Setup Script
# This script sets up a project directory to work with agentic workflow MCP integration

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get project directory from argument or use current directory
PROJECT_DIR="${1:-$(pwd)}"

# Convert to absolute path
PROJECT_DIR=$(realpath "$PROJECT_DIR")

print_status "Setting up agentic workflow for project: $PROJECT_DIR"

# Check if we're in a valid directory
if [[ ! -d "$PROJECT_DIR" ]]; then
    print_error "Directory does not exist: $PROJECT_DIR"
    exit 1
fi

# Check if agentic CLI is available
if ! command -v agentic >/dev/null 2>&1; then
    print_error "agentic CLI not found. Please install it first:"
    echo "  cd /path/to/agentic"
    echo "  bun install"
    echo "  bun run install"
    exit 1
fi

# Create .opencode directory structure
print_status "Creating .opencode directory structure..."
mkdir -p "$PROJECT_DIR/.opencode/command"
mkdir -p "$PROJECT_DIR/.opencode/agent"

# Create .claude directory structure for Claude Code compatibility
print_status "Creating .claude directory structure..."
mkdir -p "$PROJECT_DIR/.claude/commands"

# Pull agentic commands and agents
print_status "Installing agentic commands and agents..."
cd "$PROJECT_DIR"
agentic pull .

# Check if pull was successful
if [[ $? -eq 0 ]]; then
    print_success "Successfully installed agentic workflow files"
else
    print_error "Failed to install agentic files"
    exit 1
fi

# Create a simple .gitignore if it doesn't exist
if [[ ! -f "$PROJECT_DIR/.gitignore" ]]; then
    print_status "Creating .gitignore file..."
    cat > "$PROJECT_DIR/.gitignore" << EOF
# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build outputs
dist/
build/
*.log

# Keep agentic workflow files
!.opencode/
!.claude/
EOF
    print_success "Created .gitignore file"
else
    print_warning ".gitignore already exists, skipping creation"
fi

# Create README section for agentic workflow
README_SECTION="
## Agentic Workflow Integration

This project is set up to work with the Agentic Workflow system for AI-assisted development.

### Available Commands

- \`research\` - Comprehensive codebase and documentation analysis
- \`plan\` - Create detailed implementation plans
- \`execute\` - Implement plans with verification
- \`test\` - Generate comprehensive test suites
- \`document\` - Create user guides and API documentation
- \`commit\` - Create structured git commits
- \`review\` - Validate implementations against plans

### MCP Integration

To use with Claude Desktop:

1. Configure Claude Desktop MCP settings:
   \`\`\`json
   {
     \"mcpServers\": {
       \"agentic-tools\": {
         \"command\": \"bun\",
         \"args\": [\"run\", \"/path/to/agentic/mcp/agentic-server.mjs\"]
       }
     }
   }
   \`\`\`

2. Start working from this project directory
3. Commands will automatically use project-specific configurations

### Usage Example

\`\`\`
Use tool: research
Input: \"Analyze the current authentication system and find areas for improvement\"
\`\`\`

For more information, see the [Agentic Workflow documentation](https://github.com/your-repo/agentic).
"

# Add to README if it exists, otherwise create one
if [[ -f "$PROJECT_DIR/README.md" ]]; then
    # Check if agentic section already exists
    if grep -q "## Agentic Workflow Integration" "$PROJECT_DIR/README.md"; then
        print_warning "Agentic workflow section already exists in README.md"
    else
        print_status "Adding agentic workflow section to existing README.md..."
        echo "$README_SECTION" >> "$PROJECT_DIR/README.md"
        print_success "Updated README.md with agentic workflow information"
    fi
else
    print_status "Creating README.md with agentic workflow information..."
    cat > "$PROJECT_DIR/README.md" << EOF
# $(basename "$PROJECT_DIR")

$README_SECTION
EOF
    print_success "Created README.md"
fi

# Show summary
echo ""
print_success "Project setup complete!"
echo ""
print_status "Next steps:"
echo "  1. Configure Claude Desktop with MCP settings (see README.md)"
echo "  2. Start MCP server: bun run /path/to/agentic/mcp/agentic-server.mjs"
echo "  3. Navigate to this project directory when working"
echo "  4. Use agentic commands through Claude Desktop or other MCP clients"
echo ""
print_status "Files installed:"
echo "  • $(find "$PROJECT_DIR/.opencode" -name "*.md" | wc -l) files in .opencode/"
echo "  • Commands: research, plan, execute, test, document, commit, review"
echo "  • Agents: $(find "$PROJECT_DIR/.opencode/agent" -name "*.md" | wc -l) specialized workflow agents"
echo ""
print_status "To verify installation:"
echo "  agentic status ."
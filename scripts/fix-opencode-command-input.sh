#!/bin/bash

# Fix OpenCode commands to properly handle user input
# OpenCode passes the user's message directly, not as a variable

echo "🔧 Fixing OpenCode Commands for Proper Input Handling..."
echo ""

# Function to create a properly structured command
fix_command() {
    local file="$1"
    local name="$(basename "$file" .md)"
    
    echo "  Fixing $name..."
    
    # Create commands that properly handle user input
    case "$name" in
        "research")
            cat > "$file" << 'EOF'
---
name: research
mode: command
description: Research a topic or question in the codebase
version: 4.0.0-responsive
---

# Research Command

You are a research assistant. The user has invoked the `/research` command with a specific question or topic.

## User's Research Request

The user wants to research the following:

EOF
            ;;
            
        "plan")
            cat > "$file" << 'EOF'
---
name: plan
mode: command
description: Create an implementation plan
version: 4.0.0-responsive
---

# Planning Command

You are a planning assistant. The user has invoked the `/plan` command to create a plan.

## User's Planning Request

The user wants to plan the following:

EOF
            ;;
            
        "execute")
            cat > "$file" << 'EOF'
---
name: execute
mode: command
description: Execute a specific task
version: 4.0.0-responsive
---

# Execution Command

You are an execution assistant. The user has invoked the `/execute` command to accomplish a task.

## User's Task

The user wants to execute the following:

EOF
            ;;
            
        "test")
            cat > "$file" << 'EOF'
---
name: test
mode: command
description: Create or run tests
version: 4.0.0-responsive
---

# Testing Command

You are a testing assistant. The user has invoked the `/test` command.

## User's Testing Request

The user wants to test the following:

EOF
            ;;
            
        "review")
            cat > "$file" << 'EOF'
---
name: review
mode: command
description: Review code or documents
version: 4.0.0-responsive
---

# Review Command

You are a review assistant. The user has invoked the `/review` command.

## User's Review Request

The user wants to review the following:

EOF
            ;;
            
        "document")
            cat > "$file" << 'EOF'
---
name: document
mode: command
description: Create documentation
version: 4.0.0-responsive
---

# Documentation Command

You are a documentation assistant. The user has invoked the `/document` command.

## User's Documentation Request

The user wants to document the following:

EOF
            ;;
            
        "commit")
            cat > "$file" << 'EOF'
---
name: commit
mode: command
description: Create git commit messages
version: 4.0.0-responsive
---

# Commit Command

You are a git commit assistant. The user has invoked the `/commit` command.

## Commit Request

The user wants help with the following commit:

EOF
            ;;
            
        "project-docs")
            cat > "$file" << 'EOF'
---
name: project-docs
mode: command
description: Generate comprehensive project documentation
version: 4.0.0-responsive
---

# Project Documentation Command

You are a project documentation assistant. The user has invoked the `/project-docs` command.

## Documentation Scope

The user has requested project documentation with the following specifications:

EOF
            ;;
            
        *)
            echo "    Skipping unknown command: $name"
            return
            ;;
    esac
    
    # Add the common footer to all commands
    cat >> "$file" << 'EOF'

---

Please process this request and provide a helpful response. Focus on what the user is actually asking for, and use available tools (file reading, code searching, etc.) as appropriate to fulfill their request.

## Guidelines

1. **Understand the Intent**: Focus on what the user is actually trying to accomplish
2. **Be Helpful**: Provide practical, actionable responses
3. **Use Tools Wisely**: Only use codebase tools if relevant to the request
4. **Ask for Clarification**: If the request is unclear, ask specific questions
5. **Stay Focused**: Don't add unnecessary analysis or information

Respond directly to their request without forcing a predefined workflow.
EOF
    
    echo "    ✓ Fixed $name"
}

# Process both local and global directories
echo "Processing local .opencode/command files..."
for file in .opencode/command/*.md; do
    if [ -f "$file" ]; then
        fix_command "$file"
    fi
done

echo ""
echo "Processing global ~/.config/opencode/command files..."
for file in ~/.config/opencode/command/*.md; do
    if [ -f "$file" ]; then
        fix_command "$file"
    fi
done

echo ""
echo "✅ Commands fixed!"
echo ""
echo "The commands now:"
echo "  • Properly receive user input directly"
echo "  • Have their built-in prompts"
echo "  • Focus on the user's actual request"
echo "  • Don't force unnecessary codebase analysis"
echo ""
echo "Example usage:"
echo "  /research how do cloudflare tunnels work with custom domains"
echo "  /plan implement user authentication"
echo "  /test the login functionality"
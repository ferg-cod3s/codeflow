#!/bin/bash

# Sync Claude commands and agents to all possible global locations
# This ensures Claude Desktop picks up the latest versions regardless of which directory it uses

echo "🔄 Syncing Claude global configurations..."

# Source directory (from Codeflow project)
SOURCE_DIR="/home/f3rg/src/github/codeflow"

# Target directories where Claude might look
CLAUDE_HOME="$HOME/.claude"
CLAUDE_CONFIG="$HOME/.config/claude"

# Function to sync to a target directory
sync_to_directory() {
    local target="$1"
    if [ -d "$target" ]; then
        echo ""
        echo "📦 Syncing to $target..."
        
        # Create directories if they don't exist
        mkdir -p "$target/commands" "$target/agents"
        
        # Copy commands
        if [ -d "$SOURCE_DIR/.claude/commands" ]; then
            cp -r "$SOURCE_DIR/.claude/commands/"* "$target/commands/" 2>/dev/null
            echo "  ✅ Commands synced"
        fi
        
        # Copy agents
        if [ -d "$SOURCE_DIR/.claude/agents" ]; then
            cp -r "$SOURCE_DIR/.claude/agents/"* "$target/agents/" 2>/dev/null
            echo "  ✅ Agents synced"
        fi
    else
        echo "  ⏩ Directory $target does not exist, skipping..."
    fi
}

# Sync to both possible locations
sync_to_directory "$CLAUDE_HOME"
sync_to_directory "$CLAUDE_CONFIG"

# Verify no 'thoughts/' references remain
echo ""
echo "🔍 Verifying all 'thoughts/' references have been replaced with 'docs/'..."

found_thoughts=false
for dir in "$CLAUDE_HOME" "$CLAUDE_CONFIG"; do
    if [ -d "$dir/commands" ]; then
        thoughts_files=$(grep -l "thoughts/" "$dir/commands/"*.md 2>/dev/null)
        if [ -n "$thoughts_files" ]; then
            echo "  ⚠️  Found 'thoughts/' references in $dir/commands"
            echo "       Files: $(echo $thoughts_files | xargs -n1 basename | paste -sd ', ')"
            found_thoughts=true
        fi
    fi
done

if [ "$found_thoughts" = false ]; then
    echo "  ✅ No 'thoughts/' references found - all using 'docs/'"
fi

echo ""
echo "✨ Claude global sync complete!"
echo ""
echo "📝 Note: You may need to restart Claude Desktop for changes to take effect."
#!/bin/bash

# Smart sync script that ensures correct model configurations
# This script syncs agents and commands to global directories while preserving correct model settings

set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Smart Sync with Model Configuration${NC}\n"

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MODEL_CONFIG="$PROJECT_ROOT/config/models.json"

# Check if model config exists
if [ ! -f "$MODEL_CONFIG" ]; then
    echo -e "${RED}❌ Model configuration not found at $MODEL_CONFIG${NC}"
    exit 1
fi

# Extract model configurations using jq (or fallback to python if jq not available)
if command -v jq &> /dev/null; then
    OPENCODE_MODEL=$(jq -r '.opencode.commands' "$MODEL_CONFIG")
    OPENCODE_AGENT_MODEL=$(jq -r '.opencode.agents' "$MODEL_CONFIG")
    CLAUDE_MODEL=$(jq -r '.claude.default' "$MODEL_CONFIG")
else
    # Fallback to Python if jq is not installed
    OPENCODE_MODEL=$(python3 -c "import json; print(json.load(open('$MODEL_CONFIG'))['opencode']['commands'])")
    OPENCODE_AGENT_MODEL=$(python3 -c "import json; print(json.load(open('$MODEL_CONFIG'))['opencode']['agents'])")
    CLAUDE_MODEL=$(python3 -c "import json; print(json.load(open('$MODEL_CONFIG'))['claude']['default'])")
fi

echo -e "${GREEN}📋 Model Configuration:${NC}"
echo "  OpenCode Commands: $OPENCODE_MODEL"
echo "  OpenCode Agents:   $OPENCODE_AGENT_MODEL"
echo "  Claude Default:    $CLAUDE_MODEL"
echo ""

# Function to fix model in a file
fix_model_in_file() {
    local file="$1"
    local model="$2"
    local type="$3"
    
    if [ -f "$file" ]; then
        # Check current model
        current_model=$(grep "^model:" "$file" | head -1 | sed 's/^model: *//')
        
        if [ "$current_model" != "$model" ]; then
            # Update model configuration
            sed -i "s|^model:.*|model: $model|" "$file"
            echo -e "  ${YELLOW}✎${NC} Fixed model in $(basename "$file"): $current_model → $model"
            return 0
        else
            return 1
        fi
    fi
    return 1
}

# Function to sync directory with model fixes
sync_directory() {
    local source_dir="$1"
    local target_dir="$2"
    local model="$3"
    local type="$4"
    
    echo -e "\n${BLUE}Syncing $type to $target_dir...${NC}"
    
    # Create target directory if it doesn't exist
    mkdir -p "$target_dir"
    
    local fixed_count=0
    local total_count=0
    
    # Copy and fix files
    for file in "$source_dir"/*.md; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            target_file="$target_dir/$filename"
            
            # Copy file
            cp "$file" "$target_file"
            total_count=$((total_count + 1))
            
            # Fix model if needed
            if fix_model_in_file "$target_file" "$model" "$type"; then
                fixed_count=$((fixed_count + 1))
            fi
        fi
    done
    
    echo -e "${GREEN}✓ Synced $total_count files, fixed $fixed_count model configurations${NC}"
}

# Sync to Claude Code directory (~/.claude/)
if [ -d "$HOME/.claude" ]; then
    echo -e "\n${BLUE}=== Syncing to Claude Code (~/.claude) ===${NC}"
    
    # Commands use claude model format (without provider prefix)
    sync_directory "$PROJECT_ROOT/.claude/commands" "$HOME/.claude/commands" "$CLAUDE_MODEL" "commands"
    sync_directory "$PROJECT_ROOT/.claude/agents" "$HOME/.claude/agents" "$CLAUDE_MODEL" "agents"
else
    echo -e "${YELLOW}⚠ Claude Code directory not found at ~/.claude${NC}"
fi

# Sync to OpenCode directory (~/.config/opencode/)
if [ -d "$HOME/.config/opencode" ]; then
    echo -e "\n${BLUE}=== Syncing to OpenCode (~/.config/opencode) ===${NC}"
    
    # Commands and agents use full provider/model format
    sync_directory "$PROJECT_ROOT/.opencode/command" "$HOME/.config/opencode/command" "$OPENCODE_MODEL" "commands"
    sync_directory "$PROJECT_ROOT/.opencode/agent" "$HOME/.config/opencode/agent" "$OPENCODE_AGENT_MODEL" "agents"
else
    echo -e "${YELLOW}⚠ OpenCode directory not found at ~/.config/opencode${NC}"
fi

# Also sync local OpenCode files to ensure consistency
echo -e "\n${BLUE}=== Fixing Local OpenCode Files ===${NC}"

fixed_count=0
# Fix local command files
for file in "$PROJECT_ROOT"/.opencode/command/*.md; do
    if fix_model_in_file "$file" "$OPENCODE_MODEL" "command"; then
        fixed_count=$((fixed_count + 1))
    fi
done

# Fix local agent files  
for file in "$PROJECT_ROOT"/.opencode/agent/*.md; do
    if fix_model_in_file "$file" "$OPENCODE_AGENT_MODEL" "agent"; then
        fixed_count=$((fixed_count + 1))
    fi
done

if [ $fixed_count -gt 0 ]; then
    echo -e "${GREEN}✓ Fixed $fixed_count local files${NC}"
else
    echo -e "${GREEN}✓ All local files already have correct models${NC}"
fi

# Verification
echo -e "\n${BLUE}=== Verification ===${NC}"

# Check for any incorrect models
echo "Checking for any remaining incorrect models..."

incorrect_found=false

# Check local files
if grep -r "^model: claude-3-5-sonnet-20241022$" "$PROJECT_ROOT/.opencode/" 2>/dev/null | grep -q .; then
    echo -e "${RED}❌ Found files with incorrect model format in .opencode/${NC}"
    incorrect_found=true
fi

# Check global OpenCode
if [ -d "$HOME/.config/opencode" ]; then
    if grep -r "^model: claude-3-5-sonnet-20241022$" "$HOME/.config/opencode/" 2>/dev/null | grep -q .; then
        echo -e "${RED}❌ Found files with incorrect model format in ~/.config/opencode/${NC}"
        incorrect_found=true
    fi
fi

if [ "$incorrect_found" = false ]; then
    echo -e "${GREEN}✅ All model configurations are correct!${NC}"
fi

echo -e "\n${GREEN}🎉 Sync complete!${NC}"
echo -e "${BLUE}You can now use OpenCode commands without model errors.${NC}"
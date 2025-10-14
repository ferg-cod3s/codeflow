#!/bin/bash

# Smart sync script that ensures correct model configurations
#
# New behavior (non-destructive by default):
# - Do NOT force-overwrite existing `model:` lines in agent/command files.
# - If a config model is empty, leave existing `model:` lines untouched
#   (optionally remove them with --strip-when-empty).
# - If a config model is set and valid, insert a `model:` line ONLY when missing
#   within the YAML frontmatter.
# - Validate model values before applying (provider/model format for OpenCode).
#
# Notes:
# - This script operates on YAML frontmatter blocks delimited by '---'.
# - For OpenCode files, models must be in the form "provider/model" and the
#   pair must exist in config/providers.<provider>.models[].
# - For Claude Code files, we only check non-empty value (the platform resolves
#   aliases like "sonnet").

set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Smart Sync with Model Configuration${NC}\n"

# ----------------------------------------------------------------------------
# Flags / Arguments
# ----------------------------------------------------------------------------

STRIP_WHEN_EMPTY=false

for arg in "$@"; do
  case "$arg" in
    --strip-when-empty)
      STRIP_WHEN_EMPTY=true
      shift
      ;;
    *)
      ;;
  esac
done

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

# ----------------------------------------------------------------------------
# Helpers for YAML frontmatter and validation
# ----------------------------------------------------------------------------

# Detect if file has YAML frontmatter
has_yaml_frontmatter() {
  local file="$1"
  awk 'NR==1 && $0 ~ /^---[ \t]*$/ {print "yes"; exit 0} END{exit 0}' "$file" | grep -q "yes"
}

# Detect if frontmatter already contains a model line
has_model_in_frontmatter() {
  local file="$1"
  awk '
    BEGIN{in_yaml=0; found=0}
    NR==1 && $0 ~ /^---[ \t]*$/ {in_yaml=1; next}
    in_yaml && $0 ~ /^---[ \t]*$/ {in_yaml=0;}
    in_yaml && $0 ~ /^model:[ \t]*/ {found=1; exit}
    END{if(found) exit 0; else exit 1}
  ' "$file"
}

# Insert model into YAML frontmatter if missing
insert_model_into_frontmatter() {
  local file="$1"; shift
  local model="$1"
  local tmp_file
  tmp_file="${file}.tmp.$$"
  awk -v MODEL_VAL="$model" '
    BEGIN{in_yaml=0; inserted=0}
    NR==1 && $0 ~ /^---[ \t]*$/ {in_yaml=1; print $0; next}
    {
      if(in_yaml && $0 ~ /^model:[ \t]*/){ inserted=1 }
      if(in_yaml && $0 ~ /^---[ \t]*$/){
        if(!inserted){ print "model: " MODEL_VAL }
        in_yaml=0
        print $0
        next
      }
      print $0
    }
  ' "$file" > "$tmp_file" && mv "$tmp_file" "$file"
}

# Remove model lines from YAML frontmatter (used when config is empty and stripping requested)
strip_model_from_frontmatter() {
  local file="$1"
  local tmp_file
  tmp_file="${file}.tmp.$$"
  awk '
    BEGIN{in_yaml=0}
    NR==1 && $0 ~ /^---[ \t]*$/ {in_yaml=1}
    {
      if(in_yaml && $0 ~ /^---[ \t]*$/ && NR!=1){ in_yaml=0 }
      if(in_yaml && $0 ~ /^model:[ \t]*/){ next }
      print $0
    }
  ' "$file" > "$tmp_file" && mv "$tmp_file" "$file"
}

# Validate OpenCode provider/model exists in config providers
is_valid_opencode_model() {
  local provider_model="$1"
  # must be provider/model
  if [[ -z "$provider_model" || "$provider_model" != */* ]]; then
    return 1
  fi
  local provider="${provider_model%%/*}"
  local model="${provider_model#*/}"
  if command -v jq &> /dev/null; then
    local jq_expr=".providers[\"$provider\"].active as $a | ($a // false) and (.providers[\"$provider\"].models // []) | index(\"$model\")"
    local idx
    idx=$(jq -r "$jq_expr" "$MODEL_CONFIG" 2>/dev/null)
    # jq index returns null when not found; numeric otherwise
    if [ "$idx" = "null" ] || [ -z "$idx" ]; then
      return 1
    fi
    return 0
  else
    # Python fallback
    python3 - "$MODEL_CONFIG" "$provider" "$model" << 'PY' || exit 1
import json, sys
cfg_path, provider, model = sys.argv[1:4]
cfg = json.load(open(cfg_path))
p = cfg.get('providers', {}).get(provider)
if not p or not p.get('active', False) or model not in (p.get('models') or []):
    sys.exit(1)
sys.exit(0)
PY
    return $?
  fi
}

# Manage model line in a file according to rules
# Args: file, desired_model, platform(opencode|claude), label(type string for logs)
manage_model_in_file() {
  local file="$1"; shift
  local desired_model="$1"; shift
  local platform="$1"; shift
  local label="$1"

  [ -f "$file" ] || return 1

  if ! has_yaml_frontmatter "$file"; then
    # No frontmatter → do nothing
    return 1
  fi

  if [ -z "$desired_model" ]; then
    if [ "$STRIP_WHEN_EMPTY" = true ]; then
      if has_model_in_frontmatter "$file"; then
        strip_model_from_frontmatter "$file"
        echo -e "  ${YELLOW}✎${NC} Removed model from $(basename "$file") (config empty, strip enabled)"
        return 0
      fi
    fi
    # Empty config and no strip → leave as-is
    return 1
  fi

  # Validate model based on platform
  if [ "$platform" = "opencode" ]; then
    if ! is_valid_opencode_model "$desired_model"; then
      echo -e "  ${YELLOW}⚠${NC} Skipping $(basename "$file"): invalid OpenCode model '$desired_model'"
      return 1
    fi
  else
    # Claude: require non-empty only
    if [ -z "$desired_model" ]; then
      echo -e "  ${YELLOW}⚠${NC} Skipping $(basename "$file"): empty Claude model"
      return 1
    fi
  fi

  # Insert only when missing; never overwrite existing
  if has_model_in_frontmatter "$file"; then
    echo -e "  ${BLUE}ℹ${NC} Model already present in $(basename "$file"); leaving unchanged"
    return 1
  fi

  insert_model_into_frontmatter "$file" "$desired_model"
  echo -e "  ${GREEN}＋${NC} Inserted model in $(basename "$file"): $desired_model"
  return 0
}

# Function to sync directory with model fixes
sync_directory() {
    local source_dir="$1"
    local target_dir="$2"
    local model="$3"
    local type="$4"
    local platform="$5" # opencode | claude
    
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
            
            # Manage model line according to rules
            if manage_model_in_file "$target_file" "$model" "$platform" "$type"; then
                fixed_count=$((fixed_count + 1))
            fi
        fi
    done
    
    echo -e "${GREEN}✓ Synced $total_count files, adjusted $fixed_count model configurations${NC}"
}

# Sync to Claude Code directory (~/.claude/)
if [ -d "$HOME/.claude" ]; then
    echo -e "\n${BLUE}=== Syncing to Claude Code (~/.claude) ===${NC}"
    
    # Commands use claude model format (without provider prefix)
    sync_directory "$PROJECT_ROOT/.claude/commands" "$HOME/.claude/commands" "$CLAUDE_MODEL" "commands" "claude"
    sync_directory "$PROJECT_ROOT/.claude/agents" "$HOME/.claude/agents" "$CLAUDE_MODEL" "agents" "claude"
else
    echo -e "${YELLOW}⚠ Claude Code directory not found at ~/.claude${NC}"
fi

# Sync to OpenCode directory (~/.config/opencode/)
if [ -d "$HOME/.config/opencode" ]; then
    echo -e "\n${BLUE}=== Syncing to OpenCode (~/.config/opencode) ===${NC}"
    
    # Commands and agents use full provider/model format
    sync_directory "$PROJECT_ROOT/.opencode/command" "$HOME/.config/opencode/command" "$OPENCODE_MODEL" "commands" "opencode"
    sync_directory "$PROJECT_ROOT/.opencode/agent" "$HOME/.config/opencode/agent" "$OPENCODE_AGENT_MODEL" "agents" "opencode"
else
    echo -e "${YELLOW}⚠ OpenCode directory not found at ~/.config/opencode${NC}"
fi

# Also sync local OpenCode files to ensure consistency
echo -e "\n${BLUE}=== Adjusting Local OpenCode Files (non-destructive) ===${NC}"

fixed_count=0
# Commands: insert/strip based on config and flags
for file in "$PROJECT_ROOT"/.opencode/command/*.md; do
    if manage_model_in_file "$file" "$OPENCODE_MODEL" "opencode" "command"; then
        fixed_count=$((fixed_count + 1))
    fi
done

# Agents: insert/strip based on config and flags
for file in "$PROJECT_ROOT"/.opencode/agent/*.md; do
    if manage_model_in_file "$file" "$OPENCODE_AGENT_MODEL" "opencode" "agent"; then
        fixed_count=$((fixed_count + 1))
    fi
done

if [ $fixed_count -gt 0 ]; then
    echo -e "${GREEN}✓ Fixed $fixed_count local files${NC}"
else
    echo -e "${GREEN}✓ All local files already have correct models${NC}"
fi

# Final status
echo -e "\n${GREEN}🎉 Sync complete!${NC}"
if [ "$STRIP_WHEN_EMPTY" = true ]; then
  echo -e "${BLUE}Mode:${NC} strip-when-empty is ON (existing models removed only when config empty)"
else
  echo -e "${BLUE}Mode:${NC} non-destructive (existing models preserved; inserted only when missing)"
fi

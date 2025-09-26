#!/bin/bash

# Batch fix for agent validation issues
# Fixes: temperature: undefined -> temperature: 0.3
#        mode: undefined -> mode: subagent
#        model: undefined -> model: opencode/grok-code
#        tools: undefined -> (remove line)

echo "🔧 Fixing agent validation issues..."

# Fix in base agents
echo "📁 Fixing base agents..."
find /Users/johnferguson/Github/codeflow/agent/ -name "*.md" -not -path "*/opencode/*" | while read file; do
    if [[ -f "$file" ]]; then
        # Create backup
        cp "$file" "$file.bak"
        
        # Apply fixes
        sed -i '' \
            -e 's/^temperature: undefined$/temperature: 0.3/' \
            -e 's/^mode: undefined$/mode: subagent/' \
            -e 's/^model: undefined$/model: opencode\/grok-code/' \
            -e '/^tools: undefined$/d' \
            "$file"
        
        echo "  ✓ Fixed $(basename "$file")"
    fi
done

# Fix in claude-code agents
echo "📁 Fixing claude-code agents..."
find /Users/johnferguson/Github/codeflow/claude-agents/ -name "*.md" | while read file; do
    if [[ -f "$file" ]]; then
        # Create backup
        cp "$file" "$file.bak"
        
        # Apply fixes
        sed -i '' \
            -e 's/^temperature: undefined$/temperature: 0.3/' \
            -e 's/^mode: undefined$/mode: subagent/' \
            -e 's/^model: undefined$/model: opencode\/grok-code/' \
            -e '/^tools: undefined$/d' \
            "$file"
        
        echo "  ✓ Fixed $(basename "$file")"
    fi
done

# Fix in opencode agents
echo "📁 Fixing opencode agents..."
find /Users/johnferguson/Github/codeflow/opencode-agents/ -name "*.md" | while read file; do
    if [[ -f "$file" ]]; then
        # Create backup
        cp "$file" "$file.bak"
        
        # Apply fixes
        sed -i '' \
            -e 's/^temperature: undefined$/temperature: 0.3/' \
            -e 's/^mode: undefined$/mode: subagent/' \
            -e 's/^model: undefined$/model: opencode\/grok-code/' \
            -e '/^tools: undefined$/d' \
            "$file"
        
        echo "  ✓ Fixed $(basename "$file")"
    fi
done

echo "✅ Batch fix complete!"

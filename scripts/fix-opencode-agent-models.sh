#!/bin/bash

# Fix OpenCode agent model configurations to use correct provider/model format

echo "Fixing OpenCode agent model configurations..."

# Fix various incorrect model references
# gpt-4 should be something like github-copilot/gpt-4o or opencode/gpt-4
# opencode/grok-code is probably fine as is
# anthropic/claude-sonnet-4 doesn't exist, should be anthropic/claude-3-5-sonnet-20241022
# github-copilot/gpt-4.1 doesn't exist, should use a real model

echo "Updating agent model references..."

# Fix in local files
echo "Updating local .opencode/agent files..."
for file in .opencode/agent/*.md; do
    if [ -f "$file" ]; then
        # Fix standalone gpt-4 to use opencode model
        sed -i "s|^model: gpt-4$|model: opencode/grok-code|" "$file"

        # Fix non-existent claude-sonnet-4 to opencode model
        sed -i "s|^model: anthropic/claude-sonnet-4$|model: opencode/grok-code|" "$file"

        # Fix non-existent github-copilot/gpt-4.1 to use opencode model
        sed -i "s|^model: github-copilot/gpt-4.1$|model: opencode/grok-code|" "$file"

        # Fix existing anthropic models to use opencode model
        sed -i "s|^model: anthropic/claude-3-5-sonnet-20241022$|model: opencode/grok-code|" "$file"

        # opencode/grok-code might be valid for OpenCode, leave it as is

        echo "  Checked: $(basename $file)"
    fi
done

# Fix in global files
echo "Updating global ~/.config/opencode/agent files..."
for file in ~/.config/opencode/agent/*.md; do
    if [ -f "$file" ]; then
        # Fix standalone gpt-4 to use opencode model
        sed -i "s|^model: gpt-4$|model: opencode/grok-code|" "$file"

        # Fix non-existent claude-sonnet-4 to opencode model
        sed -i "s|^model: anthropic/claude-sonnet-4$|model: opencode/grok-code|" "$file"

        # Fix non-existent github-copilot/gpt-4.1 to use opencode model
        sed -i "s|^model: github-copilot/gpt-4.1$|model: opencode/grok-code|" "$file"

        # Fix existing anthropic models to use opencode model
        sed -i "s|^model: anthropic/claude-3-5-sonnet-20241022$|model: opencode/grok-code|" "$file"

        echo "  Checked: $(basename $file)"
    fi
done

echo ""
echo "Verification - Local agent models:"
grep -h "^model:" .opencode/agent/*.md | sort -u

echo ""
echo "Verification - Global agent models:"
grep -h "^model:" ~/.config/opencode/agent/*.md | sort -u

echo ""
echo "Agent model configurations fixed!"
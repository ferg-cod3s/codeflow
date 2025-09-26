#!/bin/bash

# Fix OpenCode model configurations to use correct provider/model format

echo "Fixing OpenCode model configurations..."

# The correct format should be provider/model
OLD_MODEL="model: claude-3-5-sonnet-20241022"
NEW_MODEL="model: opencode/code-supernova"

echo "Updating local .opencode/command files..."
for file in .opencode/command/*.md; do
    if [ -f "$file" ]; then
        sed -i "s|^${OLD_MODEL}$|${NEW_MODEL}|" "$file"
        echo "  Updated: $file"
    fi
done

echo "Updating global ~/.config/opencode/command files..."
for file in ~/.config/opencode/command/*.md; do
    if [ -f "$file" ]; then
        sed -i "s|^${OLD_MODEL}$|${NEW_MODEL}|" "$file"
        echo "  Updated: $file"
    fi
done

echo ""
echo "Verification - Local files:"
grep -h "^model:" .opencode/command/*.md | head -1

echo ""
echo "Verification - Global files:"
grep -h "^model:" ~/.config/opencode/command/*.md | head -1

echo ""
echo "Model configurations fixed!"
echo "You can now run OpenCode and test commands like /research"
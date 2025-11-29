#!/bin/bash

echo "🚀 Setting up NPM_TOKEN for GitHub Actions publishing"
echo "=================================================="

REPO="ferg-cod3s/codeflow"

echo ""
echo "Step 1: Checking if you're logged into npm..."
if npm whoami >/dev/null 2>&1; then
    echo "✅ Already logged in as: $(npm whoami)"
else
    echo "❌ Not logged into npm. Please run: npm login"
    echo "   Then rerun this script"
    exit 1
fi

echo ""
echo "Step 2: Generating new NPM automation token..."
echo "Note: This will create a token with publishing permissions"
read -p "Press Enter to continue..."

# Generate token and capture it
TOKEN_OUTPUT=$(npm token create)
echo "$TOKEN_OUTPUT"

# Extract token from output (npm shows it in the output)
TOKEN=$(echo "$TOKEN_OUTPUT" | grep -o 'npm_[a-zA-Z0-9_-]*' | head -1)

if [ -z "$TOKEN" ]; then
    echo "❌ Could not extract token. Please copy it manually from above output."
    read -p "Enter the NPM token: " TOKEN
fi

if [ -n "$TOKEN" ]; then
    echo ""
    echo "Step 3: Setting NPM_TOKEN secret in GitHub..."
    echo "$TOKEN" | gh secret set NPM_TOKEN --repo "$REPO"
    
    if [ $? -eq 0 ]; then
        echo "✅ NPM_TOKEN secret set successfully!"
        echo ""
        echo "🎉 Setup complete! Your GitHub Actions can now publish to NPM."
        echo "   Test by creating and pushing a new tag: git tag v0.22.1 && git push origin v0.22.1"
    else
        echo "❌ Failed to set secret. Please check your GitHub permissions."
    fi
else
    echo "❌ No token provided. Setup aborted."
fi
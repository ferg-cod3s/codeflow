#!/bin/bash

# NPM OIDC Setup Helper Script
# This script helps configure NPM trusted publishing for GitHub Actions

set -e

echo "🚀 NPM OIDC Setup Helper for @agentic-codeflow/cli"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Extract package info
PACKAGE_NAME=$(jq -r '.name' package.json)
PACKAGE_VERSION=$(jq -r '.version' package.json)

print_status "Found package: $PACKAGE_NAME v$PACKAGE_VERSION"

# Check if it's a scoped package
if [[ $PACKAGE_NAME == @* ]]; then
    ORG_NAME=$(echo $PACKAGE_NAME | cut -d'/' -f1 | sed 's/@//')
    print_status "Detected NPM organization: $ORG_NAME"
else
    print_warning "This is not a scoped package. OIDC setup may differ."
fi

echo ""
print_status "Step 1: NPM Organization Configuration"
echo "---------------------------------------------"
echo "To configure OIDC for your NPM organization:"
echo ""
echo "1. Go to: https://www.npmjs.com/org/$ORG_NAME/settings"
echo "2. Navigate to 'Publishing access'"
echo "3. Click 'Add trusted publisher'"
echo "4. Enter the following details:"
echo "   - Owner: ferg-cod3s"
echo "   - Repository: codeflow"
echo "   - Workflow: .github/workflows/publish.yml"
echo "   - Environment: (leave blank)"
echo ""
read -p "Press Enter after configuring NPM organization..."

echo ""
print_status "Step 2: GitHub Repository Permissions"
echo "------------------------------------------"
echo "The workflow requires these permissions:"
echo ""
echo "✅ id-token: write (for OIDC)"
echo "✅ contents: write (for releases)"
echo "✅ packages: write (for GitHub Packages)"
echo ""

# Check current workflow permissions
if grep -q "id-token: write" .github/workflows/publish.yml; then
    print_success "id-token permission is configured"
else
    print_error "id-token permission missing in workflow"
fi

if grep -q "contents: write" .github/workflows/publish.yml; then
    print_success "contents permission is configured"
else
    print_error "contents permission missing in workflow"
fi

echo ""
print_status "Step 3: Testing the Workflow"
echo "---------------------------------"
echo "To test the OIDC setup:"
echo ""
echo "1. Create a test tag:"
echo "   git tag v$PACKAGE_VERSION-test"
echo "   git push origin v$PACKAGE_VERSION-test"
echo ""
echo "2. Monitor the workflow at:"
echo "   https://github.com/ferg-cod3s/codeflow/actions"
echo ""
echo "3. Check for successful NPM publishing"
echo ""

read -p "Do you want to create a test tag now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Creating test tag..."
    git tag v$PACKAGE_VERSION-test
    git push origin v$PACKAGE_VERSION-test
    print_success "Test tag pushed! Check the workflow status."
fi

echo ""
print_status "Step 4: Cleanup (Optional)"
echo "------------------------------"
echo "After successful testing:"
echo ""
echo "1. Remove test tag locally:"
echo "   git tag -d v$PACKAGE_VERSION-test"
echo ""
echo "2. Remove test tag remotely:"
echo "   git push origin :refs/tags/v$PACKAGE_VERSION-test"
echo ""

print_success "OIDC setup guide completed!"
echo ""
echo "📚 For more details, see: docs/NPM_OIDC_SETUP.md"
echo "🔧 If you encounter issues, check the workflow logs"
echo "📞 For NPM support: https://www.npmjs.com/support"

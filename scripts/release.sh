#!/bin/bash

# Codeflow Release Script
# Automates version tagging and publishing to prevent missing tags

set -e

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

# Function to get current version from package.json
get_current_version() {
    node -p "require('./package.json').version"
}

# Function to bump version in package.json
bump_version() {
    local bump_type=${1:-patch}
    local current=$(get_current_version)
    local new_version

    if [ "$bump_type" = "major" ]; then
        new_version=$(node -e "const v='$current'.split('.'); console.log((parseInt(v[0])+1) + '.0.0')")
    elif [ "$bump_type" = "minor" ]; then
        new_version=$(node -e "const v='$current'.split('.'); console.log(v[0] + '.' + (parseInt(v[1])+1) + '.0')")
    else
        new_version=$(node -e "const v='$current'.split('.'); console.log(v[0] + '.' + v[1] + '.' + (parseInt(v[2])+1))")
    fi

    # Update package.json
    node -e "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('package.json')); pkg.version = '$new_version'; fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');"
    print_success "Bumped version from $current to $new_version"

    # Commit the change
    git add package.json
    git commit --no-verify -m "Bump version to $new_version"
    print_success "Committed version bump"
}

# Function to check if tag exists
tag_exists() {
    git tag -l | grep -q "^v$1$"
}

# Function to check if working directory is clean
check_clean_working_dir() {
    if [[ -n $(git status --porcelain) ]]; then
        print_error "Working directory is not clean. Please commit or stash changes first."
        exit 1
    fi
}

# Function to validate version format
validate_version() {
    if [[ ! $1 =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_error "Invalid version format: $1. Expected format: x.y.z"
        exit 1
    fi
}

# Main function
main() {
    local bump_type=""
    print_status "Starting codeflow release process..."

    # Check if we're in the right directory
    if [[ ! -f "package.json" ]]; then
        print_error "package.json not found. Please run this script from the project root."
        exit 1
    fi

    # Check working directory is clean
    check_clean_working_dir

    # Handle bump option
    if [[ -n "$bump_type" ]]; then
        bump_version "$bump_type"
    fi

    # Get current version
    CURRENT_VERSION=$(get_current_version)
    validate_version "$CURRENT_VERSION"

    print_status "Current version: $CURRENT_VERSION"

    # Check if tag already exists
    if tag_exists "$CURRENT_VERSION"; then
        print_warning "Tag v$CURRENT_VERSION already exists!"

        # Check if it's on the current commit
        CURRENT_COMMIT=$(git rev-parse HEAD)
        TAG_COMMIT=$(git rev-list -n 1 "v$CURRENT_VERSION")

        if [[ "$CURRENT_COMMIT" == "$TAG_COMMIT" ]]; then
            print_success "Tag v$CURRENT_VERSION is already on current commit."
        else
            print_error "Tag v$CURRENT_VERSION exists but points to a different commit."
            print_status "Current commit: $CURRENT_COMMIT"
            print_status "Tag commit:     $TAG_COMMIT"
            exit 1
        fi
    else
        # Create new tag
        print_status "Creating tag v$CURRENT_VERSION..."
        git tag "v$CURRENT_VERSION"
        print_success "Created tag v$CURRENT_VERSION"
    fi

    # Push tag to remote
    print_status "Pushing tag to remote..."
    git push origin "v$CURRENT_VERSION"
    print_success "Pushed tag v$CURRENT_VERSION to remote"

    # Optional: Publish to npm
    if [[ "$publish_flag" == "--publish" ]]; then
        print_status "Publishing to npm..."
        if bun publish; then
            print_success "Successfully published v$CURRENT_VERSION to npm"
        else
            print_error "Failed to publish to npm"
            exit 1
        fi
    else
        print_status "Skipping npm publish (use --publish or -p to publish)"
    fi

    print_success "Release process completed for version $CURRENT_VERSION"
    print_status "Next steps:"
    echo "  - Create GitHub release at: https://github.com/ferg-cod3s/codeflow/releases/new?tag=v$CURRENT_VERSION"
    if [[ "$publish_flag" != "--publish" ]]; then
        echo "  - Publish to npm with: bun publish"
    fi
}

# Help function
show_help() {
    echo "Codeflow Release Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --publish         Also publish to npm registry"
    echo "  --bump-patch         Bump patch version (e.g., 1.2.3 -> 1.2.4)"
    echo "  --bump-minor         Bump minor version (e.g., 1.2.3 -> 1.3.0)"
    echo "  --bump-major         Bump major version (e.g., 1.2.3 -> 2.0.0)"
    echo "  -h, --help           Show this help message"
    echo ""
    echo "This script will:"
    echo "  1. Check that working directory is clean"
    echo "  2. Optionally bump version in package.json and commit"
    echo "  3. Read version from package.json"
    echo "  4. Create git tag if it doesn't exist"
    echo "  5. Push tag to remote repository"
    echo "  6. Optionally publish to npm"
}

# Parse command line arguments
bump_type=""
publish_flag=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -p|--publish)
            publish_flag="--publish"
            shift
            ;;
        --bump-patch)
            bump_type="patch"
            shift
            ;;
        --bump-minor)
            bump_type="minor"
            shift
            ;;
        --bump-major)
            bump_type="major"
            shift
            ;;
        "")
            break
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

main
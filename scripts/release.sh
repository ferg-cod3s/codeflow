#!/usr/bin/env bash

# Parse command line arguments
minor=false
version_override=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --minor) minor=true; shift 1;;
    --version) version_override="$2"; shift 2;;
    *) echo "Unknown parameter: $1"; exit 1;;
  esac
done

# Check if version was manually specified
if [ -n "$version_override" ]; then
    new_version="$version_override"
    echo "Using specified version: $new_version"
else
    # Get the latest release from GitHub
    latest_tag=$(gh release list --limit 1 --json tagName --jq '.[0].tagName')

    # If there is no tag, start from 0.1.1 (since 0.1.0 was already used)
    if [ -z "$latest_tag" ]; then
        echo "No tags found, starting from v0.1.1"
        new_version="0.1.1"
    else
        echo "Latest tag: $latest_tag"
        
        # Remove the 'v' prefix and split into major, minor, and patch numbers
        version_without_v=${latest_tag#v}
        IFS='.' read -ra VERSION <<< "$version_without_v"

        if [ "$minor" = true ]; then
            # Increment the minor version and reset patch to 0
            minor_number=${VERSION[1]}
            let "minor_number++"
            new_version="${VERSION[0]}.$minor_number.0"
        else
            # Increment the patch version
            patch_number=${VERSION[2]}
            let "patch_number++"
            new_version="${VERSION[0]}.${VERSION[1]}.$patch_number"
        fi
    fi
fi

echo "New version: $new_version"

# Trigger the GitHub workflow
gh workflow run release.yml -f version="$new_version"

echo "✓ Release workflow triggered for v$new_version"
echo "Check progress at: https://github.com/Cluster444/agentic/actions"
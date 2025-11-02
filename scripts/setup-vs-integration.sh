#!/usr/bin/env bash

# CodeFlow VS Integration Setup Script
# Integrates verbalized sampling into development workflow

set -e

echo "🚀 Setting up CodeFlow VS Integration..."

# Check if VS system exists
if [ ! -f "src/verbalized-sampling/cli.ts" ]; then
    echo "❌ VS integration system not found. Please run setup first."
    exit 1
fi

# Build VS CLI
echo "🔨 Building VS CLI..."
bun build src/verbalized-sampling/cli.ts --target bun --outfile vs-cli
chmod +x vs-cli

# Initialize VS integration
echo "⚙️  Initializing VS integration..."
./vs-cli init

# Setup git hooks
echo "🔗 Setting up git hooks..."
mkdir -p .git/hooks

# Pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "🔍 Running VS validation..."
if command -v bun &> /dev/null && [ -f "vs-cli" ]; then
    ./vs-cli validate . --strict
    echo "✅ VS validation passed"
else
    echo "⚠️  VS CLI not available, skipping validation"
fi
EOF

chmod +x .git/hooks/pre-commit

# Setup package.json scripts
echo "📦 Adding VS scripts to package.json..."

# Check if scripts section exists
if grep -q '"scripts":' package.json; then
    # Add VS scripts to existing scripts section
    sed -i.bak '/"scripts": {/a\
    "vs:validate": "bun run src/verbalized-sampling/cli.ts validate . --strict",\
    "vs:test": "bun run src/verbalized-sampling/cli.ts test",\
    "vs:inject": "bun run src/verbalized-sampling/cli.ts inject",\
    "vs:export": "bun run src/verbalized-sampling/cli.ts export",\
    "vs:import": "bun run src/verbalized-sampling/cli.ts import",\
    "vs:sync": "bun run src/verbalized-sampling/cli.ts sync",\
    "vs:info": "bun run src/verbalized-sampling/cli.ts info",\
    "vs:init": "bun run src/verbalized-sampling/cli.ts init",\
    "precommit:vs": "./vs-cli validate . --strict",\
    "lint:vs": "./vs-cli validate . --strict --no-warnings",\
    "test:vs": "./vs-cli test \"Sample problem\" --type research",\
    ' package.json
else
    echo "⚠️  Could not find scripts section in package.json"
fi

# Create VS configuration
echo "📝 Creating VS configuration..."
cat > vs-config.json << EOF
{
  "verbalized_sampling": {
    "enabled": true,
    "platform": "opencode",
    "auto_inject": true,
    "confidence_threshold": 0.7,
    "strategy_count": 3,
    "output_format": "markdown",
    "validation": {
      "strict_mode": true,
      "include_warnings": true,
      "include_suggestions": true,
      "min_quality_score": 80
    },
    "sync": {
      "auto_sync": false,
      "global_repo": null
    }
  }
}
EOF

# Setup global repository (optional)
read -p "🔗 Setup global VS repository? (y/N): " setup_global
if [[ $setup_global =~ ^[Yy]$ ]]; then
    read -p "Enter global repository path: " global_repo
    if [ -n "$global_repo" ] && [ -d "$global_repo" ]; then
        echo "📤 Exporting to global repository..."
        ./vs-cli export "$global_repo"
        sed -i.bak "s|\"global_repo\": null|\"global_repo\": \"$global_repo\"|" vs-config.json
        echo "✅ Global repository configured"
    fi
fi

# Run initial validation
echo "🔍 Running initial validation..."
./vs-cli validate . --strict

echo ""
echo "🎉 CodeFlow VS Integration Setup Complete!"
echo ""
echo "📋 Available commands:"
echo "  ./vs-cli validate .          # Validate all components"
echo "  ./vs-cli test \"problem\"       # Test VS generation"
echo "  ./vs-cli inject file.md \"problem\"  # Inject VS into component"
echo "  ./vs-cli export /repo/path    # Export to global repo"
echo "  ./vs-cli info                 # Show system information"
echo ""
echo "📦 Package.json scripts added:"
echo "  bun run vs:validate           # Validate components"
echo "  bun run vs:test               # Test VS generation"
echo "  bun run vs:export             # Export to global repo"
echo ""
echo "🔗 Git hooks installed:"
echo "  Pre-commit hook validates VS integration"
echo ""
echo "📖 Next steps:"
echo "1. Review vs-config.json for customization"
echo "2. Run './vs-cli validate .' to check existing components"
echo "3. Use './vs-cli inject' when creating new agents/commands/skills"
echo "4. Consider setting up global repository sync for team collaboration"
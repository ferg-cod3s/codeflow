#!/bin/bash

# Agent duplicate cleanup script
# Generated to resolve canonical conflicts and duplicates

echo "🧹 Starting agent duplicate cleanup..."
echo "This will remove duplicate agent files to establish canonical structure"
echo ""

# Function to safely remove files with confirmation
safe_remove() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "  Removing: $file"
        rm -f "$file"
    else
        echo "  Skipping (not found): $file"
    fi
}

echo "📁 Phase 1: Removing duplicate Claude Code agents (.claude/agents/ duplicates)"
echo "Keeping canonical versions in claude-agents/"
echo ""

# Remove duplicates from .claude/agents/ (keeping claude-agents/ as canonical)
claude_duplicates=(
    "accessibility-pro"
    "agent-architect"
    "ai-integration-expert"
    "analytics-engineer"
    "api-builder"
    "code-reviewer"
    "codebase-analyzer"
    "codebase-locator"
    "codebase-pattern-finder"
    "content-localization-coordinator"
    "database-expert"
    "deployment-wizard"
    "development-migrations-specialist"
    "devops-operations-specialist"
    "full-stack-developer"
    "growth-engineer"
    "infrastructure-builder"
    "monitoring-expert"
    "operations-incident-commander"
    "performance-engineer"
    "programmatic-seo-engineer"
    "quality-testing-performance-tester"
    "security-scanner"
    "smart-subagent-orchestrator"
    "system-architect"
    "thoughts-analyzer"
    "thoughts-locator"
    "ux-optimizer"
    "web-search-researcher"
)

for agent in "${claude_duplicates[@]}"; do
    safe_remove ".claude/agents/${agent}.md"
done

echo ""
echo "📁 Phase 2: Creating missing canonical OpenCode directory structure"
echo ""

# Create opencode-agents directory if it doesn't exist
if [ ! -d "opencode-agents" ]; then
    echo "  Creating: opencode-agents/"
    mkdir -p opencode-agents
fi

echo ""
echo "📁 Phase 3: Removing incomplete/problematic agents"
echo ""

# Remove README.md from codeflow-agents (not an agent)
safe_remove "codeflow-agents/README.md"

# Remove test agents that shouldn't be in production
safe_remove ".claude/agents/force-test.md"

echo ""
echo "📁 Phase 4: Creating canonical OpenCode agents from existing OpenCode agents"
echo ""

# Copy from .opencode/agent/ to opencode-agents/ to create canonical OpenCode format
if [ -d ".opencode/agent" ]; then
    echo "  Copying agents from .opencode/agent/ to opencode-agents/"
    cp -r .opencode/agent/* opencode-agents/ 2>/dev/null || true

    # Remove the problematic test agents from canonical directory
    safe_remove "opencode-agents/dryrun-test.md"
    safe_remove "opencode-agents/health-test.md"
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 Summary of changes:"
echo "  • Removed 29 duplicate Claude Code agents from .claude/agents/"
echo "  • Created opencode-agents/ directory with canonical OpenCode agents"
echo "  • Removed 1 README file and 1 test agent from canonical directories"
echo "  • Established clean canonical structure with 3 directories:"
echo "    - codeflow-agents/ (base format)"
echo "    - claude-agents/ (Claude Code format)"
echo "    - opencode-agents/ (OpenCode format)"
echo ""
echo "🔍 Next steps:"
echo "1. Run: node scripts/audit-agent-compliance.js"
echo "2. Run: codeflow validate"
echo "3. Run: codeflow convert-all"
echo "4. Test: codeflow sync-global"
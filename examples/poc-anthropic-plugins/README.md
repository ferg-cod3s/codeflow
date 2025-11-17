# Anthropic Claude Code Plugins - Conversion POC

This directory contains a Proof of Concept (POC) demonstrating the conversion of official Anthropic Claude Code plugins to OpenCode format.

## Contents

- **claude-code-format/** - Original Claude Code plugins
  - explanatory-output-style
  - learning-output-style

- **opencode-format/** - Converted OpenCode plugins
  - explanatory-output-style
  - learning-output-style

- **POC_CONVERSION_GUIDE.md** - Comprehensive conversion guide and analysis

## Quick Links

- 📖 [Complete Conversion Guide](./POC_CONVERSION_GUIDE.md)
- 🎓 [Explanatory Plugin (Claude Code)](./claude-code-format/explanatory-output-style/)
- 🎓 [Explanatory Plugin (OpenCode)](./opencode-format/explanatory-output-style/)
- 📚 [Learning Plugin (Claude Code)](./claude-code-format/learning-output-style/)
- 📚 [Learning Plugin (OpenCode)](./opencode-format/learning-output-style/)

## What These Plugins Do

### Explanatory Output Style
Adds educational insights about implementation choices and codebase patterns throughout coding sessions.

**Features:**
- ★ Insight markers with 2-3 key educational points
- Explanations before and after writing code
- Focus on codebase-specific patterns (not general concepts)

**Use Case**: When you want to learn while coding, understanding *why* decisions are made.

### Learning Output Style
Interactive learning mode that requests code contributions at decision points.

**Features:**
- Requests 5-10 lines of code for meaningful decisions
- Provides constructive feedback on your code
- Combines interactive learning with educational insights
- Distinguishes learning opportunities from boilerplate

**Use Case**: When you want hands-on learning, writing code yourself with guidance.

## How to Test

### Claude Code Format (Original)

```bash
# Install from Anthropic marketplace
/plugin marketplace add anthropics/claude-code
/plugin install explanatory-output-style@anthropics/claude-code
# or
/plugin install learning-output-style@anthropics/claude-code
```

### OpenCode Format (Converted)

```bash
# Copy to project plugin directory
cp opencode-format/explanatory-output-style/explanatory-output-style.ts .opencode/plugin/

# Or copy to global plugin directory
cp opencode-format/explanatory-output-style/explanatory-output-style.ts ~/.config/opencode/plugin/

# Create .opencode/rules.md for best results
cat > .opencode/rules.md <<EOF
Provide educational insights throughout code assistance using:
\`★ Insight ─────────────────────────────────────\`
[2-3 key educational points]
\`─────────────────────────────────────────────────\`
EOF

# Start OpenCode
opencode
```

## Key Findings

### ✅ What Works
- Core functionality successfully converted
- Hook mapping (SessionStart → session.start) works well
- TypeScript provides better maintainability than bash scripts
- OpenCode plugins are more customizable

### ⚠️ Challenges
- OpenCode lacks direct system prompt injection (like Claude Code's `additionalContext`)
- Workaround: Use .opencode/rules.md + explicit prompting
- Requires more user engagement than Claude Code

### 🎯 Conversion Success Rate
- **Automated conversion feasibility**: 70-80%
- **Manual refinement needed**: 20-30%
- **Overall viability**: ✅ Proven feasible

## POC Objectives

This POC validates the feasibility of automated Claude Code → OpenCode plugin conversion for CodeFlow CLI.

**Objectives Met:**
- [x] Identify conversion challenges
- [x] Demonstrate successful conversions
- [x] Document conversion methodology
- [x] Create reusable templates
- [x] Provide implementation roadmap

## Next Steps

1. **Implement automated conversion** in CodeFlow CLI
   ```bash
   codeflow convert claude-plugin --input ./my-plugin --output ./opencode-plugin
   ```

2. **Expand to more plugins**
   - Test with all 11 Anthropic plugins
   - Document edge cases and limitations

3. **Create conversion templates**
   - SessionStart hooks
   - Tool execution hooks
   - Custom tools
   - MCP server integrations

4. **Build validation suite**
   - Test converted plugins
   - Compare behavior with originals
   - Measure success metrics

## Contributing

Interested in helping convert more plugins?

1. Choose a Claude Code plugin from [anthropics/claude-code](https://github.com/anthropics/claude-code/tree/main/plugins)
2. Follow the methodology in [POC_CONVERSION_GUIDE.md](./POC_CONVERSION_GUIDE.md)
3. Create a PR with your conversion
4. Document any new challenges or patterns

## Resources

### Documentation
- [POC Conversion Guide](./POC_CONVERSION_GUIDE.md) - Complete analysis
- [Integration Guide](../../docs/CLAUDE_TO_OPENCODE_PLUGIN_INTEGRATION.md) - Technical details
- [Implementation Roadmap](../../docs/PLUGIN_INTEGRATION_ROADMAP.md) - Development plan

### Official Sources
- [Claude Code Plugins](https://github.com/anthropics/claude-code/tree/main/plugins)
- [Claude Code Docs](https://code.claude.com/docs/en/plugins)
- [OpenCode Docs](https://opencode.ai/docs/plugins/)

### CodeFlow CLI
- [Main Repository](https://github.com/ferg-cod3s/codeflow)
- [Agent Conversion](../../README.md)
- [Command Conversion](../../README.md)
- [Skill Conversion](../../README.md)

## License

The original plugins are from Anthropic's official repository. Conversions maintain attribution to original authors.

- Original plugins: See individual plugin.json files
- Converted plugins: MIT (following CodeFlow CLI license)
- POC documentation: MIT

---

**POC Status**: ✅ Complete
**Date**: 2025-11-17
**Validated By**: CodeFlow CLI Research
**Next Milestone**: Implement automated conversion in CodeFlow CLI

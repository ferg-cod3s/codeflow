# Explanatory Output Style Plugin for OpenCode

Converted from the official Anthropic Claude Code plugin.

## What it does

This plugin adds educational insights about implementation choices and codebase patterns throughout OpenCode sessions. It recreates the "Explanatory" output style from Claude Code.

## Installation

### Option 1: Copy to project plugin directory
```bash
cp explanatory-output-style.ts .opencode/plugin/
```

### Option 2: Copy to global plugin directory
```bash
cp explanatory-output-style.ts ~/.config/opencode/plugin/
```

### Option 3: Enable in opencode.json
```json
{
  "plugins": {
    "explanatory-output-style": {
      "enabled": true
    }
  }
}
```

## Usage

Once installed, the plugin activates automatically and provides:

- 📚 Educational insights throughout code assistance
- ★ Special insight markers in responses
- 🎓 Explanations of implementation choices

### Example Output

When the plugin is active, you'll see insights like:

```
★ Insight ─────────────────────────────────────
- This implementation uses the Strategy pattern to separate concerns
- The async/await pattern here prevents blocking the event loop
- Type guards ensure runtime type safety beyond TypeScript compilation
─────────────────────────────────────────────────
```

## Differences from Claude Code Version

The Claude Code version uses a SessionStart hook to inject additional context into the system prompt. OpenCode handles this differently:

### Claude Code Approach
- SessionStart hook outputs JSON with `additionalContext`
- Context is injected directly into the AI's system prompt
- Works at the session initialization level

### OpenCode Approach
- Uses event hooks for session lifecycle
- Logs instructions for visibility
- Relies on session context and conversation history
- May require explicit prompting for insights

### Recommended Usage with OpenCode

To get the best results with this plugin in OpenCode:

1. **Start sessions with context**:
   ```
   opencode
   > Please provide educational insights as we work
   ```

2. **Request explanations explicitly**:
   ```
   > Explain why you chose this implementation
   ```

3. **Use with .opencode/rules.md**:
   ```markdown
   # OpenCode Rules

   - Provide educational insights with ★ Insight markers
   - Explain implementation choices
   - Focus on codebase-specific patterns
   ```

## Limitations

- OpenCode doesn't have a direct SessionStart context injection mechanism like Claude Code
- Educational mode must be reinforced through conversation or rules
- Consider using OpenCode's `.opencode/rules.md` for persistent instructions

## Configuration

Create a `.opencode/rules.md` file in your project to make the explanatory mode persistent:

```markdown
# Educational Insights

Provide educational insights throughout code assistance using this format:

\`\`\`
★ Insight ─────────────────────────────────────
[2-3 key educational points]
─────────────────────────────────────────────────
\`\`\`

Focus on:
- Implementation choices specific to this codebase
- Design patterns and architecture decisions
- Trade-offs and alternatives considered
- Performance implications
- Security considerations

Balance educational content with task completion.
```

## Token Costs

⚠️ **Important**: This plugin encourages more verbose, educational output. This will increase token usage and costs. Only enable if you value the educational insights and are comfortable with the additional cost.

## Customization

Edit `explanatory-output-style.ts` to customize:
- The insight marker format
- When insights are provided
- The level of detail in explanations
- Which tool executions trigger educational prompts

## Original Plugin

This is a conversion of the official Anthropic plugin:
- Original: https://github.com/anthropics/claude-code/tree/main/plugins/explanatory-output-style
- Author: Dickson Tsai (Anthropic)
- Converted by: CodeFlow CLI

## License

MIT (following original plugin license)

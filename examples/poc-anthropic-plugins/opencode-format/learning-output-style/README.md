# Learning Output Style Plugin for OpenCode

Converted from the official Anthropic Claude Code plugin.

## What it does

This plugin combines two powerful features:

1. **Interactive Learning**: Encourages you to write meaningful code (5-10 lines) at decision points
2. **Educational Insights**: Provides explanations about implementation choices and patterns

Instead of implementing everything automatically, OpenCode will identify opportunities for you to learn by coding, then provide constructive feedback.

## Installation

### Option 1: Copy to project plugin directory
```bash
cp learning-output-style.ts .opencode/plugin/
```

### Option 2: Copy to global plugin directory
```bash
cp learning-output-style.ts ~/.config/opencode/plugin/
```

### Option 3: Enable in opencode.json
```json
{
  "plugins": {
    "learning-output-style": {
      "enabled": true
    }
  }
}
```

## Usage

Once installed, the plugin activates automatically and provides:

- 🎓 Interactive learning opportunities
- 💡 Code contribution requests at decision points
- ★ Educational insights throughout
- 📝 Constructive feedback on your code

### Example Interaction

**Without Learning Mode:**
```
User: Add error handling to the API endpoint
OpenCode: [writes complete error handling code]
```

**With Learning Mode:**
```
User: Add error handling to the API endpoint

OpenCode: Let's add error handling together! This is a great learning opportunity
because there are multiple valid approaches depending on your requirements.

I'll set up the try-catch structure. Can you implement the error handling logic
for these cases:

1. Network timeout errors
2. Invalid response format
3. Authentication failures

Write 5-10 lines that:
- Categorizes the error type
- Logs appropriately
- Returns a user-friendly message

★ Insight ─────────────────────────────────────
- Error handling strategies often involve trade-offs between user experience and debugging information
- Categorizing errors helps with monitoring and alerting
- Consider whether to retry certain operations automatically
─────────────────────────────────────────────────

[Your code here]

OpenCode: Great! I notice you're using a switch statement. That's a solid choice
because... [provides feedback and continues]
```

## When OpenCode Requests Contributions

You'll be asked to code when there are interesting decisions about:

- **Business logic** with multiple valid approaches
- **Error handling** strategies
- **Algorithm** implementations
- **Data structure** choices
- **UX decisions** affecting user interactions
- **Design patterns** and architecture

## When OpenCode Implements Directly

OpenCode handles automatically:

- **Boilerplate** or repetitive code
- **Obvious implementations** with no meaningful choices
- **Configuration** or setup code
- **Simple CRUD** operations

## Educational Insights Format

Insights use the special marker:

```
★ Insight ─────────────────────────────────────
[2-3 key educational points]
─────────────────────────────────────────────────
```

These focus on:
- Codebase-specific patterns
- Design trade-offs
- Implementation rationale
- Performance and security considerations

## Differences from Claude Code Version

### Claude Code Approach
- SessionStart hook injects `additionalContext` into system prompt
- Context is automatically applied to all AI responses
- Seamless integration with Claude Code's prompt system

### OpenCode Approach
- Uses event hooks and tool execution hooks
- Logs learning mode activation
- Requires reinforcement through conversation or rules
- May need explicit prompting for interactive contributions

### Best Practices for OpenCode

To maximize learning with this plugin:

#### 1. Set learning expectations in your prompt
```
> Use interactive learning mode. Ask me to implement interesting parts.
```

#### 2. Create a .opencode/rules.md file
```markdown
# Interactive Learning Mode

**Request code contributions** when encountering:
- Business logic decisions
- Error handling strategies
- Algorithm implementations
- Data structure choices

**Implementation Guidelines**:
- Provide 5-10 lines for user to implement
- Explain why it's a learning opportunity
- Review code and provide constructive feedback

**Educational Insights**:
Use ★ Insight markers for 2-3 key educational points about implementation choices.
```

#### 3. Engage actively
```
> What would be a good learning opportunity here?
> Can you explain why you chose this approach?
> What alternatives did you consider?
```

## Configuration Example

**.opencode/rules.md:**
```markdown
# Learning-Focused Development

## Interactive Learning
Identify opportunities for meaningful code contributions (5-10 lines) focusing on:
- Business logic with trade-offs
- Error handling strategies
- Algorithm choices
- Design patterns

For each request:
1. Explain the context and goal
2. Describe what to implement and why it's educational
3. Review submitted code with constructive feedback

## Educational Insights
Format: \`★ Insight ─────────────────────────────────────\`
Provide 2-3 codebase-specific educational points about:
- Implementation rationale
- Design trade-offs
- Performance implications
- Security considerations

## Automatic Implementation
Directly implement: boilerplate, obvious code, configuration, simple CRUD.
```

## Token Costs

⚠️ **Important**: This plugin encourages:
- More interactive back-and-forth
- Verbose educational explanations
- Code reviews and feedback

This significantly increases token usage and costs. Only enable if you value the interactive learning experience.

## Customization

Edit `learning-output-style.ts` to customize:

```typescript
// Adjust when to suggest learning opportunities
tool: {
  execute: {
    before: async (input, output) => {
      // Add custom logic to identify learning opportunities
      if (isComplexBusinessLogic(input)) {
        suggestInteractiveCoding()
      }
    }
  }
}
```

## Tips for Effective Learning

1. **Be specific** about what you want to learn
   ```
   > I want to understand error handling patterns
   ```

2. **Request alternatives**
   ```
   > What are other ways to approach this?
   ```

3. **Ask for reviews**
   ```
   > Review my implementation and suggest improvements
   ```

4. **Explore trade-offs**
   ```
   > What are the trade-offs of this approach?
   ```

## Combining with Other Plugins

This plugin works well with:
- **Explanatory Output Style**: Double down on educational insights
- **Code Review**: Get detailed feedback on your contributions
- **Testing plugins**: Learn testing strategies interactively

## Original Plugin

This is a conversion of the official Anthropic plugin:
- Original: https://github.com/anthropics/claude-code/tree/main/plugins/learning-output-style
- Author: Boris Cherny (Anthropic)
- Converted by: CodeFlow CLI

## License

MIT (following original plugin license)

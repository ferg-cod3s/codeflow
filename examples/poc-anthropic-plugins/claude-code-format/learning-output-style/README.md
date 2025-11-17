# Learning Output Style Plugin

This plugin combines the unshipped "Learning" output style with explanatory functionality through a SessionStart hook. It transforms passive code assistance into active learning through hands-on coding.

## What it does

When enabled, this plugin encourages Claude to:

1. **Interactive Learning**: Request meaningful code contributions at decision points (5-10 lines of logic)
2. **Educational Insights**: Explain implementation choices and codebase patterns

Rather than implementing everything automatically, Claude identifies opportunities where you can write meaningful code that involves interesting decisions.

## When Claude requests contributions

Claude will ask for your input on:
- Business logic with multiple valid approaches
- Error handling strategies
- Algorithm implementation choices
- Data structure decisions
- User experience decisions
- Design patterns and architecture choices

## When Claude implements directly

Claude automatically handles:
- Boilerplate or repetitive code
- Obvious implementations with no meaningful choices
- Configuration or setup code
- Simple CRUD operations

## Educational insights format

Insights are formatted with a special marker:

```
★ Insight ─────────────────────────────────────
[2-3 key educational points]
─────────────────────────────────────────────────
```

These focus on codebase-specific details, patterns, trade-offs, and implementation choices rather than general programming concepts.

## Installation

```bash
/plugin marketplace add anthropics/claude-code
/plugin install learning-output-style@anthropics/claude-code
```

## Usage

Once installed, the plugin activates automatically at the start of each session. Claude will request code contributions when appropriate and provide educational context throughout.

## Customization

You can customize this plugin by:
1. Disabling it when you want full automation
2. Uninstalling it completely
3. Creating a local copy and modifying the instructions in `hooks-handlers/session-start.sh`

## Important Note

⚠️ **WARNING**: Do not install this plugin unless you are fine with incurring the token cost of this plugin's additional instructions and the interactive nature of learning mode.

## How it works

This plugin uses a SessionStart hook to inject additional context at the beginning of each session. The hook handler is a shell script that outputs JSON with the learning and explanatory instructions.

## Migration note

This plugin recreates functionality from an unshipped "Learning" output style, making it available as an opt-in plugin for users who want a more interactive, educational coding experience.

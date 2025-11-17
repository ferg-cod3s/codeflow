# Explanatory Output Style Plugin

This plugin recreates the deprecated "Explanatory" output style as a SessionStart hook.

## What it does

When enabled, this plugin automatically adds instructions at the start of each session that encourage Claude to provide educational insights about implementation choices, codebase patterns, and design trade-offs as it works on your task.

Insights are formatted with a special marker:

```
★ Insight ─────────────────────────────────────
[2-3 key educational points]
─────────────────────────────────────────────────
```

These insights focus on codebase-specific details rather than general programming concepts.

## Installation

```bash
/plugin marketplace add anthropics/claude-code
/plugin install explanatory-output-style@anthropics/claude-code
```

## Usage

Once installed, the plugin activates automatically at the start of each session. No additional configuration is required.

## Customization

You can customize this plugin by:
1. Disabling it when you don't need educational insights
2. Uninstalling it completely
3. Creating a local copy and modifying the instructions in `hooks-handlers/session-start.sh`

## Important Note

⚠️ **WARNING**: Do not install this plugin unless you are fine with incurring the token cost of this plugin's additional instructions and output.

## How it works

This plugin uses a SessionStart hook (similar to CLAUDE.md) to inject additional context at the beginning of each session. The hook handler is a shell script that outputs JSON with the educational instructions.

## Migration from deprecated output style

If you previously used `"outputStyle": "Explanatory"` in your configuration, this plugin recreates that functionality in the new plugin system.

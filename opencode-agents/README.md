# opencode config (local)

This folder contains an opencode.json tailored for macOS user `johnferguson` with:
- Default provider: GitHub Copilot
- Default agent: smart-subagent-orchestrator (gpt-5-mini, temp 0.2)
- Agent model audit: most non-implementation agents downgraded to gpt-5-mini for speed/cost; implementation-heavy agents use gpt-5
- MCP tightening: filesystem root limited to ~/Github; GitHub MCP runs read-only

## Install / Link

Create or update symlink so opencode uses this config:

```sh
ln -sf \
  "$PWD/opencode.json" \
  "$HOME/.config/opencode/opencode.json"
```

A backup of any previous target is created automatically by our setup automation.

## Required environment

Set secrets and service tokens in `$HOME/.config/opencode/.env`.

Minimum required for included MCP servers:
- GitHub MCP:
  - GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxx (fine-grained token)
  - GITHUB_TOOLSETS=repos,issues,pull_requests,actions,code_security
- Sentry MCP:
  - SENTRY_AUTH_TOKEN=...
  - SENTRY_BASE_URL=...
  - SENTRY_ORG=...
- Coolify MCP (optional):
  - COOLIFY_BASE_URL=...
  - COOLIFY_ACCESS_TOKEN=...

Provider secret for Copilot models:
- GITHUB_COPILOT_API_KEY=...

Add to your shell profile:
```sh
export GITHUB_COPILOT_API_KEY="<your key>"
```

## Validate locally

- Verify env file exists:
```sh
ls -la "$HOME/.config/opencode/.env"
```
- Smoke test GitHub MCP container (no network calls):
```sh
docker run --rm -i --read-only \
  --env-file "$HOME/.config/opencode/.env" \
  ghcr.io/github/github-mcp-server --help
```
- Check stdio subcommand is available:
```sh
docker run --rm -i --read-only \
  --env-file "$HOME/.config/opencode/.env" \
  ghcr.io/github/github-mcp-server stdio --help
```

## Notes
- Filesystem MCP root is narrowed to `~/Github` to reduce blast radius.
- GitHub MCP runs with `--read-only`. Lift only when write operations are explicitly needed.
- You can further restrict GitHub toolsets by setting `GITHUB_TOOLSETS` in the .env.

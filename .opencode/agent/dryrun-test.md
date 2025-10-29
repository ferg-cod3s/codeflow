---
name: dryrun-test
description: Test agent for dry run
mode: subagent
model: opencode/grok-code
permission:
  edit: deny
  bash: deny
  webfetch: allow
  read: allow
  write: deny
---
# Dry Run Test Agent
---
name: health-test
description: Test agent for health monitoring
mode: subagent
model: opencode/grok-code
permission:
  edit: deny
  bash: deny
  webfetch: allow
  read: allow
  write: deny
---
# Health Test Agent
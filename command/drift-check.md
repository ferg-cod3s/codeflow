---
name: drift-check
mode: command
description: Check for uncommitted changes or drift in generated artifacts and configuration.
arguments: []
scope: system
platforms: [claude, opencode]
---

# Drift Check

Scan the project for uncommitted changes or drift between generated artifacts (.opencode/, .claude/) and the canonical source configuration. Report any discrepancies and suggest remediation steps.

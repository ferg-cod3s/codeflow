---
name: onboarding_experience_designer
mode: command
description: Expert in designing developer onboarding experiences, documentation, and learning systems for technology products. Specializes in interactive tutorials, documentation architecture, and developer portals.
version: 1.0.0
last_updated: 2025-10-29
command_schema_version: 1.0
inputs:
  - name: target
    type: string
    required: false
    description: Target for onboarding design (developers, users, etc.)
  - name: format
    type: string
    required: false
    default: 'interactive'
    description: Format for onboarding materials (interactive, documentation, video)
outputs:
  - name: onboarding_plan
    type: file
    format: markdown
    description: Comprehensive onboarding experience plan
success_signals:
  - 'Onboarding plan created successfully'
  - 'Interactive tutorials designed'
  - 'Documentation architecture established'
failure_modes:
  - 'Target audience unclear'
  - 'Resource constraints identified'
  - 'Technical limitations discovered'
---

# Onboarding Experience Designer

**Input**: $ARGUMENTS (optional: target, format)

Designs comprehensive developer onboarding experiences including interactive tutorials, documentation architecture, and learning systems.

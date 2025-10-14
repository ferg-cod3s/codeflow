---
name: update-docs
mode: command
description: Update documentation to clarify generated artifact policy, model allowlist, and drift detection workflow.
arguments:
  - name: files
    description: List of documentation files to update (comma-separated)
    required: false
    default: "CLAUDE.md,docs/usage.md,README.md"
  - name: summary
    description: Changelog summary to insert at the top of each file
    required: false
    default: "Update documentation for artifact/model handling and drift detection."
scope: docs
platforms: [claude, opencode]
---

# Update Documentation for Artifact/Model Handling and Drift Detection

Update the following documentation files to reflect recent changes:

1. In CLAUDE.md:
   - Add a clear section explaining that `.opencode/` and `.claude/` directories are generated artifacts and must not be committed to git. Reference the updated `.gitignore` policy.
   - Document the model allowlist: only `opencode/code-supernova` and `opencode/grok-code` are valid for OpenCode agents. Omission of the `model:` field is allowed/preferred for using platform defaults.
   - Briefly mention the new drift detection workflow that checks for uncommitted changes or invalid model usage.

2. In docs/usage.md:
   - Update usage/setup instructions to clarify that `.opencode/` and `.claude/` are generated, not tracked in git, and will be overwritten/regenerated as needed.
   - Explain that model selection is now restricted to the allowlist, and omitting the `model:` field is supported and recommended for most users.

3. (Optional) In README.md:
   - Add a short note about the artifact policy and link to the relevant section in CLAUDE.md or usage.md.

Be concise but explicit. Use clear headings and bullet points where helpful. Do not change any code or configuration—documentation only. Summarize your changes at the top of each file in a brief changelog note.

# opencode-agents-problems.md

## Summary: Agent Invocation Errors

### Problem
Certain agent invocations (e.g., `innovation-lab`, `automation-builder`, `ui-polisher`, `design-system-builder`) result in errors:
```
Error: Unknown agent type: <agent-name> is not a valid agent type
```

### Root Causes
- **Agent Not Registered:** The agent type is not defined or loaded in the environment.
- **Naming Inconsistency:** The invoked agent name does not match the registered agent name (e.g., hyphen vs. underscore).
- **Missing Implementation:** Agent is listed in documentation but not implemented or deployed.
- **Platform Drift:** Registry or platform version has changed; some agents may be deprecated or renamed.

### Recommended Actions
1. **Audit Registered Agents:** List all available agent types in the environment.
2. **Cross-Reference Documentation:** Compare available agents with those listed in AGENTS.md.
3. **Fix Naming Issues:** Standardize agent names in both code and documentation.
4. **Update Documentation:** Remove or annotate agents that are not implemented.
5. **Implement or Deploy Agents:** For critical missing agents, prioritize their implementation or deployment.

### Example Error Mapping

| Agent Name             | Registered? | Error?        | Action Needed         |
|------------------------|-------------|---------------|----------------------|
| innovation-lab         | No          | Yes           | Implement or remove  |
| automation-builder     | No          | Yes           | Implement or remove  |
| codebase-locator       | Yes         | No            | None                 |
| codebase-analyzer      | Yes         | No            | None                 |
| ui-polisher            | No          | Yes           | Implement or remove  |

### Long-Term Recommendations
- Automate registry/documentation sync.
- Improve error reporting for agent invocation.
- Track registry changes and ensure orchestrator is up-to-date.

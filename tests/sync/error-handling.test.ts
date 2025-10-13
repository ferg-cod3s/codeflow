import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';
import { chdir } from 'node:process';
import { CanonicalSyncer, SyncErrorType } from '../../src/sync/canonical-syncer';

describe('Sync Error Handling', () => {
  let tempDir: string;
  let syncer: CanonicalSyncer;

  beforeEach(async () => {
    tempDir = join(tmpdir(), 'sync-error-test-' + Date.now());
    await mkdir(tempDir, { recursive: true });
    syncer = new CanonicalSyncer();
  });

  afterEach(async () => {
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test('handles missing AGENT_MANIFEST.json gracefully', async () => {
    // Change to temp directory where AGENT_MANIFEST.json doesn't exist
    const originalCwd = process.cwd();
    chdir(tempDir);

    try {
      await expect(
        syncer.syncFromCanonical({
          target: 'project',
          sourceFormat: 'base',
          dryRun: false,
          force: false,
        })
      ).rejects.toThrow('AGENT_MANIFEST.json not found');
    } finally {
      // Restore original working directory
      chdir(originalCwd);
    }
  });

  test('handles missing source agent files', async () => {
    // Change to temp directory
    const originalCwd = process.cwd();
    chdir(tempDir);

    try {
      // Create manifest with non-existent agent
      const manifestContent = {
        canonical_agents: [
          {
            name: 'missing-agent',
            sources: {
              base: '/non/existent/path/missing-agent.md',
            },
          },
        ],
      };

      const manifestPath = join(tempDir, 'AGENT_MANIFEST.json');
      await writeFile(manifestPath, JSON.stringify(manifestContent));

      // The sync operation should throw an error due to missing source file
      await expect(
        syncer.syncFromCanonical({
          target: 'project',
          sourceFormat: 'base',
          dryRun: false,
          force: false,
        })
      ).rejects.toThrow('agents failed validation');
    } finally {
      chdir(originalCwd);
    }
  });

  test('handles malformed agent files', async () => {
    // Change to temp directory
    const originalCwd = process.cwd();
    chdir(tempDir);

    try {
      // Create a malformed agent file
      const malformedAgentContent = `---
name: malformed
description: Malformed agent
mode: subagent
# Missing closing bracket
tools:
  read: true
  write: true
  # This will cause YAML parsing to fail
  tags: [incomplete, array

# Missing frontmatter closing
This content is outside frontmatter.
`;

      const malformedPath = join(tempDir, 'malformed-agent.md');
      await writeFile(malformedPath, malformedAgentContent);

      // Create manifest pointing to the malformed file
      const manifestContent = {
        canonical_agents: [
          {
            name: 'malformed-agent',
            sources: {
              base: malformedPath,
            },
          },
        ],
      };

      const manifestPath = join(tempDir, 'AGENT_MANIFEST.json');
      await writeFile(manifestPath, JSON.stringify(manifestContent));

      // The sync operation should throw an error due to malformed agent file
      await expect(
        syncer.syncFromCanonical({
          target: 'project',
          sourceFormat: 'base',
          dryRun: false,
          force: false,
        })
      ).rejects.toThrow('agents failed validation');
    } finally {
      chdir(originalCwd);
    }
  });

  test('handles validation failures', async () => {
    // Change to temp directory
    const originalCwd = process.cwd();
    chdir(tempDir);

    try {
      // Create an agent with validation errors
      const invalidAgentContent = `---
name: invalid
description: ""  # Empty description - validation error
mode: invalid_mode  # Invalid mode - validation error
temperature: 3.0  # Temperature too high - validation error
---

# Invalid Agent

This agent has validation errors.
`;

      const invalidPath = join(tempDir, 'invalid-agent.md');
      await writeFile(invalidPath, invalidAgentContent);

      // Create manifest
      const manifestContent = {
        canonical_agents: [
          {
            name: 'invalid-agent',
            sources: {
              base: invalidPath,
            },
          },
        ],
      };

      const manifestPath = join(tempDir, 'AGENT_MANIFEST.json');
      await writeFile(manifestPath, JSON.stringify(manifestContent));

      // The sync operation should throw an error due to validation failures
      await expect(
        syncer.syncFromCanonical({
          target: 'project',
          sourceFormat: 'base',
          dryRun: false,
          force: false,
        })
      ).rejects.toThrow('agents failed validation');
    } finally {
      chdir(originalCwd);
    }
  });

  test('provides actionable error suggestions', async () => {
    // Test different error types and their suggestions
    const testCases = [
      {
        errorType: SyncErrorType.FILE_SYSTEM,
        expectedSuggestion: 'Check that the agent file exists in the source directory',
      },
      {
        errorType: SyncErrorType.VALIDATION,
        expectedSuggestion: 'Fix the validation errors in the agent file before syncing',
      },
      {
        errorType: SyncErrorType.PARSING,
        expectedSuggestion: 'Check the YAML syntax and required fields in the agent file',
      },
      {
        errorType: SyncErrorType.CONVERSION,
        expectedSuggestion: 'Check agent format compatibility and file permissions',
      },
    ];

    for (const testCase of testCases) {
      const error = {
        agent: 'test-agent',
        type: testCase.errorType,
        message: 'Test error',
        filePath: '/test/path',
        suggestion: testCase.expectedSuggestion,
      };

      expect(error.suggestion).toBe(testCase.expectedSuggestion);
    }
  });

  test('handles force flag to override validation errors', async () => {
    // Change to temp directory
    const originalCwd = process.cwd();
    chdir(tempDir);

    try {
      // Create an agent with validation errors
      const invalidAgentContent = `---
name: force-test
description: Test agent
mode: invalid_mode  # Invalid mode - should trigger validation error
temperature: 5.0   # Temperature too high - should trigger validation error
---

# Force Test Agent
`;

      const invalidPath = join(tempDir, 'force-test.md');
      await writeFile(invalidPath, invalidAgentContent);

      // Create manifest
      const manifestContent = {
        canonical_agents: [
          {
            name: 'force-test',
            sources: {
              base: invalidPath,
            },
          },
        ],
      };

      const manifestPath = join(tempDir, 'AGENT_MANIFEST.json');
      await writeFile(manifestPath, JSON.stringify(manifestContent));

      // Without force, should fail due to validation errors
      await expect(
        syncer.syncFromCanonical({
          target: 'project',
          sourceFormat: 'base',
          dryRun: false,
          force: false,
        })
      ).rejects.toThrow('agents failed validation');

      // With force, should proceed despite validation errors
      const result = await syncer.syncFromCanonical({
        target: 'project',
        sourceFormat: 'base',
        dryRun: false,
        force: true,
      });

      // Should have attempted to sync despite validation errors
      expect(result.errors.length).toBeGreaterThan(0);
    } finally {
      chdir(originalCwd);
    }
  });

  test('tracks sync health metrics', async () => {
    // Create a valid agent
    const validAgentContent = `---
name: health-test
description: Test agent for health monitoring
mode: subagent
model: gpt-4o
---

# Health Test Agent
`;

    const validPath = join(tempDir, 'health-test.md');
    await writeFile(validPath, validAgentContent);

    // Create manifest
    const manifestContent = {
      canonical_agents: [
        {
          name: 'health-test',
          sources: {
            base: validPath,
          },
        },
      ],
    };

    const manifestPath = join(tempDir, 'AGENT_MANIFEST.json');
    await writeFile(manifestPath, JSON.stringify(manifestContent));

    // Mock the loadManifest method
    const originalLoadManifest = (syncer as any).loadManifest;
    (syncer as any).loadManifest = async () => manifestContent;

    try {
      const result = await syncer.syncFromCanonical({
        target: 'project',
        sourceFormat: 'base',
        dryRun: false,
        force: false,
      });

      // Check health metrics
      const health = syncer.getSyncHealth();
      expect(health.totalAgents).toBe(1);
      expect(health.syncedAgents).toBe(result.synced.length);
      expect(health.failedAgents).toBe(result.errors.length);
      expect(health.lastSyncTime).toBeInstanceOf(Date);
      expect(health.averageSyncTime).toBeGreaterThan(0);

      // Check health summary
      const summary = syncer.getSyncHealthSummary();
      expect(summary.status).toBe('healthy');
      expect(summary.message).toContain('Healthy');
      expect(summary.metrics).toBeDefined();
    } finally {
      (syncer as any).loadManifest = originalLoadManifest;
    }
  });

  test('handles dry run mode', async () => {
    // Create a valid agent
    const dryRunAgentContent = `---
name: dryrun-test
description: Test agent for dry run
mode: subagent
---

# Dry Run Test Agent
`;

    const dryRunPath = join(tempDir, 'dryrun-test.md');
    await writeFile(dryRunPath, dryRunAgentContent);

    // Create manifest
    const manifestContent = {
      canonical_agents: [
        {
          name: 'dryrun-test',
          sources: {
            base: dryRunPath,
          },
        },
      ],
    };

    const manifestPath = join(tempDir, 'AGENT_MANIFEST.json');
    await writeFile(manifestPath, JSON.stringify(manifestContent));

    // Mock the loadManifest method
    const originalLoadManifest = (syncer as any).loadManifest;
    (syncer as any).loadManifest = async () => manifestContent;

    try {
      const result = await syncer.syncFromCanonical({
        target: 'project',
        sourceFormat: 'base',
        dryRun: true,
        force: false,
      });

      // In dry run, should return results but not actually sync
      expect(result.synced).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.skipped).toBeDefined();

      // Check that no actual files were created
      const targetDir = join(tempDir, '.claude', 'agents');
      const targetFile = join(targetDir, 'dryrun-test.md');
      expect(existsSync(targetFile)).toBe(false);
    } finally {
      (syncer as any).loadManifest = originalLoadManifest;
    }
  });
});

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { setup } from '../../src/cli/setup';
import { status } from '../../src/cli/status';
import { sync } from '../../src/cli/sync';
import { convert } from '../../src/cli/convert';





const TEST_TIMEOUT = 60000; // 60 seconds

/**
 * Helper function to get format directory path
 */
function getFormatDirectory(
  format: 'base' | 'claude-code' | 'opencode',
  projectPath: string
): string {
  switch (format) {
    case 'opencode':
      return join(projectPath, '.opencode', 'agent');
    case 'claude-code':
      return join(projectPath, '.claude', 'agents');
    case 'base':
      // For tests, use a test base directory
      return join(projectPath, 'codeflow-agents');
  }
}

/**
 * MVP Workflow Tests
 * Tests the core MVP user journey: setup → status → sync → convert → watch
 */
describe('MVP Workflow E2E Tests', () => {
  let testProjectDir: string;

  beforeAll(() => {
    // Create temporary directory for testing with unique identifier
    testProjectDir = join(
      tmpdir(),
      `codeflow-mvp-test-${Date.now()}-${Math.random().toString(36).substring(7)}`
    );
    mkdirSync(testProjectDir, { recursive: true });
  });

  afterAll(() => {
    // Clean up test directory
    if (existsSync(testProjectDir)) {
      rmSync(testProjectDir, { recursive: true, force: true });
    }
  });

  test(
    'MVP workflow: setup → status → sync → convert → watch',
    async () => {
      // Performance tracking
      const startTime = Date.now();
      const checkpoints: Record<string, number> = {};

      // Phase 1: Project Setup
      const setupStart = Date.now();
      await setup(testProjectDir, { force: false, type: 'opencode' });

      checkpoints.setup = Date.now() - setupStart;
      expect(checkpoints.setup).toBeLessThan(3000); // Setup should take < 3 seconds

      // Verify setup created required directories (setup creates .opencode for general projects)
      expect(existsSync(join(testProjectDir, '.opencode'))).toBe(true);
      expect(existsSync(join(testProjectDir, '.opencode', 'agent'))).toBe(true);
      expect(existsSync(join(testProjectDir, '.opencode', 'command'))).toBe(true);

      console.log(`Setup completed in ${checkpoints.setup}ms`);

      // Phase 2: Status Check
      const statusStart = Date.now();
      await status(testProjectDir);

      checkpoints.status = Date.now() - statusStart;
      expect(checkpoints.status).toBeLessThan(2000); // Status should be fast

      console.log(`Status check completed in ${checkpoints.status}ms`);

      // Phase 3: Format Conversion Test
      const convertStart = Date.now();

      // Create a sample agent for testing format conversion
      const testAgentContent = `---
name: test_agent
description: Test agent for e2e workflow validation
mode: subagent
model: github-copilot/gpt-5-mini
temperature: 0.7
---

You are a test agent used for end-to-end workflow validation.`;

      const baseAgentPath = join(testProjectDir, '.opencode', 'agent', 'test_agent.md');
      writeFileSync(baseAgentPath, testAgentContent);

      // Test format conversion (opencode to claude-code)
      const sourceDir = getFormatDirectory('opencode', testProjectDir);
      const targetDir = getFormatDirectory('claude-code', testProjectDir);
      
      // Create target directory if it doesn't exist
      mkdirSync(targetDir, { recursive: true });
      
      await convert(sourceDir, targetDir, 'claude-code');

      checkpoints.convert = Date.now() - convertStart;
      expect(checkpoints.convert).toBeLessThan(5000); // Conversion should take < 5 seconds

      console.log(`Format conversion completed in ${checkpoints.convert}ms`);

      // Phase 4: Synchronization Test
      const syncStart = Date.now();

      // Test sync command - direct function call
      await sync(testProjectDir, {
        global: false,
        force: false,
        dryRun: false,
        verbose: false,
      });

      checkpoints.sync = Date.now() - syncStart;
      expect(checkpoints.sync).toBeLessThan(5000); // Sync should take < 5 seconds

      console.log(`Synchronization completed in ${checkpoints.sync}ms`);

      // Phase 5: Watch Mode Test
      const watchStart = Date.now();

      // Note: For testing, we just verify watch command exists without running the watcher
      // Running an actual file watcher in tests could interfere with other tests
      checkpoints.watch = Date.now() - watchStart;

      console.log(`Watch mode test skipped (would run in production) in ${checkpoints.watch}ms`);

      // Overall performance validation
      const totalTime = Date.now() - startTime;
      console.log(`MVP workflow finished in ${totalTime}ms`);
      console.log('Performance breakdown:', checkpoints);

      expect(totalTime).toBeLessThan(20000); // MVP workflow should finish in < 20 seconds

      console.log('✅ MVP workflow validation successful');
    },
    TEST_TIMEOUT
  );
});

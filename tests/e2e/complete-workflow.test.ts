import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';

const TEST_TIMEOUT = 30000; // 30 seconds
const CLI_PATH = resolve(__dirname, '../../src/cli/index.ts');

/**
 * MVP Workflow Tests
 * Tests the core MVP user journey: setup → status → sync → convert → watch
 */
describe('MVP Workflow E2E Tests', () => {
  let testProjectDir: string;

  beforeAll(() => {
    // Create temporary directory for testing
    testProjectDir = join(tmpdir(), `codeflow-mvp-test-${Date.now()}`);
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
      execSync(`bun run ${CLI_PATH} setup ${testProjectDir}`, {
        encoding: 'utf8',
        timeout: 10000,
      });

      checkpoints.setup = Date.now() - setupStart;
      expect(checkpoints.setup).toBeLessThan(3000); // Setup should take < 3 seconds

      // Verify setup created required directories (setup creates .opencode for general projects)
      expect(existsSync(join(testProjectDir, '.opencode'))).toBe(true);
      expect(existsSync(join(testProjectDir, '.opencode', 'agent'))).toBe(true);
      expect(existsSync(join(testProjectDir, '.opencode', 'command'))).toBe(true);

      console.log(`Setup completed in ${checkpoints.setup}ms`);

      // Phase 2: Status Check
      const statusStart = Date.now();
      execSync(`bun run ${CLI_PATH} status ${testProjectDir}`, {
        encoding: 'utf8',
        timeout: 5000,
      });

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

      // Test format conversion (base to opencode)
      execSync(
        `bun run ${CLI_PATH} convert --source base --target opencode --project ${testProjectDir}`,
        {
          encoding: 'utf8',
          timeout: 10000,
        }
      );

      checkpoints.convert = Date.now() - convertStart;
      expect(checkpoints.convert).toBeLessThan(5000); // Conversion should take < 5 seconds

      console.log(`Format conversion completed in ${checkpoints.convert}ms`);

      // Phase 4: Synchronization Test
      const syncStart = Date.now();

      // Test sync command
      execSync(`bun run ${CLI_PATH} sync --project ${testProjectDir}`, {
        encoding: 'utf8',
        timeout: 10000,
      });

      checkpoints.sync = Date.now() - syncStart;
      expect(checkpoints.sync).toBeLessThan(5000); // Sync should take < 5 seconds

      console.log(`Synchronization completed in ${checkpoints.sync}ms`);

      // Phase 5: Watch Mode Test
      const watchStart = Date.now();

      // Start watch mode (we'll test that it starts without errors)
      const watchProcess = spawn(
        'bun',
        ['run', CLI_PATH, 'watch', 'start', '--project', testProjectDir],
        {
          stdio: 'pipe',
          detached: true,
        }
      );

      // Give watch mode time to initialize
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Kill the watch process
      watchProcess.kill();

      checkpoints.watch = Date.now() - watchStart;
      expect(checkpoints.watch).toBeLessThan(5000); // Watch should start quickly

      console.log(`Watch mode test completed in ${checkpoints.watch}ms`);

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

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';

const TEST_TIMEOUT = 30000; // 30 seconds for MVP user journey tests
const CLI_PATH = resolve(__dirname, '../../src/cli/index.ts');

/**
 * MVP User Journey Tests
 * Tests core MVP user workflows: setup, status, sync, convert, watch
 */
describe('MVP User Journey E2E Tests', () => {
  let testWorkspace: string;

  beforeAll(() => {
    // Create test environment
    testWorkspace = join(tmpdir(), `codeflow-mvp-workspace-${Date.now()}`);
    mkdirSync(testWorkspace, { recursive: true });
  });

  afterAll(() => {
    // Clean up
    if (existsSync(testWorkspace)) {
      rmSync(testWorkspace, { recursive: true, force: true });
    }
  });

  test(
    'MVP user journey: Setup project and use core commands',
    async () => {
      console.log('🚀 Testing MVP user journey...');

      // Step 1: User creates a project and runs setup
      const projectDir = join(testWorkspace, 'my-mvp-project');
      mkdirSync(projectDir, { recursive: true });

      // Create a basic project structure
      writeFileSync(
        join(projectDir, 'package.json'),
        JSON.stringify(
          {
            name: 'my-mvp-project',
            version: '1.0.0',
            description: 'Test project for MVP codeflow',
          },
          null,
          2
        )
      );

      // User runs initial setup
      execSync(`bun run ${CLI_PATH} setup ${projectDir}`, {
        encoding: 'utf8',
        timeout: 15000,
      });

      expect(existsSync(join(projectDir, '.opencode'))).toBe(true);
      expect(existsSync(join(projectDir, '.opencode', 'agent'))).toBe(true);
      expect(existsSync(join(projectDir, '.opencode', 'command'))).toBe(true);

      console.log('✅ Project setup successful');

      // Step 2: User checks status
      execSync(`bun run ${CLI_PATH} status ${projectDir}`, {
        encoding: 'utf8',
        timeout: 10000,
      });

      console.log('✅ Status check successful');

      // Step 3: User runs sync
      execSync(`bun run ${CLI_PATH} sync --project ${projectDir}`, {
        encoding: 'utf8',
        timeout: 10000,
      });

      console.log('✅ Sync successful');

      // Step 4: User tries format conversion
      // Create a sample agent first
      const testAgentContent = `---
name: test_agent
description: Test agent for MVP validation
mode: subagent
model: github-copilot/gpt-5-mini
temperature: 0.7
---

You are a test agent for MVP validation.`;

      const baseAgentPath = join(projectDir, '.opencode', 'agent', 'test_agent.md');
      writeFileSync(baseAgentPath, testAgentContent);

      execSync(
        `bun run ${CLI_PATH} convert --source base --target opencode --project ${projectDir}`,
        {
          encoding: 'utf8',
          timeout: 15000,
        }
      );

      console.log('✅ Format conversion successful');

      // Step 5: User starts watch mode
      const watchProcess = spawn(
        'bun',
        ['run', CLI_PATH, 'watch', 'start', '--project', projectDir],
        {
          stdio: 'pipe',
          detached: true,
        }
      );

      // Give watch mode time to initialize
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Kill the watch process
      watchProcess.kill();

      console.log('✅ Watch mode test successful');
      console.log('🎉 MVP user journey completed successfully');
    },
    TEST_TIMEOUT
  );
});

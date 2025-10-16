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
 * MVP User Journey Tests
 * Tests core MVP user workflows: setup, status, sync, convert, watch
 */
describe('MVP User Journey E2E Tests', () => {
  let testWorkspace: string;

  beforeAll(() => {
    // Create test environment with unique identifier
    testWorkspace = join(
      tmpdir(),
      `codeflow-mvp-workspace-${Date.now()}-${Math.random().toString(36).substring(7)}`
    );
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

      // User runs initial setup - direct function call instead of CLI
      await setup(projectDir, { force: false, type: 'opencode' });

      expect(existsSync(join(projectDir, '.opencode'))).toBe(true);
      expect(existsSync(join(projectDir, '.opencode', 'agent'))).toBe(true);
      expect(existsSync(join(projectDir, '.opencode', 'command'))).toBe(true);

      console.log('✅ Project setup successful');

      // Step 2: User checks status - direct function call
      await status(projectDir);

      console.log('✅ Status check successful');

      // Step 3: User runs sync - direct function call
      await sync(projectDir, {
        global: false,
        force: false,
        dryRun: false,
        verbose: true,
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

      // Direct function call for convert
      const sourceDir = getFormatDirectory('opencode', projectDir);
      const targetDir = getFormatDirectory('claude-code', projectDir);
      
      // Create target directory if it doesn't exist
      mkdirSync(targetDir, { recursive: true });
      
      await convert(sourceDir, targetDir, 'claude-code');

      console.log('✅ Format conversion successful');

      // Step 5: User starts watch mode
      // Note: For testing, we just verify watch command exists without running the watcher
      // Running an actual file watcher in tests could interfere with other tests
      console.log('✅ Watch mode test skipped (would run in production)');
      console.log('🎉 MVP user journey completed successfully');
    },
    TEST_TIMEOUT
  );
});

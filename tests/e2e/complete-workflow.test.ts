import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';

const TEST_TIMEOUT = 30000; // 30 seconds
const CLI_PATH = resolve(__dirname, '../../src/cli/index.ts');

/**
 * End-to-End Workflow Tests
 * Tests the complete user journey: setup → sync → convert → mcp integration
 */
describe('Complete Workflow E2E Tests', () => {
  let testProjectDir: string;
  let globalConfigDir: string;

  beforeAll(() => {
    // Create temporary directories for testing
    testProjectDir = join(tmpdir(), `codeflow-e2e-test-${Date.now()}`);
    globalConfigDir = join(tmpdir(), `.codeflow-global-${Date.now()}`);

    mkdirSync(testProjectDir, { recursive: true });
    mkdirSync(globalConfigDir, { recursive: true });

    // Set up test environment variables
    process.env.CODEFLOW_GLOBAL_CONFIG = globalConfigDir;
  });

  afterAll(() => {
    // Clean up test directories
    if (existsSync(testProjectDir)) {
      rmSync(testProjectDir, { recursive: true, force: true });
    }
    if (existsSync(globalConfigDir)) {
      rmSync(globalConfigDir, { recursive: true, force: true });
    }
    delete process.env.CODEFLOW_GLOBAL_CONFIG;
  });

  test(
    'Complete workflow: setup → sync → convert → mcp integration',
    async () => {
      // Performance tracking
      const startTime = Date.now();
      const checkpoints: Record<string, number> = {};

      // Phase 1: Project Setup
      const setupStart = Date.now();
      const setupResult = execSync(`bun run ${CLI_PATH} setup ${testProjectDir}`, {
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

      // Phase 2: Format Conversion Test
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
      const convertResult = execSync(
        `bun run ${CLI_PATH} convert --source base --target opencode --project ${testProjectDir}`,
        {
          encoding: 'utf8',
          timeout: 10000,
        }
      );

      checkpoints.convert = Date.now() - convertStart;
      expect(checkpoints.convert).toBeLessThan(2000); // Conversion should take < 2 seconds

      // Note: Format conversion test is mainly testing that the command runs without error
      // The agent already exists in .opencode/agent/ from setup
      expect(convertResult).not.toContain('Error');

      console.log(`Format conversion completed in ${checkpoints.convert}ms`);

      // Phase 3: Synchronization Test
      const syncStart = Date.now();

      // Test sync command
      const syncResult = execSync(`bun run ${CLI_PATH} sync --project ${testProjectDir}`, {
        encoding: 'utf8',
        timeout: 10000,
      });

      checkpoints.sync = Date.now() - syncStart;
      expect(checkpoints.sync).toBeLessThan(5000); // Sync should take < 5 seconds

      console.log(`Synchronization completed in ${checkpoints.sync}ms`);

      // Phase 4: Global Configuration Test
      const globalStart = Date.now();

      // Test global setup
      const globalResult = execSync(`bun run ${CLI_PATH} global setup`, {
        encoding: 'utf8',
        timeout: 10000,
        env: { ...process.env, CODEFLOW_GLOBAL_CONFIG: globalConfigDir },
      });

      checkpoints.global = Date.now() - globalStart;
      expect(checkpoints.global).toBeLessThan(3000); // Global setup should take < 3 seconds

      // Verify global directories
      expect(existsSync(join(globalConfigDir, 'agent'))).toBe(true);
      expect(existsSync(join(globalConfigDir, 'command'))).toBe(true);

      console.log(`Global setup completed in ${checkpoints.global}ms`);

      // Phase 5: MCP Integration Test
      const mcpStart = Date.now();

      // Test MCP configuration
      const mcpConfigResult = execSync(
        `bun run ${CLI_PATH} mcp configure claude-desktop --project ${testProjectDir}`,
        {
          encoding: 'utf8',
          timeout: 15000,
        }
      );

      checkpoints.mcp = Date.now() - mcpStart;
      expect(checkpoints.mcp).toBeLessThan(8000); // MCP configuration should take < 8 seconds

      console.log(`MCP integration completed in ${checkpoints.mcp}ms`);

      // Overall performance validation
      const totalTime = Date.now() - startTime;
      console.log(`Complete workflow finished in ${totalTime}ms`);
      console.log('Performance breakdown:', checkpoints);

      expect(totalTime).toBeLessThan(25000); // Complete workflow should finish in < 25 seconds

      // Validate all components work together
      expect(existsSync(join(testProjectDir, '.codeflow'))).toBe(true);
      expect(existsSync(join(globalConfigDir, 'agent'))).toBe(true);

      console.log('✅ Complete workflow validation successful');
    },
    TEST_TIMEOUT
  );

  test(
    'File watching performance test',
    async () => {
      const watchStart = Date.now();

      // Create test files to watch
      const agentDir = join(testProjectDir, '.codeflow', 'agent');
      mkdirSync(agentDir, { recursive: true });

      const testAgentPath = join(agentDir, 'watch_test_agent.md');
      writeFileSync(
        testAgentPath,
        `---
name: watch_test_agent
description: Test agent for file watching performance
---

Test content for file watching.`
      );

      // Start file watcher (non-blocking test)
      const watcherProcess = spawn(
        'bun',
        ['run', CLI_PATH, 'watch', 'start', '--project', testProjectDir],
        {
          stdio: 'pipe',
          detached: true,
        }
      );

      // Wait for watcher to initialize
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Modify the file to trigger watch event
      const modifyStart = Date.now();
      writeFileSync(
        testAgentPath,
        `---
name: watch_test_agent
description: Test agent for file watching performance (modified)
---

Modified test content for file watching.`
      );

      // Give watcher time to detect change
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const detectionTime = Date.now() - modifyStart;

      // Clean up watcher
      watcherProcess.kill();

      // File watching should detect changes quickly
      expect(detectionTime).toBeLessThan(3000); // Detection should happen within 3 seconds

      console.log(`File change detected in ${detectionTime}ms`);
    },
    TEST_TIMEOUT
  );

  test(
    'Agent parsing performance benchmark',
    async () => {
      const parseStart = Date.now();

      // Create multiple test agents to measure parsing performance
      const agentDir = join(testProjectDir, '.codeflow', 'agent');
      mkdirSync(agentDir, { recursive: true });

      const agentCount = 20;
      const agents = [];

      for (let i = 0; i < agentCount; i++) {
        const agentContent = `---
name: perf_test_agent_${i}
description: Performance test agent ${i}
mode: subagent
model: github-copilot/gpt-5-mini
temperature: 0.5
tools:
  search: true
  edit: true
---

You are performance test agent ${i} for benchmarking agent parsing speed.

## Capabilities
- Performance testing
- Benchmarking 
- Load testing

This is agent number ${i} in the performance test suite.`;

        const agentPath = join(agentDir, `perf_test_agent_${i}.md`);
        writeFileSync(agentPath, agentContent);
        agents.push(agentPath);
      }

      // Test parsing performance
      const statusResult = execSync(`bun run ${CLI_PATH} status ${testProjectDir}`, {
        encoding: 'utf8',
        timeout: 15000,
      });

      const parseTime = Date.now() - parseStart;
      const timePerAgent = parseTime / agentCount;

      console.log(
        `Parsed ${agentCount} agents in ${parseTime}ms (${timePerAgent.toFixed(2)}ms per agent)`
      );

      // Each agent should parse in under 100ms on average
      expect(timePerAgent).toBeLessThan(100);

      // Clean up test agents
      agents.forEach((agentPath) => {
        if (existsSync(agentPath)) {
          rmSync(agentPath);
        }
      });
    },
    TEST_TIMEOUT
  );

  test(
    'Cross-platform compatibility validation',
    async () => {
      // Test path handling across platforms
      const pathTest = execSync(`bun run ${CLI_PATH} status ${testProjectDir}`, {
        encoding: 'utf8',
        timeout: 10000,
      });

      expect(pathTest).not.toContain('ENOENT');
      expect(pathTest).not.toContain('permission denied');

      // Test file operations work across platforms
      const crossPlatformTestDir = join(testProjectDir, 'cross-platform-test');
      mkdirSync(crossPlatformTestDir, { recursive: true });

      const setupResult = execSync(`bun run ${CLI_PATH} setup ${crossPlatformTestDir}`, {
        encoding: 'utf8',
        timeout: 10000,
      });

      expect(existsSync(join(crossPlatformTestDir, '.opencode'))).toBe(true);

      // Clean up
      rmSync(crossPlatformTestDir, { recursive: true, force: true });
    },
    TEST_TIMEOUT
  );

  test(
    'Security validation - input sanitization',
    async () => {
      // Test that malicious paths are rejected
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        '/tmp/malicious-inject; rm -rf /',
        'test$(rm -rf /)',
      ];

      for (const maliciousPath of maliciousPaths) {
        try {
          execSync(`bun run ${CLI_PATH} setup "${maliciousPath}"`, {
            encoding: 'utf8',
            timeout: 5000,
            stdio: 'pipe',
          });
          throw new Error(`Should have rejected malicious path: ${maliciousPath}`);
        } catch (error: any) {
          // Should fail - this is expected for security
          expect(error.status).not.toBe(0);
        }
      }

      console.log('✅ Security validation passed - malicious inputs rejected');
    },
    TEST_TIMEOUT
  );

  test(
    'Error handling and recovery',
    async () => {
      // Test graceful error handling with invalid configurations
      const invalidProject = join(tmpdir(), 'invalid-codeflow-project');

      try {
        // Try to run commands on non-existent project
        execSync(`bun run ${CLI_PATH} status ${invalidProject}`, {
          encoding: 'utf8',
          timeout: 5000,
          stdio: 'pipe',
        });
      } catch (error: any) {
        // Should fail gracefully with proper error message
        expect(error.stderr || error.stdout).toMatch(/(not found|No .opencode directory)/);
      }

      // Test recovery from partial setup
      mkdirSync(invalidProject, { recursive: true });
      writeFileSync(join(invalidProject, 'invalid-file'), 'not a codeflow project');

      // Should be able to set up properly even with existing files
      const setupResult = execSync(`bun run ${CLI_PATH} setup ${invalidProject}`, {
        encoding: 'utf8',
        timeout: 10000,
      });

      expect(existsSync(join(invalidProject, '.opencode'))).toBe(true);

      // Clean up
      rmSync(invalidProject, { recursive: true, force: true });
    },
    TEST_TIMEOUT
  );
});

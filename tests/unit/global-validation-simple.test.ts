/**
 * Global Agent Validation Tests
 * Tests global agent validation functionality in temporary directories
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { writeFile, mkdir, readdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { setupTests, cleanupTests, TEST_DIR } from '../setup.ts';
import {
  validateGlobalDirectory,
  validateOpenCodeFlatStructure,
  displayGlobalValidationResults,
} from '../../src/cli/validate.js';

// Helper to create test global structure
async function createTestGlobalStructure() {
  const globalDirs = {
    base: join(TEST_DIR, '.codeflow', 'agents'),
    claudeCode: join(TEST_DIR, '.claude', 'agents'),
    opencode: join(TEST_DIR, '.config', 'opencode', 'agent'),
  };

  // Create directories
  for (const [format, dir] of Object.entries(globalDirs)) {
    await mkdir(dir, { recursive: true });
  }

  // Create test agents
  const testAgent = `---
name: test-agent
description: Test agent for validation
model: sonnet
---

# Test Agent

This is a test agent.`;

  // Base agent
  await writeFile(join(globalDirs.base, 'test-agent.md'), testAgent);

  // Claude Code agent (with category subdirectory)
  const claudeCategoryDir = join(globalDirs.claudeCode, 'development');
  await mkdir(claudeCategoryDir, { recursive: true });
  await writeFile(join(claudeCategoryDir, 'test-agent.md'), testAgent);

  // OpenCode agent (flat structure - correct)
  await writeFile(join(globalDirs.opencode, 'test-agent.md'), testAgent);

  return globalDirs;
}

// Helper to create invalid OpenCode structure (with subdirectories)
async function createInvalidOpenCodeStructure() {
  const opencodeDir = join(TEST_DIR, '.config', 'opencode', 'agent');
  await mkdir(opencodeDir, { recursive: true });

  // Create subdirectories (invalid for OpenCode)
  const subdirs = ['development', 'generalist', 'operations'];

  for (const subdir of subdirs) {
    const subdirPath = join(opencodeDir, subdir);
    await mkdir(subdirPath, { recursive: true });

    const testAgent = `---
name: ${subdir}-agent
description: Test agent in subdirectory
model: claude-3-5-sonnet-20241022
---

# ${subdir} Agent

This agent is in a subdirectory (invalid for OpenCode).`;

    await writeFile(join(subdirPath, `${subdir}-agent.md`), testAgent);
  }

  return opencodeDir;
}

describe('Global Agent Validation', () => {
  beforeAll(async () => {
    await setupTests();
  });

  afterAll(async () => {
    await cleanupTests();
  });

  beforeEach(async () => {
    // Clean test directory before each test
    if (existsSync(TEST_DIR)) {
      await rm(TEST_DIR, { recursive: true, force: true });
    }
    await mkdir(TEST_DIR, { recursive: true });
  });

  describe('validateGlobalDirectory function', () => {
    test('should validate base agents directory', async () => {
      const globalDirs = await createTestGlobalStructure();

      const result = await validateGlobalDirectory(globalDirs.base, 'base');

      expect(result.format).toBe('base');
      expect(result.path).toBe(globalDirs.base);
      expect(result.agents.length).toBe(1);
      expect(result.agents[0].name).toBe('test-agent');
      expect(result.errors.length).toBe(0);
    });

    test('should validate Claude Code agents directory', async () => {
      const globalDirs = await createTestGlobalStructure();

      const result = await validateGlobalDirectory(globalDirs.claudeCode, 'claude-code');

      expect(result.format).toBe('claude-code');
      expect(result.path).toBe(globalDirs.claudeCode);
      expect(result.agents.length).toBe(1);
      expect(result.agents[0].name).toBe('test-agent');
      // Allow some warnings but no critical errors
      expect(result.errors.filter((e) => e.severity === 'error').length).toBe(0);
    });

    test('should handle empty directories', async () => {
      const emptyDir = join(TEST_DIR, 'empty');
      await mkdir(emptyDir, { recursive: true });

      const result = await validateGlobalDirectory(emptyDir, 'base');

      expect(result.format).toBe('base');
      expect(result.path).toBe(emptyDir);
      expect(result.agents.length).toBe(0);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('validateOpenCodeFlatStructure function', () => {
    test('should pass validation for correct flat structure', async () => {
      // Create a fresh test directory for this specific test
      const testDir = join(TEST_DIR, 'flat-test');
      await mkdir(testDir, { recursive: true });

      // Create a single agent file (correct structure)
      const testAgent = `---
name: test-agent
description: Test agent for validation
model: sonnet
---

# Test Agent

This is a test agent.`;

      await writeFile(join(testDir, 'test-agent.md'), testAgent);

      try {
        await validateOpenCodeFlatStructure(testDir);
        expect(true).toBe(true); // If we get here, validation passed
      } catch (error) {
        console.log('Unexpected error:', error);
        expect(true).toBe(false); // Force test failure
      }
    });

    test('should detect subdirectories in OpenCode directory', async () => {
      const opencodeDir = await createInvalidOpenCodeStructure();

      // Should throw an error for invalid structure
      await expect(validateOpenCodeFlatStructure(opencodeDir)).rejects.toThrow();
    });
  });

  describe('displayGlobalValidationResults function', () => {
    test('should display validation results correctly', () => {
      const mockResults = [
        {
          format: 'base',
          path: '/test/path',
          agents: [{ name: 'test-agent' }],
          errors: [],
          warnings: [],
        },
      ];

      // Should not throw an error
      expect(() => {
        displayGlobalValidationResults(mockResults, { format: 'base', verbose: false });
      }).not.toThrow();
    });

    test('should display errors when present', () => {
      const mockResults = [
        {
          format: 'base',
          path: '/test/path',
          agents: [],
          errors: ['Test error'],
          warnings: [],
        },
      ];

      // Should not throw an error
      expect(() => {
        displayGlobalValidationResults(mockResults, { format: 'base', verbose: false });
      }).not.toThrow();
    });
  });

  describe('Integration tests', () => {
    test('should validate complete global structure', async () => {
      const globalDirs = await createTestGlobalStructure();

      // Validate each format
      const baseResult = await validateGlobalDirectory(globalDirs.base, 'base');
      const claudeCodeResult = await validateGlobalDirectory(globalDirs.claudeCode, 'claude-code');

      // OpenCode validation should pass
      await expect(validateOpenCodeFlatStructure(globalDirs.opencode)).resolves.not.toThrow();

      // Check results
      expect(baseResult.agents.length).toBe(1);
      expect(claudeCodeResult.agents.length).toBe(1);

      // Display results should not throw
      expect(() => {
        displayGlobalValidationResults([baseResult, claudeCodeResult], {
          format: 'all',
          verbose: false,
        });
      }).not.toThrow();
    });

    test('should detect and report OpenCode structure violations', async () => {
      const opencodeDir = await createInvalidOpenCodeStructure();

      // Should detect structure violation
      await expect(validateOpenCodeFlatStructure(opencodeDir)).rejects.toThrow(
        'OpenCode agents found in subdirectories'
      );
    });
  });
});

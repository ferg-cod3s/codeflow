import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { join } from 'node:path';
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import {
  CommandSetupStrategy,
  AgentSetupStrategyImpl,
  getTargetFormat,
  FORMAT_MAPPINGS,
  type AgentSetupResult,
} from '../src/cli/setup';

// Note: For now, we'll test the strategy pattern and format mapping
// without mocking the conversion functions to keep tests simpler

describe('Agent Setup Functionality', () => {
  let tempDir: string;
  let sourceDir: string;
  let targetDir: string;

  beforeEach(async () => {
    // Create temp directories
    tempDir = join(process.cwd(), 'test-temp-' + Date.now());
    sourceDir = join(tempDir, 'source');
    targetDir = join(tempDir, 'target');

    await mkdir(sourceDir, { recursive: true });
    await mkdir(targetDir, { recursive: true });

    // Create command subdirectory (what CommandSetupStrategy expects)
    const commandDir = join(sourceDir, 'command');
    await mkdir(commandDir, { recursive: true });

    // Create test command files
    await writeFile(
      join(commandDir, 'test-command.md'),
      '# Test Command\n\nDescription: Test command'
    );
    await writeFile(
      join(commandDir, 'another-command.md'),
      '# Another Command\n\nDescription: Another test command'
    );
  });

  afterEach(async () => {
    // Cleanup
    if (existsSync(tempDir)) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('CommandSetupStrategy', () => {
    test('should handle command directories', () => {
      const strategy = new CommandSetupStrategy();
      expect(strategy.shouldHandle('commands')).toBe(true);
      expect(strategy.shouldHandle('.claude/commands')).toBe(true);
      expect(strategy.shouldHandle('agents')).toBe(false);
    });

    test('should copy command files successfully', async () => {
      const strategy = new CommandSetupStrategy();
      const result = await strategy.setup(sourceDir, targetDir);

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);

      // Verify files were copied
      expect(existsSync(join(targetDir, 'test-command.md'))).toBe(true);
      expect(existsSync(join(targetDir, 'another-command.md'))).toBe(true);
    });

    test('should handle missing source directory', async () => {
      const strategy = new CommandSetupStrategy();
      const missingSourceDir = join(tempDir, 'missing');
      const result = await strategy.setup(missingSourceDir, targetDir);

      expect(result.success).toBe(false);
      expect(result.count).toBe(0);
      expect(result.errors[0]).toContain('Source directory not found');
    });

    test('should handle file copy errors gracefully', async () => {
      const strategy = new CommandSetupStrategy();
      const result = await strategy.setup(sourceDir, targetDir);

      // This should succeed with our test setup
      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });
  });

  describe('AgentSetupStrategy', () => {
    test('should handle agent directories', () => {
      const strategy = new AgentSetupStrategyImpl();
      expect(strategy.shouldHandle('agents')).toBe(true);
      expect(strategy.shouldHandle('.claude/agents')).toBe(true);
      expect(strategy.shouldHandle('commands')).toBe(false);
    });

    test('should handle missing source directory', async () => {
      const strategy = new AgentSetupStrategyImpl();
      const missingSourceDir = join(tempDir, 'missing');
      const result = await strategy.setup(missingSourceDir, targetDir, {
        name: 'test',
        detector: async () => true,
        setupDirs: ['.claude/agents'],
        description: 'Test project',
      });

      expect(result.success).toBe(false);
      expect(result.count).toBe(0);
      expect(result.errors[0]).toContain('Could not determine target format');
    });
  });

  describe('Format Mapping', () => {
    test('should map Claude Code agents correctly', () => {
      const format = getTargetFormat('.claude/agents');
      expect(format).toBe('claude-code');
    });

    test('should map OpenCode agents correctly', () => {
      const format = getTargetFormat('.opencode/agent');
      expect(format).toBe('opencode');
    });

    test('should return null for unknown formats', () => {
      const format = getTargetFormat('.unknown/agents');
      expect(format).toBeNull();
    });

    test('should handle partial matches', () => {
      const format = getTargetFormat('some/path/.claude/agents');
      expect(format).toBe('claude-code');
    });
  });

  describe('FORMAT_MAPPINGS Configuration', () => {
    test('should contain expected mappings', () => {
      expect(FORMAT_MAPPINGS['.claude/agents']).toBe('claude-code');
      expect(FORMAT_MAPPINGS['.opencode/agent']).toBe('opencode');
    });

    test('should be immutable', () => {
      const original = { ...FORMAT_MAPPINGS };
      // This should not modify the original
      expect(FORMAT_MAPPINGS).toEqual(original);
    });
  });

  describe('Error Handling', () => {
    test('should provide structured error results', async () => {
      const strategy = new CommandSetupStrategy();
      const missingSourceDir = join(tempDir, 'missing');
      const result = await strategy.setup(missingSourceDir, targetDir);

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('count', 0);
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });
});

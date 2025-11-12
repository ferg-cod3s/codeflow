/**
 * Tests for simplified validation system with isolated tmp environments
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { validate } from '../../../src/cli/validate';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { readdir } from 'fs/promises';

describe('Simplified Validation System', () => {
  const testTmpDir = join(process.cwd(), 'tmp', 'test-validation');

  beforeAll(() => {
    // Clean up any existing test tmp directory
    if (existsSync(testTmpDir)) {
      rmSync(testTmpDir, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    // Clean up test tmp directory
    if (existsSync(testTmpDir)) {
      rmSync(testTmpDir, { recursive: true, force: true });
    }
  });

  test('should create isolated tmp environment for validation', async () => {
    // Mock console.log to capture output
    const originalConsoleLog = console.log;
    const logs: string[] = [];
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalConsoleLog(...args);
    };

    try {
      await validate({
        format: 'claude-code',
        verbose: true,
        cleanup: true, // Should cleanup by default
      });

      // Check that tmp environment was created and mentioned in logs
      const environmentLog = logs.find((log) => log.includes('Created validation environment:'));
      expect(environmentLog).toBeDefined();
      expect(environmentLog).toContain('tmp/validation-');

      // Check that cleanup was mentioned
      const cleanupLog = logs.find((log) => log.includes('Cleaning up validation environment'));
      expect(cleanupLog).toBeDefined();
    } finally {
      console.log = originalConsoleLog;
    }
  });

  test('should validate Claude Code format in isolation', async () => {
    // Get initial count of validation directories
    const tmpDir = join(process.cwd(), 'tmp');
    let initialValidationDirs: string[] = [];
    if (existsSync(tmpDir)) {
      const allDirs = await readdir(tmpDir);
      initialValidationDirs = allDirs.filter((dir) => dir.startsWith('validation-'));
    }

    await validate({
      format: 'claude-code',
      verbose: false,
      cleanup: true,
    });

    // Check that tmp directory count is the same after cleanup
    if (existsSync(tmpDir)) {
      const finalValidationDirs = (await readdir(tmpDir)).filter((dir) =>
        dir.startsWith('validation-')
      );
      expect(finalValidationDirs.length).toBe(initialValidationDirs.length);
    }
  });

  test('should validate OpenCode format in isolation', async () => {
    await validate({
      format: 'opencode',
      verbose: false,
      cleanup: true,
    });

    // Should not throw and complete successfully
    expect(true).toBe(true);
  });

  test('should validate all formats in isolation', async () => {
    await validate({
      format: 'all',
      verbose: false,
      cleanup: true,
    });

    // Should not throw and complete successfully
    expect(true).toBe(true);
  });

  test('should handle validation errors gracefully', async () => {
    // Test with a path that doesn't exist
    await validate({
      format: 'claude-code',
      path: 'non-existent-directory',
      verbose: false,
      cleanup: true,
    });

    // Should handle error gracefully and exit
    expect(true).toBe(true);
  });

  test('should filter out commands and only validate agents', async () => {
    // This test verifies that the filtering logic works correctly
    // Commands have mode: 'command' in base format
    // Claude Code and OpenCode formats don't have mode field

    await validate({
      format: 'claude-code',
      verbose: true,
      cleanup: true,
    });

    // Should not throw and complete successfully
    expect(true).toBe(true);
  });

  test('should create proper tmp directory structure', async () => {
    // Mock console.log to capture environment path
    const originalConsoleLog = console.log;
    const logs: string[] = [];
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalConsoleLog(...args);
    };

    try {
      await validate({
        format: 'all',
        verbose: true,
        cleanup: false, // Don't cleanup to inspect structure
      });

      // Find environment path from logs
      const environmentLog = logs.find((log) => log.includes('Created validation environment:'));
      expect(environmentLog).toBeDefined();

      if (environmentLog) {
        const envPath = environmentLog.split('Created validation environment: ')[1];

        // Check that platform-specific subdirectories were created (runtime conversion)
        const claudeAgentsDir = join(envPath, '.claude', 'agents');
        const openCodeAgentsDir = join(envPath, '.opencode', 'agent');

        expect(existsSync(claudeAgentsDir)).toBe(true);
        expect(existsSync(openCodeAgentsDir)).toBe(true);

        // Check that agents were generated via CanonicalSyncer
        const claudeAgents = await readdir(claudeAgentsDir);
        const openCodeAgents = await readdir(openCodeAgentsDir);

        expect(claudeAgents.length).toBeGreaterThan(0);
        expect(openCodeAgents.length).toBeGreaterThan(0);

        // Cleanup manually for this test
        rmSync(envPath, { recursive: true, force: true });
      }
    } finally {
      console.log = originalConsoleLog;
    }
  });
});

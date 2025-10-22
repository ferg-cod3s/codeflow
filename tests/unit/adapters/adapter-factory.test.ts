/**
 * Adapter Factory Tests
 * Tests the adapter-factory.ts functionality for platform detection and adapter creation
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import { mkdir, writeFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import {
  AdapterFactory,
  createAdapter,
  Platform
} from '../../../src/adapters/adapter-factory.js';
import { setupTests, cleanupTests, TEST_DIR } from '../../setup.js';

// Note: Adapter implementations are tested with actual adapters
// These tests focus on the factory logic and platform detection

describe('Adapter Factory', () => {
  let testProjectRoot: string;

  beforeAll(async () => {
    await setupTests();
  });

  afterAll(async () => {
    await cleanupTests();
  });

  beforeEach(async () => {
    testProjectRoot = join(TEST_DIR, `adapter-factory-test-${Date.now()}`);
    await mkdir(testProjectRoot, { recursive: true });
  });

  afterEach(async () => {
    if (existsSync(testProjectRoot)) {
      await rm(testProjectRoot, { recursive: true, force: true });
    }
  });

  describe('createAdapter', () => {
    test('should create Claude Code adapter', () => {
      const adapter = AdapterFactory.createAdapter(Platform.CLAUDE_CODE, testProjectRoot);

      expect(adapter).toBeDefined();
      expect(adapter.platform).toBe('claude-code');
      expect(adapter.projectRoot).toBe(testProjectRoot);
    });

    test('should create OpenCode adapter', () => {
      const adapter = AdapterFactory.createAdapter(Platform.OPENCODE, testProjectRoot);

      expect(adapter).toBeDefined();
      expect(adapter.platform).toBe('opencode');
      expect(adapter.projectRoot).toBe(testProjectRoot);
    });

    test('should create OpenCode adapter with MCP endpoint config', () => {
      const config = {
        platform: {
          opencode: {
            mcpEndpoint: 'http://localhost:3000'
          }
        }
      };

      const adapter = AdapterFactory.createAdapter(Platform.OPENCODE, testProjectRoot, config);

      expect(adapter).toBeDefined();
      expect(adapter.platform).toBe('opencode');
      expect(adapter.projectRoot).toBe(testProjectRoot);
    });

    test('should throw error for unknown platform', () => {
      expect(() => {
        AdapterFactory.createAdapter(Platform.UNKNOWN, testProjectRoot);
      }).toThrow('Unsupported platform: UNKNOWN');
    });

    test('should throw error for unsupported platform', () => {
      expect(() => {
        AdapterFactory.createAdapter('unsupported' as Platform, testProjectRoot);
      }).toThrow('Unsupported platform: unsupported');
    });
  });

  describe('createAdapterAuto', () => {
    test('should detect Claude Code project and create adapter', async () => {
      // Create Claude Code project structure
      const claudeDir = join(testProjectRoot, '.claude', 'agents');
      await mkdir(claudeDir, { recursive: true });
      await writeFile(join(claudeDir, 'test-agent.md'), 'Test agent');

      const adapter = await AdapterFactory.createAdapterAuto(testProjectRoot);

      expect(adapter).toBeDefined();
      expect(adapter.platform).toBe('claude-code');
    });

    test('should detect OpenCode project and create adapter', async () => {
      // Create OpenCode project structure
      const opencodeDir = join(testProjectRoot, '.opencode', 'agent');
      await mkdir(opencodeDir, { recursive: true });
      await writeFile(join(opencodeDir, 'test-agent.md'), 'Test agent');

      const adapter = await AdapterFactory.createAdapterAuto(testProjectRoot);

      expect(adapter).toBeDefined();
      expect(adapter.platform).toBe('opencode');
    });

    test('should prioritize Claude Code over OpenCode when both exist', async () => {
      // Create both project structures
      const claudeDir = join(testProjectRoot, '.claude', 'agents');
      const opencodeDir = join(testProjectRoot, '.opencode', 'agent');

      await mkdir(claudeDir, { recursive: true });
      await mkdir(opencodeDir, { recursive: true });

      await writeFile(join(claudeDir, 'test-agent.md'), 'Test agent');
      await writeFile(join(opencodeDir, 'test-agent.md'), 'Test agent');

      const adapter = await AdapterFactory.createAdapterAuto(testProjectRoot);

      expect(adapter).toBeDefined();
      expect(adapter.platform).toBe('claude-code');
    });

    test('should show low confidence warning for ambiguous detection', async () => {
      // Create ambiguous project structure (only one directory exists)
      const claudeDir = join(testProjectRoot, '.claude');
      await mkdir(claudeDir, { recursive: true });
      // Don't create agents subdirectory

      // Mock console.warn
      const originalConsoleWarn = console.warn;
      let warningOutput = '';
      console.warn = (...args) => {
        warningOutput += args.join(' ') + '\n';
      };

      try {
        const adapter = await AdapterFactory.createAdapterAuto(testProjectRoot);

        expect(adapter).toBeDefined();
        expect(warningOutput).toContain('⚠️  Low confidence platform detection');
      } finally {
        console.warn = originalConsoleWarn;
      }
    });

    test('should throw error when no platform detected', async () => {
      await expect(AdapterFactory.createAdapterAuto(testProjectRoot))
        .rejects.toThrow('Could not detect platform');
    });

    test('should include evidence in error message', async () => {
      try {
        await AdapterFactory.createAdapterAuto(testProjectRoot);
      } catch (error: any) {
        expect(error.message).toContain('Evidence collected:');
        expect(error.message).toContain('Could not detect platform');
      }
    });

    test('should work with config parameter', async () => {
      const claudeDir = join(testProjectRoot, '.claude', 'agents');
      await mkdir(claudeDir, { recursive: true });
      await writeFile(join(claudeDir, 'test-agent.md'), 'Test agent');

      const config = {
        platform: {
          opencode: {
            mcpEndpoint: 'http://localhost:3000'
          }
        }
      };

      const adapter = await AdapterFactory.createAdapterAuto(testProjectRoot, config);

      expect(adapter).toBeDefined();
      expect(adapter.platform).toBe('claude-code');
    });
  });

  describe('isSupported', () => {
    test('should return true for supported platforms', () => {
      expect(AdapterFactory.isSupported(Platform.CLAUDE_CODE)).toBe(true);
      expect(AdapterFactory.isSupported(Platform.OPENCODE)).toBe(true);
    });

    test('should return false for unsupported platforms', () => {
      expect(AdapterFactory.isSupported(Platform.UNKNOWN)).toBe(false);
      expect(AdapterFactory.isSupported('unsupported' as Platform)).toBe(false);
    });
  });

  describe('getSupportedPlatforms', () => {
    test('should return array of supported platforms', () => {
      const platforms = AdapterFactory.getSupportedPlatforms();

      expect(Array.isArray(platforms)).toBe(true);
      expect(platforms).toContain(Platform.CLAUDE_CODE);
      expect(platforms).toContain(Platform.OPENCODE);
      expect(platforms).toHaveLength(2);
    });
  });

  describe('getPlatformDisplayName', () => {
    test('should return correct display names', () => {
      expect(AdapterFactory.getPlatformDisplayName(Platform.CLAUDE_CODE)).toBe('Claude Code');
      expect(AdapterFactory.getPlatformDisplayName(Platform.OPENCODE)).toBe('OpenCode');
      expect(AdapterFactory.getPlatformDisplayName(Platform.UNKNOWN)).toBe('Unknown');
    });

    test('should return Unknown for invalid platforms', () => {
      expect(AdapterFactory.getPlatformDisplayName('invalid' as Platform)).toBe('Unknown');
    });
  });

  describe('createAdapter helper function', () => {
    test('should create adapter with explicit platform', async () => {
      const adapter = await createAdapter(testProjectRoot, undefined, Platform.CLAUDE_CODE);

      expect(adapter).toBeDefined();
      expect(adapter.platform).toBe('claude-code');
    });

    test('should auto-detect when no platform specified', async () => {
      const claudeDir = join(testProjectRoot, '.claude', 'agents');
      await mkdir(claudeDir, { recursive: true });
      await writeFile(join(claudeDir, 'test-agent.md'), 'Test agent');

      const adapter = await createAdapter(testProjectRoot);

      expect(adapter).toBeDefined();
      expect(adapter.platform).toBe('claude-code');
    });

    test('should auto-detect when platform is UNKNOWN', async () => {
      const claudeDir = join(testProjectRoot, '.claude', 'agents');
      await mkdir(claudeDir, { recursive: true });
      await writeFile(join(claudeDir, 'test-agent.md'), 'Test agent');

      const adapter = await createAdapter(testProjectRoot, undefined, Platform.UNKNOWN);

      expect(adapter).toBeDefined();
      expect(adapter.platform).toBe('claude-code');
    });

    test('should pass config to auto-detection', async () => {
      const claudeDir = join(testProjectRoot, '.claude', 'agents');
      await mkdir(claudeDir, { recursive: true });
      await writeFile(join(claudeDir, 'test-agent.md'), 'Test agent');

      const config = {
        platform: {
          opencode: {
            mcpEndpoint: 'http://localhost:3000'
          }
        }
      };

      const adapter = await createAdapter(testProjectRoot, config);

      expect(adapter).toBeDefined();
      expect(adapter.platform).toBe('claude-code');
    });

    test('should handle auto-detection errors', async () => {
      await expect(createAdapter(testProjectRoot))
        .rejects.toThrow('Could not detect platform');
    });
  });

  describe('Platform Detection Edge Cases', () => {
    test('should handle empty directories', async () => {
      const claudeDir = join(testProjectRoot, '.claude', 'agents');
      await mkdir(claudeDir, { recursive: true });
      // Empty directory

      const adapter = await AdapterFactory.createAdapterAuto(testProjectRoot);

      expect(adapter).toBeDefined();
      expect(adapter.platform).toBe('claude-code');
    });

    test('should handle hidden files', async () => {
      const claudeDir = join(testProjectRoot, '.claude', 'agents');
      await mkdir(claudeDir, { recursive: true });
      await writeFile(join(claudeDir, '.hidden-file'), 'Hidden');

      const adapter = await AdapterFactory.createAdapterAuto(testProjectRoot);

      expect(adapter).toBeDefined();
      expect(adapter.platform).toBe('claude-code');
    });

    test('should handle nested directory structures', async () => {
      const claudeDir = join(testProjectRoot, '.claude', 'agents', 'nested');
      await mkdir(claudeDir, { recursive: true });
      await writeFile(join(claudeDir, 'test-agent.md'), 'Test agent');

      const adapter = await AdapterFactory.createAdapterAuto(testProjectRoot);

      expect(adapter).toBeDefined();
      expect(adapter.platform).toBe('claude-code');
    });

    test('should handle permission errors gracefully', async () => {
      // This test would require mocking file system operations
      // For now, we'll test that the function handles the case
      await expect(AdapterFactory.createAdapterAuto('/non/existent/path'))
        .rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should provide helpful error messages for unknown platforms', () => {
      expect(() => {
        AdapterFactory.createAdapter(Platform.UNKNOWN, testProjectRoot);
      }).toThrow(/Supported platforms: Claude Code, OpenCode/);
    });

    test('should provide helpful error messages for detection failures', async () => {
      try {
        await AdapterFactory.createAdapterAuto(testProjectRoot);
      } catch (error: any) {
        expect(error.message).toContain('Please ensure either:');
        expect(error.message).toContain('.claude/agents/ directory exists');
        expect(error.message).toContain('.opencode/agent/ directory exists');
      }
    });

    test('should handle malformed project structures', async () => {
      // Create malformed structure
      const claudeDir = join(testProjectRoot, '.claude');
      await mkdir(claudeDir, { recursive: true });
      await writeFile(join(claudeDir, 'not-agents'), 'Not agents directory');

      // Should still detect as Claude Code project
      const adapter = await AdapterFactory.createAdapterAuto(testProjectRoot);

      expect(adapter).toBeDefined();
      expect(adapter.platform).toBe('claude-code');
    });
  });
});

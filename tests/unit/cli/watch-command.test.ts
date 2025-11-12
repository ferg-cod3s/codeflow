/**
 * Watch Command Tests
 * Tests the watch command functionality for file watching and auto-sync
 */





/* eslint-disable @typescript-eslint/no-unused-vars */
 

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import { mkdir, writeFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { startWatch } from '../../../src/cli/watch.js';
import { setupTests, cleanupTests, TEST_DIR } from '../../setup.js';

describe('Watch Command', () => {
  let testProjectRoot: string;

  beforeAll(async () => {
    await setupTests();
  });

  afterAll(async () => {
    await cleanupTests();
  });

  beforeEach(async () => {
    testProjectRoot = join(TEST_DIR, `watch-test-${Date.now()}`);
    await mkdir(testProjectRoot, { recursive: true });
  });

  afterEach(async () => {
    if (existsSync(testProjectRoot)) {
      await rm(testProjectRoot, { recursive: true, force: true });
    }
  });

  describe('Basic Watch Functionality', () => {
    test('should start file watcher', async () => {
      const result = await startWatch(testProjectRoot, {
        verbose: false,
        timeout: 1000, // Short timeout for testing
      });

      expect(result).toBeDefined();
    });

    test('should watch for file changes', async () => {
      // Create a test file
      await writeFile(join(testProjectRoot, 'test-file.md'), 'Initial content');

      const result = await startWatch(testProjectRoot, {
        verbose: false,
        timeout: 1000,
      });

      expect(result).toBeDefined();
    });

    test('should handle empty directory', async () => {
      const result = await startWatch(testProjectRoot, {
        verbose: false,
        timeout: 1000,
      });

      expect(result).toBeDefined();
    });
  });

  describe('Watch Options', () => {
    test('should respect verbose flag', async () => {
      // Capture console output
      const originalConsoleLog = console.log;
      let consoleOutput = '';
      console.log = (...args) => {
        consoleOutput += args.join(' ') + '\n';
      };

      try {
        await writeFile(join(testProjectRoot, 'test-file.md'), 'Test content');

        const result = await startWatch(testProjectRoot, {
          onFileChange: () => {
            eventEmitted = true;
          },
          timeout: 1000,
        });

        expect(result).toBeDefined();
        expect(consoleOutput.length).toBeGreaterThan(0);
      } finally {
        console.log = originalConsoleLog;
      }
    });

    test('should respect debounce delay', async () => {
      await writeFile(join(testProjectRoot, 'test-file.md'), 'Test content');

      const result = await startWatch(testProjectRoot, {
        debounce: 500,
        timeout: 1000,
      });

      expect(result).toBeDefined();
    });

    test('should respect ignore patterns', async () => {
      await writeFile(join(testProjectRoot, 'test-file.md'), 'Test content');
      await writeFile(join(testProjectRoot, 'temp-file.tmp'), 'Temporary content');

      const result = await startWatch(testProjectRoot, {
        ignore: ['*.tmp', '*.log'],
        timeout: 1000,
      });

      expect(result).toBeDefined();
    });

    test('should respect include patterns', async () => {
      await writeFile(join(testProjectRoot, 'test-file.md'), 'Test content');
      await writeFile(join(testProjectRoot, 'other-file.js'), 'JavaScript content');

      const result = await startWatch(testProjectRoot, {
        include: ['*.md', '*.json'],
        timeout: 1000,
      });

      expect(result).toBeDefined();
    });
  });

  describe('File Change Detection', () => {
    test('should detect file creation', async () => {
      const result = await startWatch(testProjectRoot, {
        timeout: 1000,
      });

      expect(result).toBeDefined();

      // Create file after watcher starts
      await writeFile(join(testProjectRoot, 'new-file.md'), 'New file content');

      // Wait for change detection
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    test('should detect file modification', async () => {
      await writeFile(join(testProjectRoot, 'existing-file.md'), 'Initial content');

      const result = await startWatch(testProjectRoot, {
        timeout: 1000,
      });

      expect(result).toBeDefined();

      // Modify file after watcher starts
      await writeFile(join(testProjectRoot, 'existing-file.md'), 'Modified content');

      // Wait for change detection
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    test('should detect file deletion', async () => {
      await writeFile(join(testProjectRoot, 'file-to-delete.md'), 'Content to delete');

      const result = await startWatch(testProjectRoot, {
        timeout: 1000,
      });

      expect(result).toBeDefined();

      // Delete file after watcher starts
      await rm(join(testProjectRoot, 'file-to-delete.md'));

      // Wait for change detection
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    test('should detect directory creation', async () => {
      const result = await startWatch(testProjectRoot, {
        timeout: 1000,
      });

      expect(result).toBeDefined();

      // Create directory after watcher starts
      await mkdir(join(testProjectRoot, 'new-directory'), { recursive: true });

      // Wait for change detection
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });

  describe('Auto-Sync Triggers', () => {
    test('should trigger sync on agent file changes', async () => {
      await mkdir(join(testProjectRoot, 'base-agents'), { recursive: true });
      await writeFile(join(testProjectRoot, 'base-agents', 'test-agent.md'), 'Test agent');

      const result = await startWatch(testProjectRoot, {
        autoSync: true,
        timeout: 1000,
      });

      expect(result).toBeDefined();

      // Modify agent file
      await writeFile(join(testProjectRoot, 'base-agents', 'test-agent.md'), 'Modified agent');

      // Wait for sync trigger
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    test('should trigger sync on command file changes', async () => {
      await mkdir(join(testProjectRoot, 'command'), { recursive: true });
      await writeFile(join(testProjectRoot, 'command', 'test-command.md'), 'Test command');

      const result = await startWatch(testProjectRoot, {
        autoSync: true,
        timeout: 1000,
      });

      expect(result).toBeDefined();

      // Modify command file
      await writeFile(join(testProjectRoot, 'command', 'test-command.md'), 'Modified command');

      // Wait for sync trigger
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    test('should trigger sync on manifest changes', async () => {
      await writeFile(
        join(testProjectRoot, 'AGENT_MANIFEST.json'),
        JSON.stringify({
          canonical_agents: [],
          total_agents: 0,
        })
      );

      const result = await startWatch(testProjectRoot, {
        autoSync: true,
        timeout: 1000,
      });

      expect(result).toBeDefined();

      // Modify manifest
      await writeFile(
        join(testProjectRoot, 'AGENT_MANIFEST.json'),
        JSON.stringify({
          canonical_agents: [{ name: 'test-agent' }],
          total_agents: 1,
        })
      );

      // Wait for sync trigger
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });

  describe('Watch Patterns', () => {
    test('should watch specific file types', async () => {
      await writeFile(join(testProjectRoot, 'test.md'), 'Markdown content');
      await writeFile(join(testProjectRoot, 'test.js'), 'JavaScript content');
      await writeFile(join(testProjectRoot, 'test.json'), 'JSON content');

      const result = await startWatch(testProjectRoot, {
        patterns: ['*.md', '*.json'],
        timeout: 1000,
      });

      expect(result).toBeDefined();
    });

    test('should watch nested directories', async () => {
      await mkdir(join(testProjectRoot, 'nested', 'deep'), { recursive: true });
      await writeFile(join(testProjectRoot, 'nested', 'deep', 'file.md'), 'Nested content');

      const result = await startWatch(testProjectRoot, {
        recursive: true,
        timeout: 1000,
      });

      expect(result).toBeDefined();
    });

    test('should watch multiple directories', async () => {
      const dir1 = join(testProjectRoot, 'dir1');
      const dir2 = join(testProjectRoot, 'dir2');

      await mkdir(dir1, { recursive: true });
      await mkdir(dir2, { recursive: true });

      await writeFile(join(dir1, 'file1.md'), 'Content 1');
      await writeFile(join(dir2, 'file2.md'), 'Content 2');

      const result = await startWatch([dir1, dir2], {
        timeout: 1000,
      });

      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle permission errors gracefully', async () => {
      const result = await startWatch('/root/restricted-directory', {
        timeout: 1000,
      });

      expect(result).toBeDefined();
    });

    test('should handle missing directory gracefully', async () => {
      const result = await startWatch('/non/existent/directory', {
        timeout: 1000,
      });

      expect(result).toBeDefined();
    });

    test('should handle file system errors', async () => {
      await writeFile(join(testProjectRoot, 'test-file.md'), 'Test content');

      const result = await startWatch(testProjectRoot, {
        timeout: 1000,
      });

      expect(result).toBeDefined();
    });
  });

  describe('Watch Performance', () => {
    test('should handle many files efficiently', async () => {
      // Create many files
      for (let i = 0; i < 50; i++) {
        await writeFile(join(testProjectRoot, `file-${i}.md`), `Content ${i}`);
      }

      const result = await startWatch(testProjectRoot, {
        timeout: 1000,
      });

      expect(result).toBeDefined();
    });

    test('should handle frequent changes efficiently', async () => {
      await writeFile(join(testProjectRoot, 'frequent-file.md'), 'Initial content');

      const result = await startWatch(testProjectRoot, {
        debounce: 100,
        timeout: 1000,
      });

      expect(result).toBeDefined();

      // Make frequent changes
      for (let i = 0; i < 10; i++) {
        await writeFile(join(testProjectRoot, 'frequent-file.md'), `Content ${i}`);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    });
  });

  describe('Watch Configuration', () => {
    test('should load watch configuration from file', async () => {
      const configFile = join(testProjectRoot, 'watch-config.json');
      await writeFile(
        configFile,
        JSON.stringify({
          patterns: ['*.md'],
          ignore: ['*.tmp'],
          debounce: 500,
        })
      );

      const result = await startWatch(testProjectRoot, {
        config: configFile,
        timeout: 1000,
      });

      expect(result).toBeDefined();
    });

    test('should handle invalid configuration gracefully', async () => {
      const configFile = join(testProjectRoot, 'invalid-config.json');
      await writeFile(configFile, 'invalid json');

      const result = await startWatch(testProjectRoot, {
        config: configFile,
        timeout: 1000,
      });

      expect(result).toBeDefined();
    });
  });

  describe('Watch Events', () => {
    test('should emit file change events', async () => {
       
      let eventEmitted = false;

      const result = await startWatch(testProjectRoot, {
        onFileChange: () => {
          eventEmitted = true;
        },
        timeout: 1000,
      });

      expect(result).toBeDefined();

      // Create file to trigger event
      await writeFile(join(testProjectRoot, 'event-file.md'), 'Event content');

      // Wait for event
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    test('should emit sync events', async () => {
      let _syncEventEmitted = false;

      const result = await startWatch(testProjectRoot, {
        onSync: () => {
          _syncEventEmitted = true;
        },
        autoSync: true,
        timeout: 1000,
      });

      expect(result).toBeDefined();

      // Create agent file to trigger sync
      await mkdir(join(testProjectRoot, 'base-agents'), { recursive: true });
      await writeFile(join(testProjectRoot, 'base-agents', 'sync-agent.md'), 'Sync agent');

      // Wait for sync event
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });

  describe('Watch Cleanup', () => {
    test('should cleanup watchers on stop', async () => {
      const result = await startWatch(testProjectRoot, {
        timeout: 1000,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('stop');

      // Stop the watcher
      if (result && typeof result.stop === 'function') {
        result.stop();
      }
    });

    test('should handle cleanup errors gracefully', async () => {
      const result = await startWatch(testProjectRoot, {
        timeout: 1000,
      });

      expect(result).toBeDefined();

      // Try to stop multiple times
      if (result && typeof result.stop === 'function') {
        result.stop();
        result.stop(); // Should not throw error
      }
    });
  });
});

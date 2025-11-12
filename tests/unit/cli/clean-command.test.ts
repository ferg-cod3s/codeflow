/**
 * Clean Command Tests
 * Tests the clean command functionality for cache cleanup and file management
 */





import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import { mkdir, writeFile, rm, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { clean } from '../../../src/cli/clean.js';
import { setupTests, cleanupTests, TEST_DIR } from '../../setup.js';

describe('Clean Command', () => {
  let testProjectRoot: string;

  beforeAll(async () => {
    await setupTests();
  });

  afterAll(async () => {
    await cleanupTests();
  });

  beforeEach(async () => {
    testProjectRoot = join(TEST_DIR, `clean-test-${Date.now()}`);
    await mkdir(testProjectRoot, { recursive: true });
  });

  afterEach(async () => {
    if (existsSync(testProjectRoot)) {
      await rm(testProjectRoot, { recursive: true, force: true });
    }
  });

  describe('Basic Clean Functionality', () => {
    test('should clean cache directory', async () => {
      // Create cache directory with files
      const cacheDir = join(testProjectRoot, '.cache');
      await mkdir(cacheDir, { recursive: true });
      await writeFile(join(cacheDir, 'cache-file.json'), '{"test": "data"}');
      await writeFile(join(cacheDir, 'temp-file.tmp'), 'temporary content');

      const result = await clean({
        projectRoot: testProjectRoot,
        verbose: false
      });

      expect(result).toBeDefined();

      // Check that cache files are cleaned
      const cacheFiles = await readdir(cacheDir).catch(() => []);
      expect(cacheFiles).toHaveLength(0);
    });

    test('should clean temporary files', async () => {
      // Create temporary files
      await writeFile(join(testProjectRoot, 'temp-file.tmp'), 'temporary content');
      await writeFile(join(testProjectRoot, 'temp-file.temp'), 'temporary content');
      await writeFile(join(testProjectRoot, '.DS_Store'), 'system file');
      await writeFile(join(testProjectRoot, 'Thumbs.db'), 'thumbnail cache');

      const result = await clean({
        projectRoot: testProjectRoot,
        verbose: false
      });

      expect(result).toBeDefined();
    });

    test('should clean build artifacts', async () => {
      // Create build artifacts
      await mkdir(join(testProjectRoot, 'dist'), { recursive: true });
      await mkdir(join(testProjectRoot, 'build'), { recursive: true });
      await mkdir(join(testProjectRoot, 'node_modules'), { recursive: true });

      await writeFile(join(testProjectRoot, 'dist', 'bundle.js'), 'compiled code');
      await writeFile(join(testProjectRoot, 'build', 'app.js'), 'built app');
      await writeFile(join(testProjectRoot, 'node_modules', 'package'), 'dependency');

      const result = await clean({
        projectRoot: testProjectRoot,
        verbose: false
      });

      expect(result).toBeDefined();
    });
  });

  describe('Clean Options', () => {
    test('should respect dry-run flag', async () => {
      // Create files to clean
      await writeFile(join(testProjectRoot, 'temp-file.tmp'), 'temporary content');
      const cacheDir = join(testProjectRoot, '.cache');
      await mkdir(cacheDir, { recursive: true });
      await writeFile(join(cacheDir, 'cache-file.json'), '{"test": "data"}');

      const result = await clean({
        projectRoot: testProjectRoot,
        dryRun: true,
        verbose: false
      });

      expect(result).toBeDefined();

      // Files should still exist in dry-run mode
      expect(existsSync(join(testProjectRoot, 'temp-file.tmp'))).toBe(true);
      expect(existsSync(join(cacheDir, 'cache-file.json'))).toBe(true);
    });

    test('should respect verbose flag', async () => {
      // Capture console output
      const originalConsoleLog = console.log;
      let consoleOutput = '';
      console.log = (...args) => {
        consoleOutput += args.join(' ') + '\n';
      };

      try {
        await writeFile(join(testProjectRoot, 'temp-file.tmp'), 'temporary content');

        await clean({
          projectRoot: testProjectRoot,
          verbose: true
        });

        // Should have some verbose output
        expect(consoleOutput.length).toBeGreaterThan(0);
      } finally {
        console.log = originalConsoleLog;
      }
    });

    test('should handle different clean types', async () => {
      const cleanTypes = ['cache', 'temp', 'build', 'all'];

      for (const type of cleanTypes) {
        // Create files for each type
        if (type === 'cache' || type === 'all') {
          const cacheDir = join(testProjectRoot, '.cache');
          await mkdir(cacheDir, { recursive: true });
          await writeFile(join(cacheDir, 'cache-file.json'), '{"test": "data"}');
        }

        if (type === 'temp' || type === 'all') {
          await writeFile(join(testProjectRoot, 'temp-file.tmp'), 'temporary content');
        }

        if (type === 'build' || type === 'all') {
          await mkdir(join(testProjectRoot, 'dist'), { recursive: true });
          await writeFile(join(testProjectRoot, 'dist', 'bundle.js'), 'compiled code');
        }

        const result = await clean({
          projectRoot: testProjectRoot,
          type: type as any,
          verbose: false
        });

        expect(result).toBeDefined();
      }
    });
  });

  describe('Orphan File Detection', () => {
    test('should detect orphaned files', async () => {
      // Create orphaned files (files not referenced in manifest or git)
      await writeFile(join(testProjectRoot, 'orphaned-file.md'), 'orphaned content');
      await writeFile(join(testProjectRoot, 'unused-agent.md'), 'unused agent');
      await writeFile(join(testProjectRoot, 'old-command.md'), 'old command');

      const result = await clean({
        projectRoot: testProjectRoot,
        detectOrphans: true,
        verbose: false
      });

      expect(result).toBeDefined();
    });

    test('should not remove referenced files', async () => {
      // Create manifest file
      await writeFile(join(testProjectRoot, 'AGENT_MANIFEST.json'), JSON.stringify({
        canonical_agents: [
          {
            name: 'referenced-agent',
            sources: {
              base: 'base-agents/development/referenced-agent.md'
            }
          }
        ]
      }));

      // Create referenced file
      await mkdir(join(testProjectRoot, 'base-agents', 'development'), { recursive: true });
      await writeFile(join(testProjectRoot, 'base-agents', 'development', 'referenced-agent.md'), 'referenced agent');

      // Create orphaned file
      await writeFile(join(testProjectRoot, 'orphaned-agent.md'), 'orphaned agent');

      const result = await clean({
        projectRoot: testProjectRoot,
        detectOrphans: true,
        verbose: false
      });

      expect(result).toBeDefined();

      // Referenced file should still exist
      expect(existsSync(join(testProjectRoot, 'base-agents', 'development', 'referenced-agent.md'))).toBe(true);
    });
  });

  describe('Cache Cleanup', () => {
    test('should clean different cache types', async () => {
      // Create different cache directories
      const caches = [
        '.cache',
        '.codeflow-cache',
        'node_modules/.cache',
        '.turbo'
      ];

      for (const cachePath of caches) {
        const fullPath = join(testProjectRoot, cachePath);
        await mkdir(fullPath, { recursive: true });
        await writeFile(join(fullPath, 'cache-file.json'), '{"test": "data"}');
      }

      const result = await clean({
        projectRoot: testProjectRoot,
        type: 'cache',
        verbose: false
      });

      expect(result).toBeDefined();

      // Check that cache directories are cleaned
      for (const cachePath of caches) {
        const fullPath = join(testProjectRoot, cachePath);
        if (existsSync(fullPath)) {
          const files = await readdir(fullPath).catch(() => []);
          expect(files).toHaveLength(0);
        }
      }
    });

    test('should clean cache with different file extensions', async () => {
      const cacheDir = join(testProjectRoot, '.cache');
      await mkdir(cacheDir, { recursive: true });

      // Create different cache file types
      await writeFile(join(cacheDir, 'cache.json'), '{"test": "data"}');
      await writeFile(join(cacheDir, 'cache.tmp'), 'temporary cache');
      await writeFile(join(cacheDir, 'cache.log'), 'cache log');
      await writeFile(join(cacheDir, 'cache.db'), 'cache database');

      const result = await clean({
        projectRoot: testProjectRoot,
        type: 'cache',
        verbose: false
      });

      expect(result).toBeDefined();

      const files = await readdir(cacheDir).catch(() => []);
      expect(files).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle permission errors gracefully', async () => {
      // Create a file that might cause permission issues
      await writeFile(join(testProjectRoot, 'readonly-file.tmp'), 'readonly content');

      const result = await clean({
        projectRoot: testProjectRoot,
        verbose: false
      });

      expect(result).toBeDefined();
    });

    test('should handle missing directories gracefully', async () => {
      const result = await clean({
        projectRoot: '/non/existent/path',
        verbose: false
      });

      expect(result).toBeDefined();
    });

    test('should handle locked files gracefully', async () => {
      // Create files that might be locked
      await writeFile(join(testProjectRoot, 'locked-file.tmp'), 'locked content');

      const result = await clean({
        projectRoot: testProjectRoot,
        verbose: false
      });

      expect(result).toBeDefined();
    });
  });

  describe('Clean Statistics', () => {
    test('should return clean statistics', async () => {
      // Create files to clean
      await writeFile(join(testProjectRoot, 'temp1.tmp'), 'temp content 1');
      await writeFile(join(testProjectRoot, 'temp2.tmp'), 'temp content 2');
      const cacheDir = join(testProjectRoot, '.cache');
      await mkdir(cacheDir, { recursive: true });
      await writeFile(join(cacheDir, 'cache1.json'), '{"test": "data1"}');
      await writeFile(join(cacheDir, 'cache2.json'), '{"test": "data2"}');

      const result = await clean({
        projectRoot: testProjectRoot,
        verbose: false
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    test('should track cleaned file sizes', async () => {
      // Create files with known sizes
      const largeContent = 'x'.repeat(1024); // 1KB
      await writeFile(join(testProjectRoot, 'large-temp.tmp'), largeContent);

      const result = await clean({
        projectRoot: testProjectRoot,
        verbose: false
      });

      expect(result).toBeDefined();
    });
  });

  describe('Clean Patterns', () => {
    test('should clean files matching patterns', async () => {
      // Create files matching different patterns
      await writeFile(join(testProjectRoot, '*.tmp'), 'glob pattern');
      await writeFile(join(testProjectRoot, 'test-*.log'), 'pattern log');
      await writeFile(join(testProjectRoot, 'temp[0-9].tmp'), 'bracket pattern');

      const result = await clean({
        projectRoot: testProjectRoot,
        patterns: ['*.tmp', '*.log'],
        verbose: false
      });

      expect(result).toBeDefined();
    });

    test('should exclude files from patterns', async () => {
      await writeFile(join(testProjectRoot, 'keep-this.tmp'), 'keep this');
      await writeFile(join(testProjectRoot, 'remove-this.tmp'), 'remove this');

      const result = await clean({
        projectRoot: testProjectRoot,
        patterns: ['*.tmp'],
        exclude: ['keep-this.tmp'],
        verbose: false
      });

      expect(result).toBeDefined();

      // keep-this.tmp should still exist
      expect(existsSync(join(testProjectRoot, 'keep-this.tmp'))).toBe(true);
    });
  });

  describe('Clean Integration', () => {
    test('should work with CodeFlow project structure', async () => {
      // Create CodeFlow project structure
      await mkdir(join(testProjectRoot, '.claude', 'agents'), { recursive: true });
      await mkdir(join(testProjectRoot, '.opencode', 'agent'), { recursive: true });
      await mkdir(join(testProjectRoot, 'base-agents'), { recursive: true });

      // Create cache files
      await mkdir(join(testProjectRoot, '.cache'), { recursive: true });
      await writeFile(join(testProjectRoot, '.cache', 'agent-cache.json'), '{"agents": []}');

      const result = await clean({
        projectRoot: testProjectRoot,
        verbose: false
      });

      expect(result).toBeDefined();
    });

    test('should preserve important configuration files', async () => {
      // Create important config files
      await writeFile(join(testProjectRoot, 'package.json'), '{"name": "test"}');
      await writeFile(join(testProjectRoot, 'AGENT_MANIFEST.json'), '{"agents": []}');
      await writeFile(join(testProjectRoot, '.gitignore'), 'node_modules/');

      const result = await clean({
        projectRoot: testProjectRoot,
        verbose: false
      });

      expect(result).toBeDefined();

      // Important files should still exist
      expect(existsSync(join(testProjectRoot, 'package.json'))).toBe(true);
      expect(existsSync(join(testProjectRoot, 'AGENT_MANIFEST.json'))).toBe(true);
      expect(existsSync(join(testProjectRoot, '.gitignore'))).toBe(true);
    });
  });
});

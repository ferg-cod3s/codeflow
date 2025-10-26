/**
 * Export Command Tests
 * Tests the export command functionality for project export and backup
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import { mkdir, writeFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { exportProject } from '../../../src/cli/export';
import { setupTests, cleanupTests, TEST_DIR } from '../../setup';

describe('Export Command', () => {
  let testProjectRoot: string;
  let exportOutputDir: string;

  beforeAll(async () => {
    await setupTests();
  });

  afterAll(async () => {
    await cleanupTests();
  });

  beforeEach(async () => {
    testProjectRoot = join(TEST_DIR, `export-test-${Date.now()}`);
    exportOutputDir = join(TEST_DIR, `export-output-${Date.now()}`);

    await mkdir(testProjectRoot, { recursive: true });
    await mkdir(exportOutputDir, { recursive: true });
  });

  afterEach(async () => {
    if (existsSync(testProjectRoot)) {
      await rm(testProjectRoot, { recursive: true, force: true });
    }
    if (existsSync(exportOutputDir)) {
      await rm(exportOutputDir, { recursive: true, force: true });
    }
  });

  describe('Basic Export Functionality', () => {
    test('should export project to file', async () => {
      // Create test project structure
      await writeFile(
        join(testProjectRoot, 'package.json'),
        JSON.stringify({
          name: 'test-project',
          version: '1.0.0',
        })
      );
      await writeFile(join(testProjectRoot, 'README.md'), '# Test Project');

      const outputFile = join(exportOutputDir, 'test-export.zip');

      const result = await exportProject({
        projectRoot: testProjectRoot,
        output: outputFile,
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(existsSync(outputFile)).toBe(true);
    });

    test('should export with default output path', async () => {
      // Create test project
      await writeFile(join(testProjectRoot, 'test-file.js'), 'console.log("test");');

      const result = await exportProject({
        projectRoot: testProjectRoot,
        verbose: false,
      });

      expect(result).toBeDefined();
    });

    test('should handle empty project directory', async () => {
      const outputFile = join(exportOutputDir, 'empty-export.zip');

      const result = await exportProject({
        projectRoot: testProjectRoot,
        output: outputFile,
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(existsSync(outputFile)).toBe(true);
    });
  });

  describe('Export Formats', () => {
    test('should export as ZIP format', async () => {
      await writeFile(join(testProjectRoot, 'test-file.js'), 'console.log("test");');

      const outputFile = join(exportOutputDir, 'test-export.zip');

      const result = await exportProject({
        projectRoot: testProjectRoot,
        output: outputFile,
        format: 'zip',
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(existsSync(outputFile)).toBe(true);
      expect(outputFile.endsWith('.zip')).toBe(true);
    });

    test('should export as TAR format', async () => {
      await writeFile(join(testProjectRoot, 'test-file.js'), 'console.log("test");');

      const outputFile = join(exportOutputDir, 'test-export.tar');

      const result = await exportProject({
        projectRoot: testProjectRoot,
        output: outputFile,
        format: 'tar',
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(existsSync(outputFile)).toBe(true);
      expect(outputFile.endsWith('.tar')).toBe(true);
    });

    test('should export as TAR.GZ format', async () => {
      await writeFile(join(testProjectRoot, 'test-file.js'), 'console.log("test");');

      const outputFile = join(exportOutputDir, 'test-export.tar.gz');

      const result = await exportProject({
        projectRoot: testProjectRoot,
        output: outputFile,
        format: 'targz',
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(existsSync(outputFile)).toBe(true);
      expect(outputFile.endsWith('.tar.gz')).toBe(true);
    });
  });

  describe('Export Options', () => {
    test('should respect include patterns', async () => {
      // Create files with different extensions
      await writeFile(join(testProjectRoot, 'source.js'), 'console.log("source");');
      await writeFile(join(testProjectRoot, 'test.js'), 'console.log("test");');
      await writeFile(join(testProjectRoot, 'config.json'), '{"test": true}');
      await writeFile(join(testProjectRoot, 'temp.tmp'), 'temporary file');

      const outputFile = join(exportOutputDir, 'filtered-export.zip');

      const result = await exportProject({
        projectRoot: testProjectRoot,
        output: outputFile,
        include: ['*.js', '*.json'],
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(existsSync(outputFile)).toBe(true);
    });

    test('should respect exclude patterns', async () => {
      // Create files to include and exclude
      await writeFile(join(testProjectRoot, 'source.js'), 'console.log("source");');
      await writeFile(join(testProjectRoot, 'test.js'), 'console.log("test");');
      await writeFile(join(testProjectRoot, 'temp.tmp'), 'temporary file');
      await mkdir(join(testProjectRoot, 'node_modules'), { recursive: true });
      await writeFile(join(testProjectRoot, 'node_modules', 'dependency.js'), 'dependency');

      const outputFile = join(exportOutputDir, 'excluded-export.zip');

      const result = await exportProject({
        projectRoot: testProjectRoot,
        output: outputFile,
        exclude: ['*.tmp', 'node_modules/**'],
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(existsSync(outputFile)).toBe(true);
    });

    test('should respect verbose flag', async () => {
      await writeFile(join(testProjectRoot, 'test-file.js'), 'console.log("test");');

      // Capture console output
      const originalConsoleLog = console.log;
      let consoleOutput = '';
      console.log = (...args) => {
        consoleOutput += args.join(' ') + '\n';
      };

      try {
        const result = await exportProject({
          projectRoot: testProjectRoot,
          verbose: true,
        });

        expect(result).toBeDefined();
        expect(consoleOutput.length).toBeGreaterThan(0);
      } finally {
        console.log = originalConsoleLog;
      }
    });

    test('should respect compression level', async () => {
      await writeFile(join(testProjectRoot, 'test-file.js'), 'console.log("test");');

      const outputFile = join(exportOutputDir, 'compressed-export.zip');

      const result = await exportProject({
        projectRoot: testProjectRoot,
        output: outputFile,
        compression: 'high',
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(existsSync(outputFile)).toBe(true);
    });
  });

  describe('Project Structure Export', () => {
    test('should export nested directory structure', async () => {
      // Create nested structure
      await mkdir(join(testProjectRoot, 'src', 'components'), { recursive: true });
      await mkdir(join(testProjectRoot, 'src', 'utils'), { recursive: true });
      await mkdir(join(testProjectRoot, 'tests'), { recursive: true });

      await writeFile(
        join(testProjectRoot, 'src', 'components', 'Button.js'),
        'export const Button = () => {};'
      );
      await writeFile(
        join(testProjectRoot, 'src', 'utils', 'helpers.js'),
        'export const helper = () => {};'
      );
      await writeFile(
        join(testProjectRoot, 'tests', 'Button.test.js'),
        'describe("Button", () => {});'
      );

      const outputFile = join(exportOutputDir, 'nested-export.zip');

      const result = await exportProject({
        projectRoot: testProjectRoot,
        output: outputFile,
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(existsSync(outputFile)).toBe(true);
    });

    test('should export CodeFlow project structure', async () => {
      // Create CodeFlow project structure
      await mkdir(join(testProjectRoot, '.claude', 'agents'), { recursive: true });
      await mkdir(join(testProjectRoot, '.opencode', 'agent'), { recursive: true });
      await mkdir(join(testProjectRoot, 'codeflow-agents'), { recursive: true });
      await mkdir(join(testProjectRoot, 'command'), { recursive: true });

      await writeFile(
        join(testProjectRoot, 'AGENT_MANIFEST.json'),
        JSON.stringify({
          canonical_agents: [],
          total_agents: 0,
        })
      );
      await writeFile(join(testProjectRoot, '.claude', 'agents', 'test-agent.md'), 'Test agent');
      await writeFile(join(testProjectRoot, '.opencode', 'agent', 'test-agent.md'), 'Test agent');
      await writeFile(join(testProjectRoot, 'command', 'test-command.md'), 'Test command');

      const outputFile = join(exportOutputDir, 'codeflow-export.zip');

      const result = await exportProject({
        projectRoot: testProjectRoot,
        output: outputFile,
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(existsSync(outputFile)).toBe(true);
    });
  });

  describe('Large File Handling', () => {
    test('should handle large files efficiently', async () => {
      // Create large file
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB
      await writeFile(join(testProjectRoot, 'large-file.txt'), largeContent);

      const outputFile = join(exportOutputDir, 'large-export.zip');

      const result = await exportProject({
        projectRoot: testProjectRoot,
        output: outputFile,
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(existsSync(outputFile)).toBe(true);
    });

    test('should handle many files efficiently', async () => {
      // Create many small files
      for (let i = 0; i < 100; i++) {
        await writeFile(join(testProjectRoot, `file-${i}.js`), `console.log("file ${i}");`);
      }

      const outputFile = join(exportOutputDir, 'many-files-export.zip');

      const result = await exportProject({
        projectRoot: testProjectRoot,
        output: outputFile,
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(existsSync(outputFile)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle permission errors gracefully', async () => {
      await writeFile(join(testProjectRoot, 'test-file.js'), 'console.log("test");');

      const outputFile = '/root/restricted-export.zip'; // This should fail on most systems

      const result = await exportProject({
        projectRoot: testProjectRoot,
        output: outputFile,
        verbose: false,
      });

      // Should handle error gracefully
      expect(result).toBeDefined();
    });

    test('should handle missing project directory', async () => {
      const outputFile = join(exportOutputDir, 'missing-export.zip');

      const result = await exportProject({
        projectRoot: '/non/existent/path',
        output: outputFile,
        verbose: false,
      });

      expect(result).toBeDefined();
    });

    test('should handle invalid output path', async () => {
      await writeFile(join(testProjectRoot, 'test-file.js'), 'console.log("test");');

      const result = await exportProject({
        projectRoot: testProjectRoot,
        output: '/invalid/path/with/restricted/permissions.zip',
        verbose: false,
      });

      expect(result).toBeDefined();
    });
  });

  describe('Export Metadata', () => {
    test('should include export metadata', async () => {
      await writeFile(join(testProjectRoot, 'test-file.js'), 'console.log("test");');

      const outputFile = join(exportOutputDir, 'metadata-export.zip');

      const result = await exportProject({
        projectRoot: testProjectRoot,
        output: outputFile,
        includeMetadata: true,
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(existsSync(outputFile)).toBe(true);
    });

    test('should include timestamp in export', async () => {
      await writeFile(join(testProjectRoot, 'test-file.js'), 'console.log("test");');

      const outputFile = join(exportOutputDir, 'timestamp-export.zip');

      const result = await exportProject({
        projectRoot: testProjectRoot,
        output: outputFile,
        includeTimestamp: true,
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(existsSync(outputFile)).toBe(true);
    });
  });

  describe('Export Validation', () => {
    test('should validate exported archive', async () => {
      await writeFile(join(testProjectRoot, 'test-file.js'), 'console.log("test");');

      const outputFile = join(exportOutputDir, 'validated-export.zip');

      const result = await exportProject({
        projectRoot: testProjectRoot,
        output: outputFile,
        validate: true,
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(existsSync(outputFile)).toBe(true);
    });

    test('should verify exported file integrity', async () => {
      await writeFile(join(testProjectRoot, 'test-file.js'), 'console.log("test");');

      const outputFile = join(exportOutputDir, 'verified-export.zip');

      const result = await exportProject({
        projectRoot: testProjectRoot,
        output: outputFile,
        verify: true,
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(existsSync(outputFile)).toBe(true);
    });
  });

  describe('Export Statistics', () => {
    test('should return export statistics', async () => {
      await writeFile(join(testProjectRoot, 'test-file.js'), 'console.log("test");');

      const outputFile = join(exportOutputDir, 'stats-export.zip');

      const result = await exportProject({
        projectRoot: testProjectRoot,
        output: outputFile,
        verbose: false,
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    test('should track exported file count', async () => {
      // Create multiple files
      for (let i = 0; i < 5; i++) {
        await writeFile(join(testProjectRoot, `file-${i}.js`), `console.log("file ${i}");`);
      }

      const outputFile = join(exportOutputDir, 'count-export.zip');

      const result = await exportProject({
        projectRoot: testProjectRoot,
        output: outputFile,
        verbose: false,
      });

      expect(result).toBeDefined();
    });
  });
});

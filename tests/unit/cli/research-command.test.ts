/**
 * Research Command Tests
 * Tests the research command functionality for codebase analysis
 */





import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import { mkdir, writeFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { research } from '../../../src/cli/research.js';
import { setupTests, cleanupTests, TEST_DIR } from '../../setup.js';

describe('Research Command', () => {
  let testProjectRoot: string;

  beforeAll(async () => {
    await setupTests();
  });

  afterAll(async () => {
    await cleanupTests();
  });

  beforeEach(async () => {
    testProjectRoot = join(TEST_DIR, `research-test-${Date.now()}`);
    await mkdir(testProjectRoot, { recursive: true });
  });

  afterEach(async () => {
    if (existsSync(testProjectRoot)) {
      await rm(testProjectRoot, { recursive: true, force: true });
    }
  });

  describe('Basic Research Functionality', () => {
    test('should execute research with valid query', async () => {
      // Create test project structure
      const testFile = join(testProjectRoot, 'test-file.js');
      await writeFile(testFile, 'console.log("Hello World");');

      const result = await research({
        query: 'test query',
        projectRoot: testProjectRoot,
        verbose: false
      });

      expect(result).toBeDefined();
    });

    test('should handle empty project directory', async () => {
      const result = await research({
        query: 'test query',
        projectRoot: testProjectRoot,
        verbose: false
      });

      expect(result).toBeDefined();
    });

    test('should handle missing project root', async () => {
      await expect(research({
        query: 'test query',
        projectRoot: '/non/existent/path',
        verbose: false
      })).rejects.toThrow();
    });
  });

  describe('Research Options', () => {
    test('should respect verbose flag', async () => {
      // Capture console output
      const originalConsoleLog = console.log;
      let consoleOutput = '';
      console.log = (...args) => {
        consoleOutput += args.join(' ') + '\n';
      };

      try {
        await research({
          query: 'test query',
          projectRoot: testProjectRoot,
          verbose: true
        });

        // Should have some verbose output
        expect(consoleOutput.length).toBeGreaterThan(0);
      } finally {
        console.log = originalConsoleLog;
      }
    });

    test('should handle different query types', async () => {
      const queries = [
        'authentication flows',
        'database schema',
        'API endpoints',
        'error handling'
      ];

      for (const query of queries) {
        const result = await research({
          query,
          projectRoot: testProjectRoot,
          verbose: false
        });

        expect(result).toBeDefined();
      }
    });

    test('should handle special characters in query', async () => {
      const specialQueries = [
        'test "quoted" query',
        'query with @ symbols',
        'query with $variables',
        'query with #hashtags'
      ];

      for (const query of specialQueries) {
        const result = await research({
          query,
          projectRoot: testProjectRoot,
          verbose: false
        });

        expect(result).toBeDefined();
      }
    });
  });

  describe('Project Structure Analysis', () => {
    test('should analyze JavaScript project', async () => {
      // Create JavaScript project structure
      await writeFile(join(testProjectRoot, 'package.json'), JSON.stringify({
        name: 'test-project',
        version: '1.0.0'
      }));
      await writeFile(join(testProjectRoot, 'index.js'), 'console.log("Hello");');
      await mkdir(join(testProjectRoot, 'src'), { recursive: true });
      await writeFile(join(testProjectRoot, 'src', 'utils.js'), 'export const helper = () => {};');

      const result = await research({
        query: 'project structure',
        projectRoot: testProjectRoot,
        verbose: false
      });

      expect(result).toBeDefined();
    });

    test('should analyze TypeScript project', async () => {
      // Create TypeScript project structure
      await writeFile(join(testProjectRoot, 'package.json'), JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        devDependencies: {
          typescript: '^4.0.0'
        }
      }));
      await writeFile(join(testProjectRoot, 'tsconfig.json'), JSON.stringify({
        compilerOptions: {
          target: 'es2020'
        }
      }));
      await writeFile(join(testProjectRoot, 'index.ts'), 'console.log("Hello");');

      const result = await research({
        query: 'TypeScript configuration',
        projectRoot: testProjectRoot,
        verbose: false
      });

      expect(result).toBeDefined();
    });

    test('should analyze Python project', async () => {
      // Create Python project structure
      await writeFile(join(testProjectRoot, 'requirements.txt'), 'requests==2.28.0');
      await writeFile(join(testProjectRoot, 'main.py'), 'print("Hello World")');
      await mkdir(join(testProjectRoot, 'src'), { recursive: true });
      await writeFile(join(testProjectRoot, 'src', 'utils.py'), 'def helper(): pass');

      const result = await research({
        query: 'Python dependencies',
        projectRoot: testProjectRoot,
        verbose: false
      });

      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle permission errors gracefully', async () => {
      // Create a file that might cause permission issues
      await writeFile(join(testProjectRoot, 'restricted-file'), 'content');

      const result = await research({
        query: 'test query',
        projectRoot: testProjectRoot,
        verbose: false
      });

      expect(result).toBeDefined();
    });

    test('should handle malformed files gracefully', async () => {
      // Create malformed files
      await writeFile(join(testProjectRoot, 'malformed.json'), '{ invalid json }');
      await writeFile(join(testProjectRoot, 'malformed.js'), 'console.log(; // syntax error');

      const result = await research({
        query: 'test query',
        projectRoot: testProjectRoot,
        verbose: false
      });

      expect(result).toBeDefined();
    });

    test('should handle large files efficiently', async () => {
      // Create a large file
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB
      await writeFile(join(testProjectRoot, 'large-file.txt'), largeContent);

      const result = await research({
        query: 'large file analysis',
        projectRoot: testProjectRoot,
        verbose: false
      });

      expect(result).toBeDefined();
    });
  });

  describe('Research Configuration', () => {
    test('should handle includeWeb option', async () => {
      const result = await research({
        query: 'latest React patterns',
        projectRoot: testProjectRoot,
        includeWeb: true,
        verbose: false
      });

      expect(result).toBeDefined();
    });

    test('should handle specialists option', async () => {
      const result = await research({
        query: 'security vulnerabilities',
        projectRoot: testProjectRoot,
        specialists: 'security-auditor',
        verbose: false
      });

      expect(result).toBeDefined();
    });

    test('should handle minQuality option', async () => {
      const result = await research({
        query: 'test query',
        projectRoot: testProjectRoot,
        minQuality: 'high',
        verbose: false
      });

      expect(result).toBeDefined();
    });

    test('should handle multiple specialists', async () => {
      const result = await research({
        query: 'comprehensive analysis',
        projectRoot: testProjectRoot,
        specialists: 'codebase-analyzer,security-auditor,performance-analyzer',
        verbose: false
      });

      expect(result).toBeDefined();
    });
  });

  describe('Output and Results', () => {
    test('should return structured results', async () => {
      await writeFile(join(testProjectRoot, 'test.js'), 'console.log("test");');

      const result = await research({
        query: 'test analysis',
        projectRoot: testProjectRoot,
        verbose: false
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    test('should include relevant file information', async () => {
      await writeFile(join(testProjectRoot, 'auth.js'), 'function authenticate() {}');
      await writeFile(join(testProjectRoot, 'user.js'), 'class User {}');

      const result = await research({
        query: 'authentication implementation',
        projectRoot: testProjectRoot,
        verbose: false
      });

      expect(result).toBeDefined();
    });

    test('should handle empty results gracefully', async () => {
      const result = await research({
        query: 'nonexistent functionality',
        projectRoot: testProjectRoot,
        verbose: false
      });

      expect(result).toBeDefined();
    });
  });

  describe('Performance', () => {
    test('should complete research within reasonable time', async () => {
      const startTime = Date.now();

      await research({
        query: 'performance test',
        projectRoot: testProjectRoot,
        verbose: false
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });

    test('should handle concurrent research requests', async () => {
      const promises = Array.from({ length: 3 }, (_, i) =>
        research({
          query: `concurrent test ${i}`,
          projectRoot: testProjectRoot,
          verbose: false
        })
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });

  describe('Integration with Platform Adapters', () => {
    test('should work with Claude Code project', async () => {
      // Create Claude Code project structure
      await mkdir(join(testProjectRoot, '.claude', 'agents'), { recursive: true });
      await writeFile(join(testProjectRoot, '.claude', 'agents', 'test-agent.md'), 'Test agent');

      const result = await research({
        query: 'Claude Code analysis',
        projectRoot: testProjectRoot,
        verbose: false
      });

      expect(result).toBeDefined();
    });

    test('should work with OpenCode project', async () => {
      // Create OpenCode project structure
      await mkdir(join(testProjectRoot, '.opencode', 'agent'), { recursive: true });
      await writeFile(join(testProjectRoot, '.opencode', 'agent', 'test-agent.md'), 'Test agent');

      const result = await research({
        query: 'OpenCode analysis',
        projectRoot: testProjectRoot,
        verbose: false
      });

      expect(result).toBeDefined();
    });
  });
});

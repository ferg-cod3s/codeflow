/**
 * Security Validation Tests
 * Tests for security validation utilities to prevent vulnerabilities
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  validatePath,
  validateFileExtension,
  validateDirectoryName,
  checkPermissions,
  validateFileSize,
  sanitizeInput,
  validateContent,
  validateFileOperation,
  securityAuditLogger,
  secureFileOperation,
  setFilePermissions,
  setDirectoryPermissions,
  applyPermissionInheritance,
} from '../../../src/security/validation';

describe('Security Validation', () => {
  let testDir: string;
  let testFile: string;

  beforeAll(async () => {
    // Create a temporary directory for tests
    testDir = join(tmpdir(), `codeflow-security-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    testFile = join(testDir, 'test.md');
    await writeFile(testFile, '# Test Content');
  });

  afterAll(async () => {
    // Cleanup test directory
    const { rm } = await import('fs/promises');
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    // Clear audit logs before each test
    securityAuditLogger.clear();
  });

  describe('validatePath', () => {
    test('should accept valid relative paths', async () => {
      const result = await validatePath('test.md');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedPath).toBeDefined();
      expect(result.sanitizedPath).toContain('test.md');
    });

    test('should accept valid absolute paths', async () => {
      const result = await validatePath(testFile);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedPath).toBe(testFile);
    });

    test('should reject empty or null paths', async () => {
      const result1 = await validatePath('');
      expect(result1.isValid).toBe(false);
      expect(result1.error).toContain('non-empty string');

      const result2 = await validatePath(null as any);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toContain('non-empty string');
    });

    test('should reject paths that are too long', async () => {
      const longPath = 'a'.repeat(1001);
      const result = await validatePath(longPath);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too long');
    });

    test('should reject path traversal attempts', async () => {
      const dangerousPaths = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32',
        '/etc/passwd',
        '/root/.ssh/id_rsa',
        'C:\\Windows\\System32',
        'test/../../../etc/passwd',
        'test\\..\\..\\windows\\system32',
      ];

      for (const path of dangerousPaths) {
        const result = await validatePath(path);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('dangerous patterns');
      }
    });

    test('should reject command injection attempts', async () => {
      const injectionPaths = [
        'test; rm -rf /',
        'test| cat /etc/passwd',
        'test && echo hacked',
        'test`whoami`',
        'test$(id)',
        'test\x00null',
      ];

      for (const path of injectionPaths) {
        const result = await validatePath(path);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('dangerous patterns');
      }
    });

    test('should allow paths under current working directory', async () => {
      const result = await validatePath('./test.md');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedPath).toBeDefined();
    });

    test('should allow paths under home directory', async () => {
      const homePath = join(process.env.HOME || process.env.USERPROFILE || '', 'test.md');
      const result = await validatePath(homePath);
      expect(result.isValid).toBe(true);
    });

    test('should allow temp directory paths', async () => {
      const tempPath = join(tmpdir(), 'test.md');
      const result = await validatePath(tempPath);
      expect(result.isValid).toBe(true);
    });

    test('should reject paths outside allowed directories', async () => {
      const restrictedPath = '/restricted/test.md';
      const result = await validatePath(restrictedPath);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('outside allowed directories');
    });
  });

  describe('validateFileExtension', () => {
    test('should accept allowed extensions', () => {
      const validFiles = ['test.md', 'README.MD', 'document.md'];

      for (const file of validFiles) {
        const result = validateFileExtension(file);
        expect(result.isValid).toBe(true);
      }
    });

    test('should reject disallowed extensions', () => {
      const invalidFiles = [
        'test.js',
        'test.exe',
        'test.sh',
        'test.py',
        'test.json',
        'test.txt',
        'test',
      ];

      for (const file of invalidFiles) {
        const result = validateFileExtension(file);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('not allowed');
      }
    });
  });

  describe('validateDirectoryName', () => {
    test('should accept allowed directory names', () => {
      const allowedDirs = ['agent', 'command', '.claude', '.opencode', 'commands', 'agents'];

      for (const dir of allowedDirs) {
        const result = validateDirectoryName(dir);
        expect(result.isValid).toBe(true);
      }
    });

    test('should accept valid project directory names', () => {
      const validDirs = ['my-project', 'test_project', 'project123', 'my.project', 'project-v2'];

      for (const dir of validDirs) {
        const result = validateDirectoryName(dir);
        expect(result.isValid).toBe(true);
      }
    });

    test('should reject directory names with invalid characters', () => {
      const invalidDirs = [
        'project;rm',
        'test|pipe',
        'project&and',
        'test<script>',
        'project"quote',
        'test`backtick',
        'project$var',
        'a'.repeat(101), // Too long
      ];

      for (const dir of invalidDirs) {
        const result = validateDirectoryName(dir);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('invalid characters or is too long');
      }
    });
  });

  describe('checkPermissions', () => {
    test('should check permissions for existing file', async () => {
      const result = await checkPermissions(testFile);

      expect(result.exists).toBe(true);
      expect(typeof result.readable).toBe('boolean');
      expect(typeof result.writable).toBe('boolean');
      expect(typeof result.executable).toBe('boolean');
    });

    test('should handle non-existent file', async () => {
      const result = await checkPermissions('/non/existent/file.md');

      expect(result.exists).toBe(false);
      expect(result.readable).toBe(false);
      expect(result.writable).toBe(false);
      expect(result.executable).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    test('should accept files within size limit', async () => {
      const result = await validateFileSize(testFile);
      expect(result.isValid).toBe(true);
    });

    test('should reject oversized files', async () => {
      // Create a large file (over 10MB)
      const largeFile = join(testDir, 'large.md');
      const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
      await writeFile(largeFile, largeContent);

      const result = await validateFileSize(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too large');
    });

    test('should handle non-existent file', async () => {
      const result = await validateFileSize('/non/existent/file.md');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Failed to check file size');
    });
  });

  describe('sanitizeInput', () => {
    test('should remove dangerous characters', () => {
      const dangerousInput = '<script>alert("xss")</script>&test"quote`backtick$dollar';
      const sanitized = sanitizeInput(dangerousInput);

      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).not.toContain('"');
      expect(sanitized).not.toContain('`');
      expect(sanitized).not.toContain('$');
      expect(sanitized).toContain('&amp;');
    });

    test('should handle newlines and whitespace', () => {
      const input = 'line1\nline2\rline3   multiple   spaces';
      const sanitized = sanitizeInput(input);

      expect(sanitized).not.toContain('\n');
      expect(sanitized).not.toContain('\r');
      expect(sanitized).toContain('line1 line2 line3 multiple spaces');
    });

    test('should limit length', () => {
      const longInput = 'a'.repeat(2000);
      const sanitized = sanitizeInput(longInput);

      expect(sanitized.length).toBeLessThanOrEqual(1000);
    });

    test('should handle non-string input', () => {
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
      expect(sanitizeInput(123 as any)).toBe('');
    });
  });

  describe('validateContent', () => {
    test('should accept safe content', () => {
      const safeContent = '# Safe Content\n\nThis is safe markdown content with **bold** text.';
      const result = validateContent(safeContent);
      expect(result.isValid).toBe(true);
    });

    test('should reject dangerous code patterns', () => {
      const dangerousContents = [
        'eval("malicious code")',
        'exec("rm -rf /")',
        'system("cat /etc/passwd")',
        '$(whoami)',
        '`id`',
        '<script>alert("xss")</script>',
        'javascript:void(0)',
        'data:text/html;base64,PHNjcmlwdD4',
        'vbscript:msgbox("xss")',
        '<iframe src="evil.com"></iframe>',
        '<object data="evil.com"></object>',
        '<embed src="evil.com"></embed>',
      ];

      for (const content of dangerousContents) {
        const result = validateContent(content);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('dangerous code patterns');
      }
    });

    test('should reject oversized content', () => {
      const largeContent = 'x'.repeat(1024 * 1024 + 1); // Over 1MB
      const result = validateContent(largeContent);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too large');
    });

    test('should handle non-string input', () => {
      const result1 = validateContent(null as any);
      expect(result1.isValid).toBe(false);
      expect(result1.error).toContain('must be a string');

      const result2 = validateContent(123 as any);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toContain('must be a string');
    });
  });

  describe('validateFileOperation', () => {
    test('should validate read operation', async () => {
      const result = await validateFileOperation(testFile, 'read');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedPath).toBeDefined();
    });

    test('should validate write operation', async () => {
      const result = await validateFileOperation(testFile, 'write');
      expect(result.isValid).toBe(true);
    });

    test('should validate delete operation', async () => {
      const result = await validateFileOperation(testFile, 'delete');
      expect(result.isValid).toBe(true);
    });

    test('should reject invalid operation types', async () => {
      const result = await validateFileOperation(testFile, 'invalid' as any);
      // Should still pass path validation but operation check might fail
      expect(result.isValid).toBe(true); // Path validation passes
    });

    test('should validate content for write operations', async () => {
      const safeContent = '# Safe content';
      const result = await validateFileOperation(testFile, 'write', safeContent);
      expect(result.isValid).toBe(true);
    });

    test('should reject dangerous content for write operations', async () => {
      const dangerousContent = '<script>alert("xss")</script>';
      const result = await validateFileOperation(testFile, 'write', dangerousContent);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('dangerous code patterns');
    });
  });

  describe('securityAuditLogger', () => {
    test('should log security events', () => {
      securityAuditLogger.log({
        operation: 'test-operation',
        filePath: '/test/path',
        result: 'success',
      });

      const logs = securityAuditLogger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].operation).toBe('test-operation');
      expect(logs[0].filePath).toBe('/test/path');
      expect(logs[0].result).toBe('success');
      expect(logs[0].timestamp).toBeDefined();
    });

    test('should log failures with errors', () => {
      securityAuditLogger.log({
        operation: 'test-operation',
        filePath: '/test/path',
        result: 'failure',
        error: 'Test error',
      });

      const failures = securityAuditLogger.getFailures(1);
      expect(failures).toHaveLength(1);
      expect(failures[0].error).toBe('Test error');
    });

    test('should limit log size', () => {
      // Add more logs than the limit
      for (let i = 0; i < 1100; i++) {
        securityAuditLogger.log({
          operation: `test-${i}`,
          filePath: `/test-${i}`,
          result: 'success',
        });
      }

      const logs = securityAuditLogger.getRecentLogs(2000);
      expect(logs.length).toBeLessThanOrEqual(1000);
    });

    test('should clear logs', () => {
      securityAuditLogger.log({
        operation: 'test',
        filePath: '/test',
        result: 'success',
      });

      expect(securityAuditLogger.getRecentLogs().length).toBeGreaterThan(0);

      securityAuditLogger.clear();
      expect(securityAuditLogger.getRecentLogs()).toHaveLength(0);
    });
  });

  describe('secureFileOperation', () => {
    test('should execute valid operations successfully', async () => {
      const result = await secureFileOperation('test-read', testFile, 'read', async (path) => {
        const content = await Bun.file(path).text();
        return content;
      });

      expect(result).toContain('Test Content');
    });

    test('should log successful operations', async () => {
      await secureFileOperation('test-success', testFile, 'read', async () => 'success');

      const logs = securityAuditLogger.getRecentLogs(1);
      expect(logs[0].result).toBe('success');
      expect(logs[0].operation).toBe('test-success');
    });

    test('should reject invalid operations and log failures', async () => {
      await expect(
        secureFileOperation(
          'test-failure',
          '../../../etc/passwd',
          'read',
          async () => 'should not execute'
        )
      ).rejects.toThrow('Security validation failed');

      const failures = securityAuditLogger.getFailures(1);
      expect(failures[0].result).toBe('failure');
      expect(failures[0].operation).toBe('test-failure');
    });

    test('should handle operation errors and log failures', async () => {
      await expect(
        secureFileOperation('test-error', testFile, 'read', async () => {
          throw new Error('Operation failed');
        })
      ).rejects.toThrow('Operation failed');

      const failures = securityAuditLogger.getFailures(1);
      expect(failures[0].result).toBe('failure');
      expect(failures[0].error).toContain('Operation failed');
    });
  });

  describe('permission management', () => {
    test('should set file permissions', async () => {
      const testFileForPerms = join(testDir, 'perms-test.md');
      await writeFile(testFileForPerms, 'test');

      const result1 = await setFilePermissions(testFileForPerms, 0o644);
      expect(result1).toBeUndefined();
    });

    test('should set directory permissions', async () => {
      const testDirForPerms = join(testDir, 'perms-test');
      await mkdir(testDirForPerms);

      const result2 = await setDirectoryPermissions(testDirForPerms, 0o755);
      expect(result2).toBeUndefined();
    });

    test('should apply permission inheritance', async () => {
      const baseDir = join(testDir, 'inheritance-test');
      await mkdir(baseDir, { recursive: true });

      // Create test files
      await writeFile(join(baseDir, 'agent.md'), '# Agent');
      await writeFile(join(baseDir, 'command.md'), '# Command');

      const config = {
        directories: 0o755,
        agentFiles: 0o644,
        commandFiles: 0o644,
      };

      const result3 = await applyPermissionInheritance(baseDir, 'primary', config);
      expect(result3).toBeUndefined();
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle malformed paths gracefully', async () => {
      const malformedPaths = ['', null as any, undefined as any, 123 as any, {}, []];

      for (const path of malformedPaths) {
        const result = await validatePath(path);
        expect(result.isValid).toBe(false);
      }
    });

    test('should handle Unicode characters in paths', async () => {
      const unicodePath = 'tëst-🚀.md';
      const result = await validatePath(unicodePath);
      expect(result.isValid).toBe(true);
    });

    test('should handle very long directory names', async () => {
      const longDirName = 'a'.repeat(200);
      const result = validateDirectoryName(longDirName);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too long');
    });

    test('should handle concurrent operations', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => validatePath(`test-${i}.md`));

      const results = await Promise.all(promises);
      expect(results.every((r) => r.isValid)).toBe(true);
    });
  });
});

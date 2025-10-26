import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

// Import utilities we need to test
// import { resolveProjectPath } from "../../src/cli/utils";

describe('Cross-Platform Compatibility', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codeflow-platform-test-'));
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('resolves Claude Desktop config path correctly', () => {
    // Test the platform-specific path logic directly
    const home = os.homedir();
    let expectedConfigPath: string;

    if (process.platform === 'darwin') {
      expectedConfigPath = path.join(
        home,
        'Library/Application Support/Claude/claude_desktop_config.json'
      );
      expect(expectedConfigPath).toContain('Library');
      expect(expectedConfigPath).toContain('Application Support');
    } else if (process.platform === 'win32') {
      expectedConfigPath = path.join(
        process.env.APPDATA || '',
        'Claude/claude_desktop_config.json'
      );
      expect(expectedConfigPath).toContain('AppData');
    } else {
      expectedConfigPath = path.join(home, '.config/Claude/claude_desktop_config.json');
      expect(expectedConfigPath).toContain('.config');
    }

    expect(expectedConfigPath).toBeDefined();
    expect(typeof expectedConfigPath).toBe('string');
    expect(expectedConfigPath.length).toBeGreaterThan(0);
    expect(expectedConfigPath.endsWith('claude_desktop_config.json')).toBe(true);
  });

  test('handles file paths with platform-specific separators', async () => {
    const testPath = path.join(tempDir, 'subdir', 'file.txt');

    // Create nested directory structure
    await fs.mkdir(path.dirname(testPath), { recursive: true });
    await fs.writeFile(testPath, 'test content');

    // Test path resolution across platforms
    const resolvedPath = path.resolve(testPath);
    expect(await fs.stat(resolvedPath)).toBeDefined();

    // Path should use correct separators for platform
    if (process.platform === 'win32') {
      expect(resolvedPath).toContain('\\');
    } else {
      expect(resolvedPath).toContain('/');
    }
  });

  test('handles file permissions across platforms', async () => {
    const testFile = path.join(tempDir, 'permissions-test.txt');
    await fs.writeFile(testFile, 'test content');

    const stats = await fs.stat(testFile);
    expect(stats).toBeDefined();
    expect(stats.isFile()).toBe(true);

    if (process.platform !== 'win32') {
      // Test Unix-like permissions
      expect(typeof stats.mode).toBe('number');
      expect(stats.mode).toBeGreaterThan(0);
    }
  });

  test('creates directories with proper permissions', async () => {
    const testDir = path.join(tempDir, 'new-directory');

    await fs.mkdir(testDir, { recursive: true });

    const stats = await fs.stat(testDir);
    expect(stats.isDirectory()).toBe(true);

    // Should be readable/writable
    await fs.access(testDir, fs.constants.R_OK | fs.constants.W_OK);
  });

  test('handles paths with spaces correctly', async () => {
    const pathWithSpaces = path.join(tempDir, 'directory with spaces', 'file with spaces.txt');

    await fs.mkdir(path.dirname(pathWithSpaces), { recursive: true });
    await fs.writeFile(pathWithSpaces, 'content');

    const stats = await fs.stat(pathWithSpaces);
    expect(stats.isFile()).toBe(true);

    const content = await fs.readFile(pathWithSpaces, 'utf-8');
    expect(content).toBe('content');
  });

  test('resolves home directory correctly', () => {
    const homeDir = os.homedir();

    expect(homeDir).toBeDefined();
    expect(typeof homeDir).toBe('string');
    expect(homeDir.length).toBeGreaterThan(0);

    // Should be an absolute path
    expect(path.isAbsolute(homeDir)).toBe(true);
  });

  test('handles environment variables properly', () => {
    // Test common environment variables across platforms
    const testEnvVar = process.env.HOME || process.env.USERPROFILE;

    expect(testEnvVar).toBeDefined();
    expect(typeof testEnvVar).toBe('string');
  });

  test('file system operations work with Unicode characters', async () => {
    const unicodeFile = path.join(tempDir, '测试文件.txt');
    const unicodeContent = 'Unicode content: 你好世界 🌍';

    await fs.writeFile(unicodeFile, unicodeContent, 'utf-8');

    const readContent = await fs.readFile(unicodeFile, 'utf-8');
    expect(readContent).toBe(unicodeContent);

    const stats = await fs.stat(unicodeFile);
    expect(stats.isFile()).toBe(true);
  });

  test('handles symlinks appropriately', async () => {
    if (process.platform === 'win32') {
      // Skip on Windows as symlinks require elevated permissions
      return;
    }

    const originalFile = path.join(tempDir, 'original.txt');
    const symlinkFile = path.join(tempDir, 'symlink.txt');

    await fs.writeFile(originalFile, 'original content');
    await fs.symlink(originalFile, symlinkFile);

    const stats = await fs.lstat(symlinkFile);
    expect(stats.isSymbolicLink()).toBe(true);

    const content = await fs.readFile(symlinkFile, 'utf-8');
    expect(content).toBe('original content');
  });
});

describe('Platform-Specific Path Resolution', () => {
  test('resolves global config directories correctly', () => {
    let globalConfigDir: string;

    if (process.platform === 'darwin') {
      globalConfigDir = path.join(os.homedir(), 'Library', 'Application Support', 'claude-code');
    } else if (process.platform === 'win32') {
      globalConfigDir = path.join(os.homedir(), 'AppData', 'Roaming', 'claude-code');
    } else {
      globalConfigDir = path.join(os.homedir(), '.config', 'claude-code');
    }

    expect(path.isAbsolute(globalConfigDir)).toBe(true);
    expect(globalConfigDir).toContain(os.homedir());
  });

  test('constructs MCP config paths correctly', () => {
    let mcpConfigPath: string;

    if (process.platform === 'darwin') {
      mcpConfigPath = path.join(
        os.homedir(),
        'Library',
        'Application Support',
        'Claude',
        'claude_desktop_config.json'
      );
    } else if (process.platform === 'win32') {
      mcpConfigPath = path.join(
        os.homedir(),
        'AppData',
        'Roaming',
        'Claude',
        'claude_desktop_config.json'
      );
    } else {
      mcpConfigPath = path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json');
    }

    expect(path.isAbsolute(mcpConfigPath)).toBe(true);
    expect(mcpConfigPath.endsWith('claude_desktop_config.json')).toBe(true);
  });

  test('handles executable paths correctly', () => {
    const nodeExePath = process.execPath;

    expect(nodeExePath).toBeDefined();
    expect(typeof nodeExePath).toBe('string');
    expect(path.isAbsolute(nodeExePath)).toBe(true);

    if (process.platform === 'win32') {
      expect(nodeExePath.toLowerCase().endsWith('.exe')).toBe(true);
    }
  });

  test('resolves temporary directory paths', () => {
    const tempDir = os.tmpdir();

    expect(tempDir).toBeDefined();
    expect(typeof tempDir).toBe('string');
    expect(path.isAbsolute(tempDir)).toBe(true);

    // Common temp directory patterns (more flexible)
    if (process.platform === 'darwin') {
      // macOS can use /tmp, /var/folders/, etc.
      expect(tempDir.toLowerCase()).toMatch(/(tmp|temp|\/t$)/);
    } else if (process.platform === 'win32') {
      expect(tempDir.toLowerCase()).toContain('temp');
    } else {
      // Linux usually uses /tmp
      expect(tempDir).toContain('tmp');
    }
  });
});

describe('File System Edge Cases', () => {
  let testDir: string;

  beforeAll(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codeflow-edge-cases-'));
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test('handles empty directories', async () => {
    const emptyDir = path.join(testDir, 'empty');
    await fs.mkdir(emptyDir);

    const entries = await fs.readdir(emptyDir);
    expect(entries).toHaveLength(0);
  });

  test('handles very long file names', async () => {
    // Create a long filename (but within filesystem limits)
    const longName = 'a'.repeat(100) + '.txt';
    const longPath = path.join(testDir, longName);

    try {
      await fs.writeFile(longPath, 'content');
      const content = await fs.readFile(longPath, 'utf-8');
      expect(content).toBe('content');
    } catch (error) {
      // Some filesystems have stricter limits
      if (error instanceof Error && error.message.includes('ENAMETOOLONG')) {
        // This is expected on some systems
        return;
      }
      throw error;
    }
  });

  test('handles concurrent file operations', async () => {
    const promises: Promise<void>[] = [];

    for (let i = 0; i < 10; i++) {
      const fileName = path.join(testDir, `concurrent-${i}.txt`);
      const promise = fs.writeFile(fileName, `content-${i}`);
      promises.push(promise);
    }

    await Promise.all(promises);

    // Verify all files were created
    for (let i = 0; i < 10; i++) {
      const fileName = path.join(testDir, `concurrent-${i}.txt`);
      const content = await fs.readFile(fileName, 'utf-8');
      expect(content).toBe(`content-${i}`);
    }
  });

  test('handles file locking scenarios', async () => {
    const testFile = path.join(testDir, 'lock-test.txt');
    await fs.writeFile(testFile, 'initial content');

    // Simultaneous reads should work
    const readPromises = Array(5)
      .fill(0)
      .map(() => fs.readFile(testFile, 'utf-8'));

    const results = await Promise.all(readPromises);
    results.forEach((content) => {
      expect(content).toBe('initial content');
    });
  });
});

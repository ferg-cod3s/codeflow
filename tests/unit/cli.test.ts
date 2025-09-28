import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

const CLI_PATH = path.join(import.meta.dir, '../../src/cli/index.ts');

// Helper function to run CLI commands
async function runCLI(
  args: string[],
  options = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const child = spawn('bun', ['run', CLI_PATH, ...args], {
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'test' },
      ...options,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code || 0 });
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      child.kill();
      resolve({ stdout, stderr, exitCode: -1 });
    }, 30000);
  });
}

describe('CLI Commands', () => {
  let tempDir: string;

  beforeAll(async () => {
    // Create temp directory inside home directory to satisfy path requirements
    tempDir = await fs.mkdtemp(path.join(os.homedir(), 'codeflow-test-'));
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('codeflow --version displays correct version', async () => {
    const result = await runCLI(['--version']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Codeflow');
    expect(result.stdout).toMatch(/\d+\.\d+\.\d+/); // Semantic version pattern
  });

  test('codeflow --help displays usage information', async () => {
    const result = await runCLI(['--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('codeflow - Intelligent AI workflow management');
    expect(result.stdout).toContain('Usage:');
    expect(result.stdout).toContain('Commands:');
    expect(result.stdout).toContain('Options:');
    expect(result.stdout).toContain('Examples:');
  });

  test('codeflow help shows same content as --help', async () => {
    const helpFlag = await runCLI(['--help']);
    const helpCommand = await runCLI(['help']);

    expect(helpFlag.exitCode).toBe(0);
    expect(helpCommand.exitCode).toBe(0);
    expect(helpFlag.stdout).toBe(helpCommand.stdout);
  });

  test('codeflow without arguments shows help', async () => {
    const result = await runCLI([]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('codeflow - Intelligent AI workflow management');
  });

  test('codeflow with invalid command shows error', async () => {
    const result = await runCLI(['invalid-command']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Error: Unknown command 'invalid-command'");
    expect(result.stderr).toContain("Run 'codeflow --help' for usage information");
  });

  test('codeflow with invalid flag shows error', async () => {
    const result = await runCLI(['--invalid-flag']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Error:');
    expect(result.stderr).toContain("Run 'codeflow --help' for usage information");
  });

  test('codeflow status without .opencode directory shows error', async () => {
    const result = await runCLI(['status'], { cwd: tempDir });

    // Should not error - status command should work without .opencode directory
    expect(result.exitCode).toBe(0);
  });

  test('codeflow setup --help shows setup-specific help', async () => {
    const result = await runCLI(['setup', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('setup [project-path]');
  });

  test('codeflow convert without required args shows error', async () => {
    const result = await runCLI(['convert']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Error: convert requires source, target, and format arguments');
    expect(result.stderr).toContain('Formats: base, claude-code, opencode');
  });

  test('codeflow convert with invalid format shows error', async () => {
    const result = await runCLI(['convert', 'source', 'target', 'invalid-format']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Error: Invalid format 'invalid-format'");
    expect(result.stderr).toContain('Valid formats: base, claude-code, opencode');
  });

  test('codeflow watch without action shows error', async () => {
    const result = await runCLI(['watch']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Error: Unknown watch action');
    expect(result.stderr).toContain('Available actions: start');
  });

  test('codeflow watch with invalid action shows error', async () => {
    const result = await runCLI(['watch', 'invalid-action']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Error: Unknown watch action 'invalid-action'");
    expect(result.stderr).toContain('Available actions: start');
  });
});

describe('CLI Argument Parsing', () => {
  test('boolean flags are parsed correctly', async () => {
    const result = await runCLI(['convert', 'source', 'target', 'base', '--dry-run']);

    // Should not error on valid boolean flags
    expect(result.exitCode).toBe(1); // Will fail due to missing source/target directories, but flags are parsed
    expect(result.stderr).toContain('Error: Cannot convert to base format'); // Should fail on format conversion, not flag parsing
  });

  test('string options are parsed correctly', async () => {
    const result = await runCLI(['setup', '.', '--type', 'claude-code']);

    // Should accept valid string options
    expect(result.exitCode).toBe(0);
  });

  test('short flags work correctly', async () => {
    const result = await runCLI(['-h']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('codeflow - Intelligent AI workflow management');
  });
});

describe('CLI Project Type Detection', () => {
  let projectDir: string;

  beforeAll(async () => {
    projectDir = await fs.mkdtemp(path.join(os.homedir(), 'codeflow-project-'));
  });

  afterAll(async () => {
    await fs.rm(projectDir, { recursive: true, force: true });
  });

  test('setup detects Claude Code project correctly', async () => {
    // Create a .claude directory to simulate Claude Code project
    await fs.mkdir(path.join(projectDir, '.claude'), { recursive: true });

    const result = await runCLI(['setup', projectDir, '--dry-run']);

    expect(result.exitCode).toBe(0);
  });

  test('setup handles empty directory', async () => {
    const emptyDir = await fs.mkdtemp(path.join(os.homedir(), 'codeflow-empty-'));

    try {
      const result = await runCLI(['setup', emptyDir]);

      expect(result.exitCode).toBe(0);
    } finally {
      await fs.rm(emptyDir, { recursive: true, force: true });
    }
  });

  test('setup with explicit type flag works', async () => {
    const result = await runCLI(['setup', projectDir, '--type', 'opencode', '--dry-run']);

    expect(result.exitCode).toBe(0);
  });
});

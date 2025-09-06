import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { CommandSetupStrategy } from '../../src/cli/setup.ts';

describe('CommandSetupStrategy', () => {
  let tempDir: string;
  let strategy: CommandSetupStrategy;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(import.meta.dir, 'tmp-'));
    strategy = new CommandSetupStrategy();
    
    // Create mock source directories and files
    await mkdir(join(tempDir, '.claude', 'commands'), { recursive: true });
    await mkdir(join(tempDir, '.opencode', 'command'), { recursive: true });
    await mkdir(join(tempDir, 'command'), { recursive: true });
    
    // Mock command files
    const mockCommand = '---\nname: test\n---\n# Test Command';
    await writeFile(join(tempDir, '.claude', 'commands', 'test.md'), mockCommand);
    await writeFile(join(tempDir, '.opencode', 'command', 'test.md'), mockCommand);
    await writeFile(join(tempDir, 'command', 'test.md'), mockCommand);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should handle Claude Code target directory', async () => {
    const targetDir = join(tempDir, 'target', '.claude', 'commands');
    await mkdir(targetDir, { recursive: true });
    
    const result = await strategy.setup(tempDir, targetDir, {} as any);
    
    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it('should handle OpenCode target directory', async () => {
    const targetDir = join(tempDir, 'target', '.opencode', 'command');
    await mkdir(targetDir, { recursive: true });
    
    const result = await strategy.setup(tempDir, targetDir, {} as any);
    
    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it('should fallback to base format when specific format missing', async () => {
    // Remove specific format
    await rm(join(tempDir, '.claude'), { recursive: true, force: true });
    
    const targetDir = join(tempDir, 'target', '.claude', 'commands');
    await mkdir(targetDir, { recursive: true });
    
    const result = await strategy.setup(tempDir, targetDir, {} as any);
    
    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(result.warnings[0]).toContain('Using fallback command source');
  });

  it('should error when no command sources exist', async () => {
    // Remove all command sources
    await rm(join(tempDir, '.claude'), { recursive: true, force: true });
    await rm(join(tempDir, '.opencode'), { recursive: true, force: true });
    await rm(join(tempDir, 'command'), { recursive: true, force: true });
    
    const targetDir = join(tempDir, 'target', '.claude', 'commands');
    await mkdir(targetDir, { recursive: true });
    
    const result = await strategy.setup(tempDir, targetDir, {} as any);
    
    expect(result.success).toBe(false);
    expect(result.count).toBe(0);
    expect(result.errors[0]).toContain('No command source found');
  });
});
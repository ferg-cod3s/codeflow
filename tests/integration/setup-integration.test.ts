import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { join } from 'node:path';
import { mkdir, rm, writeFile, readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { setup } from '../../src/cli/setup';

describe('Setup Integration', () => {
  let tempDir: string;
  let projectDir: string;

  beforeEach(async () => {
    // Create temp directory for testing
    tempDir = join(process.cwd(), 'test-integration-' + Date.now());
    projectDir = join(tempDir, 'test-project');
    await mkdir(projectDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup
    if (existsSync(tempDir)) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test('should setup Claude Code project with commands', async () => {
    // Create a .claude directory to trigger Claude Code detection
    const claudeDir = join(projectDir, '.claude');
    await mkdir(claudeDir, { recursive: true });

    // Create claude_config.json to ensure Claude Code detection
    await writeFile(
      join(claudeDir, 'claude_config.json'),
      JSON.stringify({ commands: { enabled: true, directory: 'commands' } })
    );

    // Run setup
    await setup(projectDir, { type: 'claude-code' });

    // Verify commands directory was created
    expect(existsSync(join(projectDir, '.claude', 'commands'))).toBe(true);

    // Verify command files were copied (the main bug fix)
    const commandFiles = await readdir(join(projectDir, '.claude', 'commands'));
    const mdFiles = commandFiles.filter(f => f.endsWith('.md'));
    expect(mdFiles).toHaveLength(7);
    expect(mdFiles).toContain('research.md');
    expect(mdFiles).toContain('plan.md');
    expect(mdFiles).toContain('execute.md');
    
    // Verify agents directory was created (our fix)
    expect(existsSync(join(projectDir, '.claude', 'agents'))).toBe(true);
  });

  test('should setup OpenCode project with agents', async () => {
    // Create .opencode directory to trigger OpenCode detection
    const opencodeDir = join(projectDir, '.opencode');
    await mkdir(opencodeDir, { recursive: true });

    // Run setup
    await setup(projectDir, { type: 'opencode' });

    // Verify directories were created
    expect(existsSync(join(projectDir, '.opencode', 'command'))).toBe(true);
    expect(existsSync(join(projectDir, '.opencode', 'agent'))).toBe(true);

    // Verify command files were copied (the main bug fix)
    const commandFiles = await readdir(join(projectDir, '.opencode', 'command'));
    const mdFiles = commandFiles.filter(f => f.endsWith('.md'));
    expect(mdFiles).toHaveLength(7);
    expect(mdFiles).toContain('research.md');
    expect(mdFiles).toContain('plan.md');
    expect(mdFiles).toContain('execute.md');
  });

  test('should setup general project with both formats', async () => {
    // Run setup without specific type (should detect as general)
    await setup(projectDir, { type: 'general' });

    // Verify both Claude Code and OpenCode directories were created
    expect(existsSync(join(projectDir, '.claude', 'commands'))).toBe(true);
    expect(existsSync(join(projectDir, '.claude', 'agents'))).toBe(true); // Our fix
    expect(existsSync(join(projectDir, '.opencode', 'command'))).toBe(true);
    expect(existsSync(join(projectDir, '.opencode', 'agent'))).toBe(true);
  });

  test('should create README with setup instructions', async () => {
    // Create a .claude directory
    const claudeDir = join(projectDir, '.claude');
    await mkdir(claudeDir, { recursive: true });
    await writeFile(
      join(claudeDir, 'claude_config.json'),
      JSON.stringify({ commands: { enabled: true, directory: 'commands' } })
    );

    // Run setup
    await setup(projectDir, { type: 'claude-code' });

    // Verify README was created/updated
    const readmePath = join(projectDir, 'README.md');
    expect(existsSync(readmePath)).toBe(true);

    const readmeContent = await readFile(readmePath, 'utf8');
    expect(readmeContent).toContain('Codeflow Workflow - Claude Code');
    expect(readmeContent).toContain('/research');
    expect(readmeContent).toContain('/plan');
  });

  test('should handle existing setup gracefully', async () => {
    // Create a .claude directory
    const claudeDir = join(projectDir, '.claude');
    await mkdir(claudeDir, { recursive: true });
    await writeFile(
      join(claudeDir, 'claude_config.json'),
      JSON.stringify({ commands: { enabled: true, directory: 'commands' } })
    );

    // Run setup first time to create the setup directories
    await setup(projectDir, { type: 'claude-code' });

    // Verify setup was created
    expect(existsSync(join(projectDir, '.claude', 'commands'))).toBe(true);
    expect(existsSync(join(projectDir, '.claude', 'agents'))).toBe(true);

    // Run setup second time without force (should detect existing setup and return early)
    // This should complete successfully
    await expect(setup(projectDir, { type: 'claude-code' })).resolves.toBeUndefined();

    // Verify directories still exist after second run
    expect(existsSync(join(projectDir, '.claude', 'commands'))).toBe(true);
    expect(existsSync(join(projectDir, '.claude', 'agents'))).toBe(true);
  });

  test('should update .gitignore with codeflow entries', async () => {
    // Create a .claude directory
    const claudeDir = join(projectDir, '.claude');
    await mkdir(claudeDir, { recursive: true });
    await writeFile(
      join(claudeDir, 'claude_config.json'),
      JSON.stringify({ commands: { enabled: true, directory: 'commands' } })
    );

    // Create existing .gitignore
    await writeFile(join(projectDir, '.gitignore'), 'node_modules/\n*.log\n');

    // Run setup
    await setup(projectDir, { type: 'claude-code' });

    // Verify .gitignore was updated
    const gitignoreContent = await readFile(join(projectDir, '.gitignore'), 'utf8');
    expect(gitignoreContent).toContain('!.claude/');
  });

  test('should respect force flag for overwriting existing setup', async () => {
    // Create a .claude directory
    const claudeDir = join(projectDir, '.claude');
    await mkdir(claudeDir, { recursive: true });
    await writeFile(
      join(claudeDir, 'claude_config.json'),
      JSON.stringify({ commands: { enabled: true, directory: 'commands' } })
    );

    // Create existing commands directory
    const commandsDir = join(claudeDir, 'commands');
    await mkdir(commandsDir, { recursive: true });
    await writeFile(join(commandsDir, 'existing.md'), '# Existing command');

    // Run setup without force (should skip)
    await setup(projectDir, { type: 'claude-code' });

    // Verify existing file is still there
    expect(existsSync(join(commandsDir, 'existing.md'))).toBe(true);

    // Run setup with force (should overwrite)
    await setup(projectDir, { type: 'claude-code', force: true });

    // Verify setup still works
    expect(existsSync(join(projectDir, '.claude', 'agents'))).toBe(true);
  });
});

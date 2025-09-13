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
    await setup(projectDir);

    // Verify commands directory was created
    expect(existsSync(join(projectDir, '.claude', 'commands'))).toBe(true);

    // Verify command files were copied (the main bug fix)
    const commandFiles = await readdir(join(projectDir, '.claude', 'commands'));
    const mdFiles = commandFiles.filter((f) => f.endsWith('.md'));

    // With Phase 3 improvements, we now copy from multiple sources
    // Primary: 7 command files from command/ directory
    // Fallback: 29 agent files from claude-agents/ directory (treated as commands)
    expect(mdFiles.length).toBeGreaterThanOrEqual(7);
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
    await setup(projectDir);

    // Verify directories were created
    expect(existsSync(join(projectDir, '.opencode', 'command'))).toBe(true);
    expect(existsSync(join(projectDir, '.opencode', 'agent'))).toBe(true);

    // Verify command files were copied (setup copies from multiple source directories)
    const commandFiles = await readdir(join(projectDir, '.opencode', 'command'));
    const mdFiles = commandFiles.filter((f) => f.endsWith('.md'));
    expect(mdFiles.length).toBeGreaterThanOrEqual(7); // Setup copies from command/ + fallback directories
    expect(mdFiles).toContain('research.md');
    expect(mdFiles).toContain('plan.md');
    expect(mdFiles).toContain('execute.md');
  });

  test('should setup general project with opencode format', async () => {
    // Run setup without specific type (should detect as general)
    await setup(projectDir);

    // Verify OpenCode directories were created (general projects default to opencode)
    expect(existsSync(join(projectDir, '.opencode', 'command'))).toBe(true);
    expect(existsSync(join(projectDir, '.opencode', 'agent'))).toBe(true);

    // Verify command files were copied
    const opencodeCommandFiles = await readdir(join(projectDir, '.opencode', 'command'));
    const opencodeMdFiles = opencodeCommandFiles.filter((f) => f.endsWith('.md'));
    expect(opencodeMdFiles.length).toBeGreaterThanOrEqual(7); // Setup copies from multiple directories
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
    await setup(projectDir);

    // Verify README was created/updated
    const readmePath = join(projectDir, 'README.md');
    expect(existsSync(readmePath)).toBe(true);

    const readmeContent = await readFile(readmePath, 'utf8');
    expect(readmeContent).toContain('Codeflow Workflow');
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
    await setup(projectDir);

    // Verify setup was created
    expect(existsSync(join(projectDir, '.claude', 'commands'))).toBe(true);
    expect(existsSync(join(projectDir, '.claude', 'agents'))).toBe(true);

    // Run setup second time without force (should detect existing setup and return early)
    // This should complete successfully
    expect(setup(projectDir)).resolves.toBeUndefined();

    // Verify directories still exist after second run
    expect(existsSync(join(projectDir, '.claude', 'commands'))).toBe(true);
    expect(existsSync(join(projectDir, '.claude', 'agents'))).toBe(true);
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
    await setup(projectDir);

    // Verify existing file is still there
    expect(existsSync(join(commandsDir, 'existing.md'))).toBe(true);

    // Run setup with force (should overwrite)
    await setup(projectDir, { force: true });

    // Verify setup still works
    expect(existsSync(join(projectDir, '.claude', 'agents'))).toBe(true);
  });
});

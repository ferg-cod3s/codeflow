import { join } from "node:path";
import { existsSync } from "node:fs";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import os from "node:os";

/**
 * Global directory paths for codeflow
 */
export function getGlobalPaths() {
  const envBase = process.env.CODEFLOW_GLOBAL_CONFIG || process.env.CODEFLOW_HOME;
  if (envBase && envBase.trim().length > 0) {
    // Test environment: flat structure
    return {
      global: envBase,
      commands: join(envBase, 'command'),
      agents: {
        base: join(envBase, 'agent'),
        claudeCode: join(envBase, 'agent'),
        opencode: join(envBase, 'agent')
      }
    };
  }

  const home = os.homedir();
  return {
    // Base global directory under home for normal usage
    global: join(home, '.claude'),

    // Command directories
    commands: join(home, '.claude', 'commands'),

    // Agent directories by format
    agents: {
      base: join(home, '.claude', 'agents', 'base'),
      claudeCode: join(home, '.claude', 'agents', 'claude-code'),
      opencode: join(home, '.claude', 'agents', 'opencode')
    }
  };
}

/**
 * Setup global agent directories
 */
export async function setupGlobalAgents(baseDir?: string): Promise<void> {
  const paths = getGlobalPaths();
  
  console.log("📁 Setting up global agent directories...");

  const envOverride = baseDir && baseDir.trim().length > 0 ? baseDir : (process.env.CODEFLOW_GLOBAL_CONFIG || process.env.CODEFLOW_HOME);
  const usingEnv = !!envOverride && envOverride.trim().length > 0;

  if (usingEnv) {
    const base = envOverride!.trim();
    // Flat structure for tests: create <base>/agent and <base>/command
    const agentDir = join(base, 'agent');
    const commandDir = join(base, 'command');

    if (!existsSync(agentDir)) {
      await mkdir(agentDir, { recursive: true });
      console.log(`  ✓ Created ${agentDir}`);
    }
    if (!existsSync(commandDir)) {
      await mkdir(commandDir, { recursive: true });
      console.log(`  ✓ Created ${commandDir}`);
    }

    console.log("✅ Global directories ready (env-based)");
    return;
  }
  
  // Default structure under ~/.claude
  // Create main agents directory
  const agentsDir = join(paths.global, 'agents');
  if (!existsSync(agentsDir)) {
    await mkdir(agentsDir, { recursive: true });
    console.log(`  ✓ Created ${agentsDir}`);
  }
  
  // Create format-specific subdirectories
  for (const [format, p] of Object.entries(paths.agents)) {
    if (!existsSync(p)) {
      await mkdir(p, { recursive: true });
      console.log(`  ✓ Created ${format} agents directory: ${p}`);
    }
  }

  // Ensure commands directory exists
  if (!existsSync(paths.commands)) {
    await mkdir(paths.commands, { recursive: true });
    console.log(`  ✓ Created commands directory: ${paths.commands}`);
  }
  
  // Create a README explaining the structure
  const readmePath = join(agentsDir, 'README.md');
  if (!existsSync(readmePath)) {
    const readmeContent = `# Codeflow Global Agents

This directory contains globally available agents that can be used across all your projects.

## Directory Structure

- \`base/\` - Base format agents (original codeflow format)
- \`claude-code/\` - Claude Code compatible agents
- \`opencode/\` - OpenCode compatible agents

## Usage

Agents in these directories are automatically discovered and available in all projects.
Priority order: project-specific → global → built-in

## Management

Use \`codeflow sync-global\` to synchronize agents to global directories.
Use \`codeflow list-differences\` to see which agents are available in each format.
`;
    
    await writeFile(readmePath, readmeContent);
    console.log("  ✓ Created README.md");
  }
  
  console.log("✅ Global agent directories ready");
}

/**
 * Check if global agent directories exist
 */
export function hasGlobalAgents(): boolean {
  const paths = getGlobalPaths();
  return existsSync(join(paths.global, 'agents'));
}

/**
 * Get global agent statistics
 */
export async function getGlobalAgentStats(): Promise<{
  base: number;
  claudeCode: number;
  opencode: number;
  total: number;
}> {
  const paths = getGlobalPaths();
  const { readdir } = await import("node:fs/promises");
  
  const stats = {
    base: 0,
    claudeCode: 0,
    opencode: 0,
    total: 0
  };
  
  try {
    if (existsSync(paths.agents.base)) {
      const files = await readdir(paths.agents.base);
      stats.base = files.filter(f => f.endsWith('.md')).length;
    }
  } catch (e) {
    // Directory doesn't exist or can't be read
  }
  
  try {
    if (existsSync(paths.agents.claudeCode)) {
      const files = await readdir(paths.agents.claudeCode);
      stats.claudeCode = files.filter(f => f.endsWith('.md')).length;
    }
  } catch (e) {
    // Directory doesn't exist or can't be read
  }
  
  try {
    if (existsSync(paths.agents.opencode)) {
      const files = await readdir(paths.agents.opencode);
      stats.opencode = files.filter(f => f.endsWith('.md')).length;
    }
  } catch (e) {
    // Directory doesn't exist or can't be read
  }
  
  stats.total = stats.base + stats.claudeCode + stats.opencode;
  
  return stats;
}
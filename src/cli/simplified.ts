#!/usr/bin/env bun

import { parseArgs } from 'util';
import { UnifiedConverter } from '../conversion/unified-converter.js';
import { existsSync } from 'fs';
import { join } from 'path';

const HELP_TEXT = `codeflow-simplified - Simplified AI workflow management

CodeFlow Simplified provides streamlined agents and commands for AI-assisted development.
Dramatically reduced complexity while maintaining full multi-platform support.

Usage:
  codeflow-simplified <command> [options]

Commands:
   convert-simplified [options]    Convert simplified agents/commands to all platforms
   setup-simplified [project-path]  Setup simplified workflow in project
   list-simplified [path]          List available simplified agents and commands

Options:
   --agents                        Convert only agents
   --commands                       Convert only commands  
   --all                           Convert all agents and commands
   -f, --force                    Force overwrite existing files
   --dry-run                       Show what would be changed without writing

Examples:
   codeflow-simplified convert-simplified --all
   codeflow-simplified convert-simplified --agents
   codeflow-simplified convert-simplified --commands
   codeflow-simplified setup-simplified ~/my-project

Simplified Agents (8 core):
   researcher    - Comprehensive codebase analysis and orchestration
   locator      - Find WHERE files and components exist
   analyzer     - Understand HOW specific code works
   developer    - Implement code across languages and frameworks
   architect    - Design system architecture and plans
   integrator   - Connect systems and implement APIs
   optimizer    - Improve performance and efficiency
   deployer     - Set up deployment and CI/CD
   auditor      - Review code for security and quality

Simplified Commands (5 core):
   /research    - Conduct comprehensive codebase research
   /plan        - Create detailed implementation plans
   /execute     - Implement code changes based on plans
   /review      - Review code for quality and security
   /ticket       - Create and manage development tickets

Benefits:
   ✅ 85% fewer agents (137 → 8 core agents)
   ✅ 80% less verbose (150+ → 20-30 lines per agent)
   ✅ Multi-platform support (Claude Code, OpenCode, MCP)
   ✅ Model inheritance (global configuration)
   ✅ Auto-conversion (single source → all platforms)

For more detailed guidance:
   - Use 'codeflow-simplified list-simplified' to see all available items
   - See docs/SIMPLIFIED_WORKFLOW.md for comprehensive documentation`;

async function main() {
  const args = parseArgs({
    args: Bun.argv,
    options: {
      help: { type: 'boolean', short: 'h', default: false },
      version: { type: 'boolean', default: false },
      force: { type: 'boolean', short: 'f', default: false },
      'dry-run': { type: 'boolean', default: false },
      agents: { type: 'boolean', default: false },
      commands: { type: 'boolean', default: false },
      all: { type: 'boolean', default: false },
    },
    strict: true,
    allowPositionals: true,
  });

  const values = args.values;
  const positionals = args.positionals.slice(2); // Remove bun and script path
  const command = positionals[0];

  if (values.version) {
    console.log('CodeFlow Simplified v1.0.0');
    process.exit(0);
  }

  if (values.help || !command) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  const converter = new UnifiedConverter();

  switch (command) {
    case 'convert-simplified': {
      if (values.all) {
        await converter.convertAll();
      } else if (values.agents) {
        await converter.convertDirectory('base-agents-simplified', 'agents');
      } else if (values.commands) {
        await converter.convertDirectory('commands-simplified', 'commands');
      } else {
        console.error('Error: Specify --agents, --commands, or --all');
        process.exit(1);
      }
      break;
    }

    case 'setup-simplified': {
      const projectPath = positionals[1] || process.cwd();
      await setupSimplified(projectPath, { force: values.force, dryRun: values['dry-run'] });
      break;
    }

    case 'list-simplified': {
      const listPath = positionals[1] || process.cwd();
      await listSimplified(listPath);
      break;
    }

    default:
      console.error(`Error: Unknown command '${command}'`);
      console.error("Run 'codeflow-simplified --help' for usage information");
      process.exit(1);
  }
}

export async function setupSimplified(
  projectPath: string,
  options: { force: boolean; dryRun: boolean }
) {
  console.log(`Setting up simplified workflow in ${projectPath}...`);

  const dirsToCreate = [
    join(projectPath, '.claude'),
    join(projectPath, '.claude', 'agents'),
    join(projectPath, '.claude', 'commands'),
    join(projectPath, '.opencode'),
    join(projectPath, '.opencode', 'agent'),
    join(projectPath, '.opencode', 'command'),
  ];

  for (const dir of dirsToCreate) {
    if (!existsSync(dir) && !options.dryRun) {
      await import('fs/promises').then((fs) => fs.mkdir(dir, { recursive: true }));
      console.log(`Created: ${dir}`);
    }
  }

  // Convert and copy simplified agents and commands
  const converter = new UnifiedConverter();
  if (!options.dryRun) {
    await converter.convertAll();
    console.log('✅ Simplified workflow setup complete!');
  } else {
    console.log('🔍 Dry run - no files created');
  }
}

export async function listSimplified(_path: string) {
  console.log('Simplified Agents and Commands:');
  console.log('');

  console.log('🤖 AGENTS (8 core):');
  const agents = [
    'researcher',
    'locator',
    'analyzer',
    'developer',
    'architect',
    'integrator',
    'optimizer',
    'deployer',
    'auditor',
  ];
  agents.forEach((agent) => {
    console.log(`  ${agent.padEnd(12)} - ${getAgentDescription(agent)}`);
  });

  console.log('');
  console.log('⚡ COMMANDS (5 core):');
  const commands = ['research', 'plan', 'execute', 'review', 'ticket'];
  commands.forEach((command) => {
    console.log(`  /${command.padEnd(10)} - ${getCommandDescription(command)}`);
  });

  console.log('');
  console.log(`Total: ${agents.length + commands.length} simplified items vs 137 original items`);
  console.log('Complexity reduction: 85% fewer agents, 80% less verbose');
}

function getAgentDescription(name: string): string {
  const descriptions: Record<string, string> = {
    researcher: 'Comprehensive codebase analysis and orchestration',
    locator: 'Find WHERE files and components exist',
    analyzer: 'Understand HOW specific code works',
    developer: 'Implement code across languages and frameworks',
    architect: 'Design system architecture and plans',
    integrator: 'Connect systems and implement APIs',
    optimizer: 'Improve performance and efficiency',
    deployer: 'Set up deployment and CI/CD',
    auditor: 'Review code for security and quality',
  };
  return descriptions[name] || 'Unknown agent';
}

function getCommandDescription(name: string): string {
  const descriptions: Record<string, string> = {
    research: 'Conduct comprehensive codebase research',
    plan: 'Create detailed implementation plans',
    execute: 'Implement code changes based on plans',
    review: 'Review code for quality and security',
    ticket: 'Create and manage development tickets',
  };
  return descriptions[name] || 'Unknown command';
}

// Only run main when this file is executed directly, not when imported
if (import.meta.main) {
  main().catch(console.error);
}

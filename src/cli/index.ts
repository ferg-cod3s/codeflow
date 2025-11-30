#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { convertCommand } from './convert.js';
import { validateCommand } from './validate.js';
import { migrateCommand } from './migrate.js';
import { enhanceCommand } from './enhance.js';

import packageJson from '../../package.json' with { type: 'json' };

const program = new Command();

program
  .name('codeflow')
  .description('CLI tool to convert base-agents, commands, and skills to OpenCode format')
  .version(packageJson.version, '-v, --version')
  .helpOption('-h, --help')
  .addHelpText('after', `
Examples:
  # Local project setup (project-specific agents/commands/skills)
  $ codeflow convert agents --output .opencode/agent
  $ codeflow migrate --output .opencode

  # Global setup (user-wide, available in all projects)
  $ codeflow convert agents --global
  $ codeflow migrate --global

  # Enhance prompts with research-backed techniques (+45-80% quality)
  $ codeflow enhance agents/python_pro.md --level standard
  $ codeflow enhance ./agents --output ./enhanced-agents

  # Preview changes
  $ codeflow convert commands --global --dry-run
  $ codeflow migrate --output .opencode --dry-run

  # Validate converted files
  $ codeflow validate .opencode/agent --format opencode-agent
  $ codeflow validate ~/.config/opencode/command --format opencode-command

Setup:
  Local setup creates .opencode/ directory in your project root
  Global setup installs to ~/.config/opencode/ (user-wide)

Learn more at: https://opencode.ai/docs`);

// Add subcommands
program.addCommand(convertCommand);
program.addCommand(validateCommand);
program.addCommand(migrateCommand);
program.addCommand(enhanceCommand);

// Global error handler
program.exitOverride((err) => {
  // Handle help/version and normal exits gracefully
  if (err.code === 'commander.help' || err.code === 'commander.version' ||
      err.code === 'exitWithHelp' || err.code === 'executeSubcommandAsync' ||
      err.message.includes('outputHelp') || err.message.includes('outputVersion')) {
    process.exit(0);
  }
  throw err;
});

try {
  program.parse();
} catch (err) {
  // Double-check for help/version errors that might not have been caught above
  if (err instanceof Error) {
    const message = err.message;
    const code = (err as any).code;
    if (message.includes('outputHelp') || message.includes('outputVersion') ||
        code === 'commander.help' || code === 'commander.version') {
      process.exit(0);
    }
  }
  console.error(chalk.red('❌ Error:'), err instanceof Error ? err.message : String(err));
  process.exit(1);
}

// Handle unknown commands
program.on('command:*', (operands) => {
  console.error(chalk.red(`❌ Unknown command: ${operands[0]}`));
  console.log(chalk.yellow('Available commands: convert, validate, migrate, enhance'));
  console.log(chalk.white('Use --help for more information'));
  process.exit(1);
});
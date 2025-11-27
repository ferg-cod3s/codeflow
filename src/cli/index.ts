#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { convertCommand } from './convert.js';
import { validateCommand } from './validate.js';
import { migrateCommand } from './migrate.js';

import packageJson from '../../package.json' with { type: 'json' };

const program = new Command();

program
  .name('codeflow')
  .description('CLI tool to convert base-agents, commands, and skills to OpenCode format')
  .version(packageJson.version, '-v, --version')
  .helpOption('-h, --help');

// Add subcommands
program.addCommand(convertCommand);
program.addCommand(validateCommand);
program.addCommand(migrateCommand);

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
  console.log(chalk.yellow('Available commands: convert, validate, migrate'));
  console.log(chalk.white('Use --help for more information'));
  process.exit(1);
});
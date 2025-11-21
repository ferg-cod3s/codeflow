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
program.exitOverride();

try {
  program.parse();
} catch (err) {
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
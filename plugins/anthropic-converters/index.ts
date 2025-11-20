#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { AnthropicConverter } from './converter';
import * as path from 'path';

const program = new Command();

// Define the 7 plugins to convert
const HIGH_PRIORITY_PLUGINS = [
  'agent-sdk-dev',
  'plugin-dev', 
  'security-guidance'
];

const MEDIUM_PRIORITY_PLUGINS = [
  'feature-dev',
  'code-review',
  'frontend-design',
  'hookify'
];

const ALL_PLUGINS = [...HIGH_PRIORITY_PLUGINS, ...MEDIUM_PRIORITY_PLUGINS];

program
  .name('anthropic-converter')
  .description('Convert Anthropic plugins to OpenCode format')
  .version('1.0.0');

program
  .command('convert')
  .description('Convert Anthropic plugins to OpenCode format')
  .option('-i, --input <dir>', 'Input directory containing Anthropic plugins', './anthropic-plugins')
  .option('-o, --output <dir>', 'Output directory for converted plugins', './converted')
  .option('-p, --plugins <plugins>', 'Comma-separated list of plugins to convert (or "high", "medium", "all")', 'all')
  .option('-d, --dry-run', 'Show what would be converted without writing files')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    console.log(chalk.blue('🔄 Anthropic Plugin Converter'));
    console.log(chalk.gray(`Input: ${options.input}`));
    console.log(chalk.gray(`Output: ${options.output}`));
    
    if (options.dryRun) {
      console.log(chalk.yellow('⚠️  DRY RUN MODE - No files will be written'));
    }

    try {
      const converter = new AnthropicConverter();
      
      // Determine which plugins to convert
      let pluginsToConvert: string[] = [];
      
      if (options.plugins === 'all') {
        pluginsToConvert = ALL_PLUGINS;
      } else if (options.plugins === 'high') {
        pluginsToConvert = HIGH_PRIORITY_PLUGINS;
      } else if (options.plugins === 'medium') {
        pluginsToConvert = MEDIUM_PRIORITY_PLUGINS;
      } else {
        pluginsToConvert = options.plugins.split(',').map((p: string) => p.trim());
      }

      console.log(chalk.blue(`\n📦 Plugins to convert: ${pluginsToConvert.join(', ')}`));
      
      // Convert plugins
      const result = await converter.convertMultiplePlugins(
        pluginsToConvert,
        options.input,
        options.output,
        options.dryRun
      );

      // Display results
      console.log(chalk.green(`\n✅ Conversion complete!`));
      console.log(chalk.white(`Converted: ${result.converted}`));
      console.log(chalk.white(`Failed: ${result.failed}`));
      
      if (result.errors.length > 0) {
        console.log(chalk.red('\n❌ Errors:'));
        result.errors.forEach(error => console.log(chalk.red(`  - ${error}`)));
      }
      
      if (result.warnings.length > 0) {
        console.log(chalk.yellow('\n⚠️  Warnings:'));
        result.warnings.forEach(warning => console.log(chalk.yellow(`  - ${warning}`)));
      }

      if (!options.dryRun && result.converted > 0) {
        console.log(chalk.green(`\n📁 Converted plugins saved to: ${options.output}`));
        console.log(chalk.gray('Next steps:'));
        console.log(chalk.gray('  1. Review the converted plugins'));
        console.log(chalk.gray('  2. Test each plugin with OpenCode'));
        console.log(chalk.gray('  3. Submit to OpenCode registry'));
      }

    } catch (error) {
      console.error(chalk.red(`❌ Conversion failed: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List available plugins for conversion')
  .action(() => {
    console.log(chalk.blue('📦 Available Plugins for Conversion'));
    
    console.log(chalk.yellow('\n🔥 High Priority:'));
    HIGH_PRIORITY_PLUGINS.forEach(plugin => {
      console.log(chalk.white(`  - ${plugin}`));
    });
    
    console.log(chalk.yellow('\n⚡ Medium Priority:'));
    MEDIUM_PRIORITY_PLUGINS.forEach(plugin => {
      console.log(chalk.white(`  - ${plugin}`));
    });
    
    console.log(chalk.gray(`\nTotal: ${ALL_PLUGINS.length} plugins`));
  });

program
  .command('validate')
  .description('Validate converted plugins')
  .option('-d, --dir <dir>', 'Directory containing converted plugins', './converted')
  .action(async (options) => {
    console.log(chalk.blue('🔍 Validating Converted Plugins'));
    console.log(chalk.gray(`Directory: ${options.dir}`));
    
    // This would integrate with the OpenCode validator
    console.log(chalk.yellow('⚠️  Validation not yet implemented'));
    console.log(chalk.gray('TODO: Integrate with OpenCode validator'));
  });

if (require.main === module) {
  program.parse();
}

export { AnthropicConverter };
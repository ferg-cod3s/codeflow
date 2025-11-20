import { Command } from 'commander';
import chalk from 'chalk';
import { AgentConverter } from '../converters/agent-converter.js';
import { CommandConverter } from '../converters/command-converter.js';
import { SkillConverter } from '../converters/skill-converter.js';
import { OpenCodeValidator } from '../validators/opencode-validator.js';
import { ensureDir } from '../utils/file-utils.js';
import * as path from 'path';

export const convertCommand = new Command('convert')
  .description('Convert base-agents, commands, or skills to OpenCode format')
  .argument('<type>', 'Type to convert: agents, commands, or skills')
  .option('-o, --output <dir>', 'Output directory', './converted')
  .option('-d, --dry-run', 'Show what would be converted without writing files')
  .option('-v, --validation <level>', 'Validation level: strict, lenient, off', 'lenient')
  .action(async (type, options) => {
    console.log(chalk.blue(`🔄 Converting ${type}...`));
    
    try {
      await ensureDir(options.output);
      
      let result;
      const validator = new OpenCodeValidator();
      
      switch (type) {
        case 'agents':
          const agentConverter = new AgentConverter();
          result = await agentConverter.convertAgents('./base-agents', path.join(options.output, 'agents'), options.dryRun);
          break;
          
        case 'commands':
          const commandConverter = new CommandConverter();
          result = await commandConverter.convertCommands('./commands', path.join(options.output, 'commands'), options.dryRun);
          break;
          
        case 'skills':
          const skillConverter = new SkillConverter();
          result = await skillConverter.convertSkills('./skills', path.join(options.output, 'skills'), options.dryRun);
          break;
          
        default:
          console.error(chalk.red(`❌ Unknown type: ${type}`));
          console.log(chalk.yellow('Available types: agents, commands, skills'));
          process.exit(1);
      }
      
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
      
      // Validate converted files if not dry run
      if (!options.dryRun && options.validation !== 'off') {
        console.log(chalk.blue('\n🔍 Validating converted files...'));
        
        const outputDir = path.join(options.output, type === 'agents' ? 'agents' : type === 'commands' ? 'commands' : 'skills');
        const format = type === 'agents' ? 'opencode-agent' : type === 'commands' ? 'opencode-command' : 'opencode-skill';
        const reports = await validator.validateDirectory(outputDir, format);
        
        const validReports = reports.filter(r => r.valid);
        const invalidReports = reports.filter(r => !r.valid);
        
        console.log(chalk.green(`Valid files: ${validReports.length}`));
        console.log(chalk.red(`Invalid files: ${invalidReports.length}`));
        
        if (invalidReports.length > 0) {
          console.log(chalk.red('\n❌ Validation errors:'));
          invalidReports.forEach(report => {
            console.log(chalk.red(`  ${report.file}:`));
            report.errors.forEach(error => {
              console.log(chalk.red(`    - ${error.field}: ${error.message}`));
            });
          });
        }
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ Conversion failed: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });
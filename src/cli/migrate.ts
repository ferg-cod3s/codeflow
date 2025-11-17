import { Command } from 'commander';
import chalk from 'chalk';
import { AgentConverter } from '../converters/agent-converter';
import { CommandConverter } from '../converters/command-converter';
import { SkillConverter } from '../converters/skill-converter';
import { OpenCodeValidator } from '../validators/opencode-validator';
import { ensureDir } from '../utils/file-utils';
import * as path from 'path';

export const migrateCommand = new Command('migrate')
  .description('Migrate all base-agents, commands, and skills to OpenCode format')
  .option('-o, --output <dir>', 'Output directory', './converted')
  .option('-d, --dry-run', 'Show what would be migrated without writing files')
  .option('-v, --validation <level>', 'Validation level: strict, lenient, off', 'lenient')
  .option('--agents-only', 'Only migrate agents')
  .option('--commands-only', 'Only migrate commands')
  .option('--skills-only', 'Only migrate skills')
  .action(async (options) => {
    console.log(chalk.blue('🚀 Starting full migration...'));
    
    try {
      await ensureDir(options.output);
      
      const validator = new OpenCodeValidator();
      const totalResults = {
        agents: { converted: 0, failed: 0, errors: [] as string[], warnings: [] as string[] },
        commands: { converted: 0, failed: 0, errors: [] as string[], warnings: [] as string[] },
        skills: { converted: 0, failed: 0, errors: [] as string[], warnings: [] as string[] }
      };
      
      // Migrate agents
      if (!options.commandsOnly && !options.skillsOnly) {
        console.log(chalk.yellow('\n📋 Migrating agents...'));
        const agentConverter = new AgentConverter();
        totalResults.agents = await agentConverter.convertAgents('./base-agents', path.join(options.output, 'agents'), options.dryRun);
      }
      
      // Migrate commands
      if (!options.agentsOnly && !options.skillsOnly) {
        console.log(chalk.yellow('\n⚡ Migrating commands...'));
        const commandConverter = new CommandConverter();
        totalResults.commands = await commandConverter.convertCommands('./commands', path.join(options.output, 'commands'), options.dryRun);
      }
      
      // Migrate skills
      if (!options.agentsOnly && !options.commandsOnly) {
        console.log(chalk.yellow('\n🛠️  Migrating skills...'));
        const skillConverter = new SkillConverter();
        totalResults.skills = await skillConverter.convertSkills('./skills', path.join(options.output, 'skills'), options.dryRun);
      }
      
      // Display summary
      console.log(chalk.green('\n✅ Migration complete!'));
      console.log(chalk.white('\n📊 Summary:'));
      
      if (totalResults.agents.converted > 0 || totalResults.agents.failed > 0) {
        console.log(chalk.white(`  Agents: ${totalResults.agents.converted} converted, ${totalResults.agents.failed} failed`));
      }
      
      if (totalResults.commands.converted > 0 || totalResults.commands.failed > 0) {
        console.log(chalk.white(`  Commands: ${totalResults.commands.converted} converted, ${totalResults.commands.failed} failed`));
      }
      
      if (totalResults.skills.converted > 0 || totalResults.skills.failed > 0) {
        console.log(chalk.white(`  Skills: ${totalResults.skills.converted} converted, ${totalResults.skills.failed} failed`));
      }
      
      const totalConverted = totalResults.agents.converted + totalResults.commands.converted + totalResults.skills.converted;
      const totalFailed = totalResults.agents.failed + totalResults.commands.failed + totalResults.skills.failed;
      
      console.log(chalk.green(`\n🎯 Total: ${totalConverted} converted, ${totalFailed} failed`));
      
      // Validate all converted files if not dry run
      if (!options.dryRun && options.validation !== 'off') {
        console.log(chalk.blue('\n🔍 Validating all converted files...'));
        
        const allReports = [];
        
        if (totalResults.agents.converted > 0 && !options.commandsOnly && !options.skillsOnly) {
          const agentReports = await validator.validateDirectory(path.join(options.output, 'agents'), 'opencode-agent');
          allReports.push(...agentReports);
        }
        
        if (totalResults.commands.converted > 0 && !options.agentsOnly && !options.skillsOnly) {
          const commandReports = await validator.validateDirectory(path.join(options.output, 'commands'), 'opencode-command');
          allReports.push(...commandReports);
        }
        
        if (totalResults.skills.converted > 0 && !options.agentsOnly && !options.commandsOnly) {
          const skillReports = await validator.validateDirectory(path.join(options.output, 'skills'), 'opencode-skill');
          allReports.push(...skillReports);
        }
        
        const validReports = allReports.filter(r => r.valid);
        const invalidReports = allReports.filter(r => !r.valid);
        
        console.log(chalk.green(`Valid files: ${validReports.length}`));
        console.log(chalk.red(`Invalid files: ${invalidReports.length}`));
        
        if (invalidReports.length > 0) {
          console.log(chalk.red('\n❌ Some files have validation errors - see above for details'));
        }
      }
      
      if (options.dryRun) {
        console.log(chalk.blue('\n💧 This was a dry run - no files were written'));
        console.log(chalk.white('To perform the actual migration, run without --dry-run'));
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ Migration failed: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });
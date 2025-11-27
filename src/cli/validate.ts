import { Command } from 'commander';
import chalk from 'chalk';
import { OpenCodeValidator } from '../validators/opencode-validator.js';
import * as path from 'path';
import fs from 'fs-extra';

export const validateCommand = new Command('validate')
  .description('Validate OpenCode format files')
  .argument('<path>', 'Path to files or directory to validate')
  .option('-f, --format <type>', 'Format type: opencode-agent, opencode-command, opencode-skill')
  .option('-r, --report <file>', 'Save validation report to file')
  .action(async (inputPath, options) => {
    console.log(chalk.blue(`🔍 Validating ${inputPath}...`));
    
    try {
      const validator = new OpenCodeValidator();
      const stats = await fs.stat(inputPath);
      
      let reports: any[];
      
      if (stats.isDirectory()) {
        if (!options.format) {
          console.error(chalk.red('❌ Format type is required for directory validation'));
          console.log(chalk.yellow('Available formats: opencode-agent, opencode-command, opencode-skill'));
          process.exit(1);
        }
        
        reports = await validator.validateDirectory(inputPath, options.format);
      } else {
        // Single file validation
        const format = options.format || inferFormatFromPath(inputPath);
        if (!format) {
          console.error(chalk.red('❌ Cannot determine format type'));
          process.exit(1);
        }
        
        let report;
        switch (format) {
          case 'opencode-agent':
            report = await validator.validateAgent(inputPath);
            break;
          case 'opencode-command':
            report = await validator.validateCommand(inputPath);
            break;
          case 'opencode-skill':
            report = await validator.validateSkill(inputPath);
            break;
          default:
            console.error(chalk.red(`❌ Unknown format: ${format}`));
            process.exit(1);
        }
        
        reports = [report];
      }
      
      // Display results
      const validReports = reports.filter(r => r.valid);
      const invalidReports = reports.filter(r => !r.valid);
      
      console.log(chalk.green(`\n✅ Validation complete!`));
      console.log(chalk.white(`Total files: ${reports.length}`));
      console.log(chalk.green(`Valid files: ${validReports.length}`));
      console.log(chalk.red(`Invalid files: ${invalidReports.length}`));
      
      if (invalidReports.length > 0) {
        console.log(chalk.red('\n❌ Validation errors:'));
        invalidReports.forEach(report => {
          console.log(chalk.red(`  ${report.file}:`));
          report.errors.forEach((error: any) => {
            console.log(chalk.red(`    - ${error.field}: ${error.message}`));
          });
          
          if (report.warnings.length > 0) {
            console.log(chalk.yellow('    Warnings:'));
            report.warnings.forEach((warning: any) => {
              console.log(chalk.yellow(`      - ${warning.field}: ${warning.message}`));
            });
          }
        });
      }
      
      // Save report if requested
      if (options.report) {
        const reportData = {
          timestamp: new Date().toISOString(),
          summary: {
            total: reports.length,
            valid: validReports.length,
            invalid: invalidReports.length
          },
          reports
        };
        
        await fs.writeFile(options.report, JSON.stringify(reportData, null, 2));
        console.log(chalk.blue(`\n📄 Report saved to: ${options.report}`));
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ Validation failed: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

function inferFormatFromPath(filePath: string): string | null {
  if (filePath.includes('agent')) return 'opencode-agent';
  if (filePath.includes('command')) return 'opencode-command';
  if (filePath.includes('skill')) return 'opencode-skill';
  return null;
}
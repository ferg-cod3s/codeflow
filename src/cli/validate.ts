import { AgentValidator } from '../conversion/validator.js';
import { parseAgentFile } from '../conversion/agent-parser.js';
import { readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { readFile } from 'fs/promises';
import { EnhancedCommandValidator, commonValidators } from '../yaml/command-validator.js';
import CLIErrorHandler from "./error-handler.js";

/**
 * Validate agent format compliance and detect duplicates
 */
export async function validate(options: {
  format?: 'all' | 'claude-code' | 'opencode' | 'base';
  path?: string;
  checkDuplicates?: boolean;
  canonicalCheck?: boolean;
  fix?: boolean;
  verbose?: boolean;
}) {
  const validator = new AgentValidator();
  const format = options.format || 'all';
  const searchPath = options.path || '.';

  // Validate search path
  const pathValidation = CLIErrorHandler.validatePath(searchPath, 'directory');
  if (!pathValidation.valid) {
    CLIErrorHandler.displayValidationResult(pathValidation, 'search path');
    return;
  }

  try {
    // Find agent files based on format
    const directories = {
      'claude-code': ['claude-agents', '.claude/agents'],
      opencode: ['opencode-agents', '.opencode/agent'],
      base: ['agent'],
      all: ['agent', 'claude-agents', 'opencode-agents', '.claude/agents', '.opencode/agent'],
    };

    const dirsToSearch = directories[format] || directories.all;
    const files: string[] = [];

    // Recursive function to find all .md files in a directory
    async function findMarkdownFiles(dir: string): Promise<string[]> {
      const foundFiles: string[] = [];
      try {
        const entries = await readdir(dir);

        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const stats = await stat(fullPath);

          if (stats.isDirectory()) {
            const subFiles = await findMarkdownFiles(fullPath);
            foundFiles.push(...subFiles);
          } else if (entry.endsWith('.md')) {
            foundFiles.push(fullPath);
          }
        }
      } catch (error) {
        // Directory doesn't exist or can't be read
        CLIErrorHandler.displayWarning(
          `Could not read directory ${dir}: ${(error as Error).message}`,
          [
            'Check directory permissions',
            'Verify the directory exists'
          ]
        );
      }

      return foundFiles;
    }

    for (const dir of dirsToSearch) {
      const fullDir = path.isAbsolute(dir) ? dir : path.join(searchPath, dir);
      if (existsSync(fullDir)) {
        const foundFiles = await findMarkdownFiles(fullDir);
        files.push(...foundFiles);
      }
    }

    CLIErrorHandler.displayProgress(`Validating ${files.length} agent files (format: ${format})`);

    // Handle duplicate detection
    if (options.checkDuplicates) {
      CLIErrorHandler.displayProgress('Checking for duplicate agents');
      const duplicateResult = await validator.validateNoDuplicates([
        'codeflow-agents',
        'claude-agents',
        'opencode-agents',
      ]);

      console.log(`📊 Duplicate Detection Results:`);
      console.log(`  Total unique agents: ${duplicateResult.totalAgents}`);
      console.log(`  Canonical agents (exactly 3 formats): ${duplicateResult.canonicalAgentCount}`);
      console.log(`  Duplicate issues found: ${duplicateResult.duplicates.length}`);

      if (duplicateResult.duplicates.length > 0) {
        console.log(`\n❌ Duplicate Issues:`);
        duplicateResult.duplicates.forEach((dup) => {
          if (dup.issue === 'missing_canonical_formats') {
            console.log(`  ${dup.agentName}: Missing formats ${dup.missingFormats?.join(', ')}`);
          } else {
            console.log(`  ${dup.agentName}: ${dup.totalCopies} copies (expected 3)`);
            dup.extraCopies?.forEach((file) => console.log(`    Extra: ${file}`));
          }
        });
      }

      // Exit for critical issues: canonical conflicts, schema missing, permission violations
      const criticalIssues =
        duplicateResult.duplicates?.filter((d: any) =>
          ['canonical_conflict', 'schema_missing', 'permission_violation'].includes(d.issue)
        ) || [];
      if (criticalIssues.length > 0) {
        CLIErrorHandler.displayError(
          CLIErrorHandler.createErrorContext(
            'validate',
            'duplicate_detection',
            'critical_validation_issues',
            'No critical validation issues',
            `${criticalIssues.length} critical issues found`,
            'Address critical issues before proceeding',
            {
              requiresUserInput: true,
              suggestions: [
                'Fix canonical conflicts by ensuring consistent agent definitions',
                'Add missing schema files',
                'Check and fix permission violations'
              ]
            }
          )
        );
        process.exit(1);
      }

      // Warn for legacy duplicates but don't fail
      const legacyIssues =
        duplicateResult.duplicates?.filter((d: any) => d.issue === 'legacy_duplicate') || [];
      if (legacyIssues.length > 0) {
        CLIErrorHandler.displayWarning(
          `${legacyIssues.length} legacy duplicates found`,
          [
            'Consider consolidating duplicate agents',
            'Check if legacy duplicates are still needed'
          ]
        );
      }
    }

    // Handle canonical integrity check
    if (options.canonicalCheck) {
      CLIErrorHandler.displayProgress('Validating canonical source integrity');
      try {
        const canonicalResult = await validator.validateCanonicalIntegrity();

        console.log(`📊 Canonical Integrity Results:`);
        console.log(`  Expected agents: ${canonicalResult.expectedCount}`);
        console.log(`  Manifest agents: ${canonicalResult.manifestAgents}`);
        console.log(`  Integrity issues: ${canonicalResult.errors.length}`);

        if (canonicalResult.errors.length > 0) {
          console.log(`\n❌ Integrity Issues:`);
          canonicalResult.errors.forEach((error) => {
            console.log(`  ${error.agent}: ${error.issue}`);
            if (error.suggestion) {
              console.log(`    💡 ${error.suggestion}`);
            }
          });
        }

        if (!canonicalResult.valid) {
          CLIErrorHandler.displayError(
            CLIErrorHandler.createErrorContext(
              'validate',
              'canonical_integrity',
              'canonical_validation_failed',
              'Valid canonical integrity',
              `${canonicalResult.errors.length} integrity issues found`,
              'Fix integrity issues and try again',
              {
                requiresUserInput: true,
                suggestions: [
                  'Ensure AGENT_MANIFEST.json exists and is valid',
                  'Run setup from the codeflow repository root',
                  'Copy the manifest manually if needed'
                ]
              }
            )
          );
          process.exit(1);
        }
      } catch (error) {
        CLIErrorHandler.displayError(
          CLIErrorHandler.createErrorContext(
            'validate',
            'canonical_integrity',
            'canonical_validation_error',
            'Successful canonical validation',
            (error as Error).message,
            'Check AGENT_MANIFEST.json and try again',
            {
              requiresUserInput: true,
              suggestions: [
                'Ensure AGENT_MANIFEST.json exists and is valid',
                'Run setup from the codeflow repository root',
                'Copy the manifest manually if needed'
              ]
            }
          )
        );
        process.exit(1);
      }
    }

    // Parse and validate agents
    const agents = [];
    const parseErrors = [];

    for (const file of files) {
      try {
        const formatType =
          file.includes('claude-agents') || file.includes('.claude/')
            ? 'claude-code'
            : file.includes('opencode-agents') || file.includes('.opencode/')
              ? 'opencode'
              : 'base';
        const agent = await parseAgentFile(file, formatType);
        if (agent) {
          agents.push(agent);
        }
      } catch (error) {
        parseErrors.push({ file, error: (error as Error).message });
      }
    }

    if (parseErrors.length > 0) {
      CLIErrorHandler.displayWarning(
        `${parseErrors.length} files failed to parse`,
        [
          'Check file formats and syntax',
          'Run with --verbose for detailed error information'
        ]
      );
      parseErrors.forEach(({ file, error }) => {
        console.error(`  ${file}: ${error}`);
      });
    }

    const { results, summary } = await validator.validateBatchWithDetails(agents);

    // Print summary
    console.log(`\n📊 Validation Summary:`);
    console.log(`  Total: ${summary.total}`);
    console.log(`  ✅ Valid: ${summary.valid}`);
    console.log(`  ❌ Errors: ${summary.errors}`);
    console.log(`  ⚠️  Warnings: ${summary.warnings}`);

    if (summary.errors > 0) {
      console.log(`\nTop error categories:`);
      Object.entries(summary.errorsByType)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .forEach(([field, count]) => {
          console.log(`  ${field}: ${count} issues`);
        });
    }

    if (options.verbose) {
      console.log(`\n📝 Detailed Results:`);
      results.forEach((result) => {
        if (!result.valid) {
          console.log(`\n❌ ${result.agent}:`);
          result.errors.forEach((error) => {
            console.log(`  ${error.field}: ${error.message}`);
            if ('suggestion' in error && error.suggestion) {
              console.log(`    💡 ${error.suggestion}`);
            }
          });
        }

        if (result.warnings.length > 0) {
          console.log(`\n⚠️  ${result.agent} warnings:`);
          result.warnings.forEach((warning) => {
            console.log(`  ${warning.field}: ${warning.message}`);
          });
        }
      });
    }

    if (options.fix) {
      const fixScript = validator.generateFixScript(results);
      console.log(`\n🔧 Fix suggestions written to: agent-fixes.txt`);
      await Bun.write('agent-fixes.txt', fixScript);
    }

    // Exit with error code if validation failed
    if (summary.errors > 0) {
      CLIErrorHandler.displayWarning(
        `Validation completed with ${summary.errors} errors`,
        [
          'Review the validation results above',
          'Fix critical issues before proceeding',
          'Use --fix option to generate fix suggestions'
        ]
      );
      process.exit(1);
    }

    CLIErrorHandler.displaySuccess(
      'Agent validation completed successfully',
      [
        'All agents passed validation',
        'No critical issues found'
      ]
    );

  } catch (error) {
    CLIErrorHandler.handleCommonError(error, 'validate');
  }
}

/**
 * Command validation options
 */
export interface CommandValidationOptions {
  path?: string;
  format?: 'opencode' | 'claude-code';
  fix?: boolean;
  verbose?: boolean;
  strict?: boolean;
}

/**
 * Validates OpenCode and Claude Code command files
 */
export async function validateCommands(options: CommandValidationOptions = {}) {
  const validator = new EnhancedCommandValidator();
  const searchPath = options.path || '.';
  const format = options.format || 'opencode';

  // Validate search path
  const pathValidation = CLIErrorHandler.validatePath(searchPath, 'directory');
  if (!pathValidation.valid) {
    CLIErrorHandler.displayValidationResult(pathValidation, 'search path');
    return;
  }

  try {
    // Find command files based on format
    const commandDirectories = {
      opencode: ['.opencode/command', 'opencode-agents', 'test-setup/.opencode/command'],
      'claude-code': ['.claude/commands', 'command', 'test-setup/.claude/commands']
    };

    const dirsToSearch = commandDirectories[format] || commandDirectories.opencode;
    const files: string[] = [];

    // Find all .md files in command directories
    async function findCommandFiles(dir: string): Promise<string[]> {
      const foundFiles: string[] = [];
      try {
        const entries = await readdir(dir);

        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const stats = await stat(fullPath);

          if (stats.isDirectory()) {
            const subFiles = await findCommandFiles(fullPath);
            foundFiles.push(...subFiles);
          } else if (entry.endsWith('.md')) {
            foundFiles.push(fullPath);
          }
        }
      } catch (error) {
        // Directory doesn't exist or can't be read
        CLIErrorHandler.displayWarning(
          `Could not read directory ${dir}: ${(error as Error).message}`,
          [
            'Check directory permissions',
            'Verify the directory exists'
          ]
        );
      }

      return foundFiles;
    }

    for (const dir of dirsToSearch) {
      const fullDir = path.isAbsolute(dir) ? dir : path.join(searchPath, dir);
      if (existsSync(fullDir)) {
        const foundFiles = await findCommandFiles(fullDir);
        files.push(...foundFiles);
      }
    }

    CLIErrorHandler.displayProgress(`Validating ${files.length} command files (format: ${format})`);

    const results: Array<{
      file: string;
      result: any;
      content?: string;
    }> = [];
    const errors: Array<{ file: string; error: string }> = [];

    // Validate each command file
    for (const file of files) {
      try {
        const content = await readFile(file, 'utf-8');
        
        // Choose validator based on format
        const schema = format === 'opencode' 
          ? { 
              requiredFields: ['description'], 
              customValidators: [commonValidators.opencodeCommand] 
            }
          : { 
              requiredFields: ['description'], 
              customValidators: [commonValidators.claudeCommand] 
            };

        const result = validator.validateCompleteCommand(content, schema);
        results.push({ file, result, content });

      } catch (error) {
        errors.push({ file, error: (error as Error).message });
      }
    }

    // Print results
    const validCount = results.filter(r => r.result.isValid).length;
    const errorCount = results.filter(r => !r.result.isValid).length;
    const warningCount = results.reduce((sum, r) => sum + r.result.warnings.length, 0);

    console.log(`\n📊 Command Validation Summary:`);
    console.log(`  Total: ${results.length}`);
    console.log(`  ✅ Valid: ${validCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log(`  ⚠️  Warnings: ${warningCount}`);

    if (errorCount > 0) {
      console.log(`\n❌ Files with errors:`);
      results.forEach(({ file, result }) => {
        if (!result.isValid) {
          console.log(`  ${path.relative(process.cwd(), file)}:`);
          result.errors.forEach((error: any, index: number) => {
            console.log(`    ${index + 1}. ${error.message}`);
            if (error.line) {
              console.log(`       Line ${error.line}`);
            }
            if (error.suggestion) {
              console.log(`       💡 ${error.suggestion}`);
            }
          });
        }
      });
    }

    if (options.verbose && warningCount > 0) {
      console.log(`\n⚠️  Files with warnings:`);
      results.forEach(({ file, result }) => {
        if (result.warnings.length > 0) {
          console.log(`  ${path.relative(process.cwd(), file)}:`);
          result.warnings.forEach((warning: any, index: number) => {
            console.log(`    ${index + 1}. ${warning.message}`);
            if (warning.suggestion) {
              console.log(`       💡 ${warning.suggestion}`);
            }
          });
        }
      });
    }

    if (options.fix && errorCount > 0) {
      console.log(`\n🔧 Generating fix suggestions...`);
      const fixReport = generateCommandFixReport(results);
      await Bun.write('command-fixes.txt', fixReport);
      console.log(`  Fix suggestions written to: command-fixes.txt`);
    }

    // Exit with error code if validation failed
    if (options.strict && errorCount > 0) {
      CLIErrorHandler.displayError(
        CLIErrorHandler.createErrorContext(
          'validate-commands',
          'strict_validation',
          'strict_validation_failed',
          'All commands pass strict validation',
          `${errorCount} validation errors found`,
          'Fix validation errors or remove --strict flag',
          {
            requiresUserInput: true,
            suggestions: [
              'Fix the validation errors listed above',
              'Remove --strict flag to allow warnings',
              'Use --fix option to generate fix suggestions'
            ]
          }
        )
      );
      process.exit(1);
    }

    if (errorCount > 0) {
      CLIErrorHandler.displayWarning(
        `Command validation completed with ${errorCount} errors`,
        [
          'Review the validation results above',
          'Fix critical issues before proceeding',
          'Use --fix option to generate fix suggestions'
        ]
      );
    } else {
      CLIErrorHandler.displaySuccess(
        'Command validation completed successfully',
        [
          'All commands passed validation',
          'No issues found'
        ]
      );
    }

    return {
      total: results.length,
      valid: validCount,
      errors: errorCount,
      warnings: warningCount,
      results
    };

  } catch (error) {
    CLIErrorHandler.handleCommonError(error, 'validate-commands');
  }
}

/**
 * Generates a fix report for command validation issues
 */
function generateCommandFixReport(results: Array<{ file: string; result: any; content?: string }>): string {
  let report = '# Command Validation Fix Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;

  const filesWithErrors = results.filter(r => !r.result.isValid);

  if (filesWithErrors.length === 0) {
    report += '✅ No fixes needed - all commands are valid!\n';
    return report;
  }

  report += `## Files Requiring Fixes (${filesWithErrors.length})\n\n`;

  filesWithErrors.forEach(({ file, result, content }) => {
    report += `### ${path.relative(process.cwd(), file)}\n\n`;
    
    result.errors.forEach((error: any, index: number) => {
      report += `**Error ${index + 1}:** ${error.message}\n`;
      if (error.line && content) {
        const lines = content.split('\n');
        const errorLine = lines[error.line - 1];
        report += `**Line ${error.line}:** \`${errorLine.trim()}\`\n`;
      }
      if (error.suggestion) {
        report += `**Fix:** ${error.suggestion}\n`;
      }
      report += '\n';
    });

    if (result.warnings.length > 0) {
      report += '**Warnings:**\n';
      result.warnings.forEach((warning: any, index: number) => {
        report += `- ${warning.message}`;
        if (warning.suggestion) {
          report += ` (${warning.suggestion})`;
        }
        report += '\n';
      });
      report += '\n';
    }

    report += '---\n\n';
  });

  return report;
}

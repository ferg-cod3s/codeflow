import { AgentValidator } from '../conversion/validator.js';
import {
  parseAgentsFromDirectory,
  serializeAgent,
  Agent,
  ParseError,
} from '../conversion/agent-parser.js';
import { FormatConverter } from '../conversion/format-converter.js';
import { existsSync } from 'fs';
import { mkdir, rm, writeFile, readdir } from 'fs/promises';
import path from 'path';
import {
  CommandValidator,
  ValidationError as CommandValidationError,
  ValidationWarning as CommandValidationWarning,
} from '../yaml/command-validator.js';
import { ValidationError, ValidationWarning } from '../conversion/validator.js';
import CLIErrorHandler from './error-handler.js';

export interface GlobalValidationResult {
  format: 'base' | 'claude-code' | 'opencode';
  path: string;
  agents: Agent[];
  errors: Array<ValidationError | CommandValidationError | ParseError | string>;
  warnings: Array<ValidationWarning | CommandValidationWarning | string>;
}

export interface GlobalValidationOptions {
  format?: 'all' | 'base' | 'claude-code' | 'opencode';
  verbose?: boolean;
}

/**
 * Create isolated tmp environment for validation
 */
async function createValidationEnvironment(): Promise<string> {
  const timestamp = Date.now();
  const tmpDir = path.join(process.cwd(), 'tmp', `validation-${timestamp}`);

  await mkdir(tmpDir, { recursive: true });
  await mkdir(path.join(tmpDir, 'claude-agents'), { recursive: true });
  await mkdir(path.join(tmpDir, 'opencode-agents'), { recursive: true });

  return tmpDir;
}

/**
 * Clean up validation environment
 */
async function cleanupValidationEnvironment(tmpDir: string): Promise<void> {
  try {
    await rm(tmpDir, { recursive: true, force: true });
  } catch (error) {
    CLIErrorHandler.displayWarning(`Failed to cleanup ${tmpDir}: ${(error as Error).message}`);
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
 * Simplified validation using isolated tmp environments
 */
export async function validate(options: {
  format?: 'all' | 'claude-code' | 'opencode' | 'base';
  path?: string;
  checkDuplicates?: boolean;
  canonicalCheck?: boolean;
  fix?: boolean;
  verbose?: boolean;
  cleanup?: boolean;
}) {
  const validator = new AgentValidator();
  const format = options.format || 'all';
  const sourcePath = options.path || 'base-agents';
  const shouldCleanup = options.cleanup !== false; // Default to true

  // Validate source path
  const pathValidation = CLIErrorHandler.validatePath(sourcePath, 'directory');
  if (!pathValidation.valid) {
    CLIErrorHandler.displayValidationResult(pathValidation, 'source path');
    return;
  }

  let tmpDir: string | null = null;

  try {
    CLIErrorHandler.displayProgress('Starting simplified validation with isolated environment');

    // Step 1: Parse source agents from base-agents only
    CLIErrorHandler.displayProgress(`Parsing source agents from ${sourcePath}`);
    const { agents, errors: parseErrors } = await parseAgentsFromDirectory(sourcePath, 'base');

    if (parseErrors.length > 0) {
      CLIErrorHandler.displayWarning(`${parseErrors.length} agents failed to parse`, [
        'Check agent file formats and syntax',
        'Run with --verbose for detailed error information',
      ]);
    }

    if (agents.length === 0) {
      CLIErrorHandler.displayWarning('No agents found to validate', [
        'Check that source directory contains valid agent files',
        'Verify directory path is correct',
      ]);
      return;
    }

    CLIErrorHandler.displayProgress(`Found ${agents.length} source agents`);

    // Step 2: Create isolated validation environment
    tmpDir = await createValidationEnvironment();
    CLIErrorHandler.displayProgress(`Created validation environment: ${tmpDir}`);

    // Step 3: Convert agents to tmp directories
    CLIErrorHandler.displayProgress('Converting agents to platform formats');
    const converter = new FormatConverter();

    // Filter out commands for agent validation
    const agentOnly = agents.filter(
      (item): item is Agent => 'mode' in item.frontmatter && item.frontmatter.mode !== 'command'
    );

    const convertedAgents = converter.convertBatch(agentOnly, 'claude-code');
    CLIErrorHandler.displayProgress(
      `Converted ${convertedAgents.length} agents to Claude Code format`
    );

    // Write Claude Code agents
    let claudeWriteCount = 0;
    for (const agent of convertedAgents) {
      try {
        const filename = `${agent.frontmatter.name}.md`;
        const filePath = path.join(tmpDir, 'claude-agents', filename);
        const serialized = serializeAgent(agent);
        await writeFile(filePath, serialized);
        claudeWriteCount++;
      } catch (error) {
        CLIErrorHandler.displayWarning(
          `Failed to write Claude Code agent ${agent.frontmatter.name}: ${(error as Error).message}`
        );
      }
    }

    // Convert and write OpenCode agents
    const openCodeAgents = converter.convertBatch(agentOnly, 'opencode');
    CLIErrorHandler.displayProgress(`Converted ${openCodeAgents.length} agents to OpenCode format`);

    let openCodeWriteCount = 0;
    for (const agent of openCodeAgents) {
      try {
        const filename = `${agent.frontmatter.name}.md`;
        const filePath = path.join(tmpDir, 'opencode-agents', filename);
        const serialized = serializeAgent(agent);
        await writeFile(filePath, serialized);
        openCodeWriteCount++;
      } catch (error) {
        CLIErrorHandler.displayWarning(
          `Failed to write OpenCode agent ${agent.frontmatter.name}: ${(error as Error).message}`
        );
      }
    }

    CLIErrorHandler.displayProgress(
      `Generated ${claudeWriteCount} Claude Code agents and ${openCodeWriteCount} OpenCode agents`
    );

    // Step 4: Validate only in tmp directories
    const validationDirs = [];
    if (format === 'all' || format === 'claude-code') {
      validationDirs.push(path.join(tmpDir, 'claude-agents'));
    }
    if (format === 'all' || format === 'opencode') {
      validationDirs.push(path.join(tmpDir, 'opencode-agents'));
    }
    if (format === 'all' || format === 'base') {
      validationDirs.push(sourcePath);
    }

    CLIErrorHandler.displayProgress(`Validating agents in isolated environment`);

    // Parse and validate agents from tmp directories
    const allAgents: Agent[] = [];
    const allParseErrors = [];

    for (const dir of validationDirs) {
      if (existsSync(dir)) {
        const dirFormat = dir.includes('claude-agents')
          ? 'claude-code'
          : dir.includes('opencode-agents')
            ? 'opencode'
            : 'base';

        const { agents: dirAgents, errors: errors } = await parseAgentsFromDirectory(
          dir,
          dirFormat
        );

        // Filter out commands - only validate agents
        const agentOnly = dirAgents.filter((item): item is Agent => {
          // Commands have mode: 'command' in base format
          if ('mode' in item.frontmatter && item.frontmatter.mode === 'command') {
            return false;
          }
          // Claude Code and OpenCode formats don't have mode field, so they're all agents
          return true;
        });

        allAgents.push(...agentOnly);
        allParseErrors.push(
          ...errors.map((e) => ({ ...e, filePath: `${dir}/${path.basename(e.filePath)}` }))
        );
      }
    }

    // Step 5: Run validation
    const { results, summary } = await validator.validateBatchWithDetails(allAgents);

    // Print summary
    console.log(`\n📊 Validation Summary:`);
    console.log(`  Environment: ${tmpDir}`);
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

    // Step 6: Cleanup
    if (shouldCleanup && tmpDir) {
      CLIErrorHandler.displayProgress('Cleaning up validation environment');
      await cleanupValidationEnvironment(tmpDir);
    }

    // Exit with error code if validation failed
    if (summary.errors > 0) {
      CLIErrorHandler.displayWarning(`Validation completed with ${summary.errors} errors`, [
        'Review the validation results above',
        'Fix critical issues before proceeding',
        'Use --fix option to generate fix suggestions',
        'Validation was performed in isolated tmp environment',
      ]);
      process.exit(1);
    }

    CLIErrorHandler.displaySuccess('Agent validation completed successfully', [
      'All agents passed validation in isolated environment',
      'No critical issues found',
      'Used tmp/ directory for isolated testing',
    ]);
  } catch (error) {
    if (tmpDir && shouldCleanup) {
      await cleanupValidationEnvironment(tmpDir);
    }
    CLIErrorHandler.handleCommonError(error, 'validate');
  }
}

/**
 * Validates OpenCode and Claude Code command files using simplified approach
 */
export async function validateCommands(options: CommandValidationOptions = {}) {
  const commandValidator = new CommandValidator();
  const searchPath = options.path || '.';
  const format = options.format || 'opencode';

  CLIErrorHandler.displayProgress(`Validating ${format} commands in ${searchPath}`);

  try {
    // For simplified validation, we'll focus on source command directories only
    const sourceDirs = {
      opencode: ['command'],
      'claude-code': ['command'],
    };

    const dirsToSearch = sourceDirs[format] || sourceDirs.opencode;
    let allResults: any[] = [];

    for (const dir of dirsToSearch) {
      const fullPath = path.isAbsolute(dir) ? dir : path.join(searchPath, dir);

      if (existsSync(fullPath)) {
        CLIErrorHandler.displayProgress(`Searching directory: ${fullPath}`);
        const result = await commandValidator.validateDirectory(fullPath, format);
        allResults.push(result);
      } else {
        CLIErrorHandler.displayProgress(`Directory not found: ${fullPath}`);
      }
    }

    // Aggregate results
    const totalFiles = allResults.reduce((sum, r) => sum + (r.metadata?.fileCount || 0), 0);
    const totalCommands = allResults.reduce((sum, r) => sum + (r.metadata?.totalCommands || 0), 0);
    const totalErrors = allResults.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = allResults.reduce((sum, r) => sum + r.warnings.length, 0);
    const totalTime = allResults.reduce((sum, r) => sum + (r.metadata?.processingTime || 0), 0);

    // Print summary
    console.log(`\n📊 Command Validation Summary:`);
    console.log(`  Directories searched: ${dirsToSearch.length}`);
    console.log(`  Total files: ${totalFiles}`);
    console.log(`  Total commands: ${totalCommands}`);
    console.log(`  Total processing time: ${totalTime.toFixed(2)}ms`);
    console.log(`  Average time per file: ${(totalTime / totalFiles).toFixed(2)}ms`);
    console.log(`  ✅ Valid commands: ${totalCommands - totalErrors}`);
    console.log(`  ❌ Errors: ${totalErrors}`);
    console.log(`  ⚠️  Warnings: ${totalWarnings}`);

    if (totalErrors > 0) {
      console.log(`\n❌ Validation Errors:`);
      allResults.forEach((result, index) => {
        if (result.errors.length > 0) {
          console.log(`\nDirectory ${index + 1}:`);
          result.errors.forEach((error: CommandValidationError, errorIndex: number) => {
            console.log(`  ${errorIndex + 1}. ${error.file}: ${error.message}`);
            if (error.suggestion) {
              console.log(`     💡 ${error.suggestion}`);
            }
          });
        }
      });
    }

    if (totalWarnings > 0) {
      console.log(`\n⚠️  Validation Warnings:`);
      allResults.forEach((result, index) => {
        if (result.warnings.length > 0) {
          console.log(`\nDirectory ${index + 1}:`);
          result.warnings.forEach((warning: CommandValidationWarning, warningIndex: number) => {
            console.log(`  ${warningIndex + 1}. ${warning.message}`);
            if (warning.suggestion) {
              console.log(`     💡 ${warning.suggestion}`);
            }
          });
        }
      });
    }

    if (options.verbose) {
      console.log(`\n📝 Detailed Performance Metrics:`);
      allResults.forEach((result, index) => {
        if (result.metadata) {
          console.log(
            `  Directory ${index + 1}: ${result.metadata.processingTime.toFixed(2)}ms for ${result.metadata.fileCount} files`
          );
        }
      });
    }

    if (options.fix && totalErrors > 0) {
      const allErrors = allResults.flatMap((r) => r.errors);
      const fixReport = commandValidator.generateFixes(allErrors);
      console.log(`\n🔧 Fix suggestions written to: command-validation-fixes.txt`);
      await Bun.write('command-validation-fixes.txt', fixReport);
    }

    // Exit with error code if validation failed
    if (totalErrors > 0) {
      CLIErrorHandler.displayWarning(`Command validation completed with ${totalErrors} errors`, [
        'Review the validation results above',
        'Fix critical issues before proceeding',
        'Use --fix option to generate fix suggestions',
      ]);
      process.exit(1);
    }

    CLIErrorHandler.displaySuccess('Command validation completed successfully', [
      'All commands passed validation',
      'No critical issues found',
    ]);

    return {
      total: totalCommands,
      valid: totalCommands - totalErrors,
      errors: totalErrors,
      warnings: totalWarnings,
      results: allResults,
    };
  } catch (error) {
    CLIErrorHandler.handleCommonError(error, 'validateCommands');
    return {
      total: 0,
      valid: 0,
      errors: 1,
      warnings: 0,
      results: [],
    };
  }
}

/**
 * Generates a fix report for command validation issues
 */
export function generateCommandFixReport(
  results: Array<{ file: string; result: any; content?: string }>
): string {
  const fixes: string[] = [
    '# Command Validation Fix Report',
    '',
    '## Summary',
    `${results.length} files with validation issues`,
    '',
    '## Fixes',
  ];

  results.forEach((item, index) => {
    fixes.push(`\n### File ${index + 1}: ${item.file}`);
    if (item.result.errors) {
      item.result.errors.forEach((error: CommandValidationError, errorIndex: number) => {
        fixes.push(`  Error ${errorIndex + 1}: ${error.message}`);
        if (error.suggestion) {
          fixes.push(`    Suggestion: ${error.suggestion}`);
        }
      });
    }
    fixes.push('');
  });

  return fixes.join('\n');
}

/**
 * Validates agents in a global directory for a given format.
 * This is a lightweight wrapper around AgentValidator for tests and legacy usage.
 */
export async function validateGlobalDirectory(
  dirPath: string,
  format: 'base' | 'claude-code' | 'opencode'
): Promise<GlobalValidationResult> {
  const validator = new AgentValidator();

  if (!existsSync(dirPath)) {
    return {
      format,
      path: dirPath,
      agents: [],
      errors: [`Directory not found: ${dirPath}`],
      warnings: [],
    };
  }

  const { agents, errors } = await parseAgentsFromDirectory(dirPath, format);
  const agentOnly = agents.filter((item): item is Agent => {
    if ('mode' in item.frontmatter && item.frontmatter.mode === 'command') {
      return false;
    }
    return true;
  });

  const { results } = await validator.validateBatchWithDetails(agentOnly);

  const allErrors: Array<ValidationError | CommandValidationError | ParseError | string> = [];
  const allWarnings: Array<ValidationWarning | CommandValidationWarning | string> = [];

  for (const result of results) {
    result.errors.forEach((e) => allErrors.push(e));
    result.warnings.forEach((w) => allWarnings.push(w));
  }

  return {
    format,
    path: dirPath,
    agents: agentOnly,
    errors: [...errors, ...allErrors],
    warnings: allWarnings,
  };
}

/**
 * Ensures OpenCode agents directory uses a flat structure (no nested subdirectories).
 */
export async function validateOpenCodeFlatStructure(opencodePath: string): Promise<void> {
  if (!existsSync(opencodePath)) {
    return;
  }

  const entries = await readdir(opencodePath);

  const subdirs: string[] = [];
  const dirents = await (
    await import('fs/promises')
  ).readdir(opencodePath, { withFileTypes: true });
  for (const entry of dirents) {
    if (entry.isDirectory()) {
      subdirs.push(entry.name);
    }
  }

  if (subdirs.length > 0) {
    throw new Error(
      `OpenCode agents found in subdirectories: ${subdirs.join(', ')}. ` +
        'OpenCode expects a flat agent directory structure.'
    );
  }
}

/**
 * Displays aggregated validation results for global directories.
 */
export function displayGlobalValidationResults(
  results: GlobalValidationResult[],
  options: GlobalValidationOptions
): void {
  const totalAgents = results.reduce((sum, r) => sum + r.agents.length, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

  console.log('\n📊 Global Validation Summary:');
  console.log(`  Formats: ${options.format || 'all'}`);
  console.log(`  Total agents: ${totalAgents}`);
  console.log(`  Errors: ${totalErrors}`);
  console.log(`  Warnings: ${totalWarnings}`);

  if (options.verbose) {
    for (const result of results) {
      console.log(`\nFormat: ${result.format} (${result.path})`);
      console.log(`  Agents: ${result.agents.length}`);
      console.log(`  Errors: ${result.errors.length}`);
      console.log(`  Warnings: ${result.warnings.length}`);
    }
  }

  if (totalErrors > 0) {
    CLIErrorHandler.displayWarning(`Global validation completed with ${totalErrors} errors`, [
      'Review validation results for each format',
      'Fix critical issues before deployment',
    ]);
  }
}

import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { parseAgentsFromDirectory, serializeAgent, Agent } from '../conversion/agent-parser.js';
import { FormatConverter } from '../conversion/format-converter.js';
import {
  applyOpenCodePermissionsToDirectory,
  DEFAULT_OPENCODE_PERMISSIONS,
} from '../security/opencode-permissions.js';
import CLIErrorHandler from './error-handler.js';

export async function convert(source: string, target: string, format: 'claude-code' | 'opencode') {
  // Validate arguments
  const validation = CLIErrorHandler.validateArguments([source, target], 2, 'convert');
  if (!validation.valid) {
    CLIErrorHandler.displayValidationResult(validation, 'convert');
    return;
  }

  // Validate source directory
  const sourceValidation = CLIErrorHandler.validatePath(source, 'directory');
  if (!sourceValidation.valid) {
    CLIErrorHandler.displayValidationResult(sourceValidation, 'source directory');
    return;
  }

  CLIErrorHandler.displayProgress(`Converting agents from ${source} to ${target}`);
  CLIErrorHandler.displayProgress(`Target format: ${format}`);

  try {
    // Parse agents from source directory
    const { agents, errors: parseErrors } = await parseAgentsFromDirectory(source, 'base');

    if (parseErrors.length > 0) {
      CLIErrorHandler.displayWarning(`Failed to parse some agents from ${source}`, [
        'Check agent file formats and syntax',
        'Run with --verbose for detailed error information',
      ]);
    }

    if (agents.length === 0) {
      CLIErrorHandler.displayWarning('No agents found to convert', [
        'Check that the source directory contains valid agent files',
        'Verify file extensions (.md, .yaml, .json)',
      ]);
      return;
    }

    CLIErrorHandler.displayProgress(`Found ${agents.length} agents to convert`);

    // Convert agents (filter out commands)
    const converter = new FormatConverter();
    const agentOnly = agents.filter(
      (item): item is Agent => 'mode' in item.frontmatter && item.frontmatter.mode !== 'command'
    );
    const convertedAgents = converter.convertBatch(agentOnly, format);

    CLIErrorHandler.displayProgress(
      `Converted ${convertedAgents.length} agents to ${format} format`
    );

    // Create target directory if it doesn't exist
    if (!existsSync(target)) {
      await mkdir(target, { recursive: true });
      CLIErrorHandler.displayProgress(`Created target directory: ${target}`);
    }

    // Write converted agents
    let writeCount = 0;
    let writeErrors = 0;

    for (const agent of convertedAgents) {
      try {
        const filename = `${agent.frontmatter.name}.md`;
        const filePath = join(target, filename);
        const serialized = serializeAgent(agent);
        await Bun.write(filePath, serialized);
        writeCount++;
      } catch (error: any) {
        writeErrors++;
        CLIErrorHandler.displayError(
          CLIErrorHandler.createErrorContext(
            'convert',
            'file_write',
            'write_error',
            'Successful file write operation',
            `${agent.frontmatter.name}: ${error.message}`,
            'Check file permissions and disk space',
            {
              requiresUserInput: true,
              suggestions: [
                'Verify write permissions for target directory',
                'Check available disk space',
                'Ensure target directory exists',
              ],
            }
          )
        );
      }
    }

    // Apply OpenCode permissions if converting to OpenCode format
    if (format === 'opencode' && writeCount > 0) {
      try {
        CLIErrorHandler.displayProgress(`Applying OpenCode permissions to ${target}`);
        await applyOpenCodePermissionsToDirectory(target, DEFAULT_OPENCODE_PERMISSIONS);
        CLIErrorHandler.displaySuccess('Applied OpenCode permissions');
      } catch (error: any) {
        CLIErrorHandler.displayWarning(`Failed to apply OpenCode permissions: ${error.message}`, [
          'Check file system permissions',
          'Verify OpenCode security configuration',
          'Files were converted but permissions may not be optimal',
        ]);
      }
    }

    CLIErrorHandler.displaySuccess(
      `Successfully converted ${writeCount} agents`,
      writeErrors > 0
        ? [`${writeErrors} agents failed to write - check error details above`]
        : undefined
    );

    if (writeErrors > 0) {
      CLIErrorHandler.displayWarning(`${writeErrors} agents failed to write`, [
        'Check the error details above for specific failures',
        'Verify target directory permissions and disk space',
      ]);
    }

    console.log(`\n📋 Conversion Summary:`);
    console.log(`  Source: ${source}`);
    console.log(`  Target: ${target} (${format})`);
    console.log(`  Agents: ${agents.length} found, ${convertedAgents.length} converted`);
    if (format === 'opencode') {
      console.log(`  Permissions: OpenCode runtime permissions applied`);
    }
  } catch (error) {
    CLIErrorHandler.handleCommonError(error, 'convert');
  }
}

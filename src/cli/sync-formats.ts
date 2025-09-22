import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { writeFile, readdir, mkdir } from 'node:fs/promises';
import { parseAgentsFromDirectory, serializeAgent } from '../conversion/agent-parser';
import { FormatConverter } from '../conversion/format-converter';
import { AgentValidator } from '../conversion/validator';
import {
  applyOpenCodePermissionsToDirectory,
  DEFAULT_OPENCODE_PERMISSIONS,
} from '../security/opencode-permissions';
import { applyPermissionInheritance } from '../security/validation';
import CLIErrorHandler from "./error-handler.js";

interface SyncFormatsOptions {
  validate?: boolean;
  dryRun?: boolean;
  direction?: 'to-all' | 'from-opencode' | 'bidirectional';
}

// Define the category structure for MCP and Claude agents
const AGENT_CATEGORIES = {
  development: [
    'analytics-engineer',
    'api-builder',
    'code-reviewer',
    'codebase-analyzer',
    'codebase-locator',
    'codebase-pattern-finder',
    'database-expert',
    'development-migrations-specialist',
    'full-stack-developer',
    'performance-engineer',
    'system-architect',
  ],
  generalist: [
    'agent-architect',
    'smart-subagent-orchestrator',
    'thoughts-analyzer',
    'thoughts-locator',
    'web-search-researcher',
  ],
  'ai-innovation': ['ai-integration-expert'],
  operations: [
    'deployment-wizard',
    'devops-operations-specialist',
    'infrastructure-builder',
    'monitoring-expert',
    'operations-incident-commander',
  ],
  'quality-testing': ['security-scanner', 'quality-testing-performance-tester'],
  'business-analytics': ['growth-engineer', 'programmatic-seo-engineer'],
  'design-ux': ['accessibility-pro', 'ux-optimizer'],
  'product-strategy': ['content-localization-coordinator'],
};

/**
 * Find the appropriate category for an agent
 */
function findAgentCategory(agentName: string): string {
  for (const [category, agents] of Object.entries(AGENT_CATEGORIES)) {
    if (agents.includes(agentName)) {
      return category;
    }
  }
  // Default to generalist if not found
  return 'generalist';
}

/**
 * Ensure all agent formats have the same agents
 */
export async function syncAllFormats(options: SyncFormatsOptions = {}) {
  const { validate = true, dryRun = false, direction = 'from-opencode' } = options;

  CLIErrorHandler.displayProgress('Synchronizing agents across all formats');
  CLIErrorHandler.displayProgress(`Direction: ${direction}`);
  if (dryRun) CLIErrorHandler.displayProgress('Dry run mode - no files will be written');

  try {
    const codeflowDir = join(import.meta.dir, '../..');

    const directories = {
      base: join(codeflowDir, 'codeflow-agents'), // Updated to use codeflow-agents directory
      claudeCode: join(codeflowDir, 'claude-agents'),
      opencode: join(codeflowDir, 'opencode-agents'),
    };

    // Parse agents from all directories
    const agentsByFormat: Record<string, any[]> = {};
    const allErrors: any[] = [];

    CLIErrorHandler.displayProgress('Loading agents from all formats');

    for (const [format, path] of Object.entries(directories)) {
      const formatKey = format === 'claudeCode' ? 'claude-code' : format;

      if (existsSync(path)) {
        const { agents, errors } = await parseAgentsFromDirectory(path, formatKey as any);
        agentsByFormat[format] = agents;
        allErrors.push(...errors);
        console.log(`  ${format}: ${agents.length} agents`);

        if (errors.length > 0) {
          CLIErrorHandler.displayWarning(
            `${errors.length} parsing errors in ${format}`,
            [
              'Check agent file formats and syntax',
              'Run with --verbose for detailed error information'
            ]
          );
        }
      } else {
        agentsByFormat[format] = [];
        CLIErrorHandler.displayWarning(
          `${format} directory not found`,
          [
            'Check if the directory exists',
            'Run setup to create missing directories'
          ]
        );
      }
    }

    if (allErrors.length > 0) {
      CLIErrorHandler.displayWarning(
        `Total parsing errors: ${allErrors.length}`,
        [
          'Check agent file formats and syntax',
          'Run with --verbose for detailed error information'
        ]
      );
    }

    // Create master agent list based on direction
    let masterAgents: any[] = [];
    let sourceFormat = '';

    switch (direction) {
      case 'from-opencode':
        masterAgents = agentsByFormat.opencode;
        sourceFormat = 'opencode';
        CLIErrorHandler.displayProgress(`Using OpenCode as master (${masterAgents.length} agents)`);
        break;

      case 'bidirectional':
        // Merge all unique agents
        const allAgents = [
          ...agentsByFormat.base,
          ...agentsByFormat.claudeCode,
          ...agentsByFormat.opencode,
        ];

        // Remove duplicates by name
        const uniqueAgents = new Map();
        for (const agent of allAgents) {
          if (!uniqueAgents.has(agent.name)) {
            uniqueAgents.set(agent.name, agent);
          }
        }

        masterAgents = Array.from(uniqueAgents.values());
        sourceFormat = 'merged';
        CLIErrorHandler.displayProgress(`Using merged unique agents (${masterAgents.length} total)`);
        break;

      case 'to-all':
      default:
        // Find the format with the most agents
        const counts = {
          base: agentsByFormat.base.length,
          claudeCode: agentsByFormat.claudeCode.length,
          opencode: agentsByFormat.opencode.length,
        };

        const maxFormat = Object.entries(counts).reduce((a, b) =>
          counts[a[0] as keyof typeof counts] > counts[b[0] as keyof typeof counts] ? a : b
        )[0];

        masterAgents = agentsByFormat[maxFormat];
        sourceFormat = maxFormat;
        CLIErrorHandler.displayProgress(`Using ${maxFormat} as master (${masterAgents.length} agents)`);
        break;
    }

    // Show what's missing in each format
    console.log('\n📊 Agent coverage analysis:');
    const masterNames = new Set(masterAgents.map((a) => a.name));

    for (const [format, agents] of Object.entries(agentsByFormat)) {
      const currentNames = new Set(agents.map((a: any) => a.name));
      const missing = Array.from(masterNames).filter((name) => !currentNames.has(name));
      const extra = Array.from(currentNames).filter((name) => !masterNames.has(name));

      console.log(`  ${format}: ${agents.length}/${masterAgents.length} agents`);
      if (missing.length > 0) {
        console.log(
          `    Missing: ${missing.length} (${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''})`
        );
      }
      if (extra.length > 0 && direction !== 'bidirectional') {
        console.log(
          `    Extra: ${extra.length} (${extra.slice(0, 3).join(', ')}${extra.length > 3 ? '...' : ''})`
        );
      }
    }

    // Sync agents to all formats
    const converter = new FormatConverter();
    const validator = new AgentValidator();

    let totalSynced = 0;
    let totalErrors = 0;

    CLIErrorHandler.displayProgress('Synchronizing agents');

    for (const [targetFormat, targetPath] of Object.entries(directories)) {
      const targetFormatKey = targetFormat === 'claudeCode' ? 'claude-code' : targetFormat;
      const currentAgents = agentsByFormat[targetFormat];
      const currentNames = new Set(currentAgents.map((a: any) => a.name));

      // Find agents that need to be added
      const missingAgents = masterAgents.filter((agent) => !currentNames.has(agent.name));

      if (missingAgents.length === 0) {
        console.log(`  ${targetFormat}: Already up to date`);
        continue;
      }

      console.log(`  ${targetFormat}: Adding ${missingAgents.length} missing agents`);

      for (const agent of missingAgents) {
        try {
          // Convert to target format
          let convertedAgent = agent;
          if (agent.format !== targetFormatKey) {
            convertedAgent = converter.convert(agent, targetFormatKey as any);
          }

          // Validate if requested
          if (validate) {
            const validation = validator.validateAgent(convertedAgent);
            if (!validation.valid) {
              CLIErrorHandler.displayWarning(
                `Validation failed for ${agent.name}: ${validation.errors[0]?.message}`,
                [
                  'Check agent format and content',
                  'Fix validation errors before syncing'
                ]
              );
              totalErrors++;
              continue;
            }
          }

          // Write to target directory with proper structure
          if (!dryRun) {
            const filename = `${convertedAgent.name}.md`;
            let filePath: string;

            if (targetFormat === 'claudeCode') {
              // Claude agents go into category subdirectories
              const category = findAgentCategory(convertedAgent.name);
              const categoryPath = join(targetPath, category);
              await mkdir(categoryPath, { recursive: true });
              filePath = join(categoryPath, filename);
            } else if (targetFormat === 'base') {
              // Base agents go into category subdirectories (MCP structure)
              const category = findAgentCategory(convertedAgent.name);
              const categoryPath = join(targetPath, category);
              await mkdir(categoryPath, { recursive: true });
              filePath = join(categoryPath, filename);
            } else {
              // OpenCode agents go into flat directory
              filePath = join(targetPath, filename);
            }

            const serialized = serializeAgent(convertedAgent);
            await writeFile(filePath, serialized);
          }

          totalSynced++;
          console.log(`    ✓ ${agent.name}`);
        } catch (error: any) {
          CLIErrorHandler.displayError(
            CLIErrorHandler.createErrorContext(
              'sync-formats',
              'agent_sync',
              'sync_failed',
              'Successful agent sync',
              `${agent.name}: ${error.message}`,
              'Check agent format and try again',
              {
                requiresUserInput: true,
                suggestions: [
                  'Verify agent file format and content',
                  'Check target directory permissions',
                  'Run with --dry-run to test without writing files'
                ]
              }
            )
          );
          totalErrors++;
        }
      }
    }

    // Apply permissions to synced agents
    if (!dryRun && totalSynced > 0) {
      for (const [targetFormat, targetPath] of Object.entries(directories)) {
        try {
          if (targetFormat === 'opencode') {
            CLIErrorHandler.displayProgress(`Applying OpenCode permissions to ${targetPath}`);
            await applyOpenCodePermissionsToDirectory(targetPath, DEFAULT_OPENCODE_PERMISSIONS);
            CLIErrorHandler.displaySuccess('Applied OpenCode permissions');
          } else {
            CLIErrorHandler.displayProgress(`Applying standard permissions to ${targetPath}`);
            await applyPermissionInheritance(targetPath, 'subagent', {
              directories: 0o755,
              agentFiles: 0o644,
              commandFiles: 0o644,
            });
            CLIErrorHandler.displaySuccess('Applied standard permissions');
          }
        } catch (error: any) {
          CLIErrorHandler.displayWarning(
            `Failed to apply permissions to ${targetPath}: ${error.message}`,
            [
              'Check file system permissions',
              'Verify security configuration',
              'Files were synced but permissions may not be optimal'
            ]
          );
        }
      }
    }

    CLIErrorHandler.displaySuccess(
      'Format synchronization complete',
      [
        `Summary: ${totalSynced} agents synced, ${totalErrors} errors`,
        dryRun ? 'Dry run complete - no files were written' : undefined,
        totalSynced > 0 ? 'MCP Server Restart: If you are using MCP integration, restart the server to use updated agents: codeflow mcp restart' : undefined
      ].filter(Boolean)
    );

    return {
      synced: totalSynced,
      errors: totalErrors,
      master: masterAgents.length,
    };

  } catch (error) {
    CLIErrorHandler.handleCommonError(error, 'sync-formats');
  }
}

/**
 * Show detailed differences between formats
 */
export async function showFormatDifferences() {
  try {
    const codeflowDir = join(import.meta.dir, '../..');

    const directories = {
      base: join(codeflowDir, 'codeflow-agents'), // Updated to use codeflow-agents directory
      'claude-code': join(codeflowDir, 'claude-agents'),
      opencode: join(codeflowDir, 'opencode-agents'),
    };

    CLIErrorHandler.displayProgress('Analyzing format differences');

    // Parse agents from all directories
    const agentsByFormat: Record<string, any[]> = {};

    for (const [format, path] of Object.entries(directories)) {
      if (existsSync(path)) {
        const { agents } = await parseAgentsFromDirectory(path, format as any);
        agentsByFormat[format] = agents;
      } else {
        agentsByFormat[format] = [];
        CLIErrorHandler.displayWarning(
          `${format} directory not found`,
          [
            'Check if the directory exists',
            'Run setup to create missing directories'
          ]
        );
      }
    }

    // Get all unique agent names
    const allNames = new Set<string>();
    for (const agents of Object.values(agentsByFormat)) {
      for (const agent of agents) {
        allNames.add(agent.name);
      }
    }

    console.log('📋 Agent presence by format:\n');

    // Show presence matrix
    const sortedNames = Array.from(allNames).sort();
    const formats = Object.keys(agentsByFormat);

    // Header
    console.log(`${'Agent Name'.padEnd(40)} | ${formats.map((f) => f.padEnd(12)).join(' | ')}`);
    console.log(`${'-'.repeat(40)} | ${formats.map(() => '-'.repeat(12)).join(' | ')}`);

    // Rows
    for (const name of sortedNames.slice(0, 20)) {
      // Show first 20 for readability
      const row = name.padEnd(40) + ' | ';
      const presence = formats
        .map((format) => {
          const hasAgent = agentsByFormat[format].some((a: any) => a.name === name);
          return (hasAgent ? '✓' : '✗').padEnd(12);
        })
        .join(' | ');

      console.log(row + presence);
    }

    if (sortedNames.length > 20) {
      console.log(`... and ${sortedNames.length - 20} more agents`);
    }

    // Summary statistics
    console.log(`\n📊 Summary:`);
    for (const [format, agents] of Object.entries(agentsByFormat)) {
      console.log(`  ${format}: ${agents.length} agents`);
    }

    // Find unique agents per format
    console.log(`\n🔍 Unique agents per format:`);
    for (const [format, agents] of Object.entries(agentsByFormat)) {
      const otherAgents = Object.entries(agentsByFormat)
        .filter(([f]) => f !== format)
        .flatMap(([_, a]) => a.map((agent: any) => agent.name));

      const unique = agents.filter((agent: any) => !otherAgents.includes(agent.name));

      if (unique.length > 0) {
        console.log(`  ${format}: ${unique.length} unique`);
        for (const agent of unique.slice(0, 5)) {
          console.log(`    • ${agent.name}`);
        }
        if (unique.length > 5) {
          console.log(`    ... and ${unique.length - 5} more`);
        }
      } else {
        console.log(`  ${format}: No unique agents`);
      }
    }

    CLIErrorHandler.displaySuccess(
      'Format differences analysis complete',
      [
        'Review the agent presence matrix above',
        'Use sync-formats to synchronize missing agents'
      ]
    );

    return {
      total: sortedNames.length,
      byFormat: Object.fromEntries(
        Object.entries(agentsByFormat).map(([format, agents]) => [format, agents.length])
      ),
    };

  } catch (error) {
    CLIErrorHandler.handleCommonError(error, 'show-format-differences');
  }
}

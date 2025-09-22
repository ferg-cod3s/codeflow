#!/usr/bin/env bun

import { parseArgs } from 'util';
import { status } from './status';
import { setup } from './setup';
import { convert } from './convert';
import { sync } from './sync';
import { startWatch } from './watch';
import { CatalogCLI } from './catalog';
import packageJson from '../../package.json';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

/**
 * Helper function to determine directory path for agent format
 */
function getFormatDirectory(
  format: 'base' | 'claude-code' | 'opencode',
  projectPath: string
): string {
  const codeflowRoot = join(import.meta.dir, '../..');

  switch (format) {
    case 'base':
      // Base format refers to the global codeflow agent directory
      return join(codeflowRoot, 'codeflow-agents');
    case 'claude-code':
      // For projects, use .claude/agents if it exists, otherwise use global
      const projectClaudeDir = join(projectPath, '.claude', 'agents');
      return existsSync(projectClaudeDir) ? projectClaudeDir : join(codeflowRoot, 'claude-agents');
    case 'opencode':
      // For projects, use .opencode/agent if it exists, otherwise use global
      const projectOpenCodeDir = join(projectPath, '.opencode', 'agent');
      return existsSync(projectOpenCodeDir)
        ? projectOpenCodeDir
        : join(codeflowRoot, 'opencode-agents');
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

let values: any;
let positionals: string[];

try {
  const parsed = parseArgs({
    args: Bun.argv,
    options: {
      help: {
        type: 'boolean',
        short: 'h',
        default: false,
      },
      version: {
        type: 'boolean',
        default: false,
      },
      force: {
        type: 'boolean',
        short: 'f',
        default: false,
      },
      type: {
        type: 'string',
        short: 't',
      },
      validate: {
        type: 'boolean',
        default: true,
      },
      'dry-run': {
        type: 'boolean',
        default: false,
      },
      global: {
        type: 'boolean',
        short: 'g',
        default: false,
      },
      project: {
        type: 'string',
      },
      source: {
        type: 'string',
      },
      target: {
        type: 'string',
        default: 'project',
      },
      'source-format': {
        type: 'string',
        default: 'base',
      },
    },
    strict: true,
    allowPositionals: true,
  });
  values = parsed.values;
  positionals = parsed.positionals;
} catch (error: any) {
  if (error.code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION') {
    console.error(`Error: ${error.message}`);
    console.error("Run 'codeflow --help' for usage information");
    process.exit(1);
  }
  throw error;
}

// Remove the first two positionals (bun and script path)
const args = positionals.slice(2);
const command = args[0];

// Handle --version flag
if (values.version) {
  console.log(`Codeflow ${packageJson.version}`);
  process.exit(0);
}

// Handle help (both --help flag and help command)
if (values.help || command === 'help' || !command) {
  console.log(`
codeflow - Intelligent AI workflow management

Usage:
  codeflow <command> [options]

Commands:
  setup [project-path]       Smart setup for Claude Code or OpenCode integration (use --global for global directories)
  status [project-path]      Check which files are up-to-date or outdated
  sync [options]             Sync agents and commands across formats
  convert <source> <target> <format>  Convert agents between formats
  watch start [options]      Start automatic file synchronization daemon
  catalog <subcommand>       Browse, search, and install catalog items

Catalog Subcommands:
  catalog list [type] [source]     List catalog items (optional: filter by type or source)
  catalog search <term> [options]  Search catalog items
  catalog info <item-id>           Show detailed information about an item
  catalog install <item-id> [targets]  Install item to specified targets
  catalog import <source> [options]    Import items from external source
  catalog update [item-ids]        Update catalog items
  catalog remove <item-id>         Remove item from catalog
  catalog health-check             Check catalog health and integrity
  catalog sync [options]           Sync catalog with external sources

Options:
  -f, --force               Force overwrite existing setup
  -t, --type <type>         Project type: claude-code, opencode, general
  --validate                Validate agents during operations (default: true)
  --dry-run                 Show what would be changed without writing files
  -g, --global              Sync to global directories (~/.claude, ~/.config/opencode)
  --project <path>          Project directory for operations
  --source <format>         Source format: base, claude-code, opencode
  --target <format>         Target format: base, claude-code, opencode
  --source-format <format>  Source format for sync (default: base)

Examples:
  codeflow setup ~/my-project
  codeflow status .
  codeflow sync                        # Sync to project directories
  codeflow sync --global               # Sync to global directories (~/.claude, ~/.config/opencode)
  codeflow sync --global --dry-run     # Preview global sync changes
  codeflow convert ./codeflow-agents ./claude-agents claude-code
  codeflow watch start --global
  codeflow catalog list agent          # List all agents
  codeflow catalog search "code review"  # Search for code review items
  codeflow catalog install claude-templates/blog-writer --target claude-code
`);
  process.exit(0);
}

switch (command) {
  case 'setup':
    const setupPath = args[1];
    await setup(setupPath, {
      global: values.global,
      force: values.force,
      type: values.type,
    });
    break;
  case 'status':
    const statusPath = args[1];
    await status(statusPath);
    break;
  case 'sync':
    const syncPath = args[1];
    await sync(syncPath, {
      global: values.global,
      force: values.force,
      dryRun: values['dry-run'],
      verbose: true,
    });
    break;
  case 'convert':
    // Support flag-based usage: --source, --target, --project
    if (values.source && values.target) {
      const projectPath = values.project || process.cwd();

      // Determine source and target directories based on format and project
      const sourceFormat = values.source as 'base' | 'claude-code' | 'opencode';
      const targetFormat = values.target as 'base' | 'claude-code' | 'opencode';

      const sourceDir = getFormatDirectory(sourceFormat, projectPath);
      const targetDir = getFormatDirectory(targetFormat, projectPath);

      if (targetFormat === 'base') {
        console.error('Error: Cannot convert to base format');
        process.exit(1);
      }

      await convert(sourceDir, targetDir, targetFormat as 'claude-code' | 'opencode');
      break;
    }

    const source = args[1];
    const target = args[2];
    const format = args[3] as 'base' | 'claude-code' | 'opencode';

    if (!source || !target || !format) {
      console.error('Error: convert requires source, target, and format arguments');
      console.error('Usage: codeflow convert <source> <target> <format>');
      console.error('Formats: base, claude-code, opencode');
      process.exit(1);
    }

    if (!['base', 'claude-code', 'opencode'].includes(format)) {
      console.error(`Error: Invalid format '${format}'`);
      console.error('Valid formats: base, claude-code, opencode');
      process.exit(1);
    }

    if (format === 'base') {
      console.error('Error: Cannot convert to base format');
      process.exit(1);
    }

    await convert(source, target, format as 'claude-code' | 'opencode');
    break;
  case 'watch':
    const watchAction = args[1];

    if (watchAction === 'start') {
      const watchPath = args[2];
      await startWatch(watchPath);
    } else {
      console.error(`Error: Unknown watch action '${watchAction}'`);
      console.error('Available actions: start');
      process.exit(1);
    }
    break;
  case 'catalog':
    const catalogCLI = new CatalogCLI();
    const catalogCommand = args[1];

    switch (catalogCommand) {
      case 'list':
        const listType = args[2];
        const listSource = args[3];
        await catalogCLI.list(listType, listSource);
        break;
      case 'search':
        const searchTerm = args[2];
        if (!searchTerm) {
          console.error('Error: search requires a search term');
          console.error('Usage: codeflow catalog search <term>');
          process.exit(1);
        }
        await catalogCLI.search(searchTerm);
        break;
      case 'info':
        const itemId = args[2];
        if (!itemId) {
          console.error('Error: info requires an item ID');
          console.error('Usage: codeflow catalog info <item-id>');
          process.exit(1);
        }
        await catalogCLI.info(itemId);
        break;
      case 'install':
        const installItemId = args[2];
        const installTargets = args[3] ? args[3].split(',') : ['claude-code'];
        if (!installItemId) {
          console.error('Error: install requires an item ID');
          console.error('Usage: codeflow catalog install <item-id> [targets]');
          process.exit(1);
        }
        await catalogCLI.install(installItemId, installTargets, {
          dryRun: values['dry-run'],
          force: values.force
        });
        break;
      case 'import':
        const importSource = args[2];
        if (!importSource) {
          console.error('Error: import requires a source name');
          console.error('Usage: codeflow catalog import <source>');
          process.exit(1);
        }
        await catalogCLI.import(importSource);
        break;
      case 'update':
        const updateItemIds = args[2] ? args[2].split(',') : undefined;
        await catalogCLI.update(updateItemIds);
        break;
      case 'remove':
        const removeItemId = args[2];
        if (!removeItemId) {
          console.error('Error: remove requires an item ID');
          console.error('Usage: codeflow catalog remove <item-id>');
          process.exit(1);
        }
        await catalogCLI.remove(removeItemId, { force: values.force });
        break;
      case 'health-check':
        await catalogCLI.healthCheck();
        break;
      case 'sync':
        await catalogCLI.sync({ dryRun: values['dry-run'] });
        break;
      default:
        console.error(`Error: Unknown catalog command '${catalogCommand}'`);
        console.error('Available catalog commands: list, search, info, install, import, update, remove, health-check, sync');
        process.exit(1);
    }
    break;
  default:
    console.error(`Error: Unknown command '${command}'`);
    console.error("Run 'codeflow --help' for usage information");
    process.exit(1);
}

#!/usr/bin/env bun

import { parseArgs } from 'util';
import { status } from './status';
import { setup } from './setup';
import { convert } from './convert';
import { sync } from './sync';
import { startWatch } from './watch';
import { catalog } from './catalog.js';
import { discover } from './discover.js';
import { fixModels } from './fix-models.js';
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
codeflow - Intelligent AI workflow management and development automation

CodeFlow is a CLI built with Bun and TypeScript that manages agents and commands for AI-assisted development workflows.

Usage:
  codeflow <command> [options]

Commands:
  setup [project-path]       Set up codeflow directory structure and copy agents/commands
  status [project-path]      Check which files are up-to-date or outdated
  sync [project-path]        Synchronize agents and commands with global configuration
  fix-models [options]       Fix model configurations (default: global, use --local for project)
  convert <source> <target> <format>  Convert agents between formats
  watch start [options]      Start automatic file synchronization daemon
  catalog <subcommand>       Browse, search, and install catalog items
  discover [query]           Find agents by use case (e.g., "build API", "fix performance")

Catalog Subcommands:
  catalog list [type] [source] [--tags tag1,tag2]    List catalog items (filter by type/source/tags)
  catalog search <term> [--tags tag1,tag2]           Search catalog items by query
  catalog info <item-id>                             Show detailed information about an item
  catalog install <item-id> [--target claude-code,opencode] [--global] [--dry-run]
                                                     Install item to specified targets
  catalog install-all [--target claude-code,opencode] [--global] [--dry-run] [--source name]
                                                     Install all catalog items to specified targets
  catalog import <source> [--adapter name] [--filter patterns] [--dry-run]
                                                     Import items from external sources (GitHub repos, etc.)
  catalog update [item-ids]                          Update installed items to latest versions
  catalog remove <item-id>                           Remove an installed item
  catalog build [--force]                            Build or rebuild the catalog index
  catalog health-check                               Check catalog health and integrity
  catalog sync [--global] [--dry-run]                Sync catalog items to configured locations

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
  --local                   Fix models in current project (for fix-models command)

Examples:
  codeflow setup ~/my-project
  codeflow status .
  codeflow sync                        # Sync to project directories
  codeflow sync --global               # Sync to global directories (~/.claude, ~/.config/opencode)
  codeflow sync --global --dry-run     # Preview global sync changes
  codeflow fix-models                  # Fix model IDs globally
  codeflow fix-models --local          # Fix model IDs in current project
  codeflow convert ./codeflow-agents ./claude-agents claude-code
  codeflow watch start --global

  # Catalog commands:
  codeflow catalog list agent --tags "code-review,testing"  # List agents with specific tags
  codeflow catalog search "code review"                     # Search for code review items
  codeflow catalog info claude-templates/blog-writer        # Show item details
  codeflow catalog install claude-templates/blog-writer --target claude-code --global
  codeflow catalog install-all --global --dry-run          # Preview installing all items
  codeflow catalog import davila7/claude-code-templates     # Import from GitHub repo
  codeflow catalog import davila7/claude-code-templates --dry-run --adapter github
  codeflow catalog sync --global                            # Sync to global directories

DEVELOPMENT WORKFLOW:
  Use 'codeflow setup' to initialize agents and commands in your project, or use the catalog system:
    codeflow catalog install <item-id> --global    # Install specific agents/commands globally
    codeflow catalog install-all --global          # Install all available items globally
    codeflow catalog import <github-repo>          # Import from external catalogs

  Available slash commands (when using Claude Code or OpenCode):
    /research - Comprehensive codebase and documentation analysis
    /plan     - Creates detailed implementation plans from tickets and research
    /execute  - Implements plans with proper verification
    /test     - Generates comprehensive test suites for implemented features
    /document - Creates user guides, API docs, and technical documentation
    /commit   - Creates commits with structured messages
    /review   - Validates implementations against original plans
    /help     - Get detailed development guidance and workflow information

  Core Agent Types:
    codebase-locator        - Finds WHERE files and components exist
    codebase-analyzer       - Understands HOW specific code works
    codebase-pattern-finder - Discovers similar implementation patterns
    thoughts-locator        - Discovers existing documentation about topics
    thoughts-analyzer       - Extracts insights from specific documents
    web-search-researcher   - Performs targeted web research

  Workflow Philosophy:
    - Always run locator agents first, then analyzers
    - Use specialized domain agents for complex tasks
    - Emphasize context compression and fresh analysis

For more detailed guidance, use the /help slash command in Claude Code/OpenCode or see docs/README.md
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
  case 'fix-models':
    // For fix-models, default to global. Check if --local was passed
    const hasLocalFlag = Bun.argv.includes('--local') || Bun.argv.includes('-l');
    await fixModels({
      dryRun: values['dry-run'],
      verbose: values.help || false,
      global: !hasLocalFlag, // Default to global unless --local is specified
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
    const catalogSubcommand = args[1] || 'help';
    const catalogOptions: any = {
      type: values.type,
      source: args[2], // For import command, this is the repository URL
      tags: values.tags ? values.tags.split(',') : undefined,
      target: values.target ? values.target.split(',') : undefined,
      global: values.global,
      dryRun: values['dry-run'],
      force: values.force,
      query: args[2],
      id: args[2],
      adapter: values.adapter,
      filter: values.filter ? values.filter.split(',') : undefined,
      exclude: values.exclude ? values.exclude.split(',') : undefined,
    };
    await catalog(catalogSubcommand, catalogOptions);
    break;

  case 'discover':
    const discoverQuery = args[1];
    await discover(discoverQuery, {
      complexity: values.complexity,
      useCase: values['use-case'],
      domain: values.domain,
    });
    break;

  default:
    console.error(`Error: Unknown command '${command}'`);
    console.error("Run 'codeflow --help' for usage information");
    process.exit(1);
}

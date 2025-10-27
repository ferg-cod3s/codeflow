#!/usr/bin/env bun

import { parseArgs } from 'util';
import { status } from './status.js';
import { setup } from './setup.js';
import { convert } from './convert.js';
import { sync } from './sync.js';
import { startWatch } from './watch.js';

import { fixModels } from './fix-models.js';
import { validate } from './validate.js';
import { list } from './list.js';
import { info } from './info.js';
import { update } from './update.js';
import { clean } from './clean.js';
import { exportProject } from './export.js';
import { research } from './research.js';
import { buildManifest } from './build-manifest.js';
import packageJson from '../../package.json';
import { join, resolve, sep } from 'node:path';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';

const HELP_TEXT = `codeflow - Intelligent AI workflow management and development automation

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
   build-manifest [options]   Build or rebuild the agent manifest file

   validate [path]            Validate agents and commands for integrity issues
   list [path]                List installed agents and commands
   info <item-name> [path]    Show detailed information about an agent or command
   update                     Check for and install CLI updates
   clean [path]               Clean up cache, temp, and orphaned files
   export [path]              Export project setup to a file
   research "<query>" [options]  Execute deep research workflow for codebase analysis

Options:
  -f, --force               Force overwrite existing setup
  -t, --type <type>         Project type: claude-code, opencode, cursor, or all
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
  codeflow setup --type claude-code    # Setup for Claude Code only
  codeflow setup --type opencode       # Setup for OpenCode only  
  codeflow setup --type all            # Setup for all platforms
  codeflow status .
  codeflow sync                        # Sync to project directories
  codeflow sync --global               # Sync to global directories (~/.claude, ~/.config/opencode)
  codeflow sync --global --dry-run     # Preview global sync changes
  codeflow fix-models                  # Fix model IDs globally
  codeflow fix-models --local          # Fix model IDs in current project
  codeflow convert ./codeflow-agents ./claude-agents claude-code
  codeflow watch start --global
  codeflow list                        # List all available agents and commands
  codeflow list --type agents          # List only agents
  codeflow list --platform claude-code # List Claude Code items only

SETUP OPTIONS:
  Use 'codeflow setup' to initialize agents and commands in your project
  
  Platform Types:
    claude-code    - Setup for Claude Code (.claude/ directory)
    opencode       - Setup for OpenCode (.opencode/ directory)  
    cursor         - Setup for Cursor (.cursor/ directory)
    all (default)  - Setup for all platforms
  
  Global vs Project:
    --global       - Install to global directories (~/.claude, ~/.config/opencode)
    (no flag)      - Install to project directory

AVAILABLE COMMANDS (25 total):
  /audit        - Audit codebase for issues and improvements
  /benchmark    - Performance benchmarking and analysis
  /code-review  - Comprehensive code review and analysis
  /commit       - Create structured git commits
  /continue     - Resume execution from last step
  /debug        - Debug and troubleshoot issues
  /deploy       - Deploy applications and infrastructure
  /document     - Create documentation and guides
  /env-setup    - Set up development environments
  /execute      - Implement plans with verification
  /help         - Get development guidance and workflow info
  /impact-analysis - Analyze impact of changes
  /migrate      - Migrate code and configurations
  /monitor      - Set up monitoring and observability
  /plan         - Create detailed implementation plans
  /project-docs - Generate complete project documentation
  /refactor     - Refactor and improve code structure
  /research     - Comprehensive codebase analysis
  /review       - Validate implementations against plans
  /security-scan - Security vulnerability scanning
  /test         - Generate and run test suites
  /ticket       - Work with tickets and issues

CORE AGENT TYPES (135 total):
  Research & Analysis:
    codebase-locator        - Finds WHERE files and components exist
    codebase-analyzer       - Understands HOW specific code works
    codebase-pattern-finder - Discovers similar implementation patterns
    research-locator        - Finds existing documentation and decisions
    research-analyzer       - Extracts insights from specific documents
    web-search-researcher   - Performs targeted web research

  Development & Engineering:
    full-stack-developer    - Cross-functional development
    api-builder            - API design and implementation
    database-expert        - Database optimization and design
    security-scanner       - Vulnerability assessment
    ux-optimizer          - User experience optimization
    frontend-developer     - React/Next.js/UI development
    backend-architect     - System design and architecture

  Specialized Domains:
    ai-engineer           - LLM applications and AI integration
    cloud-architect       - Multi-cloud infrastructure design
    devops-operations-specialist - Operations and deployment
    quality-testing-performance-tester - Performance testing
    ml-engineer          - Machine learning systems
    blockchain-developer  - Web3 and smart contracts

  Meta & Orchestration:
    smart-subagent-orchestrator - Complex multi-agent workflows
    agent-architect       - Create custom agents
    system-architect      - System design and architecture

Workflow Philosophy:
  - Always run locator agents first, then analyzers
  - Use specialized domain agents for complex tasks
  - Emphasize context compression and fresh analysis

For more detailed guidance:
  - Use 'codeflow list' to see all available agents and commands
  - Use 'codeflow info <name>' to get details about specific items
  - See docs/README.md for comprehensive documentation`;

/**
 * Safely resolve and validate paths to prevent directory traversal attacks
 */
function safeResolve(base: string, candidate: string, allowedRoots: string[] = []): string {
  if (candidate.includes('..')) {
    throw new Error(`Path traversal detected: ${candidate} contains ".."`);
  }
  const resolved = join(base, candidate);
  const normalized = resolve(resolved);

  // Check if the normalized path is within allowed roots
  const isAllowed =
    allowedRoots.length === 0 ||
    allowedRoots.some((root) => {
      const rootNormalized = resolve(root);
      return normalized.startsWith(rootNormalized + sep) || normalized === rootNormalized;
    });

  if (!isAllowed) {
    throw new Error(
      'Path traversal detected: ' + candidate + ' resolves outside allowed directories'
    );
  }

  return normalized;
}

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
    case 'claude-code': {
      // For projects, use .claude/agents if it exists, otherwise use global
      const projectClaudeDir = join(projectPath, '.claude', 'agents');
      return existsSync(projectClaudeDir) ? projectClaudeDir : join(codeflowRoot, 'claude-agents');
    }
    case 'opencode': {
      // For projects, use .opencode/agent if it exists, otherwise use global
      const projectOpenCodeDir = join(projectPath, '.opencode', 'agent');
      return existsSync(projectOpenCodeDir)
        ? projectOpenCodeDir
        : join(codeflowRoot, 'opencode-agents');
    }
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
      output: {
        type: 'string',
        short: 'o',
      },
      'include-web': {
        type: 'boolean',
        default: false,
      },
      specialists: {
        type: 'string',
      },
      verbose: {
        type: 'boolean',
        short: 'v',
        default: false,
      },
      'min-quality': {
        type: 'string',
      },
      platform: {
        type: 'string',
      },
      format: {
        type: 'string',
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
  console.log(HELP_TEXT);
  process.exit(0);
}

switch (command) {
  case 'setup': {
    const setupPath = args[1];
    const safeSetupPath = safeResolve(process.cwd(), setupPath || '.', [process.cwd(), homedir()]);
    await setup(safeSetupPath, {
      global: values.global,
      force: values.force,
      type: values.type,
    });
    break;
  }
  case 'status': {
    const statusPath = args[1];
    const safeStatusPath = safeResolve(process.cwd(), statusPath || '.', [
      process.cwd(),
      homedir(),
    ]);
    await status(safeStatusPath);
    break;
  }
  case 'sync': {
    const syncPath = args[1];
    const safeSyncPath = safeResolve(process.cwd(), syncPath || '.', [process.cwd(), homedir()]);
    await sync(safeSyncPath, {
      global: values.global,
      force: values.force,
      dryRun: values['dry-run'],
      verbose: true,
    });
    break;
  }
  case 'fix-models': {
    // For fix-models, default to global. Check if --local was passed
    const hasLocalFlag = Bun.argv.includes('--local') || Bun.argv.includes('-l');
    await fixModels({
      dryRun: values['dry-run'],
      verbose: values.help || false,
      global: !hasLocalFlag, // Default to global unless --local is specified
    });
    break;
  }
  case 'convert': {
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
  }
  case 'watch': {
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
  }

  case 'validate': {
    await validate({
      format: values.format || 'all',
      path: args[1],
      checkDuplicates: values['check-duplicates'],
      canonicalCheck: values['canonical-check'],
      fix: values.fix,
      verbose: values.verbose,
    });
    break;
  }

  case 'list': {
    const listPath = args[1];
    const safeListPath = safeResolve(process.cwd(), listPath || '.', [process.cwd(), homedir()]);
    await list(safeListPath, {
      type: values.type || 'all',
      platform: values.platform || 'all',
      format: values.format || 'table',
      verbose: values.verbose,
    });
    break;
  }

  case 'info': {
    const itemName = args[1];
    if (!itemName) {
      console.error('Error: info requires an item name');
      console.error('Usage: codeflow info <item-name>');
      process.exit(1);
    }
    const infoPath = args[2];
    const safeInfoPath = safeResolve(process.cwd(), infoPath || '.', [process.cwd(), homedir()]);
    await info(itemName, safeInfoPath, {
      format: values.format || 'detailed',
      showContent: values['show-content'],
    });
    break;
  }

  case 'update': {
    const updateAction = args[1];
    await update({
      check: updateAction === 'check' || values.check,
      force: values.force,
      verbose: values.verbose,
    });
    break;
  }

  case 'clean': {
    const cleanPath = args[1];
    const safeCleanPath = safeResolve(process.cwd(), cleanPath || '.', [process.cwd(), homedir()]);
    await clean(safeCleanPath, {
      dryRun: values['dry-run'],
      force: values.force,
      verbose: values.verbose,
      type: values.type || 'all',
    });
    break;
  }

  case 'export': {
    const exportPath = args[1];
    const safeExportPath = safeResolve(process.cwd(), exportPath || '.', [
      process.cwd(),
      homedir(),
    ]);
    await exportProject(safeExportPath, {
      format: values.format || 'json',
      output: values.output,
      includeContent: values['include-content'],
      verbose: values.verbose,
    });
    break;
  }

  case 'research': {
    const researchQuery = args[1];
    await research({
      query: researchQuery,
      output: values.output,
      'include-web': values['include-web'],
      specialists: values.specialists,
      verbose: values.verbose,
      'min-quality': values['min-quality'],
    });
    break;
  }

  case 'build-manifest': {
    await buildManifest({
      output: values.output,
      dryRun: values['dry-run'],
      verbose: values.verbose,
      projectRoot: values.project || process.cwd(),
    });
    break;
  }

  default:
    console.error(`Error: Unknown command '${command}'`);
    console.error("Run 'codeflow --help' for usage information");
    process.exit(1);
}

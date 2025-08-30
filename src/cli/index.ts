#!/usr/bin/env bun

import { parseArgs } from "util";
import { pull } from "./pull";
import { status } from "./status";
import { setup } from "./setup";
import { mcpServer, mcpConfigure, mcpList } from "./mcp";
import { convert, convertAll, listDifferences } from "./convert";
import { syncGlobalAgents } from "./sync";
import { syncAllFormats, showFormatDifferences } from "./sync-formats";
import { startWatch, stopWatch, watchStatus, watchLogs, restartWatch } from "./watch";
import packageJson from "../../package.json";
import { join } from "node:path";
import { existsSync } from "node:fs";

/**
 * Helper function to determine directory path for agent format
 */
function getFormatDirectory(format: 'base' | 'claude-code' | 'opencode', projectPath: string): string {
  const codeflowRoot = join(import.meta.dir, "../..");
  
  switch (format) {
    case 'base':
      // Base format refers to the global codeflow agent directory
      return join(codeflowRoot, "agent");
    case 'claude-code': {
      // For projects, use .claude/agents if it exists, otherwise use global
      const projectClaudeDir = join(projectPath, '.claude', 'agents');
      return existsSync(projectClaudeDir) ? projectClaudeDir : join(codeflowRoot, "claude-agents");
    }
    case 'opencode': {
      // For projects, use .opencode/agent if it exists, otherwise use global  
      const projectOpenCodeDir = join(projectPath, '.opencode', 'agent');
      return existsSync(projectOpenCodeDir) ? projectOpenCodeDir : join(codeflowRoot, "opencode-agents");
    }
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

/**
 * Helper function to determine source of truth format
 */
function determineSourceOfTruth(sourceOfTruthFlag?: string): 'base' | 'claude-code' | 'opencode' | 'auto' {
  if (!sourceOfTruthFlag) return 'auto';
  
  const validFormats = ['base', 'claude-code', 'opencode', 'auto'];
  if (!validFormats.includes(sourceOfTruthFlag)) {
    console.error(`❌ Invalid source-of-truth value: ${sourceOfTruthFlag}`);
    console.error(`Valid values: ${validFormats.join(', ')}`);
    process.exit(1);
  }
  
  return sourceOfTruthFlag as 'base' | 'claude-code' | 'opencode' | 'auto';
}

let values: any;
let positionals: string[];

try {
  const parsed = parseArgs({
    args: Bun.argv,
    options: {
      help: {
        type: "boolean",
        short: "h",
        default: false,
      },
      version: {
        type: "boolean",
        default: false,
      },
      force: {
        type: "boolean",
        short: "f",
        default: false,
      },
      type: {
        type: "string",
        short: "t",
      },
      background: {
        type: "boolean",
        short: "b",
        default: false,
      },
      remove: {
        type: "boolean",
        short: "r",
        default: false,
      },
      validate: {
        type: "boolean",
        default: true,
      },
      "dry-run": {
        type: "boolean",
        default: false,
      },
      "source-of-truth": {
        type: "string",
        short: "T",
      },
      global: {
        type: "boolean",
        short: "g",
        default: false,
      },
      projects: {
        type: "string",
        short: "p",
      },
      "auto-convert": {
        type: "boolean",
        default: true,
      },
      "health-check": {
        type: "string",
        default: "15",
      },
      follow: {
        type: "boolean",
        default: false,
      },
      lines: {
        type: "string",
        default: "50",
      },
      clear: {
        type: "boolean",
        default: false,
      },
      json: {
        type: "boolean",
        default: false,
      },
      project: {
        type: "string",
      },
      source: {
        type: "string",
      },
      target: {
        type: "string",
      },
    },
    strict: true,
    allowPositionals: true,
  });
  values = parsed.values;
  positionals = parsed.positionals;
} catch (error: any) {
  if (error.code === "ERR_PARSE_ARGS_UNKNOWN_OPTION") {
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
if (values.help || command === "help" || !command) {
  console.log(`
codeflow - Intelligent AI workflow management

Usage:
  codeflow <command> [options]

Project Setup:
  setup [project-path]       Smart setup for Claude Code or MCP integration
  pull [project-path]        Pull agents and commands to existing .opencode directory
  status [project-path]      Check which files are up-to-date or outdated

Agent Management:
  convert <source> <target> <format>  Convert agents between formats
  convert-all                Convert all agent formats in project
  sync-formats               Ensure all formats have the same agents
  sync-global                Sync agents to global directories
  list-differences          Show differences between agent formats
  show-format-differences   Detailed format difference analysis

MCP Server:
  mcp start                  Start MCP server for current project
  mcp start --background     Start MCP server in background
  mcp stop                   Stop background MCP server
  mcp restart                Restart MCP server (picks up updated agents)
  mcp status                 Check MCP server status
  mcp configure <client>     Configure MCP client (claude-desktop, warp, cursor)
  mcp list                   List available MCP tools and usage

File Watching:
  watch start [options]      Start automatic file synchronization daemon
  watch stop                 Stop file watching daemon
  watch status               Show daemon status and activity
  watch logs [options]       View daemon logs
  watch restart [options]    Restart the daemon

Information:
  commands                   List available slash commands
  version                    Show the version of codeflow
  help                       Show this help message

Global:
  global setup               Initialize global agent/command directories (respects CODEFLOW_GLOBAL_CONFIG)

Setup Options:
  -f, --force               Force overwrite existing setup
  -t, --type <type>         Project type: claude-code (Claude.ai), opencode, general (both)

Conversion Options:
  --validate                Validate agents during conversion (default: true)
  --dry-run                 Show what would be converted without writing files
  --source <format>         Source format for project-scoped conversion (base|claude-code|opencode)
  --target <format>         Target format for project-scoped conversion (base|claude-code|opencode)
  --project <path>          Project directory for flag-based conversion
  -T, --source-of-truth <format>   Which format to use as authoritative source (base|claude-code|opencode|auto)

MCP Options:
  -b, --background          Run MCP server in background
  -r, --remove              Remove MCP client configuration

Watch Options:
  -g, --global              Watch global directories
  -p, --projects <paths>    Comma-separated project directories to watch
  --auto-convert            Enable automatic format conversion (default: true)
  --health-check <minutes>  Health check interval in minutes (default: 15)
  --follow                  Follow logs in real-time
  --lines <count>           Number of log lines to show (default: 50)
  --clear                   Clear log file
  --json                    Output status in JSON format

Examples:
  # Smart project setup (detects Claude Code vs MCP needs)
  codeflow setup ~/my-project
  
  # Force setup for specific type
  codeflow setup . --type claude-code    # For Claude.ai (slash commands)
  codeflow setup . --type opencode       # For OpenCode (commands)
  
  # Convert agents between formats
  codeflow convert ./agent ./claude-agents claude-code
  codeflow convert-all --dry-run
  
  # Sync agents across formats
  codeflow sync-formats --dry-run
  codeflow sync-global
  codeflow sync-global -T claude-code
  
  # Start MCP server for current project
  codeflow mcp start
  
  # Configure Claude Desktop for MCP
  codeflow mcp configure claude-desktop
  
  # Restart MCP server after updating agents
  codeflow sync-global && codeflow mcp restart
  
  # Start file watching with global sync
  codeflow watch start --global
  
  # Watch specific projects
  codeflow watch start --projects ~/project1,~/project2
  
  # Project sync
  codeflow sync --project ~/my-project
  
  # View daemon status and logs
  codeflow watch status
  codeflow watch logs --follow
`);
  process.exit(0);
}

switch (command) {
  case "setup": {
    const setupPath = args[1];
    await setup(setupPath, { force: values.force, type: values.type });
    break;
  }
  case "pull": {
    const projectPath = args[1];
    await pull(projectPath);
    break;
  }
  case "status": {
    const statusPath = args[1];
    await status(statusPath);
    break;
  }
  case "mcp": {
    const mcpAction = args[1];
    if (!mcpAction) {
      await mcpList();
      break;
    }
    
    switch (mcpAction) {
      case "start":
        await mcpServer("start", { background: values.background });
        break;
      case "stop":
        await mcpServer("stop");
        break;
      case "restart":
        await mcpServer("restart", { background: values.background });
        break;
      case "status":
        await mcpServer("status");
        break;
      case "configure": {
        const client = args[2];
        if (!client) {
          console.error("Error: MCP client name required");
          console.error("Usage: codeflow mcp configure <client>");
          console.error("Available clients: claude-desktop, warp, cursor");
          console.error("\nNote: Some platforms use different setups:");
          console.error("  • Claude.ai: Use 'codeflow setup . --type claude-code'");
          console.error("  • OpenCode: Use 'codeflow setup . --type opencode'");
          process.exit(1);
        }
        await mcpConfigure(client, { remove: values.remove });
        break;
      }
      case "list":
        await mcpList();
        break;
      default:
        console.error(`Error: Unknown MCP action '${mcpAction}'`);
        console.error("Available actions: start, stop, restart, status, configure, list");
        process.exit(1);
    }
    break;
  }
  case "commands": {
    const { commands } = await import("./commands");
    await commands();
    break;
  }
  case "convert": {
    // Support flag-based usage: --source, --target, --project
    if (values.source && values.target) {
      const { convert } = await import("./convert");
      const projectPath = values.project || process.cwd();
      
      // Determine source and target directories based on format and project
      const sourceFormat = values.source as 'base' | 'claude-code' | 'opencode';
      const targetFormat = values.target as 'base' | 'claude-code' | 'opencode';
      
      const sourceDir = getFormatDirectory(sourceFormat, projectPath);
      const targetDir = getFormatDirectory(targetFormat, projectPath);
      
      await convert({
        source: sourceDir,
        target: targetDir,
        format: targetFormat,
        validate: values.validate !== false,
        dryRun: values["dry-run"]
      });
      break;
    }

    const source = args[1];
    const target = args[2];
    const format = args[3] as 'base' | 'claude-code' | 'opencode';
    
    if (!source || !target || !format) {
      console.error("Error: convert requires source, target, and format arguments");
      console.error("Usage: codeflow convert <source> <target> <format>");
      console.error("Formats: base, claude-code, opencode");
      process.exit(1);
    }
    
    if (!['base', 'claude-code', 'opencode'].includes(format)) {
      console.error(`Error: Invalid format '${format}'`);
      console.error("Valid formats: base, claude-code, opencode");
      process.exit(1);
    }
    
    await convert({
      source,
      target,
      format,
      validate: values.validate !== false,
      dryRun: values["dry-run"]
    });
    break;
  }
  case "convert-all": {
    await convertAll(args[1], {
      validate: values.validate !== false,
      dryRun: values["dry-run"]
    });
    break;
  }
  case "list-differences": {
    await listDifferences(args[1]);
    break;
  }
  case "sync": {
    if (values.project) {
      const { syncGlobalAgents } = await import("./sync");
      const { existsSync } = await import("node:fs");
      const { resolve } = await import("node:path");
      
      const projectPath = resolve(values.project);
      console.log(`🔄 Synchronizing project: ${projectPath}`);
      
      // Verify project path exists
      if (!existsSync(projectPath)) {
        console.error(`❌ Project path does not exist: ${projectPath}`);
        process.exit(1);
      }
      
      // Determine source of truth for sync operation
      const sourceOfTruth = determineSourceOfTruth(values["source-of-truth"]);
      
      // Sync project agents to global directories
      await syncGlobalAgents({
        validate: values.validate !== false,
        dryRun: values["dry-run"],
        sourceOfTruth: sourceOfTruth
      });
      console.log("✅ Synchronization complete");
      break;
    }
    console.log("Usage: codeflow sync --project <path>");
    process.exit(0);
    break;
  }
  case "sync-formats": {
    const direction = args[1] as 'to-all' | 'from-opencode' | 'bidirectional' | undefined;
    await syncAllFormats({
      validate: values.validate !== false,
      dryRun: values["dry-run"],
      direction: direction || 'from-opencode'
    });
    break;
  }
  case "sync-global": {
    await syncGlobalAgents({
      validate: values.validate !== false,
      dryRun: values["dry-run"],
      sourceOfTruth: determineSourceOfTruth(values["source-of-truth"])
    });
    break;
  }
  case "show-format-differences": {
    await showFormatDifferences();
    break;
  }
  case "global":
    {
      const action = args[1];
      if (action === "setup") {
        const { setupGlobalAgents } = await import("./global");
        await setupGlobalAgents(process.env.CODEFLOW_GLOBAL_CONFIG || undefined);
        break;
      }
      console.error("Usage: codeflow global setup");
      process.exit(1);
    }
    break;
  case "watch": {
    const watchAction = args[1];
    const codeflowRoot = import.meta.dir + "/../.."; // Get codeflow root directory
    
    if (!watchAction) {
      console.error("Error: watch action required");
      console.error("Usage: codeflow watch <action>");
      console.error("Available actions: start, stop, status, logs, restart");
      process.exit(1);
    }
    
    switch (watchAction) {
      case "start":
        await startWatch(codeflowRoot, {
          global: values.global,
          projects: values.projects,
          autoConvert: values["auto-convert"],
          healthCheck: parseInt(values["health-check"]),
          background: !values.foreground // Default to background unless --foreground specified
        });
        break;
      case "stop":
        await stopWatch();
        break;
      case "status":
        await watchStatus({
          json: values.json
        });
        break;
      case "logs":
        await watchLogs({
          follow: values.follow,
          lines: parseInt(values.lines),
          clear: values.clear
        });
        break;
      case "restart":
        await restartWatch(codeflowRoot, {
          global: values.global,
          projects: values.projects,
          autoConvert: values["auto-convert"],
          healthCheck: parseInt(values["health-check"])
        });
        break;
      default:
        console.error(`Error: Unknown watch action '${watchAction}'`);
        console.error("Available actions: start, stop, status, logs, restart");
        process.exit(1);
    }
    break;
  }
  case "version": {
    console.log(`Codeflow ${packageJson.version}`);
    break;
  }
  case "help": {
    // Already handled above, but included for completeness
    break;
  }
  default:
    console.error(`Error: Unknown command '${command}'`);
    console.error("Run 'codeflow --help' for usage information");
    process.exit(1);
}
#!/usr/bin/env bun

import { parseArgs } from "util";
import { pull } from "./pull";
import { status } from "./status";
import { setup } from "./setup";
import { mcpServer, mcpConfigure, mcpList } from "./mcp";
import packageJson from "../../package.json";

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

MCP Server:
  mcp start                  Start MCP server for current project
  mcp start --background     Start MCP server in background
  mcp stop                   Stop background MCP server  
  mcp status                 Check MCP server status
  mcp configure <client>     Configure MCP client (claude-desktop)
  mcp list                   List available MCP tools and usage

Information:
  commands                   List available slash commands
  version                    Show the version of codeflow
  help                       Show this help message

Setup Options:
  -f, --force               Force overwrite existing setup
  -t, --type <type>         Specify project type (claude-code, opencode, general)

MCP Options:
  -b, --background          Run MCP server in background
  -r, --remove              Remove MCP client configuration

Examples:
  # Smart project setup (detects Claude Code vs MCP needs)
  codeflow setup ~/my-project
  
  # Force setup for specific type
  codeflow setup . --type claude-code
  
  # Start MCP server for current project
  codeflow mcp start
  
  # Configure Claude Desktop for MCP
  codeflow mcp configure claude-desktop
`);
  process.exit(0);
}

switch (command) {
  case "setup":
    const setupPath = args[1];
    await setup(setupPath, { force: values.force, type: values.type });
    break;
  case "pull":
    const projectPath = args[1];
    await pull(projectPath);
    break;
  case "status":
    const statusPath = args[1];
    await status(statusPath);
    break;
  case "mcp":
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
      case "status":
        await mcpServer("status");
        break;
      case "configure":
        const client = args[2];
        if (!client) {
          console.error("Error: MCP client name required");
          console.error("Usage: codeflow mcp configure <client>");
          console.error("Available clients: claude-desktop");
          process.exit(1);
        }
        await mcpConfigure(client, { remove: values.remove });
        break;
      case "list":
        await mcpList();
        break;
      default:
        console.error(`Error: Unknown MCP action '${mcpAction}'`);
        console.error("Available actions: start, stop, status, configure, list");
        process.exit(1);
    }
    break;
  case "commands":
    const { commands } = await import("./commands");
    await commands();
    break;
  case "version":
    console.log(`Codeflow ${packageJson.version}`);
    break;
  case "help":
    // Already handled above, but included for completeness
    break;
  default:
    console.error(`Error: Unknown command '${command}'`);
    console.error("Run 'codeflow --help' for usage information");
    process.exit(1);
}
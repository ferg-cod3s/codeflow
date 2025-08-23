#!/usr/bin/env bun

import { parseArgs } from "util";
import { pull } from "./pull";
import { status } from "./status";
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
    },
    strict: true,
    allowPositionals: true,
  });
  values = parsed.values;
  positionals = parsed.positionals;
} catch (error: any) {
  if (error.code === "ERR_PARSE_ARGS_UNKNOWN_OPTION") {
    console.error(`Error: ${error.message}`);
    console.error("Run 'agentic --help' for usage information");
    process.exit(1);
  }
  throw error;
}

// Remove the first two positionals (bun and script path)
const args = positionals.slice(2);
const command = args[0];

// Handle --version flag
if (values.version) {
  console.log(`Agentic ${packageJson.version}`);
  process.exit(0);
}

// Handle help (both --help flag and help command)
if (values.help || command === "help" || !command) {
  console.log(`
agentic - Manage opencode agents and commands

Usage:
  agentic <command> [options]

Commands:
  pull [project-path]    Pull agents and commands to a project's .opencode directory
  status [project-path]  Check which files are up-to-date or outdated
  version                Show the version of agentic
  help                   Show this help message

Options:
  -h, --help          Show this help message
  --version           Show the version of agentic

Examples:
  agentic pull ~/projects/my-app
  agentic pull                       # Auto-detect project from current dir
  agentic status ~/projects/my-app
  agentic status                     # Auto-detect project from current dir
`);
  process.exit(0);
}

switch (command) {
  case "pull":
    const projectPath = args[1];
    await pull(projectPath);
    break;
  case "status":
    const statusPath = args[1];
    await status(statusPath);
    break;
  case "version":
    console.log(`Agentic ${packageJson.version}`);
    break;
  case "help":
    // Already handled above, but included for completeness
    break;
  default:
    console.error(`Error: Unknown command '${command}'`);
    console.error("Run 'agentic --help' for usage information");
    process.exit(1);
}
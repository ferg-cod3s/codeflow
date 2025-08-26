#!/usr/bin/env bun

import { parseArgs } from "util";
import { pull } from "./pull";
import { status } from "./status";
import { metadata } from "./metadata";
import { init } from "./init";
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
      global: {
        type: "boolean",
        short: "g",
        default: false,
      },
      "thoughts-dir": {
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
  init [project-path]    Initialize agentic in a project with config and thoughts directory
  pull [project-path]    Pull agents and commands to a project's .opencode directory
  status [project-path]  Check which files are up-to-date or outdated
  metadata               Display project metadata for research documentation
  version                Show the version of agentic
  help                   Show this help message

Options:
  -h, --help          Show this help message
  -g, --global        Use ~/.config/opencode instead of .opencode directory
  --version           Show the version of agentic
  --thoughts-dir      Specify thoughts directory (for init command)

Examples:
  agentic init                       # Initialize in current directory
  agentic init ~/projects/my-app     # Initialize in specific project
  agentic pull ~/projects/my-app
  agentic pull                       # Auto-detect project from current dir
  agentic pull -g                    # Pull to ~/.config/opencode
  agentic status ~/projects/my-app
  agentic status                     # Auto-detect project from current dir
  agentic status -g                  # Check status of ~/.config/opencode
  agentic metadata                   # Display project metadata
`);
  process.exit(0);
}

switch (command) {
  case "init":
    const initPath = args[1];
    await init(initPath, values["thoughts-dir"]);
    break;
  case "pull":
    const projectPath = args[1];
    if (values.global && projectPath) {
      console.error("Error: Cannot use --global flag with a project path");
      process.exit(1);
    }
    await pull(projectPath, values.global);
    break;
  case "status":
    const statusPath = args[1];
    if (values.global && statusPath) {
      console.error("Error: Cannot use --global flag with a project path");
      process.exit(1);
    }
    await status(statusPath, values.global);
    break;
  case "metadata":
    await metadata();
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
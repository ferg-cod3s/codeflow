import fs from "fs";
import { YamlProcessor } from '../yaml/yaml-processor.js';
import { CommandValidator, ValidationWarning, ValidationError } from '../yaml/command-validator.js';
import path from "path";
import { fileURLToPath } from "url";
import CLIErrorHandler from "./error-handler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SlashCommand {
  name: string;
  description: string;
  platform: "Claude Code" | "OpenCode";
  agent?: string;
  model?: string;
}

interface LoadCommandsResult {
  commands: SlashCommand[];
  warnings: ValidationWarning[];
  errors: ValidationError[];
}

async function processCommandDirectory(
  dirPath: string,
  platform: "Claude Code" | "OpenCode",
  format: "claude-code" | "opencode",
  commands: SlashCommand[],
  warnings: ValidationWarning[],
  errors: ValidationError[]
): Promise<void> {
  if (!fs.existsSync(dirPath)) return;

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
  const validator = new CommandValidator();
  const processor = new YamlProcessor();

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parseResult = processor.parse(content);
      if (!parseResult.success) {
        errors.push({
          file: filePath,
          message: `YAML parsing failed: ${parseResult.error.message}`,
          code: 'YAML_PARSE_ERROR',
          severity: 'error',
        });
        continue;
      }
      const { frontmatter } = parseResult.data;
      if (!frontmatter || frontmatter.mode !== 'command') {
        errors.push({
          file: filePath,
          message: 'Command file must have mode: "command"',
          code: 'INVALID_MODE',
          severity: 'error',
        });
        continue;
      }
      const validationResult = await validator.validateFile(filePath, format);
      if (!validationResult.valid) {
        errors.push(...validationResult.errors);
        continue;
      }
      warnings.push(...validationResult.warnings);
      commands.push({
        name: path.basename(file, '.md'),
        description: frontmatter.description || 'No description available',
        platform,
        agent: frontmatter.agent,
        model: frontmatter.model,
      });
    } catch (error: any) {
      errors.push({
        file: filePath,
        message: `Failed to process command file: ${error.message}`,
        code: 'FILE_PROCESS_ERROR',
        severity: 'error',
      });
    }
  }
}

async function loadSlashCommands(): Promise<LoadCommandsResult> {
  const commands: SlashCommand[] = [];
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];
  const codeflowRoot = path.resolve(__dirname, "../..");
  const currentDir = process.cwd();

  // First, try to load commands from current working directory (project-specific)
  const projectClaudeCommandsPath = path.join(currentDir, ".claude", "commands");
  const projectOpencodeCommandsPath = path.join(currentDir, ".opencode", "command");

  // Load Claude Code commands from current project
  await processCommandDirectory(projectClaudeCommandsPath, "Claude Code", "claude-code", commands, warnings, errors);

  // Load OpenCode commands from current project
  await processCommandDirectory(projectOpencodeCommandsPath, "OpenCode", "opencode", commands, warnings, errors);

  // If no project-specific commands found, fall back to global codeflow commands
  if (commands.length === 0) {
    // Load Claude Code commands from global
    const claudeCommandsPath = path.join(codeflowRoot, ".claude", "commands");
    await processCommandDirectory(claudeCommandsPath, "Claude Code", "claude-code", commands, warnings, errors);

    // Load OpenCode commands from global
    const opencodeCommandsPath = path.join(codeflowRoot, ".opencode", "command");
    await processCommandDirectory(opencodeCommandsPath, "OpenCode", "opencode", commands, warnings, errors);
  }

  return { commands, warnings, errors };
}

export async function commands(): Promise<void> {
  try {
    const result = await loadSlashCommands();
    const { commands, warnings, errors } = result;

    if (commands.length === 0) {
      CLIErrorHandler.displayWarning(
        "No slash commands found",
        [
          "Run 'codeflow pull' to install agents and commands to a project",
          "Check if you're in a valid project directory"
        ]
      );
      return;
    }

    console.log("\n📋 Available Slash Commands\n");

    // Group by platform
    const claudeCommands = commands.filter(c => c.platform === "Claude Code");
    const opencodeCommands = commands.filter(c => c.platform === "OpenCode");

    if (claudeCommands.length > 0) {
      console.log("🔵 Claude Code Commands (.claude/commands/):");
      claudeCommands.forEach(cmd => {
        console.log(`  /${cmd.name}`);
        console.log(`    ${cmd.description}`);
        if (cmd.model) {
          console.log(`    Model: ${cmd.model}`);
        }
        console.log();
      });
    }

    if (opencodeCommands.length > 0) {
      console.log("🟠 OpenCode Commands (.opencode/command/):");
      opencodeCommands.forEach(cmd => {
        console.log(`  /${cmd.name}`);
        console.log(`    ${cmd.description}`);
        if (cmd.agent) {
          console.log(`    Agent: ${cmd.agent}`);
        }
        if (cmd.model) {
          console.log(`    Model: ${cmd.model}`);
        }
        console.log();
      });
    }

    // Print warnings
    if (warnings.length > 0) {
      console.log("⚠️  Warnings:");
      const maxWarnings = 10;
      warnings.slice(0, maxWarnings).forEach(warning => {
        console.log(`  ${warning.file}: ${warning.message}`);
      });
      if (warnings.length > maxWarnings) {
        console.log(`  ... and ${warnings.length - maxWarnings} more warnings`);
      }
      console.log();
    }

    // Print errors summary
    if (errors.length > 0) {
      console.log("❌ Excluded (Errors):");
      const errorSummary = errors.reduce((acc, error) => {
        acc[error.file] = (acc[error.file] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      Object.entries(errorSummary).forEach(([file, count]) => {
        console.log(`  ${file}: ${count} error(s)`);
      });
      console.log("💡 Run 'codeflow validate' for detailed error information.\n");
    }

    console.log("💡 Usage:");
    console.log("  Claude Code: Type '/<command>' in Claude Code interface");
    console.log("  OpenCode: Type '/<command>' in OpenCode interface");
    console.log("\n🚀 To install these commands to a project:");
    console.log("  codeflow pull [project-path]");

  } catch (error) {
    CLIErrorHandler.handleCommonError(error, "commands");
    return;
  }
}

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import YAML from "yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SlashCommand {
  name: string;
  description: string;
  platform: "Claude Code" | "OpenCode";
  agent?: string;
  model?: string;
}

function parseMarkdownFrontmatter(content: string): { [key: string]: any } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);

  if (!match) return {};

  try {
    return YAML.parse(match[1]);
  } catch (error) {
    console.error("Error parsing YAML frontmatter:", error);
    return {};
  }
}

function loadSlashCommands(): SlashCommand[] {
  const commands: SlashCommand[] = [];
  const codeflowRoot = path.resolve(__dirname, "../..");
  const currentDir = process.cwd();

  // First, try to load commands from current working directory (project-specific)
  const projectClaudeCommandsPath = path.join(currentDir, ".claude", "commands");
  const projectOpencodeCommandsPath = path.join(currentDir, ".opencode", "command");

  // Load Claude Code commands from current project
  if (fs.existsSync(projectClaudeCommandsPath)) {
    const files = fs.readdirSync(projectClaudeCommandsPath).filter(f => f.endsWith('.md'));

    for (const file of files) {
      const filePath = path.join(projectClaudeCommandsPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const frontmatter = parseMarkdownFrontmatter(content);

      commands.push({
        name: path.basename(file, '.md'),
        description: frontmatter.description || 'No description available',
        platform: "Claude Code",
        model: frontmatter.model
      });
    }
  }

  // Load OpenCode commands from current project
  if (fs.existsSync(projectOpencodeCommandsPath)) {
    const files = fs.readdirSync(projectOpencodeCommandsPath).filter(f => f.endsWith('.md'));

    for (const file of files) {
      const filePath = path.join(projectOpencodeCommandsPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const frontmatter = parseMarkdownFrontmatter(content);

      commands.push({
        name: path.basename(file, '.md'),
        description: frontmatter.description || 'No description available',
        platform: "OpenCode",
        agent: frontmatter.agent,
        model: frontmatter.model
      });
    }
  }

  // If no project-specific commands found, fall back to global codeflow commands
  if (commands.length === 0) {
    // Load Claude Code commands from global
    const claudeCommandsPath = path.join(codeflowRoot, ".claude", "commands");
    if (fs.existsSync(claudeCommandsPath)) {
      const files = fs.readdirSync(claudeCommandsPath).filter(f => f.endsWith('.md'));

      for (const file of files) {
        const filePath = path.join(claudeCommandsPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const frontmatter = parseMarkdownFrontmatter(content);

        commands.push({
          name: path.basename(file, '.md'),
          description: frontmatter.description || 'No description available',
          platform: "Claude Code",
          model: frontmatter.model
        });
      }
    }

    // Load OpenCode commands from global
    const opencodeCommandsPath = path.join(codeflowRoot, ".opencode", "command");
    if (fs.existsSync(opencodeCommandsPath)) {
      const files = fs.readdirSync(opencodeCommandsPath).filter(f => f.endsWith('.md'));

      for (const file of files) {
        const filePath = path.join(opencodeCommandsPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const frontmatter = parseMarkdownFrontmatter(content);

        commands.push({
          name: path.basename(file, '.md'),
          description: frontmatter.description || 'No description available',
          platform: "OpenCode",
          agent: frontmatter.agent,
          model: frontmatter.model
        });
      }
    }
  }

  return commands;
}

export async function commands(): Promise<void> {
  try {
    const slashCommands = loadSlashCommands();

    if (slashCommands.length === 0) {
      console.log("No slash commands found.");
      console.log("Run 'codeflow pull' to install agents and commands to a project.");
      return;
    }

    console.log("\n📋 Available Slash Commands\n");

    // Group by platform
    const claudeCommands = slashCommands.filter(c => c.platform === "Claude Code");
    const opencodeCommands = slashCommands.filter(c => c.platform === "OpenCode");

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

    console.log("💡 Usage:");
    console.log("  Claude Code: Type '/<command>' in Claude Code interface");
    console.log("  OpenCode: Type '/<command>' in OpenCode interface");
    console.log("\n🚀 To install these commands to a project:");
    console.log("  codeflow pull [project-path]");

  } catch (error) {
    console.error("Error loading slash commands:", error);
    process.exit(1);
  }
}

import { promises as fs } from 'fs';
import { basename, join } from 'path';

interface CustomOpenCodeMetadata {
  name: string;
  role: string;
  model: string;
  temperature: number;
  tools: Record<string, boolean>;
  description: string;
  tags: string[];
  category?: string;
  allowed_directories?: string[];
}

interface OfficialOpenCodeMetadata {
  description: string;
  mode: 'primary' | 'subagent' | 'all';
  model?: string;
  temperature?: number;
  tools?: Record<string, boolean>;
  permission?: Record<string, 'allow' | 'ask' | 'deny'>;
  disable?: boolean;
  allowed_directories?: string[];
}

// Simple YAML frontmatter parser
function parseFrontmatter(frontmatterContent: string): CustomOpenCodeMetadata {
  const lines = frontmatterContent.split('\n');
  const frontmatter: any = {};
  let inTools = false;
  let toolsIndentLevel = 0;
  let inAllowedDirectories = false;
  let allowedDirectoriesIndentLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (trimmedLine === '') continue;

    // Handle tools section specially
    if (trimmedLine === 'tools:') {
      inTools = true;
      frontmatter.tools = {};
      toolsIndentLevel = line.indexOf('tools:');
      continue;
    }

    // Handle allowed_directories section specially
    if (trimmedLine === 'allowed_directories:') {
      inAllowedDirectories = true;
      frontmatter.allowed_directories = [];
      allowedDirectoriesIndentLevel = line.indexOf('allowed_directories:');
      continue;
    }

    if (inTools) {
      const indentLevel = line.length - line.trimStart().length;

      // Exit tools section if we're back to the same or lesser indentation
      if (indentLevel <= toolsIndentLevel && trimmedLine !== '') {
        inTools = false;
      } else if (trimmedLine.includes(':')) {
        const [key, value] = trimmedLine.split(':').map((s) => s.trim());
        frontmatter.tools[key] = value === 'true' ? true : value === 'false' ? false : value;
        continue;
      }
    }

    if (inAllowedDirectories) {
      const indentLevel = line.length - line.trimStart().length;

      // Exit allowed_directories section if we're back to the same or lesser indentation
      if (indentLevel <= allowedDirectoriesIndentLevel && trimmedLine !== '') {
        inAllowedDirectories = false;
      } else if (trimmedLine.startsWith('- ')) {
        const directory = trimmedLine.substring(2).trim();
        if (directory) {
          frontmatter.allowed_directories.push(directory);
        }
        continue;
      }
    }

    if (!inTools && !inAllowedDirectories && trimmedLine.includes(':')) {
      const colonIndex = trimmedLine.indexOf(':');
      const key = trimmedLine.substring(0, colonIndex).trim();
      let value = trimmedLine.substring(colonIndex + 1).trim();

      // Handle different value types
      if (value === 'true' || value === 'false') {
        frontmatter[key] = value === 'true';
      } else if (!isNaN(Number(value)) && value !== '' && !value.includes('/')) {
        frontmatter[key] = Number(value);
      } else if (value.startsWith('"') && value.endsWith('"')) {
        frontmatter[key] = value.slice(1, -1);
      } else if (key === 'temperature' && !isNaN(Number(value)) && value !== '') {
        frontmatter[key] = Number(value);
      } else {
        frontmatter[key] = value;
      }
    }
  }

  return frontmatter as CustomOpenCodeMetadata;
}

// Simple YAML frontmatter serializer
function stringifyFrontmatter(frontmatter: OfficialOpenCodeMetadata): string {
  const lines = [];

  for (const [key, value] of Object.entries(frontmatter)) {
    if (key === 'tools' && typeof value === 'object') {
      lines.push(`${key}:`);
      for (const [toolKey, toolValue] of Object.entries(value as Record<string, boolean>)) {
        lines.push(`  ${toolKey}: ${toolValue}`);
      }
    } else if (key === 'permission' && typeof value === 'object') {
      lines.push(`${key}:`);
      for (const [permKey, permValue] of Object.entries(value as Record<string, string>)) {
        lines.push(`  ${permKey}: ${permValue}`);
      }
    } else if (key === 'allowed_directories' && Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const dir of value) {
        lines.push(`  - ${dir}`);
      }
    } else if (typeof value === 'string' && value.includes('\n')) {
      lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  return lines.join('\n');
}

// Recursive function to find all .md files in a directory
async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await findMarkdownFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (_error) {
    // Directory doesn't exist or can't be read, skip it
  }

  return files;
}

async function convertOpenCodeAgent(filePath: string): Promise<void> {
  const content = await fs.readFile(filePath, 'utf-8');

  // Extract frontmatter and content
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    console.warn(`Skipping ${filePath}: No valid frontmatter found`);
    return;
  }

  try {
    const oldFrontmatter = parseFrontmatter(frontmatterMatch[1]);
    const agentContent = frontmatterMatch[2];

    // Convert to official OpenCode format
    const newFrontmatter: OfficialOpenCodeMetadata = {
      description: oldFrontmatter.description,
      mode: 'subagent', // Most agents are subagents
      model: convertModelName(oldFrontmatter.model),
      temperature: oldFrontmatter.temperature,
      tools: oldFrontmatter.tools,
      permission: convertToolsToPermissions(oldFrontmatter.tools),
      allowed_directories: oldFrontmatter.allowed_directories,
    };

    // Generate new agent file content
    const newContent = `---\n${stringifyFrontmatter(newFrontmatter).trim()}\n---\n\n${agentContent}`;

    // Write converted agent
    await fs.writeFile(filePath, newContent, 'utf-8');
    console.log(`✅ Converted: ${basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Failed to convert ${filePath}:`, error);
  }
}

function convertModelName(oldModel: string): string {
  // Convert internal model names to OpenCode format
  const modelMap: Record<string, string> = {
    'claude-3.5-sonnet-20241022': 'opencode/grok-code-fast',
    'claude-3-5-sonnet-latest': 'opencode/grok-code-fast',
  };

  return modelMap[oldModel] || oldModel;
}

function convertToolsToPermissions(
  tools: Record<string, boolean>
): Record<string, 'allow' | 'ask' | 'deny'> {
  const permissions: Record<string, 'allow' | 'ask' | 'deny'> = {};

  for (const [tool, enabled] of Object.entries(tools)) {
    if (enabled === true) {
      permissions[tool] = 'allow';
    } else {
      permissions[tool] = 'deny';
    }
  }

  return permissions;
}

// Main conversion function
async function main() {
  const agentFiles = await findMarkdownFiles('deprecated/opencode-agents');

  console.log(`Found ${agentFiles.length} OpenCode agents to convert`);

  for (const file of agentFiles) {
    await convertOpenCodeAgent(file);
  }

  console.log('🎉 OpenCode agent conversion complete!');
}

if (import.meta.main) {
  main().catch(console.error);
}

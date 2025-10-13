import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

interface ListItem {
  name: string;
  type: 'agent' | 'command';
  platform: 'claude-code' | 'opencode' | 'base';
  path: string;
  size?: number;
  description?: string;
}

interface ListOptions {
  type?: 'agents' | 'commands' | 'all';
  platform?: 'claude-code' | 'opencode' | 'base' | 'all';
  format?: 'table' | 'json' | 'simple';
  verbose?: boolean;
}

/**
 * Extract metadata from a markdown file
 */
async function extractMetadata(filePath: string): Promise<{ description?: string; size: number }> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const stats = { size: Buffer.byteLength(content, 'utf8') };

    // Extract description from frontmatter or first line
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const descMatch = frontmatter.match(/description:\s*(.+)/);
      if (descMatch) {
        return { description: descMatch[1].replace(/['"]/g, '').trim(), ...stats };
      }
    }

    // Fallback to first non-empty line
    const lines = content.split('\n').filter((line) => line.trim());
    const firstLine = lines.find((line) => !line.startsWith('#') && line.trim().length > 10);
    if (firstLine) {
      return {
        description: firstLine.substring(0, 100) + (firstLine.length > 100 ? '...' : ''),
        ...stats,
      };
    }

    return stats;
  } catch (error) {
    return { size: 0 };
  }
}

/**
 * List files in a directory (recursively for base format)
 */
async function listDirectory(dir: string, type: 'agent' | 'command'): Promise<ListItem[]> {
  if (!existsSync(dir)) {
    return [];
  }

  try {
    const items: ListItem[] = [];
    const isBaseFormat = dir.includes('codeflow-agents') || dir.endsWith('command');

    async function scanDirectory(currentDir: string): Promise<void> {
      const entries = readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name);

        if (entry.isDirectory() && isBaseFormat) {
          await scanDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const metadata = await extractMetadata(fullPath);

          let platform: 'claude-code' | 'opencode' | 'base' = 'base';
          if (dir.includes('.claude')) {
            platform = 'claude-code';
          } else if (dir.includes('.opencode')) {
            platform = 'opencode';
          } else if (dir.includes('codeflow-agents') || dir === 'command') {
            platform = 'base';
          }

          items.push({
            name: entry.name.replace('.md', ''),
            type,
            platform,
            path: fullPath,
            ...metadata,
          });
        }
      }
    }

    await scanDirectory(dir);
    return items;
  } catch (error) {
    console.warn(
      `Warning: Could not read directory ${dir}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return [];
  }
}

/**
 * Format items as a table
 */
function formatAsTable(items: ListItem[]): string {
  if (items.length === 0) {
    return 'No items found.';
  }

  const headers = ['Name', 'Type', 'Platform', 'Size', 'Description'];
  const rows = items.map((item) => [
    item.name,
    item.type,
    item.platform,
    item.size ? `${Math.round(item.size / 1024)}KB` : '0KB',
    item.description || 'No description',
  ]);

  const colWidths = headers.map((header, i) =>
    Math.max(header.length, ...rows.map((row) => row[i]?.length || 0))
  );

  const formatRow = (row: string[]) => row.map((cell, i) => cell.padEnd(colWidths[i])).join(' | ');

  const separator = colWidths.map((width) => '-'.repeat(width)).join('-|-');

  return [formatRow(headers), separator, ...rows.map(formatRow)].join('\n');
}

/**
 * Format items as JSON
 */
function formatAsJson(items: ListItem[]): string {
  return JSON.stringify(items, null, 2);
}

/**
 * Format items as simple list
 */
function formatAsSimple(items: ListItem[]): string {
  if (items.length === 0) {
    return 'No items found.';
  }

  return items.map((item) => `${item.name} (${item.type}, ${item.platform})`).join('\n');
}

/**
 * Main list function
 */
export async function list(
  projectPath: string = process.cwd(),
  options: ListOptions = {}
): Promise<void> {
  const projectPathResolved = resolve(projectPath);
  const { type = 'all', platform = 'all', format = 'table', verbose = false } = options;

  console.log(`📋 Listing Codeflow items in: ${projectPathResolved}`);

  const items: ListItem[] = [];

  // Collect agents
  if (type === 'agents' || type === 'all') {
    const agentDirs = ['.claude/agents', '.opencode/agent', 'codeflow-agents'];

    for (const dir of agentDirs) {
      const fullPath = join(projectPathResolved, dir);
      const agentItems = await listDirectory(fullPath, 'agent');
      items.push(...agentItems);
    }
  }

  // Collect commands
  if (type === 'commands' || type === 'all') {
    const commandDirs = ['.claude/commands', '.opencode/command', 'command'];

    for (const dir of commandDirs) {
      const fullPath = join(projectPathResolved, dir);
      const commandItems = await listDirectory(fullPath, 'command');
      items.push(...commandItems);
    }
  }

  // Filter by platform
  let filteredItems = items;
  if (platform !== 'all') {
    filteredItems = items.filter((item) => item.platform === platform);
  }

  // Sort items
  filteredItems.sort((a, b) => {
    // Sort by type first, then by name
    if (a.type !== b.type) {
      return a.type.localeCompare(b.type);
    }
    return a.name.localeCompare(b.name);
  });

  // Format output
  let output: string;
  switch (format) {
    case 'json':
      output = formatAsJson(filteredItems);
      break;
    case 'simple':
      output = formatAsSimple(filteredItems);
      break;
    case 'table':
    default:
      output = formatAsTable(filteredItems);
      break;
  }

  console.log(`\n${output}`);

  // Summary
  const summary = {
    total: filteredItems.length,
    agents: filteredItems.filter((i) => i.type === 'agent').length,
    commands: filteredItems.filter((i) => i.type === 'command').length,
    platforms: {
      'claude-code': filteredItems.filter((i) => i.platform === 'claude-code').length,
      opencode: filteredItems.filter((i) => i.platform === 'opencode').length,
      base: filteredItems.filter((i) => i.platform === 'base').length,
    },
  };

  console.log(`\n📊 Summary:`);
  console.log(`   Total items: ${summary.total}`);
  console.log(`   Agents: ${summary.agents}`);
  console.log(`   Commands: ${summary.commands}`);
  console.log(`   Claude Code: ${summary.platforms['claude-code']}`);
  console.log(`   OpenCode: ${summary.platforms['opencode']}`);
  console.log(`   Base: ${summary.platforms['base']}`);

  if (verbose) {
    console.log(`\n🔍 Verbose information:`);
    console.log(`   Project path: ${projectPathResolved}`);
    console.log(`   Filter type: ${type}`);
    console.log(`   Filter platform: ${platform}`);
    console.log(`   Output format: ${format}`);
  }
}

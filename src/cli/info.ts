import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

interface InfoOptions {
  format?: 'detailed' | 'yaml' | 'json';
  showContent?: boolean;
}

/**
 * Show detailed information about a specific agent or command
 */
export async function info(
  itemName: string,
  projectPath: string = process.cwd(),
  options: InfoOptions = {}
): Promise<void> {
  const projectPathResolved = resolve(projectPath);
  const { format = 'detailed', showContent = false } = options;

  console.log(`🔍 Getting info for: ${itemName}`);
  console.log(`📁 Project path: ${projectPathResolved}`);

  // Search for the item in all possible locations
  const searchLocations = [
    {
      path: join(projectPathResolved, '.claude', 'agents', `${itemName}.md`),
      type: 'agent',
      platform: 'claude-code',
    },
    {
      path: join(projectPathResolved, '.opencode', 'agent', `${itemName}.md`),
      type: 'agent',
      platform: 'opencode',
    },
    {
      path: join(projectPathResolved, '.claude', 'commands', `${itemName}.md`),
      type: 'command',
      platform: 'claude-code',
    },
    {
      path: join(projectPathResolved, '.opencode', 'command', `${itemName}.md`),
      type: 'command',
      platform: 'opencode',
    },
  ];

  let foundItem: { path: string; type: string; platform: string } | null = null;

  for (const location of searchLocations) {
    if (existsSync(location.path)) {
      foundItem = location;
      break;
    }
  }

  if (!foundItem) {
    console.error(`❌ Item '${itemName}' not found in project.`);
    console.error(`💡 Use 'codeflow list' to see available items.`);
    process.exit(1);
  }

  console.log(`✅ Found ${foundItem.type}: ${itemName} (${foundItem.platform})`);
  console.log(`📄 Path: ${foundItem.path}`);

  try {
    const content = await readFile(foundItem.path, 'utf-8');
    const stats = { size: Buffer.byteLength(content, 'utf8'), lines: content.split('\n').length };

    console.log(`📊 File stats: ${Math.round(stats.size / 1024)}KB, ${stats.lines} lines`);

    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      console.log(`\n📋 Frontmatter:`);

      const lines = frontmatter.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          console.log(`   ${line}`);
        }
      }
    }

    if (showContent) {
      console.log(`\n📝 Content:`);
      console.log(`---`);
      console.log(content);
      console.log(`---`);
    }

    // Show format-specific information
    if (format === 'yaml' && frontmatterMatch) {
      console.log(`\n📄 YAML Format:`);
      console.log(frontmatterMatch[0]);
    } else if (format === 'json') {
      console.log(`\n📄 JSON Format:`);
      try {
        // Simple YAML to JSON conversion for display
        const yamlLines = frontmatterMatch ? frontmatterMatch[1].split('\n') : [];
        const jsonObj: any = {};

        for (const line of yamlLines) {
          const match = line.match(/^(\w+):\s*(.+)$/);
          if (match) {
            const [, key, value] = match;
            jsonObj[key] = value.replace(/['"]/g, '').trim();
          }
        }

        console.log(JSON.stringify(jsonObj, null, 2));
      } catch (error) {
        console.log('Could not convert to JSON format');
      }
    }
  } catch (error) {
    console.error(
      `❌ Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    process.exit(1);
  }
}

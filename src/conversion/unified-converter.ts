#!/usr/bin/env bun

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';

interface SimplifiedDefinition {
  name: string;
  description: string;
  tools: string[];
  mode?: string;
  content: string;
}

interface PlatformOutput {
  name: string;
  description: string;
  tools: string[];
  model?: string;
  content: string;
}

class UnifiedConverter {
  private outputDirs: Record<string, Record<string, string>> = {
    'claude-code': {
      agents: '.claude/agents',
      commands: '.claude/commands',
    },
    opencode: {
      agents: '.opencode/agent',
      commands: '.opencode/command',
    },
  };

  parseSimplifiedFile(content: string, filePath?: string): SimplifiedDefinition {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      throw new Error('Invalid format: missing frontmatter');
    }

    const frontmatter = frontmatterMatch[1];
    const fileContent = content.slice(frontmatterMatch[0].length).trim();

    let name = this.extractField(frontmatter, 'name');

    // If no name in frontmatter, extract from filename
    if (!name && filePath) {
      const filename = filePath.split('/').pop() || '';
      name = filename.replace('.md', '');
    }

    const description = this.extractField(frontmatter, 'description');
    const tools = this.extractArray(frontmatter, 'tools');
    const mode = this.extractField(frontmatter, 'mode') || 'subagent';

    return {
      name,
      description,
      tools,
      mode,
      content: fileContent,
    };
  }

  private extractField(frontmatter: string, field: string): string {
    const match = frontmatter.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
    return match ? match[1].trim() : '';
  }

  private extractArray(frontmatter: string, field: string): string[] {
    // First try array format: tools: [tool1, tool2]
    const arrayMatch = frontmatter.match(new RegExp(`^${field}:\\s*\\[(.*?)\\]`, 'm'));
    if (arrayMatch) {
      return arrayMatch[1].split(',').map((item) => item.trim().replace(/['"]/g, ''));
    }

    // Then try simple string format: tools: tool1, tool2, tool3
    const stringMatch = frontmatter.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
    if (stringMatch) {
      const value = stringMatch[1].trim();
      if (value) {
        return value.split(',').map((item) => item.trim());
      }
    }

    return [];
  }

  convertToClaudeCode(def: SimplifiedDefinition, type: 'agent' | 'command'): PlatformOutput {
    const prefix = type === 'agent' ? 'Claude Code agent' : 'Claude Code command';
    const suffix =
      type === 'agent'
        ? 'Optimized for Claude Code with enhanced capabilities and detailed instructions.'
        : 'Streamlined command for Claude Code with clear step-by-step execution.';

    return {
      name: def.name,
      description: `${prefix}: ${def.description}. ${suffix}`,
      tools: def.tools,
      model: 'anthropic/claude-sonnet-4',
      content: def.content,
    };
  }

  convertToOpenCode(def: SimplifiedDefinition, type: 'agent' | 'command'): PlatformOutput {
    const prefix = type === 'agent' ? 'OpenCode agent' : 'OpenCode command';
    const suffix =
      type === 'agent'
        ? 'Use PROACTIVELY for specialized tasks in this domain.'
        : 'Execute with workflow.';

    return {
      name: def.name,
      description: `${prefix}: ${def.description}. ${suffix}`,
      tools: def.tools,
      model: def.mode || 'inherit',
      content: def.content,
    };
  }

  generatePlatformFile(output: PlatformOutput, platform?: string): string {
    const frontmatterLines = [
      '---',
      `name: ${output.name}`,
      `description: "${output.description}"`,
    ];

    // Only add model line if model exists
    if (output.model) {
      frontmatterLines.push(`model: ${output.model}`);
    }

    // Add tools/permissions based on platform
    if (output.tools.length > 0) {
      if (platform === 'opencode') {
        // OpenCode uses permission: format
        frontmatterLines.push('permission:');
        const permissions = this.convertToolsToPermissions(output.tools);
        for (const [tool, permission] of Object.entries(permissions)) {
          frontmatterLines.push(`  ${tool}: ${permission}`);
        }
      } else {
        // Claude Code uses tools: format
        frontmatterLines.push(`tools: ${output.tools.join(', ')}`);
      }
    }

    frontmatterLines.push('---');

    const frontmatter = frontmatterLines.join('\n') + '\n';
    return frontmatter + output.content;
  }

  private convertToolsToPermissions(tools: string[]): Record<string, string> {
    const permissions: Record<string, string> = {};

    // Default all tools to allow
    const allTools = ['read', 'write', 'edit', 'patch', 'bash', 'webfetch', 'grep', 'glob', 'list'];

    // Set explicit allows first
    for (const tool of tools) {
      const toolName = tool.toLowerCase().trim();
      if (allTools.includes(toolName)) {
        permissions[toolName] = 'allow';
      }
    }

    // For security, explicitly deny bash and webfetch unless specifically requested
    if (!permissions['bash']) {
      permissions['bash'] = 'deny';
    }
    if (!permissions['webfetch']) {
      permissions['webfetch'] = 'deny';
    }

    return permissions;
  }

  async convertFile(filePath: string): Promise<void> {
    const content = readFileSync(filePath, 'utf-8');
    const definition = this.parseSimplifiedFile(content, filePath);

    // Determine if it's an agent or command based on directory
    const type = filePath.includes('/agent') || filePath.includes('agents') ? 'agents' : 'commands';

    for (const [platform, dirs] of Object.entries(this.outputDirs)) {
      const outputDir = dirs[type];

      if (!outputDir) {
        console.error(`Invalid output directory for ${platform} ${type}`);
        continue;
      }

      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      let platformOutput: PlatformOutput;
      if (platform === 'claude-code') {
        platformOutput = this.convertToClaudeCode(
          definition,
          type === 'agents' ? 'agent' : 'command'
        );
      } else if (platform === 'opencode') {
        platformOutput = this.convertToOpenCode(
          definition,
          type === 'agents' ? 'agent' : 'command'
        );
      } else {
        continue;
      }

      const outputPath = join(outputDir, `${definition.name}.md`);
      const platformContent = this.generatePlatformFile(platformOutput, platform);

      writeFileSync(outputPath, platformContent, 'utf-8');
      console.log(`Generated ${platform} ${type}: ${outputPath}`);
    }
  }

  async convertDirectory(baseDir: string, type: 'agents' | 'commands'): Promise<void> {
    console.log(`Converting simplified ${type} from ${baseDir}...`);

    if (!existsSync(baseDir)) {
      console.error(`Directory not found: ${baseDir}`);
      return;
    }

    const files = await this.scanDirectory(baseDir);

    for (const filePath of files) {
      try {
        await this.convertFile(filePath);
      } catch (error) {
        console.error(`Error converting ${filePath}:`, error);
      }
    }

    console.log(`Converted ${files.length} ${type} to all platforms`);
  }

  private async scanDirectory(dir: string): Promise<string[]> {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      const files: string[] = [];

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(join(dir, entry.name));
        }
      }

      return files;
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error);
      return [];
    }
  }

  async convertAll(): Promise<void> {
    console.log('Converting all simplified agents and commands...');

    await Promise.all([
      this.convertDirectory('base-agents-simplified', 'agents'),
      this.convertDirectory('commands-simplified', 'commands'),
    ]);

    console.log('Conversion complete!');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const converter = new UnifiedConverter();

  if (args.length === 0) {
    console.log('Usage: unified-converter.ts [file] [--agents] [--commands] [--all]');
    console.log('  file              - Convert specific file');
    console.log('  --agents           - Convert all agents');
    console.log('  --commands         - Convert all commands');
    console.log('  --all              - Convert all agents and commands');
    process.exit(1);
  }

  if (args[0] === '--all') {
    await converter.convertAll();
  } else if (args[0] === '--agents') {
    await converter.convertDirectory('base-agents-simplified', 'agents');
  } else if (args[0] === '--commands') {
    await converter.convertDirectory('commands-simplified', 'commands');
  } else {
    await converter.convertFile(args[0]);
  }
}

// Only run main when this file is executed directly, not when imported
if (import.meta.main) {
  main().catch(console.error);
}

export { UnifiedConverter };

#!/usr/bin/env bun

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { readdir } from 'fs/promises';

interface SimplifiedAgent {
  name: string;
  description: string;
  tools: string[];
  mode: string;
  content: string;
}

interface PlatformAgent {
  name: string;
  description: string;
  tools: string[];
  model?: string;
  content: string;
}

class SimplifiedConverter {
  private outputDirs: Record<string, string> = {
    'claude-code': '.claude/agents',
    opencode: '.opencode/agent',
  };

  parseSimplifiedAgent(content: string): SimplifiedAgent {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      throw new Error('Invalid agent format: missing frontmatter');
    }

    const frontmatter = frontmatterMatch[1];
    const agentContent = content.slice(frontmatterMatch[0].length).trim();

    const name = this.extractField(frontmatter, 'name');
    const description = this.extractField(frontmatter, 'description');
    const tools = this.extractArray(frontmatter, 'tools');
    const mode = this.extractField(frontmatter, 'mode') || 'subagent';

    return {
      name,
      description,
      tools,
      mode,
      content: agentContent,
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

  convertToClaudeCode(agent: SimplifiedAgent): PlatformAgent {
    const enhancedDescription = `Claude Code agent: ${agent.description}. Optimized for Claude Code with enhanced capabilities and detailed instructions.`;

    return {
      name: agent.name,
      description: enhancedDescription,
      tools: agent.tools,
      model: 'anthropic/claude-sonnet-4',
      content: agent.content,
    };
  }

  convertToOpenCode(agent: SimplifiedAgent): PlatformAgent {
    const enhancedDescription = `OpenCode agent: ${agent.description}. Use PROACTIVELY for specialized tasks in this domain.`;

    return {
      name: agent.name,
      description: enhancedDescription,
      tools: agent.tools,
      model: 'subagent',
      content: agent.content,
    };
  }

  generatePlatformFile(agent: PlatformAgent): string {
    const frontmatter = [
      '---',
      `name: ${agent.name}`,
      `description: ${agent.description}`,
      agent.tools.length > 0 ? `tools: ${agent.tools.join(', ')}` : '',
      agent.model ? `model: ${agent.model}` : '',
      '---',
      '',
    ]
      .filter((line) => line.trim())
      .join('\n');

    return frontmatter + agent.content;
  }

  async convertAgent(agentPath: string): Promise<void> {
    const content = readFileSync(agentPath, 'utf-8');
    const agent = this.parseSimplifiedAgent(content);

    for (const [platform, outputDir] of Object.entries(this.outputDirs)) {
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      let platformAgent: PlatformAgent;
      if (platform === 'claude-code') {
        platformAgent = this.convertToClaudeCode(agent);
      } else if (platform === 'opencode') {
        platformAgent = this.convertToOpenCode(agent);
      } else {
        continue;
      }

      const outputPath = join(outputDir, `${agent.name}.md`);
      const platformContent = this.generatePlatformFile(platformAgent);

      writeFileSync(outputPath, platformContent, 'utf-8');
      console.log(`Generated ${platform} agent: ${outputPath}`);
    }
  }

  async convertAll(baseDir: string = 'base-agents-simplified'): Promise<void> {
    console.log(`Converting simplified agents from ${baseDir}...`);

    if (!existsSync(baseDir)) {
      console.error(`Directory not found: ${baseDir}`);
      return;
    }

    const files = await this.scanDirectory(baseDir);

    for (const filePath of files) {
      try {
        await this.convertAgent(filePath);
      } catch (error) {
        console.error(`Error converting ${filePath}:`, error);
      }
    }

    console.log(`Converted ${files.length} agents to all platforms`);
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
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const converter = new SimplifiedConverter();

  if (args.length === 0) {
    console.log('Usage: simplified-converter.ts <agent-file> [--all]');
    process.exit(1);
  }

  if (args[0] === '--all') {
    await converter.convertAll();
  } else {
    await converter.convertAgent(args[0]);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { SimplifiedConverter };

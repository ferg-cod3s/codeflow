import * as path from 'path';
import { BaseAgent, OpenCodeAgent } from '../types/index';
import { readFile, writeFile, readAllFiles } from '../utils/file-utils';
import { parseMarkdownFrontmatter, stringifyMarkdownFrontmatter } from '../utils/yaml-utils';

export class AgentConverter {
  private fieldMapping: Record<string, string> = {
    'name': 'name',
    'description': 'description',
    'mode': 'mode',
    'temperature': 'temperature',
    'model': 'model',
    'tools': 'tools',
    'permission': 'permission'
  };

  async convertAgents(inputDir: string, outputDir: string, dryRun: boolean = false): Promise<{
    converted: number;
    failed: number;
    errors: string[];
    warnings: string[];
  }> {
    const result = {
      converted: 0,
      failed: 0,
      errors: [] as string[],
      warnings: [] as string[]
    };

    const agentFiles = await readAllFiles('**/*.md', inputDir);
    
    for (const file of agentFiles) {
      try {
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, file);
        
        const content = await readFile(inputPath);
        const converted = await this.convertSingleAgent(content);
        
        if (!dryRun) {
          await writeFile(outputPath, converted);
        }
        
        result.converted++;
        console.log(`✅ Converted: ${file}`);
      } catch (error) {
        result.failed++;
        result.errors.push(`${file}: ${error}`);
        console.error(`❌ Failed: ${file} - ${error}`);
      }
    }
    
    return result;
  }

  private async convertSingleAgent(content: string): Promise<string> {
    const { frontmatter, body } = parseMarkdownFrontmatter(content);
    
    // Map base agent fields to OpenCode format
    const openCodeAgent: OpenCodeAgent = {
      name: frontmatter.name,
      description: frontmatter.description,
      mode: frontmatter.mode || 'subagent',
      temperature: frontmatter.temperature,
      model: frontmatter.model,
      tools: this.mapTools(frontmatter.tools),
      permission: this.mapPermissions(frontmatter.permission, frontmatter.allowed_directories)
    };

    // Combine prompt from body and additional frontmatter fields
    const prompt = this.buildPrompt(frontmatter, body);
    
    if (prompt) {
      openCodeAgent.prompt = prompt;
    }

    // Filter out undefined values
    const cleanAgent = Object.fromEntries(
      Object.entries(openCodeAgent).filter(([_, value]) => value !== undefined)
    );

    return stringifyMarkdownFrontmatter(cleanAgent, body);
  }

  private mapTools(tools?: Record<string, boolean>): Record<string, boolean> | undefined {
    if (!tools) return undefined;
    
    // Map current tool names to OpenCode tool names
    const toolMapping: Record<string, string> = {
      'write': 'write',
      'edit': 'edit',
      'bash': 'bash',
      'read': 'read',
      'grep': 'grep',
      'glob': 'glob',
      'list': 'list',
      'webfetch': 'webfetch'
    };

    const mappedTools: Record<string, boolean> = {};
    for (const [tool, enabled] of Object.entries(tools)) {
      const openCodeTool = toolMapping[tool] || tool;
      mappedTools[openCodeTool] = enabled;
    }

    return mappedTools;
  }

  private mapPermissions(
    permission?: Record<string, string>, 
    allowedDirectories?: string[]
  ): Record<string, string | boolean> | undefined {
    if (!permission && !allowedDirectories) return undefined;

    const mappedPermissions: Record<string, string | boolean> = {};

    // Map existing permissions with OpenCode-compatible values
    if (permission) {
      for (const [key, value] of Object.entries(permission)) {
        // Convert permission values to OpenCode format
        if (typeof value === 'string') {
          // Map string permissions to OpenCode permission values
          if (value === 'true' || value === 'allow') {
            mappedPermissions[key] = 'allow';
          } else if (value === 'false' || value === 'deny') {
            mappedPermissions[key] = 'deny';
          } else {
            mappedPermissions[key] = 'ask'; // Default for string values
          }
        } else {
          mappedPermissions[key] = value;
        }
      }
    }

    // Note: allowed_directories is not a standard OpenCode permission
    // We'll include it in the prompt instead

    return mappedPermissions;
  }

  private buildPrompt(frontmatter: any, body: string): string {
    // Extract additional frontmatter fields that should be part of prompt
    const promptFields = [
      'primary_objective',
      'anti_objectives', 
      'intended_followups',
      'tags',
      'category',
      'allowed_directories'
    ];

    let prompt = body;

    // Add structured information to prompt
    const additionalInfo = promptFields
      .filter(field => frontmatter[field])
      .map(field => {
        const value = frontmatter[field];
        if (Array.isArray(value)) {
          return `**${field}**: ${value.join(', ')}`;
        } else if (typeof value === 'object') {
          return `**${field}**: ${JSON.stringify(value, null, 2)}`;
        } else {
          return `**${field}**: ${value}`;
        }
      })
      .join('\n');

    if (additionalInfo) {
      prompt = `${additionalInfo}\n\n${body}`;
    }

    return prompt;
  }
}
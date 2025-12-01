import * as path from 'path';
import { OpenCodeAgent } from '../types/index.js';
import { readFile, writeFile, readAllFiles } from '../utils/file-utils.js';
import { parseMarkdownFrontmatter, stringifyMarkdownFrontmatter } from '../utils/yaml-utils.js';
import { ConversionErrorHandler, ErrorType, ConversionResult } from '../core/error-handler.js';

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

  private errorHandler = new ConversionErrorHandler({
    maxRetries: 2,
    retryDelay: 500,
    continueOnError: true
  });

  async convertAgents(inputDir: string, outputDir: string, dryRun: boolean = false): Promise<ConversionResult<{
    totalFiles: number;
    converted: number;
    failed: number;
    errors: string[];
    warnings: string[];
  }>> {
    const agentFiles = await readAllFiles('**/*.md', inputDir);
    let converted = 0;
    let failed = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const file of agentFiles) {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file);
      
      const result = await this.errorHandler.handleError(
        this.errorHandler.createError(ErrorType.FILE_READ_ERROR, `Failed to read file: ${file}`, { file, operation: 'read' }),
        async () => {
          const content = await readFile(inputPath);
          return await this.convertSingleAgent(content);
        },
        `convert_${file}`
      );

      if (result.success && result.data) {
        if (!dryRun) {
          await this.errorHandler.handleError(
            this.errorHandler.createError(ErrorType.FILE_WRITE_ERROR, `Failed to write file: ${file}`, { file, operation: 'write' }),
            async () => await writeFile(outputPath, result.data!),
            `write_${file}`
          );
        }
        converted++;
        console.log(`✅ Converted: ${file}`);
      } else {
        failed++;
        if (result.error) {
          errors.push(`${file}: ${result.error.message}`);
          console.error(`❌ Failed: ${file} - ${result.error.message}`);
        }
        warnings.push(...(result.warnings || []));
      }
    }

    return {
      success: failed === 0,
      data: { totalFiles: agentFiles.length, converted, failed, errors, warnings },
      warnings,
      converted,
      failed,
      errors,
      metrics: this.errorHandler.createMetrics(converted, failed, 0, 0)
    };
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

    // Filter out undefined values and name (opencode derives from filename)
    const cleanAgent = Object.fromEntries(
      Object.entries(openCodeAgent).filter(([key, value]) => 
        value !== undefined && key !== 'name'
      )
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
    permission?: Record<string, any>, 
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
        } else if (typeof value === 'object' && value !== null) {
          // For complex permission objects, use the most permissive setting
          // OpenCode permissions are simpler than the base-agent format
          const hasAllow = Object.values(value).some(v => v === 'allow');
          const hasDeny = Object.values(value).some(v => v === 'deny');
          
          if (hasDeny && !hasAllow) {
            mappedPermissions[key] = 'deny';
          } else if (hasAllow && !hasDeny) {
            mappedPermissions[key] = 'allow';
          } else {
            mappedPermissions[key] = 'ask'; // Mixed permissions
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
import { readFile } from 'fs/promises';
import { YamlProcessor } from '../yaml/yaml-processor.js';
import { ParsedEntity } from './agent-parser.js';

export interface CommandMetadata {
  name: string;
  description: string;
  version?: string;
  last_updated?: string;
  command_schema_version?: string;
  mode?: 'command';
  model?: string;
  temperature?: number;
  category?: string;
  inputs?: CommandInput[];
  outputs?: CommandOutput[];
  cache_strategy?: CacheStrategy;
  success_signals?: string[];
  failure_modes?: string[];
  params?: {
    required?: CommandParam[];
    optional?: CommandParam[];
  };
}

export interface CommandInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  default?: any;
}

export interface CommandOutput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'structured';
  format?: string;
  description?: string;
}

export interface CommandParam {
  name: string;
  description: string;
  type: string;
}

export interface CacheStrategy {
  type: 'content_based' | 'time_based' | 'none';
  ttl?: number;
  max_size?: number;
  invalidation?: string;
  scope?: string;
}

export class CommandConverter {
  private processor: YamlProcessor;

  constructor() {
    this.processor = new YamlProcessor();
  }

  /**
   * Convert command from OpenCode format to Claude Code format
   */
  convertToClaudeCode(commandContent: string, filePath: string): string {
    const parseResult = this.processor.parse(commandContent);
    if (!parseResult.success) {
      throw new Error(`Failed to parse command: ${parseResult.error.message}`);
    }

    const parsedYaml = parseResult.data;
    const frontmatter = parsedYaml.frontmatter as CommandMetadata;
    const convertedFrontmatter = this.convertOpenCodeToClaudeCode(frontmatter);

    // Transform body content variable syntax
    const transformedBody = this.transformBodyVariables(
      parsedYaml.body,
      'claude-code',
      frontmatter.inputs
    );

    // Create ParsedEntity for serialization
    const entity: ParsedEntity = {
      name: convertedFrontmatter.name || 'unknown',
      format: 'claude-code',
      frontmatter: convertedFrontmatter,
      content: transformedBody,
      filePath,
    };

    const yamlResult = this.processor.serialize(entity);
    if (!yamlResult.success) {
      throw new Error(`Failed to serialize converted command: ${yamlResult.error.message}`);
    }

    return yamlResult.data;
  }

  /**
   * Convert command from Claude Code format to OpenCode format
   */
  convertToOpenCode(commandContent: string, filePath: string): string {
    const parseResult = this.processor.parse(commandContent);
    if (!parseResult.success) {
      throw new Error(`Failed to parse command: ${parseResult.error.message}`);
    }

    const parsedYaml = parseResult.data;
    const frontmatter = parsedYaml.frontmatter as CommandMetadata;

    // Check if already in OpenCode format (has mode: command and inputs)
    const isAlreadyOpenCode = frontmatter.mode === 'command' && frontmatter.inputs;

    const convertedFrontmatter = isAlreadyOpenCode
      ? this.ensureOpenCodeDefaults(frontmatter)
      : this.convertClaudeCodeToOpenCode(frontmatter);

    // Transform body content variable syntax
    // Always apply variable transformation, even for already-OpenCode files
    const transformedBody = this.transformBodyVariables(
      parsedYaml.body,
      'opencode',
      convertedFrontmatter.inputs
    );

    // Create ParsedEntity for serialization
    const entity: ParsedEntity = {
      name: convertedFrontmatter.name || 'unknown',
      format: 'opencode',
      frontmatter: convertedFrontmatter,
      content: transformedBody,
      filePath,
    };

    const yamlResult = this.processor.serialize(entity);
    if (!yamlResult.success) {
      throw new Error(`Failed to serialize converted command: ${yamlResult.error.message}`);
    }

    return yamlResult.data;
  }

  /**
   * Ensure OpenCode format has all required defaults
   * Used when source is already in OpenCode format
   */
  private ensureOpenCodeDefaults(frontmatter: CommandMetadata): CommandMetadata {
    const converted: CommandMetadata = {
      ...frontmatter,
      mode: 'command',
      model: frontmatter.model || 'opencode/grok-code',
      version: frontmatter.version || '2.1.0-optimized',
      last_updated: frontmatter.last_updated || new Date().toISOString().split('T')[0],
      command_schema_version: frontmatter.command_schema_version || '1.0',
    };

    // Preserve inputs as-is
    if (frontmatter.inputs) {
      converted.inputs = frontmatter.inputs;
    }

    // Ensure outputs exist
    if (!converted.outputs) {
      converted.outputs = [
        {
          name: 'result',
          type: 'string',
          description: 'Command execution result',
        },
      ];
    }

    // Ensure cache strategy exists
    if (!converted.cache_strategy) {
      converted.cache_strategy = {
        type: 'content_based',
        ttl: 3600,
        scope: 'command',
      };
    }

    // Ensure success/failure signals exist
    if (!converted.success_signals) {
      converted.success_signals = [
        'Command completed successfully',
        'Task executed without errors',
      ];
    }

    if (!converted.failure_modes) {
      converted.failure_modes = [
        'Command execution failed',
        'Invalid parameters provided',
        'System error occurred',
      ];
    }

    // Remove Claude-specific fields
    delete converted.temperature;
    delete converted.category;
    delete converted.params;

    return converted;
  }

  /**
   * Convert OpenCode frontmatter to Claude Code format
   */
  private convertOpenCodeToClaudeCode(frontmatter: CommandMetadata): CommandMetadata {
    const converted: CommandMetadata = {
      name: frontmatter.name,
      description: frontmatter.description,
      temperature: 0.1, // Commands should be deterministic
      category: this.inferCategoryFromName(frontmatter.name),
    };

    // Convert inputs to Claude-style params if they exist
    if (frontmatter.inputs && frontmatter.inputs.length > 0) {
      converted.params = {
        required: frontmatter.inputs
          .filter((input) => input.required)
          .map((input) => ({
            name: input.name,
            description: input.description || input.name,
            type: input.type,
          })),
        optional: frontmatter.inputs
          .filter((input) => !input.required)
          .map((input) => ({
            name: input.name,
            description: input.description || input.name,
            type: input.type,
          })),
      };
    }

    // Remove OpenCode-specific fields
    delete converted.mode;
    delete converted.model;
    delete converted.inputs;
    delete converted.outputs;
    delete converted.cache_strategy;
    delete converted.success_signals;
    delete converted.failure_modes;
    delete converted.command_schema_version;
    delete converted.last_updated;

    return converted;
  }

  /**
   * Convert Claude Code frontmatter to OpenCode format
   */
  /**
   * Convert Claude Code frontmatter to OpenCode format
   */
  private convertClaudeCodeToOpenCode(frontmatter: CommandMetadata): CommandMetadata {
    const converted: CommandMetadata = {
      name: frontmatter.name,
      description: frontmatter.description,
      mode: 'command',
      model: 'opencode/grok-code',
      version: '2.1.0-optimized',
      last_updated: new Date().toISOString().split('T')[0],
      command_schema_version: '1.0',
    };

    // Convert params to OpenCode inputs if they exist
    if (frontmatter.params) {
      converted.inputs = [
        ...(frontmatter.params.required || []).map((param) => ({
          name: param.name,
          type: (param.type as any) || 'string',
          required: true,
          description: param.description,
        })),
        ...(frontmatter.params.optional || []).map((param) => ({
          name: param.name,
          type: (param.type as any) || 'string',
          required: false,
          description: param.description,
        })),
      ];
    }

    // Add default outputs
    converted.outputs = [
      {
        name: 'result',
        type: 'string',
        description: 'Command execution result',
      },
    ];

    // Add default cache strategy
    converted.cache_strategy = {
      type: 'content_based',
      ttl: 3600,
      scope: 'command',
    };

    // Add default success/failure signals
    converted.success_signals = ['Command completed successfully', 'Task executed without errors'];

    converted.failure_modes = [
      'Command execution failed',
      'Invalid parameters provided',
      'System error occurred',
    ];

    // Remove Claude-specific fields
    delete converted.params;
    delete converted.category;
    delete converted.temperature;

    return converted;
  }

  /**
   * Convert model name to Claude Code format
   */
  private convertModelToClaudeCode(model?: string): string {
    if (!model) return 'claude-3-5-sonnet-20241022';

    // Convert OpenCode model names to Claude format
    const modelMap: Record<string, string> = {
      'opencode/grok-code': 'claude-3-5-sonnet-20241022',
      'opencode/code-supernova': 'claude-3-5-sonnet-20241022',
      'opencode/grok-code-fast-1': 'claude-3-5-sonnet-20241022',
    };

    return modelMap[model] || 'claude-3-5-sonnet-20241022';
  }

  /**
   * Convert model name to OpenCode format
   */
  private convertModelToOpenCode(model?: string): string | undefined {
    if (!model) return undefined;

    // Convert Claude model names to OpenCode format
    const modelMap: Record<string, string> = {
      'claude-3-5-sonnet-20241022': 'opencode/grok-code',
      'claude-3-5-sonnet': 'opencode/grok-code',
    };

    return modelMap[model] || undefined;
  }

  /**
   * Infer category from command name
   */
  private inferCategoryFromName(name: string): string {
    const nameLower = name.toLowerCase();

    // Check for more specific matches first
    if (nameLower.includes('docker')) return 'docker';
    if (nameLower.includes('database') || nameLower.includes('db')) return 'database';
    if (nameLower.includes('security') || nameLower.includes('audit')) return 'security';
    if (nameLower.includes('monitor')) return 'monitoring';
    if (nameLower.includes('git') || nameLower.includes('commit')) return 'git';

    // Then check for general categories
    if (nameLower.includes('test')) return 'testing';
    if (nameLower.includes('build') || nameLower.includes('compile')) return 'build';
    if (nameLower.includes('deploy')) return 'deploy';
    if (nameLower.includes('analyze') || nameLower.includes('review')) return 'analysis';
    if (nameLower.includes('generate') || nameLower.includes('create')) return 'generation';
    if (nameLower.includes('convert') || nameLower.includes('transform')) return 'conversion';
    if (nameLower.includes('document')) return 'documentation';

    return 'utility';
  }

  /**
   * Transform variable syntax in command body content
   * OpenCode uses $ARGUMENTS (single placeholder for all args)
   * Claude/Cursor use {{variable}} (named parameters)
   */
  private transformBodyVariables(
    body: string,
    targetFormat: 'claude-code' | 'opencode',
    inputs?: CommandInput[]
  ): string {
    if (targetFormat === 'opencode') {
      // Convert {{variable}} to $ARGUMENTS
      // OpenCode limitation: can only pass single argument string
      let transformed = body;
      const variablePattern = /\{\{(\w+)\}\}/g;
      const matches = body.match(variablePattern);

      if (matches && matches.length > 1) {
        // Multiple variables detected - add warning comment
        transformed =
          '<!-- Note: OpenCode only supports $ARGUMENTS placeholder. Multiple parameters from Claude/Cursor may not work as expected. -->\n\n' +
          transformed;
      }

      // Replace all {{variable}} with $ARGUMENTS
      transformed = transformed.replace(variablePattern, '$ARGUMENTS');

      return transformed;
    } else {
      // Convert $ARGUMENTS to {{variable}}
      // Use the first required input, or first input if no required ones
      let primaryParam = 'arguments'; // fallback

      if (inputs && inputs.length > 0) {
        const requiredInputs = inputs.filter((i) => i.required);
        const firstInput = requiredInputs.length > 0 ? requiredInputs[0] : inputs[0];
        primaryParam = firstInput.name;
      }

      return body.replace(/\$ARGUMENTS/g, `{{${primaryParam}}}`);
    }
  }

  /**
   * Load and convert a command file
   */
  async convertFile(filePath: string, targetFormat: 'claude-code' | 'opencode'): Promise<string> {
    const content = await readFile(filePath, 'utf-8');
    if (filePath.includes('document.md')) {
      console.error(`[DEBUG] Reading document.md: ${filePath}`);
      console.error(`[DEBUG] First 100 chars: ${content.substring(0, 100)}`);
      console.error(`[DEBUG] Starts with ---?: ${content.startsWith('---')}`);
    }

    if (targetFormat === 'claude-code') {
      return this.convertToClaudeCode(content, filePath);
    } else {
      return this.convertToOpenCode(content, filePath);
    }
  }
}

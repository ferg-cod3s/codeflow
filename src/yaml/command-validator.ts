import { readFile, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { existsSync } from 'node:fs';
import { ValidationEngine } from './validation-engine.js';
import { YamlProcessor } from './yaml-processor.js';

export interface CommandValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata?: {
    fileCount: number;
    totalCommands: number;
    processingTime: number;
  };
}

export interface ValidationError {
  file: string;
  line?: number;
  column?: number;
  message: string;
  code: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

export interface ValidationWarning {
  file: string;
  message: string;
  suggestion?: string;
}

export interface CommandSchema {
  name: string;
  mode: 'command';
  description: string;
  version?: string;
  inputs?: CommandInput[];
  outputs?: CommandOutput[];
  cache_strategy?: CacheStrategy;
  success_signals?: string[];
  failure_modes?: string[];
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

export interface CacheStrategy {
  type: 'content_based' | 'time_based' | 'none';
  ttl?: number;
  max_size?: number;
}

export class CommandValidator {
  private validator: ValidationEngine;
  private processor: YamlProcessor;
  private variablePattern = /\{\{([^}]+)\}\}/g;

  constructor() {
    this.validator = new ValidationEngine();
    this.processor = new YamlProcessor();
  }

  /**
   * Validates all command files in a directory with format-specific validation
   */
  async validateDirectory(
    directoryPath: string,
    format: 'claude-code' | 'opencode' = 'opencode'
  ): Promise<CommandValidationResult> {
    const startTime = performance.now();

    if (!existsSync(directoryPath)) {
      throw new Error(`Directory does not exist: ${directoryPath}`);
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let totalCommands = 0;

    try {
      const files = await this.findCommandFiles(directoryPath);

      for (const file of files) {
        try {
          const result = await this.validateFile(file, format);
          if (!result.valid) {
            errors.push(...result.errors);
          }
          warnings.push(...result.warnings);
          totalCommands++;
        } catch (error) {
          errors.push({
            file,
            message: `Failed to validate command file: ${(error as Error).message}`,
            code: 'FILE_VALIDATION_ERROR',
            severity: 'error',
          });
        }
      }
    } catch (error) {
      errors.push({
        file: directoryPath,
        message: `Failed to read directory: ${(error as Error).message}`,
        code: 'DIRECTORY_READ_ERROR',
        severity: 'error',
      });
    }

    const processingTime = performance.now() - startTime;

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        fileCount: await this.countFiles(directoryPath),
        totalCommands,
        processingTime,
      },
    };
  }

  /**
   * Validates a single command file with format-specific validation
   */
  async validateFile(
    filePath: string,
    format: 'claude-code' | 'opencode' = 'opencode'
  ): Promise<CommandValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      const content = await readFile(filePath, 'utf-8');
      const parseResult = this.processor.parse(content);
      if (!parseResult.success) {
        errors.push({
          file: filePath,
          message: `YAML parsing failed: ${parseResult.error.message}`,
          code: 'YAML_PARSE_ERROR',
          severity: 'error',
        });
        return { valid: false, errors, warnings };
      }
      const parsed = parseResult.data;

      if (!parsed.frontmatter) {
        errors.push({
          file: filePath,
          message: 'Command file must have YAML frontmatter',
          code: 'MISSING_FRONTMATTER',
          severity: 'error',
        });
        return { valid: false, errors, warnings };
      }

      // Validate schema structure
      const schemaValidation = this.validateSchema(parsed.frontmatter, format);
      if (!schemaValidation.valid) {
        errors.push(...schemaValidation.errors);
      }

      // Validate variable references
      const variableValidation = this.validateVariableReferences(content, parsed.frontmatter);
      errors.push(...variableValidation.errors);
      warnings.push(...variableValidation.warnings);

      // Validate YAML syntax
      const yamlValidation = await this.validateYamlSyntax(content);
      errors.push(...yamlValidation.errors);
      warnings.push(...yamlValidation.warnings);
    } catch (error) {
      errors.push({
        file: filePath,
        message: `Failed to parse command file: ${(error as Error).message}`,
        code: 'PARSE_ERROR',
        severity: 'error',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates command schema against expected structure for the given format
   */
  public validateSchema(
    frontmatter: any,
    format: 'claude-code' | 'opencode'
  ): { valid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    if (format === 'opencode') {
      return this.validateOpenCodeSchema(frontmatter, errors);
    } else {
      return this.validateClaudeCodeSchema(frontmatter, errors);
    }
  }

  /**
   * Validate OpenCode command schema
   */
  private validateOpenCodeSchema(
    frontmatter: any,
    errors: ValidationError[]
  ): { valid: boolean; errors: ValidationError[] } {
    // Required fields for OpenCode
    if (!frontmatter.name || typeof frontmatter.name !== 'string') {
      errors.push({
        file: 'frontmatter',
        message: 'Command must have a name field',
        code: 'MISSING_NAME',
        severity: 'error',
      });
    }

    if (!frontmatter.description || typeof frontmatter.description !== 'string') {
      errors.push({
        file: 'frontmatter',
        message: 'Command must have a description field',
        code: 'MISSING_DESCRIPTION',
        severity: 'error',
      });
    }

    if (!frontmatter.mode || frontmatter.mode !== 'command') {
      errors.push({
        file: 'frontmatter',
        message: 'OpenCode commands must have mode: "command"',
        code: 'INVALID_MODE',
        severity: 'error',
      });
    }

    // Validate inputs array
    if (frontmatter.inputs) {
      if (!Array.isArray(frontmatter.inputs)) {
        errors.push({
          file: 'frontmatter',
          message: 'inputs must be an array',
          code: 'INVALID_INPUTS_FORMAT',
          severity: 'error',
        });
      } else {
        frontmatter.inputs.forEach((input: any, index: number) => {
          if (!input.name || !input.type) {
            errors.push({
              file: 'frontmatter',
              message: `Input at index ${index} must have name and type`,
              code: 'INVALID_INPUT_SCHEMA',
              severity: 'error',
            });
          }
          if (typeof input.required !== 'boolean') {
            errors.push({
              file: 'frontmatter',
              message: `Input "${input.name}" must specify required as boolean`,
              code: 'INVALID_INPUT_REQUIRED',
              severity: 'error',
            });
          }
        });
      }
    }

    // Validate outputs array
    if (frontmatter.outputs) {
      if (!Array.isArray(frontmatter.outputs)) {
        errors.push({
          file: 'frontmatter',
          message: 'outputs must be an array',
          code: 'INVALID_OUTPUTS_FORMAT',
          severity: 'error',
        });
      }
    }

    // Validate cache strategy
    if (frontmatter.cache_strategy) {
      const validTypes = ['content_based', 'time_based', 'none'];
      if (!validTypes.includes(frontmatter.cache_strategy.type)) {
        errors.push({
          file: 'frontmatter',
          message: `Cache strategy type must be one of: ${validTypes.join(', ')}`,
          code: 'INVALID_CACHE_TYPE',
          severity: 'error',
        });
      }
      if (
        frontmatter.cache_strategy.ttl !== undefined &&
        typeof frontmatter.cache_strategy.ttl !== 'number'
      ) {
        errors.push({
          file: 'frontmatter',
          message: 'Cache strategy ttl must be a number',
          code: 'INVALID_CACHE_TTL',
          severity: 'error',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate Claude Code command schema
   */
  private validateClaudeCodeSchema(
    frontmatter: any,
    errors: ValidationError[]
  ): { valid: boolean; errors: ValidationError[] } {
    // Required fields for Claude Code
    if (!frontmatter.name || typeof frontmatter.name !== 'string') {
      errors.push({
        file: 'frontmatter',
        message: 'Command must have a name field',
        code: 'MISSING_NAME',
        severity: 'error',
      });
    }

    if (!frontmatter.description || typeof frontmatter.description !== 'string') {
      errors.push({
        file: 'frontmatter',
        message: 'Command must have a description field',
        code: 'MISSING_DESCRIPTION',
        severity: 'error',
      });
    }

    // Claude Code commands should have model field
    if (!frontmatter.model || typeof frontmatter.model !== 'string') {
      errors.push({
        file: 'frontmatter',
        message: 'Claude Code commands must have a model field',
        code: 'MISSING_MODEL',
        severity: 'error',
      });
    }

    // Validate model format (should be Claude model)
    if (frontmatter.model && !frontmatter.model.includes('claude')) {
      errors.push({
        file: 'frontmatter',
        message: 'Claude Code commands should use Claude models',
        code: 'INVALID_MODEL',
        severity: 'warning',
      });
    }

    // Temperature should be reasonable for commands
    if (frontmatter.temperature !== undefined) {
      if (
        typeof frontmatter.temperature !== 'number' ||
        frontmatter.temperature < 0 ||
        frontmatter.temperature > 1
      ) {
        errors.push({
          file: 'frontmatter',
          message: 'Temperature must be a number between 0 and 1',
          code: 'INVALID_TEMPERATURE',
          severity: 'error',
        });
      } else if (frontmatter.temperature > 0.5) {
        errors.push({
          file: 'frontmatter',
          message: 'Commands should use lower temperature (<= 0.5) for consistency',
          code: 'HIGH_TEMPERATURE',
          severity: 'warning',
        });
      }
    }

    // Category is recommended for Claude Code
    if (!frontmatter.category) {
      errors.push({
        file: 'frontmatter',
        message: 'Claude Code commands should have a category',
        code: 'MISSING_CATEGORY',
        severity: 'warning',
      });
    }

    // Validate params structure if present
    if (frontmatter.params) {
      if (typeof frontmatter.params !== 'object') {
        errors.push({
          file: 'frontmatter',
          message: 'params must be an object',
          code: 'INVALID_PARAMS_FORMAT',
          severity: 'error',
        });
      } else {
        // Validate required params
        if (frontmatter.params.required && !Array.isArray(frontmatter.params.required)) {
          errors.push({
            file: 'frontmatter',
            message: 'params.required must be an array',
            code: 'INVALID_REQUIRED_PARAMS',
            severity: 'error',
          });
        }

        // Validate optional params
        if (frontmatter.params.optional && !Array.isArray(frontmatter.params.optional)) {
          errors.push({
            file: 'frontmatter',
            message: 'params.optional must be an array',
            code: 'INVALID_OPTIONAL_PARAMS',
            severity: 'error',
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates variable references in command content
   */
  private validateVariableReferences(
    content: string,
    frontmatter: any
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Extract all variable references from content
    const variableMatches = content.match(this.variablePattern);
    if (variableMatches) {
      const referencedVariables = variableMatches.map((match) => match.replace(/\{\{|\}\}/g, ''));

      // Check if variables are defined in inputs
      const definedInputs = frontmatter.inputs || [];
      const inputNames = definedInputs.map((input: any) => input.name);

      referencedVariables.forEach((variable) => {
        if (!inputNames.includes(variable)) {
          errors.push({
            file: 'content',
            message: `Variable "{{${variable}}}" is not defined in inputs`,
            code: 'UNDEFINED_VARIABLE',
            severity: 'error',
            suggestion: `Add "${variable}" to the inputs array or remove the reference`,
          });
        }
      });
    }

    // Check for unused inputs
    if (frontmatter.inputs && frontmatter.inputs.length > 0) {
      const definedInputs = frontmatter.inputs.map((input: any) => input.name);
      const referencedVariables = (content.match(this.variablePattern) || []).map((match) =>
        match.replace(/\{\{|\}\}/g, '')
      );

      definedInputs.forEach((inputName: string) => {
        if (!referencedVariables.includes(inputName)) {
          warnings.push({
            file: 'frontmatter',
            message: `Input "${inputName}" is defined but not used in content`,
            suggestion: `Remove unused input or add {{${inputName}}} reference to content`,
          });
        }
      });
    }

    return { errors, warnings };
  }

  /**
   * Validates YAML syntax
   */
  private async validateYamlSyntax(
    content: string
  ): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      const parseResult = this.processor.parse(content);
      if (!parseResult.success) {
        errors.push({
          file: 'yaml',
          message: `YAML syntax error: ${parseResult.error.message}`,
          code: 'YAML_SYNTAX_ERROR',
          severity: 'error',
        });
        return { errors, warnings };
      }
    } catch (error) {
      errors.push({
        file: 'yaml',
        message: `YAML syntax error: ${(error as Error).message}`,
        code: 'YAML_SYNTAX_ERROR',
        severity: 'error',
      });
    }

    return { errors, warnings };
  }

  /**
   * Finds all command files in a directory recursively
   */
  private async findCommandFiles(directoryPath: string): Promise<string[]> {
    const files: string[] = [];

    async function scanDirectory(dir: string) {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          // Check if it's a command file by reading frontmatter
          try {
            const content = await readFile(fullPath, 'utf-8');
            const parseResult = new YamlProcessor().parse(content);
            if (
              parseResult.success &&
              parseResult.data.frontmatter &&
              parseResult.data.frontmatter.mode === 'command'
            ) {
              files.push(fullPath);
            }
          } catch {
            // Not a valid command file, skip
          }
        }
      }
    }

    await scanDirectory(directoryPath);
    return files;
  }

  /**
   * Counts total files in directory
   */
  private async countFiles(directoryPath: string): Promise<number> {
    let count = 0;

    async function scanDirectory(dir: string) {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else {
          count++;
        }
      }
    }

    await scanDirectory(directoryPath);
    return count;
  }

  /**
   * Generates fix suggestions for validation errors
   */
  generateFixes(errors: ValidationError[]): string {
    const fixes: string[] = [
      '# Command Validation Fix Report',
      '',
      '## Summary',
      `${errors.length} validation errors found`,
      '',
      '## Fixes',
    ];

    errors.forEach((error, index) => {
      fixes.push(`\n### Error ${index + 1}: ${error.code}`);
      fixes.push(`**File:** ${error.file}`);
      fixes.push(`**Message:** ${error.message}`);
      if (error.suggestion) {
        fixes.push(`**Suggestion:** ${error.suggestion}`);
      }
      fixes.push('');
    });

    return fixes.join('\n');
  }
}

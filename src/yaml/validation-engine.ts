import { Agent, BaseAgent, ClaudeCodeAgent, OpenCodeAgent } from '../conversion/agent-parser';

/**
 * Unified validation engine for all agent formats
 * Provides consistent validation rules and error handling
 */

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field?: string;
  message: string;
}

export type AgentFormat = 'base' | 'claude-code' | 'opencode';

export class ValidationEngine {
  /**
   * Main validation entry point - validates any agent format
   */
  validate(agent: Agent): ValidationResult {
    switch (agent.format) {
      case 'base':
        return this.validateBase(agent.frontmatter as BaseAgent);
      case 'claude-code':
        return this.validateClaudeCode(agent.frontmatter as ClaudeCodeAgent);
      case 'opencode':
        return this.validateOpenCode(agent.frontmatter as OpenCodeAgent);
      default:
        return {
          valid: false,
          errors: [
            {
              message: `Unknown agent format: ${agent.format}`,
              severity: 'error',
            },
          ],
          warnings: [],
        };
    }
  }

  /**
   * Validate Base agent format (single source of truth)
   */
  validateBase(agent: BaseAgent): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    this.validateRequiredField(agent.name, 'name', 'Name is required and cannot be empty', errors);
    this.validateRequiredField(
      agent.description,
      'description',
      'Description is required and cannot be empty',
      errors
    );

    // Name format validation
    if (agent.name && !/^[a-z0-9-]+$/.test(agent.name)) {
      warnings.push({
        field: 'name',
        message: 'Name should use lowercase letters, numbers, and hyphens only',
      });
    }

    // Description length validation
    this.validateDescriptionLength(agent.description, warnings);

    // Mode validation
    this.validateMode(agent.mode, errors);

    // Temperature validation (unified range: 0-2)
    this.validateTemperature(agent.temperature, 0, 2, errors);

    // Model validation
    this.validateModel(agent.model, warnings);

    // Tools validation
    this.validateToolsObject(agent.tools, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate Claude Code agent format
   */
  validateClaudeCode(agent: ClaudeCodeAgent): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    this.validateRequiredField(agent.name, 'name', 'Name is required and cannot be empty', errors);
    this.validateRequiredField(
      agent.description,
      'description',
      'Description is required and cannot be empty',
      errors
    );

    // Name format validation
    if (agent.name && !/^[a-z0-9-]+$/.test(agent.name)) {
      warnings.push({
        field: 'name',
        message: 'Name should use lowercase letters, numbers, and hyphens only',
      });
    }

    // Description length validation
    this.validateDescriptionLength(agent.description, warnings);

    // Model validation
    this.validateModel(agent.model, warnings);

    // Tools validation (string format for Claude Code)
    if (agent.tools !== undefined) {
      if (typeof agent.tools !== 'string') {
        errors.push({
          field: 'tools',
          message: 'Tools must be a comma-separated string for Claude Code format',
          severity: 'error',
        });
      } else if (agent.tools.trim() === '') {
        warnings.push({
          field: 'tools',
          message: 'No tools specified, agent may have limited functionality',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate OpenCode agent format
   */
  validateOpenCode(agent: OpenCodeAgent): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields - CRITICAL FIX: Add name validation
    this.validateRequiredField(agent.name, 'name', 'Name is required for OpenCode format', errors);
    this.validateRequiredField(
      agent.description,
      'description',
      'Description is required and cannot be empty',
      errors
    );
    this.validateRequiredField(
      agent.mode,
      'mode',
      'Mode is required and must be one of: primary, subagent, all',
      errors
    );

    // Name format validation
    if (agent.name && !/^[a-z0-9-]+$/.test(agent.name)) {
      warnings.push({
        field: 'name',
        message: 'Name should use lowercase letters, numbers, and hyphens only',
      });
    }

    // Description length validation
    this.validateDescriptionLength(agent.description, warnings);

    // Mode validation
    this.validateMode(agent.mode, errors);

    // Model validation
    this.validateModel(agent.model, warnings);

    // Temperature validation (unified range: 0-2, not 0.0-1.0)
    this.validateTemperature(agent.temperature, 0, 2, errors);

    // Tools validation
    this.validateToolsObject(agent.tools, errors, warnings);

    // Permission validation
    this.validatePermissions(agent.permission, errors);

    // Tags validation
    this.validateTagsArray(agent.tags, errors);

    // Category validation
    if (agent.category && typeof agent.category !== 'string') {
      errors.push({
        field: 'category',
        message: 'Category must be a string',
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
   * Validate multiple agents and return combined results
   */
  validateBatch(agents: Agent[]): {
    results: Array<ValidationResult & { agent: Agent }>;
    summary: { valid: number; errors: number; warnings: number };
  } {
    const results = agents.map((agent) => ({
      ...this.validate(agent),
      agent,
    }));

    const summary = {
      valid: results.filter((r) => r.valid).length,
      errors: results.reduce((sum, r) => sum + r.errors.length, 0),
      warnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
    };

    return { results, summary };
  }

  // Helper validation methods

  private validateRequiredField(
    value: any,
    field: string,
    message: string,
    errors: ValidationError[]
  ): void {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push({
        field,
        message,
        severity: 'error',
      });
    }
  }

  private validateDescriptionLength(
    description: string | undefined,
    warnings: ValidationWarning[]
  ): void {
    if (!description) return;

    if (description.length < 10) {
      warnings.push({
        field: 'description',
        message: 'Description is very short, consider adding more detail',
      });
    }

    if (description.length > 500) {
      warnings.push({
        field: 'description',
        message: 'Description is very long, consider making it more concise',
      });
    }
  }

  private validateMode(mode: string | undefined, errors: ValidationError[]): void {
    if (mode && !['subagent', 'primary', 'all'].includes(mode)) {
      errors.push({
        field: 'mode',
        message: 'Mode must be one of: subagent, primary, all',
        severity: 'error',
      });
    }
  }

  private validateTemperature(
    temperature: number | undefined,
    min: number,
    max: number,
    errors: ValidationError[]
  ): void {
    if (temperature !== undefined) {
      if (typeof temperature !== 'number') {
        errors.push({
          field: 'temperature',
          message: 'Temperature must be a number',
          severity: 'error',
        });
      } else if (temperature < min || temperature > max) {
        errors.push({
          field: 'temperature',
          message: `Temperature must be between ${min} and ${max}`,
          severity: 'error',
        });
      }
    }
  }

  private validateModel(model: string | undefined, warnings: ValidationWarning[]): void {
    if (model) {
      if (typeof model !== 'string') {
        // This should be an error, but keeping as warning for compatibility
        warnings.push({
          field: 'model',
          message: 'Model should be a string',
        });
      } else if (!model.includes('/') && !model.includes('-')) {
        warnings.push({
          field: 'model',
          message: 'Model format seems unusual, expected provider/model or provider-model format',
        });
      }
    }
  }

  private validateToolsObject(
    tools: Record<string, boolean> | undefined,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!tools) return;

    if (typeof tools !== 'object' || Array.isArray(tools)) {
      errors.push({
        field: 'tools',
        message: 'Tools must be an object with tool names as keys and boolean values',
        severity: 'error',
      });
      return;
    }

    // Validate each tool value
    for (const [toolName, toolValue] of Object.entries(tools)) {
      if (typeof toolValue !== 'boolean') {
        errors.push({
          field: `tools.${toolName}`,
          message: `Tool '${toolName}' must have a boolean value`,
          severity: 'error',
        });
      }
    }

    // Check for enabled tools
    const enabledTools = Object.entries(tools)
      .filter(([_, enabled]) => enabled === true)
      .map(([name, _]) => name);

    if (enabledTools.length === 0) {
      warnings.push({
        field: 'tools',
        message: 'No tools are enabled, agent may have limited functionality',
      });
    }

    // Check tool balance
    this.validateToolBalance(tools, warnings);
  }

  private validateToolBalance(tools: Record<string, boolean>, warnings: ValidationWarning[]): void {
    const hasRead = tools.read === true;
    const hasWrite = tools.write === true || tools.edit === true;

    if (hasWrite && !hasRead) {
      warnings.push({
        field: 'tools',
        message: 'Agent can write/edit but not read files, which may cause issues',
      });
    }
  }

  private validatePermissions(
    permission: Record<string, any> | undefined,
    errors: ValidationError[]
  ): void {
    if (!permission) return;

    if (typeof permission !== 'object' || Array.isArray(permission)) {
      errors.push({
        field: 'permission',
        message: 'Permission must be an object with action names as keys and permission values',
        severity: 'error',
      });
      return;
    }

    // Validate each permission value
    for (const [action, permValue] of Object.entries(permission)) {
      if (!['allow', 'ask', 'deny'].includes(permValue as string)) {
        errors.push({
          field: `permission.${action}`,
          message: `Permission for '${action}' must be one of: allow, ask, deny`,
          severity: 'error',
        });
      }
    }

    // Ensure required permissions are present
    this.validateRequiredPermissions(permission, errors);

    // Validate permission consistency (e.g., if write is allowed, read should be too)
    this.validatePermissionConsistency(permission, errors);
  }

  /**
   * Validate that required permissions are present
   */
  private validateRequiredPermissions(
    permission: Record<string, any>,
    errors: ValidationError[]
  ): void {
    const requiredPermissions = ['edit', 'bash', 'webfetch'];

    for (const requiredPerm of requiredPermissions) {
      if (!(requiredPerm in permission)) {
        errors.push({
          field: 'permission',
          message: `Required permission '${requiredPerm}' is missing`,
          severity: 'error',
        });
      }
    }
  }

  /**
   * Validate permission consistency for official OpenCode permissions
   */
  private validatePermissionConsistency(
    permission: Record<string, any>,
    errors: ValidationError[]
  ): void {
    // OpenCode only has edit, bash, and webfetch permissions
    // No additional consistency checks needed since all permissions are independent
  }

  private validateTagsArray(tags: string[] | undefined, errors: ValidationError[]): void {
    if (!tags) return;

    if (!Array.isArray(tags)) {
      errors.push({
        field: 'tags',
        message: 'Tags must be an array',
        severity: 'error',
      });
      return;
    }

    for (let i = 0; i < tags.length; i++) {
      if (typeof tags[i] !== 'string') {
        errors.push({
          field: `tags[${i}]`,
          message: 'All tags must be strings',
          severity: 'error',
        });
      }
    }
  }
}

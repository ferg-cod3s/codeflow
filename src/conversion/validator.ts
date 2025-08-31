import { Agent, BaseAgent, ClaudeCodeAgent, OpenCodeAgent } from './agent-parser';

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validation warning interface
 */
export interface ValidationWarning {
  field?: string;
  message: string;
}

/**
 * Agent validation system
 */
export class AgentValidator {
  /**
   * Validate base agent format (single source of truth)
   */
  validateBase(agent: BaseAgent): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields
    if (!agent.name || agent.name.trim() === '') {
      errors.push({
        field: 'name',
        message: 'Name is required and cannot be empty',
        severity: 'error',
      });
    }

    if (!agent.description || agent.description.trim() === '') {
      errors.push({
        field: 'description',
        message: 'Description is required and cannot be empty',
        severity: 'error',
      });
    }

    // Name format validation (should be lowercase with hyphens)
    if (agent.name && !/^[a-z0-9-]+$/.test(agent.name)) {
      warnings.push({
        field: 'name',
        message: 'Name should use lowercase letters, numbers, and hyphens only',
      });
    }

    // Description length validation
    if (agent.description && agent.description.length < 10) {
      warnings.push({
        field: 'description',
        message: 'Description is very short, consider adding more detail',
      });
    }

    if (agent.description && agent.description.length > 500) {
      warnings.push({
        field: 'description',
        message: 'Description is very long, consider making it more concise',
      });
    }

    // Mode validation - only validate if mode is present and not 'agent'
    if (
      agent.mode &&
      agent.mode !== 'agent' &&
      !(['subagent', 'primary'] as const).includes(agent.mode as any)
    ) {
      errors.push({
        field: 'mode',
        message: 'Mode must be either "subagent", "primary", or "agent"',
        severity: 'error',
      });
    }

    // Temperature validation
    if (agent.temperature !== undefined) {
      if (typeof agent.temperature !== 'number') {
        errors.push({
          field: 'temperature',
          message: 'Temperature must be a number',
          severity: 'error',
        });
      } else if (agent.temperature < 0 || agent.temperature > 2) {
        errors.push({
          field: 'temperature',
          message: 'Temperature must be between 0 and 2',
          severity: 'error',
        });
      }
    }

    // Model validation (basic format check)
    if (agent.model) {
      if (typeof agent.model !== 'string') {
        errors.push({
          field: 'model',
          message: 'Model must be a string',
          severity: 'error',
        });
      } else if (!agent.model.includes('/') && !agent.model.includes('-')) {
        warnings.push({
          field: 'model',
          message: 'Model format seems unusual, expected provider/model or provider-model format',
        });
      }
    }

    // Tools validation (object format for base)
    if (agent.tools) {
      if (typeof agent.tools !== 'object' || Array.isArray(agent.tools)) {
        errors.push({
          field: 'tools',
          message: 'Tools must be an object with tool names as keys and boolean values',
          severity: 'error',
        });
      } else {
        for (const [toolName, toolValue] of Object.entries(agent.tools)) {
          if (typeof toolValue !== 'boolean') {
            errors.push({
              field: `tools.${toolName}`,
              message: `Tool '${toolName}' must have a boolean value`,
              severity: 'error',
            });
          }
        }

        // Check for common tools
        const enabledTools = Object.entries(agent.tools)
          .filter(([_, enabled]) => enabled === true)
          .map(([name, _]) => name);

        if (enabledTools.length === 0) {
          warnings.push({
            field: 'tools',
            message: 'No tools are enabled, agent may have limited functionality',
          });
        }

        // Check if read/write tools are balanced
        const hasRead = agent.tools.read === true;
        const hasWrite = agent.tools.write === true;
        const hasEdit = agent.tools.edit === true;

        if (hasWrite && !hasRead) {
          warnings.push({
            field: 'tools',
            message: 'Agent can write but not read files, which may cause issues',
          });
        }

        if (hasEdit && !hasRead) {
          warnings.push({
            field: 'tools',
            message: 'Agent can edit but not read files, which may cause issues',
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate Claude Code agent format (converted from base)
   */
  validateClaudeCode(agent: ClaudeCodeAgent): ValidationResult {
    // Convert Claude Code agent to Base format for validation
    const baseAgent: BaseAgent = {
      ...agent,
      tools: agent.tools
        ? agent.tools.split(',').reduce(
            (acc, tool) => {
              acc[tool.trim()] = true;
              return acc;
            },
            {} as Record<string, boolean>
          )
        : undefined,
    };
    return this.validateBase(baseAgent);
  }

  /**
   * Validate OpenCode agent format (converted from base)
   */
  validateOpenCode(agent: OpenCodeAgent): ValidationResult {
    // For OpenCode, name is optional but description and mode are required
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check required fields for OpenCode
    if (!agent.description || agent.description.trim() === '') {
      errors.push({
        field: 'description',
        message: 'Description is required and cannot be empty',
        severity: 'error',
      });
    }

    if (!agent.mode) {
      errors.push({
        field: 'mode',
        message: 'Mode is required for OpenCode agents',
        severity: 'error',
      });
    }

    // If name is missing, that's an error for OpenCode validation
    if (!agent.name || agent.name.trim() === '') {
      errors.push({
        field: 'name',
        message: 'Name is required for OpenCode agents',
        severity: 'error',
      });
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      return {
        valid: false,
        errors,
        warnings,
      };
    }

    // Convert OpenCode agent to Base format for further validation
    const baseAgent: BaseAgent = {
      ...agent,
      name: agent.name!, // We know name exists at this point
    };

    return this.validateBase(baseAgent);
  }

  /**
   * Validate agent of any format
   */
  validateAgent(agent: Agent): ValidationResult {
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
   * Validate multiple agents and return combined results
   */
  validateBatch(agents: Agent[]): {
    results: Array<ValidationResult & { agent: Agent }>;
    summary: { valid: number; errors: number; warnings: number };
  } {
    const results = agents.map((agent) => ({
      ...this.validateAgent(agent),
      agent,
    }));

    const summary = {
      valid: results.filter((r) => r.valid).length,
      errors: results.reduce((sum, r) => sum + r.errors.length, 0),
      warnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
    };

    return { results, summary };
  }

  /**
   * Validate round-trip conversion preserves data integrity
   */
  validateRoundTrip(original: Agent, converted: Agent): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check format consistency
    if (original.format !== converted.format) {
      errors.push({
        message: `Format mismatch: expected ${original.format}, got ${converted.format}`,
        severity: 'error',
      });
    }

    // Check name consistency
    if (original.name !== converted.name) {
      errors.push({
        field: 'name',
        message: `Name changed during conversion: ${original.name} -> ${converted.name}`,
        severity: 'error',
      });
    }

    // Check content consistency
    if (original.content.trim() !== converted.content.trim()) {
      errors.push({
        field: 'content',
        message: 'Content changed during conversion',
        severity: 'error',
      });
    }

    // Check fields that should be preserved based on the target format
    const preservedFields = ['name', 'description'];

    // Claude Code format only preserves name, description, and tools
    if (original.format === 'base' && converted.format === 'base') {
      // For base-to-base conversions, preserve all fields
      preservedFields.push('mode', 'model', 'temperature');
    }

    for (const field of preservedFields) {
      const originalValue = (original.frontmatter as any)[field];
      const convertedValue = (converted.frontmatter as any)[field];

      // Skip undefined values (optional fields)
      if (originalValue === undefined && convertedValue === undefined) {
        continue;
      }

      // Handle tools field specially - it may change format between platforms
      if (field === 'tools') {
        continue; // Skip tools validation as format may change
      }

      if (JSON.stringify(originalValue) !== JSON.stringify(convertedValue)) {
        errors.push({
          field: `frontmatter.${field}`,
          message: `Field '${field}' changed during conversion: ${JSON.stringify(originalValue)} -> ${JSON.stringify(convertedValue)}`,
          severity: 'error',
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
   * Get validation recommendations for improving agent quality
   */
  getRecommendations(agent: Agent): string[] {
    const recommendations: string[] = [];
    const validation = this.validateAgent(agent);

    // Add recommendations based on validation results
    for (const warning of validation.warnings) {
      recommendations.push(warning.message);
    }

    // Additional quality recommendations based on format
    if (agent.format === 'claude-code') {
      // Claude Code specific recommendations
      const claudeAgent = agent.frontmatter as ClaudeCodeAgent;
      if (!claudeAgent.name) {
        recommendations.push('Claude Code agents require a name field');
      }
      if (!claudeAgent.description) {
        recommendations.push('Claude Code agents require a description field');
      }
      if (agent.content.length < 100) {
        recommendations.push(
          'Agent content is quite short, consider adding more detailed instructions'
        );
      }
    } else if (agent.format === 'opencode') {
      // OpenCode specific recommendations
      const openCodeAgent = agent.frontmatter as OpenCodeAgent;
      if (!openCodeAgent.mode) {
        recommendations.push(
          "Consider specifying a mode (subagent or primary) to clarify the agent's role"
        );
      }
      if (!openCodeAgent.model) {
        recommendations.push('Consider specifying a model to ensure consistent behavior');
      }
      if (openCodeAgent.temperature === undefined) {
        recommendations.push('Consider setting a temperature value to control output randomness');
      }
      if (agent.content.length < 100) {
        recommendations.push(
          'Agent content is quite short, consider adding more detailed instructions'
        );
      }
    } else {
      // Base format recommendations
      const baseAgent = agent.frontmatter as BaseAgent;
      if (!baseAgent.mode) {
        recommendations.push(
          "Consider specifying a mode (subagent or primary) to clarify the agent's role"
        );
      }
      if (!baseAgent.model) {
        recommendations.push('Consider specifying a model to ensure consistent behavior');
      }
      if (baseAgent.temperature === undefined) {
        recommendations.push('Consider setting a temperature value to control output randomness');
      }
      if (agent.content.length < 100) {
        recommendations.push(
          'Agent content is quite short, consider adding more detailed instructions'
        );
      }
    }

    return recommendations;
  }
}

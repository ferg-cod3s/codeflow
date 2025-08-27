import { Agent, BaseAgent, ClaudeCodeAgent, OpenCodeAgent } from "./agent-parser";

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
   * Validate base agent format
   */
  validateBase(agent: BaseAgent): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Required fields
    if (!agent.description || agent.description.trim() === '') {
      errors.push({
        field: 'description',
        message: 'Description is required and cannot be empty',
        severity: 'error'
      });
    }
    
    // Description length validation
    if (agent.description && agent.description.length < 10) {
      warnings.push({
        field: 'description',
        message: 'Description is very short, consider adding more detail'
      });
    }
    
    if (agent.description && agent.description.length > 500) {
      warnings.push({
        field: 'description',
        message: 'Description is very long, consider making it more concise'
      });
    }
    
    // Mode validation
    if (agent.mode && !['subagent', 'primary'].includes(agent.mode)) {
      errors.push({
        field: 'mode',
        message: 'Mode must be either "subagent" or "primary"',
        severity: 'error'
      });
    }
    
    // Temperature validation
    if (agent.temperature !== undefined) {
      if (typeof agent.temperature !== 'number') {
        errors.push({
          field: 'temperature',
          message: 'Temperature must be a number',
          severity: 'error'
        });
      } else if (agent.temperature < 0 || agent.temperature > 2) {
        errors.push({
          field: 'temperature',
          message: 'Temperature must be between 0 and 2',
          severity: 'error'
        });
      }
    }
    
    // Model validation (basic format check)
    if (agent.model) {
      if (typeof agent.model !== 'string') {
        errors.push({
          field: 'model',
          message: 'Model must be a string',
          severity: 'error'
        });
      } else if (!agent.model.includes('/') && !agent.model.includes('-')) {
        warnings.push({
          field: 'model',
          message: 'Model format seems unusual, expected provider/model or provider-model format'
        });
      }
    }
    
    // Tools validation
    if (agent.tools) {
      if (typeof agent.tools !== 'object' || Array.isArray(agent.tools)) {
        errors.push({
          field: 'tools',
          message: 'Tools must be an object with tool names as keys and boolean values',
          severity: 'error'
        });
      } else {
        for (const [toolName, toolValue] of Object.entries(agent.tools)) {
          if (typeof toolValue !== 'boolean') {
            errors.push({
              field: `tools.${toolName}`,
              message: `Tool '${toolName}' must have a boolean value`,
              severity: 'error'
            });
          }
        }
        
        // Check for common tools
        const commonTools = ['read', 'write', 'edit', 'bash', 'grep', 'glob', 'list'];
        const enabledTools = Object.entries(agent.tools)
          .filter(([_, enabled]) => enabled === true)
          .map(([name, _]) => name);
          
        if (enabledTools.length === 0) {
          warnings.push({
            field: 'tools',
            message: 'No tools are enabled, agent may have limited functionality'
          });
        }
        
        // Check if read/write tools are balanced
        const hasRead = agent.tools.read === true;
        const hasWrite = agent.tools.write === true;
        const hasEdit = agent.tools.edit === true;
        
        if (hasWrite && !hasRead) {
          warnings.push({
            field: 'tools',
            message: 'Agent can write but not read files, which may cause issues'
          });
        }
        
        if (hasEdit && !hasRead) {
          warnings.push({
            field: 'tools',
            message: 'Agent can edit but not read files, which may cause issues'
          });
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Validate Claude Code agent format
   * Currently identical to base validation but may diverge
   */
  validateClaudeCode(agent: ClaudeCodeAgent): ValidationResult {
    return this.validateBase(agent);
  }
  
  /**
   * Validate OpenCode agent format
   */
  validateOpenCode(agent: OpenCodeAgent): ValidationResult {
    const result = this.validateBase(agent);
    
    // Additional OpenCode-specific validations
    const errors = [...result.errors];
    const warnings = [...result.warnings];
    
    // Validate OpenCode-specific fields if they exist
    if (agent.usage && typeof agent.usage !== 'string') {
      errors.push({
        field: 'usage',
        message: 'Usage must be a string',
        severity: 'error'
      });
    }
    
    if (agent.do_not_use_when && typeof agent.do_not_use_when !== 'string') {
      errors.push({
        field: 'do_not_use_when',
        message: 'do_not_use_when must be a string',
        severity: 'error'
      });
    }
    
    if (agent.escalation && typeof agent.escalation !== 'string') {
      errors.push({
        field: 'escalation',
        message: 'Escalation must be a string',
        severity: 'error'
      });
    }
    
    if (agent.examples && typeof agent.examples !== 'string') {
      errors.push({
        field: 'examples',
        message: 'Examples must be a string',
        severity: 'error'
      });
    }
    
    if (agent.prompts && typeof agent.prompts !== 'string') {
      errors.push({
        field: 'prompts',
        message: 'Prompts must be a string',
        severity: 'error'
      });
    }
    
    if (agent.constraints && typeof agent.constraints !== 'string') {
      errors.push({
        field: 'constraints',
        message: 'Constraints must be a string',
        severity: 'error'
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
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
          errors: [{
            message: `Unknown agent format: ${agent.format}`,
            severity: 'error'
          }],
          warnings: []
        };
    }
  }
  
  /**
   * Validate multiple agents and return combined results
   */
  validateBatch(agents: Agent[]): { results: Array<ValidationResult & { agent: Agent }>; summary: { valid: number; errors: number; warnings: number } } {
    const results = agents.map(agent => ({
      ...this.validateAgent(agent),
      agent
    }));
    
    const summary = {
      valid: results.filter(r => r.valid).length,
      errors: results.reduce((sum, r) => sum + r.errors.length, 0),
      warnings: results.reduce((sum, r) => sum + r.warnings.length, 0)
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
        severity: 'error'
      });
    }
    
    // Check name consistency
    if (original.name !== converted.name) {
      errors.push({
        field: 'name',
        message: `Name changed during conversion: ${original.name} -> ${converted.name}`,
        severity: 'error'
      });
    }
    
    // Check content consistency
    if (original.content.trim() !== converted.content.trim()) {
      errors.push({
        field: 'content',
        message: 'Content changed during conversion',
        severity: 'error'
      });
    }
    
    // Check frontmatter consistency
    const originalKeys = Object.keys(original.frontmatter).sort();
    const convertedKeys = Object.keys(converted.frontmatter).sort();
    
    if (JSON.stringify(originalKeys) !== JSON.stringify(convertedKeys)) {
      errors.push({
        field: 'frontmatter',
        message: 'Frontmatter keys changed during conversion',
        severity: 'error'
      });
    }
    
    // Check individual field values
    for (const key of originalKeys) {
      const originalValue = original.frontmatter[key];
      const convertedValue = converted.frontmatter[key];
      
      if (JSON.stringify(originalValue) !== JSON.stringify(convertedValue)) {
        errors.push({
          field: `frontmatter.${key}`,
          message: `Value changed during conversion: ${JSON.stringify(originalValue)} -> ${JSON.stringify(convertedValue)}`,
          severity: 'error'
        });
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
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
    
    // Additional quality recommendations
    if (!agent.frontmatter.mode) {
      recommendations.push('Consider specifying a mode (subagent or primary) to clarify the agent\'s role');
    }
    
    if (!agent.frontmatter.model) {
      recommendations.push('Consider specifying a model to ensure consistent behavior');
    }
    
    if (agent.frontmatter.temperature === undefined) {
      recommendations.push('Consider setting a temperature value to control output randomness');
    }
    
    if (agent.content.length < 100) {
      recommendations.push('Agent content is quite short, consider adding more detailed instructions');
    }
    
    return recommendations;
  }
}
import fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';
import { ValidationReport } from '../types/index.js';
import { parseMarkdownFrontmatter } from '../utils/yaml-utils.js';

export class OpenCodeValidator {
  async validateAgent(filePath: string): Promise<ValidationReport> {
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter, body } = parseMarkdownFrontmatter(content);
    
    const report: ValidationReport = {
      file: filePath,
      format: 'opencode-agent',
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Skip validation if this doesn't look like an agent file
    if (!this.looksLikeAgent(frontmatter, content)) {
      report.warnings.push({
        field: 'file-type',
        message: 'File does not appear to be an OpenCode agent'
      });
      return report;
    }

    // Note: name is derived from filename by opencode, not required in frontmatter

    if (!frontmatter.description) {
      report.errors.push({
        field: 'description',
        message: 'Description is required',
        severity: 'error'
      });
      report.valid = false;
    }

    // Mode validation
    if (frontmatter.mode && !['primary', 'subagent', 'all'].includes(frontmatter.mode)) {
      report.errors.push({
        field: 'mode',
        message: 'Mode must be one of: primary, subagent, all',
        severity: 'error'
      });
      report.valid = false;
    }

    // Temperature validation
    if (frontmatter.temperature !== undefined) {
      if (typeof frontmatter.temperature !== 'number' || frontmatter.temperature < 0 || frontmatter.temperature > 1) {
        report.errors.push({
          field: 'temperature',
          message: 'Temperature must be a number between 0 and 1',
          severity: 'error'
        });
        report.valid = false;
      }
    }

    // Tools validation
    if (frontmatter.tools && typeof frontmatter.tools !== 'object') {
      report.errors.push({
        field: 'tools',
        message: 'Tools must be an object',
        severity: 'error'
      });
      report.valid = false;
    }

    // Warnings
    if (!body || body.trim().length === 0) {
      report.warnings.push({
        field: 'prompt',
        message: 'Agent prompt/body is empty'
      });
    }

    if (frontmatter.mode === 'primary' && (!frontmatter.tools || Object.keys(frontmatter.tools).length === 0)) {
      report.warnings.push({
        field: 'tools',
        message: 'Primary agents should have tools enabled'
      });
    }

    // Suggestions
    if (frontmatter.mode === 'subagent' && frontmatter.tools && Object.keys(frontmatter.tools).length > 0) {
      report.suggestions.push('Consider limiting tools for subagents to maintain focus');
    }

    return report;
  }

  async validateCommand(filePath: string): Promise<ValidationReport> {
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter, body } = parseMarkdownFrontmatter(content);
    
    const report: ValidationReport = {
      file: filePath,
      format: 'opencode-command',
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Check detection logic
    const looksLikeCommand = this.looksLikeCommand(frontmatter, content);
    const looksLikeBaseAgent = this.looksLikeBaseAgentCommand(frontmatter, content);
    
    // If this looks like a base-agent command, it's not a valid OpenCode command
    if (looksLikeBaseAgent) {
      report.errors.push({
        field: 'format',
        message: 'File appears to be in base-agent format, not OpenCode format',
        severity: 'error'
      });
      report.suggestions.push('Run "codeflow convert commands" to convert to OpenCode format');
      return report;
    }
    
    // Skip validation if this doesn't look like a command file
    if (!looksLikeCommand) {
      report.warnings.push({
        field: 'file-type',
        message: 'File does not appear to be an OpenCode command'
      });
      return report;
    }

    // Required fields validation
    if (!frontmatter.name) {
      report.errors.push({
        field: 'name',
        message: 'Name is required',
        severity: 'error'
      });
      report.valid = false;
    }

    if (!frontmatter.description) {
      report.errors.push({
        field: 'description',
        message: 'Description is required',
        severity: 'error'
      });
      report.valid = false;
    }

    // Template validation
    if (!frontmatter.template || frontmatter.template.trim().length === 0) {
      report.errors.push({
        field: 'template',
        message: 'Command template is required',
        severity: 'error'
      });
      report.valid = false;
    }

    // Subtask validation
    if (frontmatter.subtask !== undefined && typeof frontmatter.subtask !== 'boolean') {
      report.errors.push({
        field: 'subtask',
        message: 'Subtask must be a boolean',
        severity: 'error'
      });
      report.valid = false;
    }

    // Warnings
    if (body.includes('$ARGUMENTS') && body.includes('$1')) {
      report.warnings.push({
        field: 'template',
        message: 'Using both $ARGUMENTS and positional parameters may cause confusion'
      });
    }

    return report;
  }

  async validateSkill(filePath: string): Promise<ValidationReport> {
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter, body } = parseMarkdownFrontmatter(content);
    
    const report: ValidationReport = {
      file: filePath,
      format: 'opencode-skill',
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Skip validation if this doesn't look like a skill file
    if (!this.looksLikeSkill(frontmatter, content)) {
      report.warnings.push({
        field: 'file-type',
        message: 'File does not appear to be an OpenCode skill'
      });
      return report;
    }

    // Required fields validation
    if (!frontmatter.name) {
      report.errors.push({
        field: 'name',
        message: 'Name is required',
        severity: 'error'
      });
      report.valid = false;
    }

    if (!frontmatter.description) {
      report.errors.push({
        field: 'description',
        message: 'Description is required',
        severity: 'error'
      });
      report.valid = false;
    }

    // NoReply validation
    if (frontmatter.noReply !== undefined && typeof frontmatter.noReply !== 'boolean') {
      report.errors.push({
        field: 'noReply',
        message: 'NoReply must be a boolean',
        severity: 'error'
      });
      report.valid = false;
    }

    // Warnings
    if (!body || body.trim().length === 0) {
      report.warnings.push({
        field: 'prompt',
        message: 'Skill prompt/body is empty'
      });
    }

    return report;
  }

  async validateDirectory(dirPath: string, format: 'opencode-agent' | 'opencode-command' | 'opencode-skill'): Promise<ValidationReport[]> {
    // Use glob to recursively find all markdown files
    const allMarkdownFiles = await glob('**/*.md', { cwd: dirPath });
    
    // Filter out documentation and non-agent files
    const excludedPatterns = [
      /^README\.md$/i,
      /^TODO\.md$/i,
      /^CHANGELOG\.md$/i,
      /^CONTRIBUTING\.md$/i,
      /^LICENSE\.md$/i,
      /^.*_SUMMARY\.md$/i,
      /^.*_GUIDE\.md$/i,
      /^docs\//,
      /^\.github\//,
      /^test-.*\//,
      /^plans\//,
      /^examples\//,
      /^node_modules\//
    ];

    const markdownFiles = allMarkdownFiles.filter(file => 
      !excludedPatterns.some(pattern => pattern.test(file))
    );

    const reports: ValidationReport[] = [];

    for (const file of markdownFiles) {
      const filePath = path.join(dirPath, file);
      let report: ValidationReport;

      switch (format) {
        case 'opencode-agent':
          report = await this.validateAgent(filePath);
          break;
        case 'opencode-command':
          report = await this.validateCommand(filePath);
          break;
        case 'opencode-skill':
          report = await this.validateSkill(filePath);
          break;
      }

      reports.push(report);
    }

    return reports;
  }

  /**
   * Check if file appears to be an actual agent based on content and frontmatter
   */
  private looksLikeAgent(frontmatter: any, content: string): boolean {
    // Must have some frontmatter
    if (!frontmatter || Object.keys(frontmatter).length === 0) {
      return false;
    }

    // Check for agent-specific fields
    const agentIndicators = [
      'mode',           // OpenCode agents have mode
      'temperature',     // OpenCode agents may have temperature
      'tools',          // OpenCode agents have tools
      'permission',      // OpenCode agents have permissions
      'model',          // OpenCode agents may specify model
      'prompt',         // Agent content indicator
      'primary_objective', // Base agent format
      'anti_objectives',    // Base agent format
      'intended_followups',  // Base agent format
      'category'        // Base agent format
    ];

    const hasAgentFields = agentIndicators.some(field => frontmatter[field] !== undefined);
    
    // Check content for agent-like patterns
    const contentIndicators = [
      /you are|act as/i,           // Role-playing instructions
      /expert|specialist/i,         // Expertise indicators
      /help me with/i,             // Task-oriented content
      /objective|goal/i,           // Purpose statements
      /capabilities|skills/i,        // Ability descriptions
      /tools?:|permissions:/i       // Configuration sections
    ];

    const hasAgentContent = contentIndicators.some(pattern => pattern.test(content));

    // Must have either agent fields OR agent content patterns
    return hasAgentFields || hasAgentContent;
  }

  /**
   * Check if file appears to be an actual command based on content and frontmatter
   */
  private looksLikeCommand(frontmatter: any, content: string): boolean {
    // Must have some frontmatter
    if (!frontmatter || Object.keys(frontmatter).length === 0) {
      return false;
    }

    // Check for command-specific fields
    const commandIndicators = [
      'template',       // Commands have templates
      'subtask',        // Commands may have subtask flag
      'arguments',      // Commands define arguments
      'parameters',     // Commands define parameters
      'usage',          // Commands have usage examples
      'examples'        // Commands have examples
    ];

    const hasCommandFields = commandIndicators.some(field => frontmatter[field] !== undefined);
    
    // Check content for command-like patterns
    const contentIndicators = [
      /\$[A-Z_]+/,               // Variable placeholders like $ARGUMENTS
      /usage:/i,                  // Usage sections
      /arguments:/i,               // Argument descriptions
      /parameters:/i,              // Parameter descriptions
      /example:/i,                 // Example usage
      /```.*\$|```.*arg/        // Code examples with arguments
    ];

    const hasCommandContent = contentIndicators.some(pattern => pattern.test(content));

    // Must have either command fields OR command content patterns
    return hasCommandFields || hasCommandContent;
  }

  /**
   * Check if file appears to be an actual skill based on content and frontmatter
   */
  private looksLikeSkill(frontmatter: any, content: string): boolean {
    // Must have some frontmatter
    if (!frontmatter || Object.keys(frontmatter).length === 0) {
      return false;
    }

    // Check for skill-specific fields
    const skillIndicators = [
      'noReply',        // Skills may have noReply flag
      'trigger',         // Skills have triggers
      'activation',     // Skills have activation conditions
      'context',        // Skills define context
      'scope'           // Skills define scope
    ];

    const hasSkillFields = skillIndicators.some(field => frontmatter[field] !== undefined);
    
    // Check content for skill-like patterns
    const contentIndicators = [
      /when|trigger/i,           // Trigger conditions
      /if.*then/i,               // Conditional logic
      /respond|reply/i,           // Response patterns
      /no.?reply/i,              // No-reply instructions
      /context:/i,                // Context definitions
      /scope:/i                   // Scope definitions
    ];

    const hasSkillContent = contentIndicators.some(pattern => pattern.test(content));

    // Must have either skill fields OR skill content patterns
    return hasSkillFields || hasSkillContent;
  }

  /**
   * Check if file appears to be a base-agent format command
   */
  private looksLikeBaseAgentCommand(frontmatter: any, content: string): boolean {
    // Check for base-agent command specific fields
    const baseAgentIndicators = [
      'inputs',          // Base-agent commands have inputs
      'outputs',         // Base-agent commands have outputs
      'parameters',      // Base-agent commands have parameters
      'cache_strategy',  // Base-agent commands have cache strategy
      'command_schema_version', // Base-agent commands have schema version
      'last_updated',    // Base-agent commands have last updated
      'subtask'          // Base-agent commands have subtask flag
    ];

    const hasBaseAgentFields = baseAgentIndicators.some(field => frontmatter[field] !== undefined);
    
    // Check content for base-agent patterns
    const contentIndicators = [
      /inputs:/i,                    // Input definitions
      /outputs:/i,                   // Output definitions
      /cache_strategy:/i,             // Cache strategy
      /command_schema_version:/i,       // Schema version
      /last_updated:/i                 // Last updated
    ];

    const hasBaseAgentContent = contentIndicators.some(pattern => pattern.test(content));

    // Must have base-agent specific fields
    return hasBaseAgentFields || hasBaseAgentContent;
  }
}
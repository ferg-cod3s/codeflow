import { Agent, BaseAgent, ClaudeCodeAgent, OpenCodeAgent } from './agent-parser.js';
import { ValidationEngine } from '../yaml/validation-engine.js';
import { readFile, readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { findAgentManifest } from '../utils/manifest-discovery.js';

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
 * Duplicate validation result interface
 */
export interface DuplicateValidationResult {
  valid: boolean;
  totalAgents: number;
  canonicalAgentCount: number;
  duplicates: Array<{
    agentName: string;
    totalCopies?: number;
    expectedCopies?: number;
    extraCopies?: string[];
    canonicalSources?: string[];
    issue?: string;
    missingFormats?: string[];
    existingLocations?: string[];
  }>;
}

/**
 * Canonical validation result interface
 */
export interface CanonicalValidationResult {
  valid: boolean;
  manifestAgents: number;
  expectedCount: number;
  errors: Array<{
    agent: string;
    issue: string;
    suggestion?: string;
  }>;
}

/**
 * Batch validation result interface
 */
export interface BatchValidationResult {
  results: Array<ValidationResult & { agent: string }>;
  summary: {
    total: number;
    valid: number;
    errors: number;
    warnings: number;
    errorsByType: Record<string, number>;
    warningsByType: Record<string, number>;
  };
}

/**
 * Agent validation system
 */
export class AgentValidator {
  private validationEngine: ValidationEngine;

  constructor() {
    this.validationEngine = new ValidationEngine();
  }

  /**
   * Validate base agent format using ValidationEngine
   */
  validateBase(agent: BaseAgent): ValidationResult {
    return this.validationEngine.validateBase(agent);
  }

  /**
   * Validate Claude Code agent format using ValidationEngine
   */
  validateClaudeCode(agent: ClaudeCodeAgent): ValidationResult {
    return this.validationEngine.validateClaudeCode(agent);
  }

  /**
   * Validate OpenCode agent format using ValidationEngine
   */
  validateOpenCode(agent: OpenCodeAgent): ValidationResult {
    return this.validationEngine.validateOpenCode(agent);
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
   * Duplicate detection validation
   */
  async validateNoDuplicates(agentDirectories: string[]): Promise<DuplicateValidationResult> {
    const agentsByName: Record<
      string,
      Array<{ file: string; format: string; directory: string }>
    > = {};
    const duplicates: Array<{
      agentName: string;
      totalCopies?: number;
      expectedCopies?: number;
      extraCopies?: string[];
      canonicalSources?: string[];
      issue?: string;
      missingFormats?: string[];
      existingLocations?: string[];
    }> = [];

    // Recursive function to find all .md files in a directory
    async function findMarkdownFiles(dir: string, baseDir = ''): Promise<string[]> {
      const files: string[] = [];
      try {
        const entries = await readdir(dir);

        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const stats = await stat(fullPath);

          if (stats.isDirectory()) {
            const subFiles = await findMarkdownFiles(fullPath, path.join(baseDir, entry));
            files.push(...subFiles);
          } else if (entry.endsWith('.md')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Directory doesn't exist or can't be read
        console.warn(`⚠️ Could not read directory ${dir}: ${(error as Error).message}`);
      }

      return files;
    }

    for (const directory of agentDirectories) {
      const files = await findMarkdownFiles(directory);

      for (const file of files) {
        const basename = path.basename(file, '.md');
        const format = this.detectFormatFromPath(file);

        if (!agentsByName[basename]) {
          agentsByName[basename] = [];
        }

        agentsByName[basename].push({
          file,
          format,
          directory: path.dirname(file),
        });
      }
    }

    // Find agents with more than expected formats (base, claude-code, opencode)
    Object.entries(agentsByName).forEach(([name, locations]) => {
      const expectedFormats = ['base', 'claude-code', 'opencode'];
      const actualFormats = locations.map((l) => l.format);

      // Check for extra copies beyond the 3 canonical formats
      const extraCopies = locations.filter((loc, index) => {
        const format = loc.format;
        const firstOccurrence = actualFormats.indexOf(format);
        return index !== firstOccurrence; // This is a duplicate of the format
      });

      if (extraCopies.length > 0) {
        duplicates.push({
          agentName: name,
          totalCopies: locations.length,
          expectedCopies: 3,
          extraCopies: extraCopies.map((c) => c.file),
          canonicalSources: locations
            .filter(
              (l) =>
                (l.format === 'base' &&
                  l.file.includes('base-agents/') &&
                  !l.file.includes('backup/')) ||
                (l.format === 'claude-code' &&
                  l.file.includes('.claude/agents/') &&
                  !l.file.includes('backup/')) ||
                (l.format === 'opencode' &&
                  l.file.includes('.opencode/agent/') &&
                  !l.file.includes('backup/'))
            )
            .map((c) => c.file),
        });
      }

      // Check for missing canonical formats
      const missingFormats = expectedFormats.filter((f) => !actualFormats.includes(f));
      if (missingFormats.length > 0) {
        duplicates.push({
          agentName: name,
          issue: 'missing_canonical_formats',
          missingFormats,
          existingLocations: locations.map((l) => l.file),
        });
      }
    });

    return {
      valid: duplicates.length === 0,
      totalAgents: Object.keys(agentsByName).length,
      canonicalAgentCount: Object.keys(agentsByName).filter(
        (name) =>
          agentsByName[name].length >= 3 && // At least 3 formats (may have extras)
          agentsByName[name].some((l) => l.directory.includes('base-agents')) &&
          agentsByName[name].some((l) => l.directory.includes('.claude')) &&
          agentsByName[name].some((l) => l.directory.includes('.opencode'))
      ).length,
      duplicates,
    };
  }

  /**
   * Canonical source integrity validation
   */
  async validateCanonicalIntegrity(): Promise<CanonicalValidationResult> {
    let manifestPath: string;
    try {
      const discovery = await findAgentManifest();
      manifestPath = discovery.path;
    } catch {
      return {
        valid: false,
        manifestAgents: 0,
        expectedCount: 42,
        errors: [
          {
            agent: 'manifest',
            issue: 'AGENT_MANIFEST.json not found',
            suggestion:
              'Run setup from the codeflow repository or copy AGENT_MANIFEST.json manually',
          },
        ],
      };
    }

    if (!existsSync(manifestPath)) {
      return {
        valid: false,
        manifestAgents: 0,
        expectedCount: 42,
        errors: [
          {
            agent: 'manifest',
            issue: 'AGENT_MANIFEST.json not found',
            suggestion: 'Create AGENT_MANIFEST.json with canonical agent definitions',
          },
        ],
      };
    }

    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
    const errors = [];

    for (const agent of manifest.canonical_agents || []) {
      // Check that all three canonical files exist
      for (const [format, filePath] of Object.entries(agent.sources || {})) {
        if (!existsSync(filePath as string)) {
          errors.push({
            agent: agent.name,
            issue: `Missing canonical ${format} file: ${filePath}`,
          });
        }
      }

      // Validate content consistency (core functionality should be equivalent)
      if (errors.length === 0 && agent.sources) {
        try {
          const baseContent = await readFile(agent.sources.base as string, 'utf-8');
          const claudeContent = await readFile(agent.sources['claude-code'] as string, 'utf-8');
          const opencodeContent = await readFile(agent.sources.opencode as string, 'utf-8');

          // Extract descriptions to compare core purpose
          const baseDesc = this.extractDescription(baseContent);
          const claudeDesc = this.extractDescription(claudeContent);
          const opencodeDesc = this.extractDescription(opencodeContent);

          // Check for significant divergence in purpose (basic similarity check)
          if (!this.descriptionsMatch(baseDesc, claudeDesc, opencodeDesc)) {
            errors.push({
              agent: agent.name,
              issue: 'Content divergence detected across formats',
              suggestion: 'Review and sync agent descriptions and core functionality',
            });
          }
        } catch (error) {
          errors.push({
            agent: agent.name,
            issue: `Error reading canonical files: ${(error as Error).message}`,
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      manifestAgents: manifest.canonical_agents?.length || 0,
      expectedCount: 42,
      errors,
    };
  }

  /**
   * Enhanced OpenCode validation
   */
  validateOpenCodeAgent(agent: OpenCodeAgent): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required fields validation
    if (!agent.description || agent.description.trim().length === 0) {
      errors.push({
        field: 'description',
        message: 'OpenCode agents must have a non-empty description',
        severity: 'error',
      });
    }

    // Mode validation
    if (!['primary', 'subagent', 'all'].includes(agent.mode || '')) {
      errors.push({
        field: 'mode',
        message: `Invalid mode '${agent.mode}'. Must be 'primary', 'subagent', or 'all'`,
        severity: 'error',
      });
    }

    // Model format validation
    if (agent.model && !agent.model.includes('/')) {
      warnings.push({
        field: 'model',
        message: `Model '${agent.model}' should use provider/model format for OpenCode`,
      });
    }

    // Tools/Permission validation - OpenCode supports both formats
    const hasTools =
      agent.tools !== undefined && (typeof agent.tools !== 'string' || agent.tools !== 'undefined');
    const hasPermissions =
      agent.permission !== undefined &&
      (typeof agent.permission !== 'string' || agent.permission !== 'undefined');

    if (!hasTools && !hasPermissions) {
      errors.push({
        field: 'tools',
        message: 'Either tools or permission field must be defined',
        severity: 'error',
      });
    }

    if (agent.tools && typeof agent.tools === 'object') {
      // Validate tool dependencies
      if (agent.tools.write && !agent.tools.read) {
        warnings.push({
          field: 'tools',
          message: 'Write permission typically requires read permission',
        });
      }
    }

    if (agent.permission && typeof agent.permission === 'object') {
      // Validate permission dependencies
      if (agent.permission.write === 'allow' && agent.permission.read !== 'allow') {
        warnings.push({
          field: 'permission',
          message: 'Write permission typically requires read permission',
        });
      }
    }

    // Temperature validation
    if (agent.temperature !== undefined && (agent.temperature < 0 || agent.temperature > 2)) {
      errors.push({
        field: 'temperature',
        message: `Temperature ${agent.temperature} is outside valid range 0-2`,
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
   * Batch validation with detailed reporting
   */
  async validateBatchWithDetails(agents: Agent[]): Promise<BatchValidationResult> {
    const results = [];
    const summary = {
      total: agents.length,
      valid: 0,
      errors: 0,
      warnings: 0,
      errorsByType: {} as Record<string, number>,
      warningsByType: {} as Record<string, number>,
    };

    for (const agent of agents) {
      const result = this.validateAgent(agent);
      results.push({ ...result, agent: agent.name });

      if (result.valid) {
        summary.valid++;
      } else {
        summary.errors += result.errors.length;

        // Categorize errors for reporting
        result.errors.forEach((error) => {
          const key = error.field || 'general';
          summary.errorsByType[key] = (summary.errorsByType[key] || 0) + 1;
        });
      }

      summary.warnings += result.warnings.length;
      result.warnings.forEach((warning) => {
        const key = warning.field || 'general';
        summary.warningsByType[key] = (summary.warningsByType[key] || 0) + 1;
      });
    }

    return { results, summary };
  }

  /**
   * Generate fix suggestions
   */
  generateFixScript(validationResults: ValidationResult[]): string {
    const fixes: string[] = [];

    validationResults.forEach((result) => {
      if (!result.valid && 'agent' in result) {
        fixes.push(`# Fixes for ${result.agent}`);
        result.errors.forEach((error) => {
          fixes.push(`# ${error.message}`);
          if ('suggestion' in error && error.suggestion) {
            fixes.push(`# Suggestion: ${error.suggestion}`);
          }
        });
        fixes.push(''); // empty line
      }
    });

    return fixes.join('\n');
  }

  /**
   * Helper method to detect format from file path
   */
  private detectFormatFromPath(filePath: string): string {
    if (filePath.includes('base-agents/')) return 'base';
    if (filePath.includes('.claude/agents/')) return 'claude-code';
    if (filePath.includes('.opencode/agent/')) return 'opencode';
    if (filePath.includes('.cursor/agents/')) return 'claude-code';
    return 'unknown';
  }

  /**
   * Extract description from agent content
   */
  private extractDescription(content: string): string {
    // Simple extraction - look for description in frontmatter or first paragraph
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.includes('description:')) {
        return line.split('description:')[1].trim();
      }
    }
    return content.substring(0, 200); // Fallback to first 200 chars
  }

  /**
   * Check if descriptions match (basic similarity check)
   */
  private descriptionsMatch(desc1: string, desc2: string, desc3: string): boolean {
    // Simple check - all descriptions should contain similar keywords
    const keywords1 = desc1.toLowerCase().split(/\s+/);
    const keywords2 = desc2.toLowerCase().split(/\s+/);
    const keywords3 = desc3.toLowerCase().split(/\s+/);

    // Check if they have significant overlap
    const common12 = keywords1.filter((k) => keywords2.includes(k)).length;
    const common13 = keywords1.filter((k) => keywords3.includes(k)).length;
    const common23 = keywords2.filter((k) => keywords3.includes(k)).length;

    return common12 > 2 && common13 > 2 && common23 > 2;
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

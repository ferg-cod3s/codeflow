import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { mkdir } from 'node:fs/promises';
import { Agent, ParsedEntity } from '../conversion/agent-parser';
import { ValidationEngine, ValidationResult, AgentFormat } from './validation-engine';
import { ArrayParser } from './array-parser';

/**
 * Parsed YAML structure
 */
export interface ParsedYaml {
  frontmatter: Record<string, any>;
  body: string;
  rawContent: string;
}

/**
 * YAML processing error
 */
export interface YamlError {
  message: string;
  field?: string;
  line?: number;
  column?: number;
}

/**
 * Result type for operations that might fail
 */
export type Result<T, E> = { success: true; data: T } | { success: false; error: E };

/**
 * Unified YAML Processor - Single source of truth for all YAML operations
 */
export class YamlProcessor {
  private validationEngine: ValidationEngine;
  private arrayParser: ArrayParser;

  constructor() {
    this.validationEngine = new ValidationEngine();
    this.arrayParser = new ArrayParser();
  }

  /**
   * Parse YAML content from string
   */
  parse(content: string): Result<ParsedYaml, YamlError> {
    try {
      // Extract frontmatter and body
      const frontmatterMatch = content.match(/^---[\s]*\n([\s\S]*?)\n---[\s]*(\n[\s\S]*)?$/);
      if (!frontmatterMatch) {
        // Try alternative pattern for empty frontmatter
        const altMatch = content.match(/^---[\s]*\n---[\s]*(\n[\s\S]*)?$/);
        if (altMatch) {
          return {
            success: true,
            data: {
              frontmatter: {},
              body: (altMatch[1] || '').trim(),
              rawContent: content,
            },
          };
        }
        return {
          success: false,
          error: {
            message: 'No frontmatter found in content',
            line: 1,
            column: 1,
          },
        };
      }

      const frontmatterText = frontmatterMatch[1];
      const body = frontmatterMatch[2] || '';

      // Parse frontmatter using YAML library
      let frontmatter: Record<string, any>;
      if (frontmatterText.trim() === '') {
        // Handle empty frontmatter
        frontmatter = {};
      } else {
        frontmatter = parseYaml(frontmatterText) || {};
      }

      return {
        success: true,
        data: {
          frontmatter,
          body: body.trim(),
          rawContent: content,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: {
          message: `YAML parsing failed: ${errorMessage}`,
          line: 1,
          column: 1,
        },
      };
    }
  }

  /**
   * Serialize agent to YAML string
   */
  serialize(entity: ParsedEntity): Result<string, YamlError> {
    try {
      // Clean frontmatter by removing null/undefined values
      const cleanFrontmatter = this.cleanFrontmatter(entity.frontmatter);

      // Convert frontmatter to YAML with proper formatting options
      const yamlOptions = {
        indent: 2,
        lineWidth: 0, // Disable line wrapping
        collectionStyle: 'block' as const, // Force block style for arrays and objects
        defaultFlowStyle: null, // Never use flow style
        defaultStringType: 'PLAIN' as const,
        // Enable circular reference detection
        skipInvalid: false,
      };

      const yamlContent = `---\n${stringifyYaml(cleanFrontmatter, yamlOptions)}---\n${entity.content}`;

      return {
        success: true,
        data: yamlContent,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: {
          message: `YAML serialization failed: ${errorMessage}`,
          line: 1,
          column: 1,
        },
      };
    }
  }

  /**
   * Detect agent format from frontmatter
   */
  detectFormat(frontmatter: Record<string, any>): AgentFormat {
    if (frontmatter.model && frontmatter.temperature !== undefined) {
      return 'opencode';
    }
    if (frontmatter.tools && typeof frontmatter.tools === 'string') {
      return 'claude-code';
    }
    return 'base';
  }

  /**
   * Validate agent structure
   */
  validate(agent: Agent): ValidationResult {
    return this.validationEngine.validate(agent);
  }

  /**
   * Process operation with error handling
   */
  async processWithErrorHandling<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<Result<T, YamlError>> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: {
          message: context ? `${context} failed: ${errorMessage}` : errorMessage,
          line: 1,
          column: 1,
        },
      };
    }
  }

  /**
   * Clean frontmatter by removing null and undefined values
   */
  private cleanFrontmatter(frontmatter: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};

    for (const [key, value] of Object.entries(frontmatter)) {
      if (value !== null && value !== undefined) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          // Recursively clean nested objects
          cleaned[key] = this.cleanFrontmatter(value);
        } else {
          cleaned[key] = value;
        }
      }
    }

    return cleaned;
  }

  /**
   * Ensure directory exists
   */
  async ensureDirectory(dirPath: string): Promise<Result<void, YamlError>> {
    try {
      await mkdir(dirPath, { recursive: true });
      return { success: true, data: undefined };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: {
          message: `Failed to create directory ${dirPath}: ${errorMessage}`,
          line: 1,
          column: 1,
        },
      };
    }
  }
}

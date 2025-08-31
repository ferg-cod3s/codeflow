import { describe, it, expect, beforeEach } from 'bun:test';
import { FormatConverter } from '../../src/conversion/format-converter';
import { AgentValidator } from '../../src/conversion/validator';
import { BaseAgent } from '../../src/conversion/agent-parser';

describe('Single Format Architecture', () => {
  let converter: FormatConverter;
  let validator: AgentValidator;

  beforeEach(() => {
    converter = new FormatConverter();
    validator = new AgentValidator();
  });

  describe('BaseAgent as Single Source of Truth', () => {
    const sampleBaseAgent = {
      name: 'test-agent',
      description: 'A test agent for validation',
      mode: 'subagent' as const,
      temperature: 0.7,
      model: 'claude-sonnet-4-20250514',
      tools: {
        read: true,
        write: true,
        edit: true,
        bash: true
      },
      usage: 'Use this agent for testing',
      do_not_use_when: 'Do not use in production',
      escalation: 'Contact admin if needed',
      examples: 'Example usage scenarios',
      prompts: 'Suggested prompts',
      constraints: 'Usage constraints'
    };

    it('should validate base agent with all fields', () => {
      const result = validator.validateBase(sampleBaseAgent);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate base agent with minimal fields', () => {
      const minimalAgent = {
        name: 'minimal-agent',
        description: 'A minimal test agent'
      };
      const result = validator.validateBase(minimalAgent);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject agent without required fields', () => {
      const invalidAgent = {
        description: 'Missing name field'
      } as BaseAgent;
      const result = validator.validateBase(invalidAgent);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
    });

    it('should validate name format correctly', () => {
      const invalidNameAgent = {
        ...sampleBaseAgent,
        name: 'Invalid Name With Spaces'
      };
      const result = validator.validateBase(invalidNameAgent);
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.field === 'name')).toBe(true);
    });

    it('should accept agent mode', () => {
      const agentModeAgent = {
        ...sampleBaseAgent,
        mode: 'agent' as const
      };
      const result = validator.validateBase(agentModeAgent);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Format Conversion', () => {
    const baseAgent = {
      name: 'conversion-test',
      description: 'Test agent for format conversion',
      mode: 'agent' as const,
      temperature: 0.8,
      model: 'claude-3-5-sonnet',
      tools: {
        read: true,
        write: false,
        edit: true,
        bash: true
      },
      usage: 'Test usage',
      examples: 'Test examples'
    };

    it('should convert base to claude-code format', () => {
      const agent = {
        format: 'base' as const,
        name: 'conversion-test',
        content: 'Test content',
        frontmatter: baseAgent
      };

      const converted = converter.baseToClaudeCode(agent);
      expect(converted.format).toBe('claude-code');
      expect(converted.frontmatter.name).toBe(baseAgent.name);
      expect(converted.frontmatter.description).toBe(baseAgent.description);
    });

    it('should convert base to opencode format', () => {
      const agent = {
        format: 'base' as const,
        name: 'conversion-test',
        content: 'Test content',
        frontmatter: baseAgent
      };

      const converted = converter.baseToOpenCode(agent);
      expect(converted.format).toBe('opencode');
      expect(converted.frontmatter.name).toBe(baseAgent.name);
      expect(converted.frontmatter.tools).toEqual(baseAgent.tools);
    });

    it('should convert claude-code to base format', () => {
      const claudeAgent = {
        format: 'claude-code' as const,
        name: 'conversion-test',
        content: 'Test content',
        frontmatter: {
          name: 'conversion-test',
          description: 'Test agent for format conversion',
          tools: 'read, edit, bash'
        }
      };

      const converted = converter.claudeCodeToBase(claudeAgent);
      expect(converted.format).toBe('base');
      expect(converted.frontmatter.name).toBe(claudeAgent.frontmatter.name);
      expect(converted.frontmatter.tools).toBeDefined();
    });

    it('should convert opencode to base format', () => {
      const opencodeAgent = {
        format: 'opencode' as const,
        name: 'conversion-test',
        content: 'Test content',
        frontmatter: baseAgent
      };

      const converted = converter.openCodeToBase(opencodeAgent);
      expect(converted.format).toBe('base');
      expect(converted.frontmatter.name).toBe(baseAgent.name);
      expect(converted.frontmatter.tools).toEqual(baseAgent.tools);
    });
  });

  describe('Round-trip Conversion', () => {
    it('should preserve data integrity through format conversions', () => {
      const originalAgent = {
        format: 'base' as const,
        name: 'round-trip-test',
        content: 'Test content for round-trip',
        frontmatter: {
          name: 'round-trip-test',
          description: 'Test agent for round-trip conversion',
          mode: 'subagent' as const,
          temperature: 0.5,
          model: 'claude-3-5-sonnet',
          tools: {
            read: true,
            write: true,
            edit: false
          }
        }
      };

      // Convert to claude-code and back
      const toClaude = converter.baseToClaudeCode(originalAgent);
      const backToBase = converter.claudeCodeToBase(toClaude);

      // Validate round-trip integrity
      const validation = validator.validateRoundTrip(originalAgent, backToBase);
      expect(validation.valid).toBe(true);
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalAgent = {
        format: 'base' as const,
        name: 'minimal-round-trip',
        content: 'Minimal content',
        frontmatter: {
          name: 'minimal-round-trip',
          description: 'Minimal test agent'
        }
      };

      // Convert through all formats
      const toClaude = converter.baseToClaudeCode(minimalAgent);
      const toOpenCode = converter.baseToOpenCode(minimalAgent);
      const backToBase = converter.claudeCodeToBase(toClaude);

      expect(backToBase.frontmatter.name).toBe(minimalAgent.frontmatter.name);
      expect(backToBase.frontmatter.description).toBe(minimalAgent.frontmatter.description);
    });
  });

  describe('Validation Consistency', () => {
    it('should validate all formats consistently', () => {
      const baseAgent = {
        name: 'validation-test',
        description: 'Test agent for validation consistency',
        mode: 'subagent' as const,
        tools: {
          read: true,
          write: true
        }
      };

      // All validation methods should work with the same data
      const baseResult = validator.validateBase(baseAgent);
      const claudeResult = validator.validateClaudeCode(baseAgent);
      const opencodeResult = validator.validateOpenCode(baseAgent);

      expect(baseResult.valid).toBe(true);
      expect(claudeResult.valid).toBe(true);
      expect(opencodeResult.valid).toBe(true);
    });

    it('should provide consistent recommendations across formats', () => {
      const agent = {
        format: 'base' as const,
        name: 'recommendation-test',
        content: 'Short content',
        frontmatter: {
          name: 'recommendation-test',
          description: 'Test agent'
        }
      };

      const recommendations = validator.getRecommendations(agent);
      expect(recommendations).toContain('Agent content is quite short, consider adding more detailed instructions');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid format conversions gracefully', () => {
      const invalidAgent = {
        format: 'invalid' as any,
        name: 'error-test',
        content: 'Test content',
        frontmatter: {}
      };

      expect(() => converter.convert(invalidAgent, 'base')).toThrow();
    });

    it('should validate required fields across all formats', () => {
      const invalidAgent = {
        description: 'Missing name field'
      } as BaseAgent;

      const baseResult = validator.validateBase(invalidAgent);
      const claudeResult = validator.validateClaudeCode(invalidAgent);
      const opencodeResult = validator.validateOpenCode(invalidAgent);

      expect(baseResult.valid).toBe(false);
      expect(claudeResult.valid).toBe(false);
      expect(opencodeResult.valid).toBe(false);
    });
  });
});

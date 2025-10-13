import { describe, it, expect, beforeEach } from 'bun:test';
import { FormatConverter } from '../../src/conversion/format-converter';
import { AgentValidator } from '../../src/conversion/validator';
import {
  BaseAgent,
  ClaudeCodeAgent,
  OpenCodeAgent,
  Agent,
} from '../../src/conversion/agent-parser';

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
        bash: true,
      },
      usage: 'Use this agent for testing',
      do_not_use_when: 'Do not use in production',
      escalation: 'Contact admin if needed',
      examples: 'Example usage scenarios',
      prompts: 'Suggested prompts',
      constraints: 'Usage constraints',
    };

    it('should validate base agent with all fields', () => {
      const result = validator.validateBase(sampleBaseAgent);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate base agent with minimal fields', () => {
      const minimalAgent = {
        name: 'minimal-agent',
        description: 'A minimal test agent',
      };
      const result = validator.validateBase(minimalAgent);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject agent without required fields', () => {
      const invalidAgent = {
        description: 'Missing name field',
      } as BaseAgent;
      const result = validator.validateBase(invalidAgent);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'name')).toBe(true);
    });

    it('should validate name format correctly', () => {
      const invalidNameAgent = {
        ...sampleBaseAgent,
        name: 'Invalid Name With Spaces',
      };
      const result = validator.validateBase(invalidNameAgent);
      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.field === 'name')).toBe(true);
    });

    it('should accept agent mode', () => {
      const agentModeAgent = {
        ...sampleBaseAgent,
        mode: 'subagent' as const,
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
      mode: 'subagent' as const,
      temperature: 0.8,
      model: 'claude-3-5-sonnet',
      tools: {
        read: true,
        write: false,
        edit: true,
        bash: true,
      },
      usage: 'Test usage',
      examples: 'Test examples',
    };

    it('should convert base to claude-code format', () => {
      const agent = {
        format: 'base' as const,
        name: 'conversion-test',
        content: 'Test content',
        frontmatter: baseAgent,
        filePath: '/test/conversion-test.md',
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
        frontmatter: baseAgent,
        filePath: '/test/conversion-test.md',
      };

      const converted = converter.baseToOpenCode(agent);
      expect(converted.format).toBe('opencode');
      expect(converted.frontmatter.name).toBe(baseAgent.name);
      // OpenCode format uses permission instead of tools
      const openCodeFrontmatter = converted.frontmatter as OpenCodeAgent;
      expect(openCodeFrontmatter.permission).toBeDefined();
      expect(openCodeFrontmatter.permission?.read).toBe('allow');
      expect(openCodeFrontmatter.permission?.write).toBe('deny');
    });

    it('should convert claude-code to base format', () => {
      const claudeAgent: Agent = {
        format: 'claude-code' as const,
        name: 'conversion-test',
        content: 'Test content',
        frontmatter: {
          name: 'conversion-test',
          description: 'Test agent for format conversion',
          mode: 'subagent',
          tools: 'read, edit, bash',
        } as ClaudeCodeAgent,
        filePath: '/test/conversion-test.md',
      };

      const converted = converter.claudeCodeToBase(claudeAgent);
      expect(converted.format).toBe('base');
      expect(converted.frontmatter.name).toBe('conversion-test');
      expect(converted.frontmatter.tools).toBeDefined();
    });

    it('should convert opencode to base format', () => {
      const opencodeAgent = {
        format: 'opencode' as const,
        name: 'conversion-test',
        content: 'Test content',
        frontmatter: {
          description: baseAgent.description,
          mode: 'subagent' as const,
          temperature: baseAgent.temperature,
          model: baseAgent.model,
          tools: baseAgent.tools,
        } as any, // OpenCodeAgent type
        filePath: '/test/conversion-test.md',
      };

      const converted = converter.openCodeToBase(opencodeAgent);
      expect(converted.format).toBe('base');
      expect(converted.frontmatter.name).toBe('conversion-test'); // Name comes from Agent.name, not frontmatter
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
          },
        },
        filePath: '/test/round-trip-test.md',
      };

      // Convert to claude-code and back
      const toClaude = converter.baseToClaudeCode(originalAgent);
      const backToBase = converter.claudeCodeToBase(toClaude);

      // Claude Code format only preserves name, description, and tools
      // Other fields (mode, temperature) are expected to be lost
      expect(backToBase.frontmatter.name).toBe(originalAgent.frontmatter.name);
      expect(backToBase.frontmatter.description).toBe(originalAgent.frontmatter.description);
      expect(backToBase.frontmatter.tools).toEqual(originalAgent.frontmatter.tools);

      // These fields are not preserved in Claude Code format
      expect(backToBase.frontmatter.mode).toBeUndefined();
      expect(backToBase.frontmatter.temperature).toBeUndefined();
      // Model is converted to 'inherit' if not recognized by Claude Code
      expect(backToBase.frontmatter.model).toBe('inherit');
    });

    it('should handle Claude Code format limitation with disabled tools', () => {
      const baseAgentWithDisabledTools = {
        format: 'base' as const,
        name: 'disabled-tools-test',
        content: 'Test content',
        frontmatter: {
          name: 'disabled-tools-test',
          description: 'Test agent with disabled tools',
          tools: {
            read: true,
            write: false,
            edit: false,
          },
        },
        filePath: '/test/disabled-tools-test.md',
      };

      // Convert to claude-code and back
      const toClaude = converter.baseToClaudeCode(baseAgentWithDisabledTools);
      const backToBase = converter.claudeCodeToBase(toClaude);

      // Claude Code format only lists enabled tools, so disabled tools are lost
      expect(toClaude.frontmatter.tools).toBe('read');
      expect(backToBase.frontmatter.tools).toEqual({ read: true });

      // This is expected behavior - Claude Code format doesn't support disabled tools
      expect(backToBase.frontmatter.tools).not.toEqual(
        baseAgentWithDisabledTools.frontmatter.tools
      );
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalAgent = {
        format: 'base' as const,
        name: 'minimal-round-trip',
        content: 'Minimal content',
        frontmatter: {
          name: 'minimal-round-trip',
          description: 'Minimal test agent',
        },
        filePath: '/test/minimal-round-trip.md',
      };

      // Convert through all formats
      const toClaude = converter.baseToClaudeCode(minimalAgent);
      const backToBase = converter.claudeCodeToBase(toClaude);

      expect(backToBase.frontmatter.name).toBe(minimalAgent.frontmatter.name);
      expect(backToBase.frontmatter.description).toBe(minimalAgent.frontmatter.description);
    });
  });

  describe('Validation Consistency', () => {
    it('should validate all formats consistently', () => {
      const baseAgent: BaseAgent = {
        name: 'validation-test',
        description: 'Test agent for validation consistency',
        mode: 'subagent' as const,
        tools: {
          read: true,
          write: true,
        },
      };

      const claudeCodeAgent: ClaudeCodeAgent = {
        name: 'validation-test',
        description: 'Test agent for validation consistency',
        tools: 'read, write',
      };

      // Convert baseAgent to OpenCodeAgent for validation
      const openCodeAgent: OpenCodeAgent = {
        name: baseAgent.name,
        description: baseAgent.description,
        mode: baseAgent.mode as 'primary' | 'subagent', // Type assertion since we know it's valid
        model: baseAgent.model,
        temperature: baseAgent.temperature,
        tools: baseAgent.tools,
      };

      // All validation methods should work with the same data
      const baseResult = validator.validateBase(baseAgent);
      const claudeResult = validator.validateClaudeCode(claudeCodeAgent);
      const opencodeResult = validator.validateOpenCode(openCodeAgent);

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
          description: 'Test agent',
        },
        filePath: '/test/recommendation-test.md',
      };

      const recommendations = validator.getRecommendations(agent);
      expect(recommendations).toContain(
        'Agent content is quite short, consider adding more detailed instructions'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid format conversions gracefully', () => {
      const invalidAgent = {
        format: 'invalid' as any,
        name: 'error-test',
        content: 'Test content',
        frontmatter: {
          name: 'error-test',
          description: 'Error test agent',
        } as any,
        filePath: '/test/error-test.md',
      };

      expect(() => converter.convert(invalidAgent, 'base')).toThrow();
    });

    it('should validate required fields across all formats', () => {
      const invalidBaseAgent = {
        description: 'Missing name field',
      } as BaseAgent;

      const invalidClaudeAgent = {
        description: 'Missing name field',
      } as ClaudeCodeAgent;

      const invalidOpenCodeAgent = {
        description: 'Missing name field',
        mode: 'subagent' as const,
      } as OpenCodeAgent;

      const baseResult = validator.validateBase(invalidBaseAgent);
      const claudeResult = validator.validateClaudeCode(invalidClaudeAgent);
      const opencodeResult = validator.validateOpenCode(invalidOpenCodeAgent);

      expect(baseResult.valid).toBe(false);
      expect(claudeResult.valid).toBe(false);
      expect(opencodeResult.valid).toBe(false);
    });
  });
});

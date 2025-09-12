import { describe, it, expect, beforeEach } from 'bun:test';
import { ValidationEngine } from '../../src/yaml/validation-engine';
import {
  Agent,
  BaseAgent,
  ClaudeCodeAgent,
  OpenCodeAgent,
} from '../../src/conversion/agent-parser';

describe('ValidationEngine', () => {
  let engine: ValidationEngine;

  beforeEach(() => {
    engine = new ValidationEngine();
  });

  describe('Base agent validation', () => {
    it('should validate valid base agent', () => {
      const agent: BaseAgent = {
        name: 'test-agent',
        description: 'A test agent with proper description',
        mode: 'subagent',
        temperature: 0.5,
        model: 'gpt-4',
        tools: {
          read: true,
          write: false,
          edit: true,
        },
      };

      const result = engine.validateBase(agent);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should reject missing required fields', () => {
      const agent: BaseAgent = {
        name: '',
        description: '',
        mode: 'subagent',
      };

      const result = engine.validateBase(agent);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].field).toBe('name');
      expect(result.errors[1].field).toBe('description');
    });

    it('should validate temperature range', () => {
      const agent: BaseAgent = {
        name: 'test',
        description: 'test',
        temperature: 3, // Invalid range
      };

      const result = engine.validateBase(agent);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('between 0 and 2');
    });
  });

  describe('OpenCode agent validation', () => {
    it('should validate valid OpenCode agent', () => {
      const agent: OpenCodeAgent = {
        name: 'opencode-agent',
        description: 'An OpenCode agent',
        mode: 'primary',
        temperature: 0.7,
        model: 'gpt-4',
        tools: {
          read: true,
          write: false,
        },
        permission: {
          read: 'allow',
          write: 'deny',
          edit: 'allow',
          bash: 'ask',
          webfetch: 'allow',
        },
        tags: ['test', 'agent'],
        category: 'development',
      };

      const result = engine.validateOpenCode(agent);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require name field (critical fix)', () => {
      const agent: OpenCodeAgent = {
        name: '', // Empty name should fail
        description: 'test',
        mode: 'subagent',
      };

      const result = engine.validateOpenCode(agent);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('Name is required for OpenCode format');
    });

    it('should validate permission values', () => {
      const agent: OpenCodeAgent = {
        name: 'test',
        description: 'test',
        mode: 'subagent',
        permission: {
          read: 'invalid', // Should be allow/ask/deny
        },
      };

      const result = engine.validateOpenCode(agent);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('must be one of: allow, ask, deny');
    });
  });

  describe('Unified agent validation', () => {
    it('should validate Agent wrapper correctly', () => {
      const agent: Agent = {
        name: 'test-agent',
        format: 'base',
        frontmatter: {
          name: 'test-agent',
          description: 'A test agent',
          mode: 'subagent',
        } as BaseAgent,
        content: 'Test content',
        filePath: '/test/path',
      };

      const result = engine.validate(agent);
      expect(result.valid).toBe(true);
    });

    it('should handle unknown format', () => {
      const agent: Agent = {
        name: 'test',
        format: 'unknown' as any,
        frontmatter: {} as any,
        content: '',
        filePath: '/test',
      };

      const result = engine.validate(agent);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('Unknown agent format');
    });
  });

  describe('Temperature range consistency', () => {
    it('should use unified temperature range (0-2) for all formats', () => {
      // Test Base format
      const baseAgent: BaseAgent = {
        name: 'test',
        description: 'test',
        temperature: 1.5, // Valid in 0-2 range
      };
      const baseResult = engine.validateBase(baseAgent);
      expect(baseResult.valid).toBe(true);

      // Test OpenCode format with same range
      const openCodeAgent: OpenCodeAgent = {
        name: 'test',
        description: 'test',
        mode: 'subagent',
        temperature: 1.5, // Should also be valid
      };
      const openCodeResult = engine.validateOpenCode(openCodeAgent);
      expect(openCodeResult.valid).toBe(true);
    });

    it('should reject temperatures outside unified range', () => {
      const agent: BaseAgent = {
        name: 'test',
        description: 'test',
        temperature: 2.5, // Invalid in 0-2 range
      };

      const result = engine.validateBase(agent);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('between 0 and 2');
    });
  });
});

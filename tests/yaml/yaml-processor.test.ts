import { describe, it, expect, beforeEach } from 'bun:test';
import { YamlProcessor } from '../../src/yaml/yaml-processor';
import { Agent, BaseAgent } from '../../src/conversion/agent-parser';





describe('YamlProcessor', () => {
  let processor: YamlProcessor;

  beforeEach(() => {
    processor = new YamlProcessor();
  });

  describe('parse', () => {
    it('should parse valid YAML content', () => {
      const content = `---
name: test-agent
description: A test agent
mode: subagent
---

This is the agent content.`;

      const result = processor.parse(content);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.frontmatter.name).toBe('test-agent');
        expect(result.data.frontmatter.description).toBe('A test agent');
        expect(result.data.body).toBe('This is the agent content.');
      }
    });

    it('should handle missing frontmatter', () => {
      const content = 'Just content without frontmatter';

      const result = processor.parse(content);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('No frontmatter found');
      }
    });

    it('should handle malformed YAML', () => {
      const content = `---
invalid: yaml: content:
---

Body`;

      const result = processor.parse(content);
      expect(result.success).toBe(false);
    });
  });

  describe('serialize', () => {
    it('should serialize agent correctly', () => {
      const agent: Agent = {
        name: 'test-agent',
        format: 'base',
        frontmatter: {
          name: 'test-agent',
          description: 'A test agent',
          mode: 'subagent',
          temperature: 0.5,
        } as BaseAgent,
        content: 'Agent content here',
        filePath: '/test/path',
      };

      const result = processor.serialize(agent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('---');
        expect(result.data).toContain('name: test-agent');
        expect(result.data).toContain('description: A test agent');
        expect(result.data).toContain('Agent content here');
      }
    });

    it('should handle special characters in content', () => {
      const agent: Agent = {
        name: 'test',
        format: 'base',
        frontmatter: {
          name: 'test',
          description: 'Test with "quotes" and :colon',
        } as BaseAgent,
        content: 'Content',
        filePath: '/test',
      };

      const result = processor.serialize(agent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('Test with "quotes" and :colon');
      }
    });
  });

  describe('validate', () => {
    it('should validate agent using ValidationEngine', () => {
      const agent: Agent = {
        name: 'test-agent',
        format: 'base',
        frontmatter: {
          name: 'test-agent',
          description: 'A test agent',
          mode: 'subagent',
        } as BaseAgent,
        content: 'Content',
        filePath: '/test',
      };

      const result = processor.validate(agent);
      expect(result.valid).toBe(true);
    });
  });

  describe('ensureDirectory', () => {
    it('should create directory successfully', async () => {
      const result = await processor.ensureDirectory('/tmp/test-yaml-dir');
      expect(result.success).toBe(true);
    });

    it('should handle existing directory', async () => {
      const result = await processor.ensureDirectory('/tmp');
      expect(result.success).toBe(true);
    });

    it('should handle permission errors', async () => {
      const result = await processor.ensureDirectory('/root/test-dir');
      // This might fail depending on permissions, but should not throw
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('processWithErrorHandling', () => {
    it('should handle successful operations', async () => {
      const operation = async () => 'success';
      const result = await processor.processWithErrorHandling(operation);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('success');
      }
    });

    it('should handle failed operations', async () => {
      const operation = async () => {
        throw new Error('Test error');
      };
      const result = await processor.processWithErrorHandling(operation, 'test context');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('test context failed');
      }
    });
  });

  describe('integration', () => {
    it('should round-trip parse and serialize', () => {
      const originalContent = `---
name: test-agent
description: A test agent
mode: subagent
temperature: 0.5
---

This is test content.`;

      // Parse
      const parseResult = processor.parse(originalContent);
      expect(parseResult.success).toBe(true);

      if (parseResult.success) {
        // Create agent
        const agent: Agent = {
          name: parseResult.data.frontmatter.name || 'test',
          format: 'base',
          frontmatter: parseResult.data.frontmatter as BaseAgent,
          content: parseResult.data.body,
          filePath: '/test',
        };

        // Serialize
        const serializeResult = processor.serialize(agent);
        expect(serializeResult.success).toBe(true);

        if (serializeResult.success) {
          // Should contain the same key information
          expect(serializeResult.data).toContain('name: test-agent');
          expect(serializeResult.data).toContain('description: A test agent');
          expect(serializeResult.data).toContain('This is test content.');
        }
      }
    });
  });
});

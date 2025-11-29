/**
 * Tests for AgentConverter
 *
 * These tests validate the agent conversion logic from base-agent
 * format to OpenCode format.
 */

import { describe, it, expect } from 'bun:test';
import { AgentConverter } from '../../src/converters/agent-converter';

describe('AgentConverter', () => {
  const converter = new AgentConverter();

  describe('convertSingleAgent', () => {
    it('should convert basic agent with required fields', async () => {
      const input = `---
name: test_agent
description: A test agent
mode: subagent
---
You are a test agent.`;

      const result = await (converter as any).convertSingleAgent(input);

      // OpenCode format doesn't include name in frontmatter (derived from filename)
      expect(result).toContain('description: A test agent');
      expect(result).toContain('mode: subagent');
      expect(result).toContain('You are a test agent');
      expect(result).not.toContain('name: test_agent');
    });

    it('should map tools correctly', async () => {
      const input = `---
name: tool_agent
description: Agent with tools
tools:
  write: true
  edit: true
  bash: false
---
Agent with tools.`;

      const result = await (converter as any).convertSingleAgent(input);

      expect(result).toContain('write: true');
      expect(result).toContain('edit: true');
      expect(result).toContain('bash: false');
    });

    it('should map permissions correctly', async () => {
      const input = `---
name: perm_agent
description: Agent with permissions
permission:
  file_write: allow
  file_read: deny
---
Agent with permissions.`;

      const result = await (converter as any).convertSingleAgent(input);

      expect(result).toContain('permission:');
      expect(result).toContain('file_write: allow');
      expect(result).toContain('file_read: deny');
    });

    it('should integrate additional fields into prompt', async () => {
      const input = `---
name: full_agent
description: Full featured agent
category: development
tags:
  - python
  - testing
primary_objective: Write quality code
---
You are a full featured agent.`;

      const result = await (converter as any).convertSingleAgent(input);

      expect(result).toContain('**category**: development');
      expect(result).toContain('**tags**: python, testing');
      expect(result).toContain('**primary_objective**: Write quality code');
      expect(result).toContain('You are a full featured agent');
    });

    it('should default mode to subagent when not specified', async () => {
      const input = `---
name: default_agent
description: Agent without mode
---
Default agent.`;

      const result = await (converter as any).convertSingleAgent(input);

      expect(result).toContain('mode: subagent');
    });

    it('should handle temperature and model fields', async () => {
      const input = `---
name: model_agent
description: Agent with model config
temperature: 0.7
model: claude-3-sonnet
---
Agent with model config.`;

      const result = await (converter as any).convertSingleAgent(input);

      expect(result).toContain('temperature: 0.7');
      expect(result).toContain('model: claude-3-sonnet');
    });
  });

  describe('mapTools', () => {
    it('should map known tools correctly', () => {
      const tools = {
        write: true,
        edit: false,
        bash: true,
        read: true
      };

      const result = (converter as any).mapTools(tools);

      expect(result).toEqual({
        write: true,
        edit: false,
        bash: true,
        read: true
      });
    });

    it('should return undefined for no tools', () => {
      const result = (converter as any).mapTools(undefined);
      expect(result).toBeUndefined();
    });

    it('should pass through unknown tools', () => {
      const tools = {
        custom_tool: true
      };

      const result = (converter as any).mapTools(tools);

      expect(result).toEqual({
        custom_tool: true
      });
    });
  });

  describe('mapPermissions', () => {
    it('should map string permissions to OpenCode format', () => {
      const permissions = {
        file_write: 'allow',
        file_read: 'deny'
      };

      const result = (converter as any).mapPermissions(permissions);

      expect(result).toEqual({
        file_write: 'allow',
        file_read: 'deny'
      });
    });

    it('should convert "true" to "allow"', () => {
      const permissions = {
        file_write: 'true'
      };

      const result = (converter as any).mapPermissions(permissions);

      expect(result.file_write).toBe('allow');
    });

    it('should convert "false" to "deny"', () => {
      const permissions = {
        file_write: 'false'
      };

      const result = (converter as any).mapPermissions(permissions);

      expect(result.file_write).toBe('deny');
    });

    it('should return undefined when no permissions', () => {
      const result = (converter as any).mapPermissions(undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('buildPrompt', () => {
    it('should combine body with additional fields', () => {
      const frontmatter = {
        name: 'test',
        category: 'testing',
        tags: ['unit', 'integration'],
        primary_objective: 'Test thoroughly'
      };
      const body = 'You are a test agent.';

      const result = (converter as any).buildPrompt(frontmatter, body);

      expect(result).toContain('**category**: testing');
      expect(result).toContain('**tags**: unit, integration');
      expect(result).toContain('**primary_objective**: Test thoroughly');
      expect(result).toContain('You are a test agent');
    });

    it('should handle array fields correctly', () => {
      const frontmatter = {
        tags: ['python', 'typescript'],
        anti_objectives: ['Skip tests', 'Write sloppy code']
      };
      const body = 'Agent body.';

      const result = (converter as any).buildPrompt(frontmatter, body);

      expect(result).toContain('**tags**: python, typescript');
      expect(result).toContain('**anti_objectives**: Skip tests, Write sloppy code');
    });

    it('should return body only when no additional fields', () => {
      const frontmatter = {
        name: 'test',
        description: 'test'
      };
      const body = 'Simple agent.';

      const result = (converter as any).buildPrompt(frontmatter, body);

      expect(result).toBe('Simple agent.');
    });
  });
});

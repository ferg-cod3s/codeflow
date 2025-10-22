/**
 * Command Conversion Tests
 * Tests command format conversion between Claude Code and OpenCode
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { CommandConverter } from '../../src/conversion/command-converter';
import { setupTests, cleanupTests, testPaths, TEST_OUTPUT } from '../setup';

describe('Command Conversion', () => {
  let converter: CommandConverter;

  beforeAll(async () => {
    await setupTests();
    converter = new CommandConverter();
  });

  afterAll(async () => {
    await cleanupTests();
  });

  describe('OpenCode to Claude Code conversion', () => {
    test('should convert basic OpenCode command to Claude Code format', async () => {
      const opencodeContent = `---
name: test
mode: command
description: Test command
model: anthropic/claude-sonnet-4
inputs:
  - name: input1
    type: string
    required: true
    description: First input
outputs:
  - name: result
    type: string
    description: Command result
cache_strategy:
  type: content_based
  ttl: 3600
success_signals:
  - 'Command completed'
failure_modes:
  - 'Command failed'
---

# Test Command

This is a test command.
`;

      const result = converter.convertToClaudeCode(opencodeContent, 'test.md');

      // Should contain Claude Code frontmatter
      expect(result).toContain('name: test');
      expect(result).toContain('description: Test command');
      expect(result).toContain('temperature: 0.1'); // Default temperature
      expect(result).toContain('category: testing'); // Inferred category

      // Should not contain model (Claude Code uses default from settings)
      expect(result).not.toContain('model:');

      // Should not contain OpenCode specific fields
      expect(result).not.toContain('mode: command');
      expect(result).not.toContain('inputs:');
      expect(result).not.toContain('cache_strategy:');
      expect(result).not.toContain('success_signals:');
      expect(result).not.toContain('failure_modes:');

      // Should contain params structure
      expect(result).toContain('params:');
      expect(result).toContain('required:');
    });

    test('should handle complex inputs conversion', async () => {
      const opencodeContent = `---
name: complex
mode: command
description: Complex command
model: anthropic/claude-sonnet-4
inputs:
  - name: required_param
    type: string
    required: true
    description: Required parameter
  - name: optional_param
    type: number
    required: false
    description: Optional parameter
---

# Complex Command

Command with multiple parameters.
`;

      const result = converter.convertToClaudeCode(opencodeContent, 'complex.md');

      expect(result).toContain('params:');
      expect(result).toContain('required:');
      expect(result).toContain('- name: required_param');
      expect(result).toContain('optional:');
      expect(result).toContain('- name: optional_param');
    });
  });

  describe('Claude Code to OpenCode conversion', () => {
    test('should convert basic Claude Code command to OpenCode format', async () => {
      const claudeContent = `---
name: test
description: Test command
model: claude-3-5-sonnet-20241022
temperature: 0.2
category: testing
params:
  required:
    - name: input1
      description: First input
      type: string
  optional:
    - name: input2
      description: Second input
      type: number
---

# Test Command

This is a test command.
`;

      const result = converter.convertToOpenCode(claudeContent, 'test.md');

      // Should contain OpenCode frontmatter
      expect(result).toContain('name: test');
      expect(result).toContain('description: Test command');
      expect(result).toContain('mode: command');
      
      // OpenCode commands MUST have model field (per MODEL_CONFIGURATION.md)
      expect(result).toContain('model: anthropic/claude-sonnet-4-20250514');

      // Should contain inputs structure
      expect(result).toContain('inputs:');
      expect(result).toContain('- name: input1');
      expect(result).toContain('required: true');
      expect(result).toContain('- name: input2');
      expect(result).toContain('required: false');

      // Should contain default outputs and cache strategy
      expect(result).toContain('outputs:');
      expect(result).toContain('cache_strategy:');

      // Should not contain Claude Code specific fields
      expect(result).not.toContain('temperature: 0.2');
      expect(result).not.toContain('category: testing');
      expect(result).not.toContain('params:');
    });

    test('should preserve inputs when source is already OpenCode format', async () => {
      // This represents the /command/*.md source files which are already in OpenCode format
      const alreadyOpenCodeContent = `---
name: research
mode: command
description: Research a ticket or provide a prompt for ad-hoc research
version: 2.1.0-optimized
last_updated: 2025-09-17
command_schema_version: 1.0
inputs:
  - name: current_date
    type: string
    required: false
    description: Current date for research document (auto-generated)
    default: auto
  - name: ticket
    type: string
    required: true
    description: Path to ticket file or research question/topic
  - name: scope
    type: string
    required: false
    description: Research scope hint (codebase|research|both)
outputs:
  - name: research_document
    type: structured
    format: JSON with research findings and document metadata
cache_strategy:
  type: content_based
  ttl: 3600
---

# Research Command

Test content.
`;

      const result = converter.convertToOpenCode(alreadyOpenCodeContent, 'research.md');

      // Should preserve all inputs exactly as-is
      expect(result).toContain('mode: command');
      expect(result).toContain('inputs:');
      expect(result).toContain('- name: current_date');
      expect(result).toContain('- name: ticket');
      expect(result).toContain('- name: scope');
      expect(result).toContain('default: auto');

      // Should preserve outputs and cache_strategy
      expect(result).toContain('outputs:');
      expect(result).toContain('cache_strategy:');

      // Should NOT have params (not converting from Claude Code)
      expect(result).not.toContain('params:');

      // OpenCode commands MUST have model field (per MODEL_CONFIGURATION.md)
      expect(result).toContain('model: anthropic/claude-sonnet-4-20250514');
    });
  });

  describe('Model conversion', () => {
    test('should not include model in Claude Code conversion', () => {
      const frontmatter = {
        name: 'test',
        description: 'test',
        model: 'anthropic/claude-sonnet-4',
      };

      const result = (converter as any).convertOpenCodeToClaudeCode(frontmatter);
      expect(result.model).toBeUndefined(); // Claude Code commands don't have models
    });

    test('should include model in OpenCode conversion', () => {
      const frontmatter = {
        name: 'test',
        description: 'test',
        model: 'claude-3-5-sonnet-20241022',
      };

      const result = (converter as any).convertClaudeCodeToOpenCode(frontmatter);
      // OpenCode commands MUST have model field (per MODEL_CONFIGURATION.md)
      expect(result.model).toBe('anthropic/claude-sonnet-4-20250514');
    });
  });

  describe('Category inference', () => {
    test('should infer categories from command names', () => {
      const testCases = [
        { name: 'test-command', expected: 'testing' },
        { name: 'build-app', expected: 'build' },
        { name: 'deploy-service', expected: 'deploy' },
        { name: 'git-commit', expected: 'git' },
        { name: 'docker-build', expected: 'docker' },
        { name: 'analyze-code', expected: 'analysis' },
        { name: 'generate-docs', expected: 'generation' },
        { name: 'unknown-cmd', expected: 'utility' },
      ];

      for (const { name, expected } of testCases) {
        const result = (converter as any).inferCategoryFromName(name);
        expect(result).toBe(expected);
      }
    });
  });

  describe('File-based conversion', () => {
    test('should convert command files', async () => {
      // Create a test OpenCode command file
      const testCommandPath = join(TEST_OUTPUT, 'test-command.md');
      const opencodeContent = `---
name: test
mode: command
description: Test command
model: anthropic/claude-sonnet-4
---

# Test Command

Test content.
`;

      await Bun.write(testCommandPath, opencodeContent);

      // Convert to Claude Code
      const claudeResult = await converter.convertFile(testCommandPath, 'claude-code');
      expect(claudeResult).not.toContain('model:'); // Claude Code commands don't have models
      expect(claudeResult).not.toContain('mode: command');

      // Convert to OpenCode
      const opencodeResult = await converter.convertFile(testCommandPath, 'opencode');
      expect(opencodeResult).toContain('mode: command');
      // OpenCode commands MUST have model field (per MODEL_CONFIGURATION.md)
      expect(opencodeResult).toContain('model: anthropic/claude-sonnet-4-20250514');
    });
  });
});

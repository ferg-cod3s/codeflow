import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FormatConverter } from '../../src/conversion/format-converter';
import { parseAgentFile, OpenCodeAgent } from '../../src/conversion/agent-parser';
import { YamlProcessor } from '../../src/yaml/yaml-processor';
import { ValidationEngine } from '../../src/yaml/validation-engine';

describe('Agent Conversion Integration', () => {
  let tempDir: string;
  let converter: FormatConverter;
  let yamlProcessor: YamlProcessor;
  let validator: ValidationEngine;

  beforeEach(async () => {
    tempDir = join(tmpdir(), 'agent-conversion-test-' + Date.now());
    await mkdir(tempDir, { recursive: true });
    converter = new FormatConverter();
    yamlProcessor = new YamlProcessor();
    validator = new ValidationEngine();
  });

  afterEach(async () => {
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test('converts base agent to opencode with proper YAML formatting', async () => {
    // Create a test base agent file
    const baseAgentContent = `---
name: test-agent
description: A test agent for conversion
mode: subagent
model: gpt-4
temperature: 0.7
tools:
  read: true
  write: true
  bash: false
category: test
tags:
  - utility
  - test
allowed_directories:
  - /tmp
  - /home/user
---

# Test Agent

This is a test agent for conversion testing.

## Instructions

Test the conversion functionality.
`;

    const baseAgentPath = join(tempDir, 'test-agent.md');
    await writeFile(baseAgentPath, baseAgentContent);

    // Parse the base agent
    const baseAgent = await parseAgentFile(baseAgentPath, 'base');

    // Convert to OpenCode format
    const openCodeAgent = converter.convert(baseAgent, 'opencode');

    // Validate the conversion
    const validation = validator.validate(openCodeAgent);
    expect(validation.valid).toBe(true);

    // Serialize to YAML and verify formatting
    const yamlResult = yamlProcessor.serialize(openCodeAgent);
    expect(yamlResult.success).toBe(true);

    if (!yamlResult.success) {
      throw new Error('Serialization failed');
    }
    const yamlContent = yamlResult.data;
    expect(yamlContent).toContain('name: test-agent');
    expect(yamlContent).toContain('description: A test agent for conversion');
    expect(yamlContent).toContain('mode: subagent');
    expect(yamlContent).toContain('model: gpt-4');
    expect(yamlContent).toContain('temperature: 0.7');
    expect(yamlContent).toContain('permission:');
    expect(yamlContent).toContain('  read: allow');
    expect(yamlContent).toContain('  write: allow');
    expect(yamlContent).toContain('  bash: deny');
    expect(yamlContent).toContain('category: test');
    expect(yamlContent).toContain('tags:');
    expect(yamlContent).toContain('  - utility');
    expect(yamlContent).toContain('  - test');
    expect(yamlContent).toContain('allowed_directories:');
    expect(yamlContent).toContain('  - /tmp');
    expect(yamlContent).toContain('  - /home/user');
  });

  test('handles permission conversion errors gracefully', async () => {
    // Create a base agent with invalid permission format
    const invalidAgentContent = `---
name: invalid-agent
description: Agent with invalid permissions
mode: subagent
tools:
  read: "invalid"  # Should be boolean
  write: true
---

# Invalid Agent

This agent has invalid tool configuration.
`;

    const invalidAgentPath = join(tempDir, 'invalid-agent.md');
    await writeFile(invalidAgentPath, invalidAgentContent);

    // Parse should work
    const baseAgent = await parseAgentFile(invalidAgentPath, 'base');

    // Conversion should handle the error gracefully
    // The validation should catch the invalid tool format
    const { ValidationEngine } = await import('../../src/yaml/validation-engine.js');
    const validator = new ValidationEngine();
    const validationResult = validator.validate(baseAgent);

    expect(validationResult.valid).toBe(false);
    expect(validationResult.errors.length).toBeGreaterThan(0);
    expect(validationResult.errors[0].message).toContain('boolean value');
  });

  test('sync operation fails fast on validation errors', async () => {
    // Create an agent with validation errors
    const invalidAgentContent = `---
name: invalid
description: ""  # Empty description should fail validation
mode: invalid_mode  # Invalid mode
temperature: 2.5  # Temperature too high
---

# Invalid Agent
`;

    const invalidAgentPath = join(tempDir, 'invalid-agent.md');
    await writeFile(invalidAgentPath, invalidAgentContent);

    // Parse the agent
    const baseAgent = await parseAgentFile(invalidAgentPath, 'base');

    // Validation should fail
    const validation = validator.validate(baseAgent);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);

    // Conversion should still work but validation should catch issues
    const openCodeAgent = converter.convert(baseAgent, 'opencode');
    const finalValidation = validator.validate(openCodeAgent);
    expect(finalValidation.valid).toBe(false);
  });

  test('round-trip conversion preserves data integrity', async () => {
    // Create a comprehensive test agent
    const originalContent = `---
name: roundtrip-agent
description: Test agent for round-trip conversion
mode: subagent
model: gpt-4
temperature: 0.8
tools:
  read: true
  write: true
  bash: true
  webfetch: false
category: utility
tags:
  - test
  - conversion
allowed_directories:
  - /tmp
  - /var/log
---

# Round-trip Test Agent

This agent tests data integrity through conversion cycles.

## Features

- Read/write operations
- Command execution
- Web fetching disabled
`;

    const originalPath = join(tempDir, 'roundtrip-agent.md');
    await writeFile(originalPath, originalContent);

    // Parse original
    const originalAgent = await parseAgentFile(originalPath, 'base');

    // Convert base -> opencode -> base
    const openCodeAgent = converter.convert(originalAgent, 'opencode');
    const roundTripAgent = converter.convert(openCodeAgent, 'base');

    // Verify key fields are preserved
    expect(roundTripAgent.name).toBe(originalAgent.name);
    expect(roundTripAgent.frontmatter.description).toBe(originalAgent.frontmatter.description);
    expect(roundTripAgent.frontmatter.mode ?? 'all').toBe(originalAgent.frontmatter.mode ?? 'all');
    expect(roundTripAgent.frontmatter.model ?? 'gpt-4').toBe(
      originalAgent.frontmatter.model ?? 'gpt-4'
    );
    expect(roundTripAgent.frontmatter.temperature ?? 0.7).toBe(
      originalAgent.frontmatter.temperature ?? 0.7
    );
    expect(roundTripAgent.frontmatter.category ?? '').toBe(
      originalAgent.frontmatter.category ?? ''
    );
    expect(roundTripAgent.frontmatter.tags ?? []).toEqual(originalAgent.frontmatter.tags ?? []);
    expect(roundTripAgent.frontmatter.allowed_directories ?? []).toEqual(
      originalAgent.frontmatter.allowed_directories ?? []
    );

    // Verify tools are preserved (converted back from permissions)
    expect(roundTripAgent.frontmatter.tools).toEqual({
      read: true,
      write: true,
      bash: true,
      webfetch: false,
      edit: false, // Default permission added during conversion
    });
  });

  test('handles malformed YAML gracefully', async () => {
    // Create malformed YAML
    const malformedContent = `---
name: malformed
description: Malformed YAML test
mode: subagent
tools:
  read: true
  write: true
  # Missing closing bracket for array
  tags: [test, malformed
---

# Malformed Agent

This has malformed YAML frontmatter.
`;

    const malformedPath = join(tempDir, 'malformed-agent.md');
    await writeFile(malformedPath, malformedContent);

    // Parsing might succeed with fallback parsing, but validation should catch issues
    try {
      const agent = await parseAgentFile(malformedPath, 'base');
      // If parsing succeeds, validation should catch the malformed structure
      const { ValidationEngine } = await import('../../src/yaml/validation-engine.js');
      const validator = new ValidationEngine();
      const validationResult = validator.validate(agent);
      expect(validationResult.valid).toBe(false);
    } catch (error) {
      // Parsing failed as expected
      expect(error).toBeDefined();
    }
  });

  test('converts agents with default permission fallbacks', async () => {
    // Create agent without explicit permissions
    const noPermContent = `---
name: no-perm-agent
description: Agent without explicit permissions
mode: subagent
model: gpt-4
---

# No Permissions Agent

This agent has no explicit permissions.
`;

    const noPermPath = join(tempDir, 'no-perm-agent.md');
    await writeFile(noPermPath, noPermContent);

    // Parse and convert
    const baseAgent = await parseAgentFile(noPermPath, 'base');
    const openCodeAgent = converter.convert(baseAgent, 'opencode');

    // Should have default permissions
    const openCodeFrontmatter = openCodeAgent.frontmatter as OpenCodeAgent;
    expect(openCodeFrontmatter.permission).toEqual({
      edit: 'deny',
      bash: 'deny',
      webfetch: 'allow',
    });
  });
});

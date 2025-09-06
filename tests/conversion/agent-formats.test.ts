import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import {
  parseAgentFile,
  parseAgentsFromDirectory,
  serializeAgent,
  Agent,
  BaseAgent,
  ClaudeCodeAgent,
  OpenCodeAgent,
} from '../../src/conversion/agent-parser';

describe('Agent Format Parsing', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codeflow-agent-test-'));
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('parses basic agent format correctly', async () => {
    const testAgent = `---
description: Test agent for parsing
mode: subagent
model: gpt-4
temperature: 0.7
tools:
  read_file: true
  write_file: false
---

# Test Agent

This is a test agent for parsing validation.

## Instructions

Follow these steps to test the agent.
`;

    const agentPath = path.join(tempDir, 'test-agent.md');
    await fs.writeFile(agentPath, testAgent);

    const agent = await parseAgentFile(agentPath, 'base');

    expect(agent.name).toBe('test-agent');
    expect(agent.format).toBe('base');
    expect(agent.frontmatter.description).toBe('Test agent for parsing');
    expect(agent.frontmatter.mode).toBe('subagent');
    expect(agent.frontmatter.model).toBe('gpt-4');
    expect(agent.frontmatter.temperature).toBe(0.7);
    expect(agent.frontmatter.tools).toEqual({
      read_file: true,
      write_file: false,
    });
    expect(agent.content).toContain('# Test Agent');
    expect(agent.filePath).toBe(agentPath);
  });

  test('parses Claude Code agent format', async () => {
    const claudeAgent = `---
description: Claude Code specific agent
mode: primary
model: claude-3-5-sonnet
temperature: 0.3
---

# Claude Code Agent

This agent is specific to Claude Code format.
`;

    const agentPath = path.join(tempDir, 'claude-agent.md');
    await fs.writeFile(agentPath, claudeAgent);

    const agent = await parseAgentFile(agentPath, 'claude-code');

    expect(agent.format).toBe('claude-code');
    expect(agent.frontmatter.model).toBe('claude-3-5-sonnet');
    expect(agent.frontmatter.temperature).toBe(0.3);
  });

  test('parses OpenCode agent format with additional fields', async () => {
    const openCodeAgent = `---
description: OpenCode specific agent
mode: subagent
model: gpt-4
usage: Use this agent for testing
do_not_use_when: Never use this agent when testing is not needed
escalation: escalate to senior-agent if issues arise
examples: Example 1, Example 2
prompts: Prompt instructions here
constraints: Limited to read-only operations
---

# OpenCode Agent

This agent has OpenCode-specific properties.
`;

    const agentPath = path.join(tempDir, 'opencode-agent.md');
    await fs.writeFile(agentPath, openCodeAgent);

    const agent = await parseAgentFile(agentPath, 'opencode');

    expect(agent.format).toBe('opencode');
    expect((agent.frontmatter as OpenCodeAgent).usage).toBe('Use this agent for testing');
    expect((agent.frontmatter as OpenCodeAgent).do_not_use_when).toBe(
      'Never use this agent when testing is not needed'
    );
    expect((agent.frontmatter as OpenCodeAgent).escalation).toBe(
      'escalate to senior-agent if issues arise'
    );
  });

  test('handles missing frontmatter gracefully', async () => {
    const invalidAgent = `# Agent Without Frontmatter

This agent has no YAML frontmatter.
`;

    const agentPath = path.join(tempDir, 'invalid-agent.md');
    await fs.writeFile(agentPath, invalidAgent);

    await expect(parseAgentFile(agentPath, 'base')).rejects.toThrow();
  });

  test('handles malformed frontmatter gracefully', async () => {
    const malformedAgent = `---
description: Test agent
invalid yaml: [unclosed array
---

# Malformed Agent
`;

    const agentPath = path.join(tempDir, 'malformed-agent.md');
    await fs.writeFile(agentPath, malformedAgent);

    // Should still parse but might have issues with the malformed YAML
    const agent = await parseAgentFile(agentPath, 'base');
    expect(agent.frontmatter.description).toBe('Test agent');
  });

  test('requires description field', async () => {
    const agentWithoutDescription = `---
mode: subagent
model: gpt-4
---

# Agent Without Description
`;

    const agentPath = path.join(tempDir, 'no-description.md');
    await fs.writeFile(agentPath, agentWithoutDescription);

    await expect(parseAgentFile(agentPath, 'base')).rejects.toThrow(
      'Agent must have a description field'
    );
  });

  test('parses complex tools configuration', async () => {
    const complexToolsAgent = `---
description: Agent with complex tools
tools:
  web_search: true
  file_operations: false
  database_query: true
  api_calls: false
---

# Complex Tools Agent
`;

    const agentPath = path.join(tempDir, 'complex-tools.md');
    await fs.writeFile(agentPath, complexToolsAgent);

    const agent = await parseAgentFile(agentPath, 'base');

    expect(agent.frontmatter.tools).toEqual({
      web_search: true,
      file_operations: false,
      database_query: true,
      api_calls: false,
    });
  });

  test('handles different data types in frontmatter', async () => {
    const typesAgent = `---
description: "Quoted string"
temperature: 0.5
max_tokens: 1000
enabled: true
disabled: false
model: unquoted-string
---

# Data Types Agent
`;

    const agentPath = path.join(tempDir, 'types-agent.md');
    await fs.writeFile(agentPath, typesAgent);

    const agent = await parseAgentFile(agentPath, 'base');

    expect(agent.frontmatter.description).toBe('Quoted string');
    expect(agent.frontmatter.temperature).toBe(0.5);
    expect(agent.frontmatter.max_tokens).toBe(1000);
    expect(agent.frontmatter.enabled).toBe(true);
    expect(agent.frontmatter.disabled).toBe(false);
    expect(agent.frontmatter.model).toBe('unquoted-string');
  });

  test('parses and serializes arrays correctly', async () => {
    const arrayAgent = `---
description: Agent with arrays
tags:
  - tag1
  - tag2
  - tag3
allowed_directories:
  - /path/to/dir1
  - /path/to/dir2
category: test
---

# Array Agent
`;

    const agentPath = path.join(tempDir, 'array-agent.md');
    await fs.writeFile(agentPath, arrayAgent);

    const agent = await parseAgentFile(agentPath, 'base');

    expect(agent.frontmatter.tags).toEqual(['tag1', 'tag2', 'tag3']);
    expect(agent.frontmatter.allowed_directories).toEqual(['/path/to/dir1', '/path/to/dir2']);
    expect(agent.frontmatter.category).toBe('test');

    // Test round-trip serialization
    const serialized = serializeAgent(agent);
    const roundtripPath = path.join(tempDir, 'roundtrip-array.md');
    await fs.writeFile(roundtripPath, serialized);
    const reparsedAgent = await parseAgentFile(roundtripPath, 'base');

    expect(reparsedAgent.frontmatter.tags).toEqual(['tag1', 'tag2', 'tag3']);
    expect(reparsedAgent.frontmatter.allowed_directories).toEqual([
      '/path/to/dir1',
      '/path/to/dir2',
    ]);
    expect(reparsedAgent.frontmatter.category).toBe('test');
  });

  test('handles inline array format correctly', async () => {
    const inlineArrayAgent = `---
description: Agent with inline arrays
tags: [tag1, tag2, tag3]
category: test
---

# Inline Array Agent
`;

    const agentPath = path.join(tempDir, 'inline-array-agent.md');
    await fs.writeFile(agentPath, inlineArrayAgent);

    const agent = await parseAgentFile(agentPath, 'base');

    expect(agent.frontmatter.tags).toEqual(['tag1', 'tag2', 'tag3']);
    expect(agent.frontmatter.category).toBe('test');

    // Test round-trip serialization (should convert to YAML list format)
    const serialized = serializeAgent(agent);
    const roundtripPath = path.join(tempDir, 'roundtrip-inline-array.md');
    await fs.writeFile(roundtripPath, serialized);
    const reparsedAgent = await parseAgentFile(roundtripPath, 'base');

    expect(reparsedAgent.frontmatter.tags).toEqual(['tag1', 'tag2', 'tag3']);
    expect(reparsedAgent.frontmatter.category).toBe('test');
  });

  test('handles mixed array formats and empty arrays', async () => {
    const mixedArrayAgent = `---
description: Agent with mixed array formats
tags: [tag1, tag2]
allowed_directories:
  - /path/to/dir1
  - /path/to/dir2
category: test
---

# Mixed Array Agent
`;

    const agentPath = path.join(tempDir, 'mixed-array-agent.md');
    await fs.writeFile(agentPath, mixedArrayAgent);

    const agent = await parseAgentFile(agentPath, 'base');

    expect(agent.frontmatter.tags).toEqual(['tag1', 'tag2']);
    expect(agent.frontmatter.allowed_directories).toEqual(['/path/to/dir1', '/path/to/dir2']);
    expect(agent.frontmatter.category).toBe('test');

    // Test round-trip serialization
    const serialized = serializeAgent(agent);
    const roundtripPath = path.join(tempDir, 'roundtrip-mixed-array.md');
    await fs.writeFile(roundtripPath, serialized);
    const reparsedAgent = await parseAgentFile(roundtripPath, 'base');

    expect(reparsedAgent.frontmatter.tags).toEqual(['tag1', 'tag2']);
    expect(reparsedAgent.frontmatter.allowed_directories).toEqual([
      '/path/to/dir1',
      '/path/to/dir2',
    ]);
    expect(reparsedAgent.frontmatter.category).toBe('test');
  });
});

describe('Agent Directory Parsing', () => {
  let testDir: string;

  beforeAll(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codeflow-dir-test-'));

    // Create test agents
    const agents = [
      {
        name: 'valid-agent-1.md',
        content: `---
description: First valid agent
mode: subagent
---
# Agent 1
`,
      },
      {
        name: 'valid-agent-2.md',
        content: `---
description: Second valid agent
mode: primary
---
# Agent 2
`,
      },
      {
        name: 'invalid-agent.md',
        content: `# Agent without frontmatter`,
      },
      {
        name: 'README.md',
        content: `# README - should be ignored`,
      },
      {
        name: 'not-markdown.txt',
        content: `This is not markdown`,
      },
    ];

    for (const agent of agents) {
      await fs.writeFile(path.join(testDir, agent.name), agent.content);
    }
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test('parses all valid agents from directory', async () => {
    const result = await parseAgentsFromDirectory(testDir, 'base');

    expect(result.agents).toHaveLength(2);
    expect(result.errors).toHaveLength(1); // invalid-agent.md should error

    const agentNames = result.agents.map((a) => a.name).sort();
    expect(agentNames).toEqual(['valid-agent-1', 'valid-agent-2']);

    // Should ignore README.md and .txt files
    expect(result.agents.find((a) => a.name === 'README')).toBeUndefined();
    expect(result.agents.find((a) => a.name === 'not-markdown')).toBeUndefined();
  });

  test('handles non-existent directory', async () => {
    const nonExistentDir = path.join(testDir, 'does-not-exist');
    const result = await parseAgentsFromDirectory(nonExistentDir, 'base');

    expect(result.agents).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  test('handles directory read errors', async () => {
    // Create a directory and then remove read permissions (Unix only)
    const restrictedDir = path.join(testDir, 'restricted');
    await fs.mkdir(restrictedDir);

    if (process.platform !== 'win32') {
      await fs.chmod(restrictedDir, 0o000); // No permissions

      const result = await parseAgentsFromDirectory(restrictedDir, 'base');

      expect(result.agents).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);

      // Restore permissions for cleanup
      await fs.chmod(restrictedDir, 0o755);
    }
  });
});

describe('Agent Serialization', () => {
  test('serializes agent back to markdown format', () => {
    const agent: Agent = {
      name: 'test-agent',
      format: 'base',
      frontmatter: {
        name: 'test-agent',
        description: 'Test agent for serialization',
        mode: 'subagent',
        model: 'gpt-4',
        temperature: 0.7,
        tools: {
          read_file: true,
          write_file: false,
        },
      },
      content: '# Test Agent\n\nThis is the content.',
      filePath: '/path/to/test-agent.md',
    };

    const serialized = serializeAgent(agent);

    expect(serialized).toContain('---');
    expect(serialized).toContain('description: Test agent for serialization');
    expect(serialized).toContain('mode: subagent');
    expect(serialized).toContain('model: gpt-4');
    expect(serialized).toContain('temperature: 0.7');
    expect(serialized).toContain('tools:');
    expect(serialized).toContain('  read_file: true');
    expect(serialized).toContain('  write_file: false');
    expect(serialized).toContain('# Test Agent');
    expect(serialized).toContain('This is the content.');
  });

  test('handles simple frontmatter without tools', () => {
    const simpleAgent: Agent = {
      name: 'simple-agent',
      format: 'base',
      frontmatter: {
        name: 'simple-agent',
        description: 'Simple test agent',
        mode: 'primary',
      },
      content: 'Simple content',
      filePath: '/path/to/simple-agent.md',
    };

    const serialized = serializeAgent(simpleAgent);

    expect(serialized).toContain('description: Simple test agent');
    expect(serialized).toContain('mode: primary');
    expect(serialized).not.toContain('tools:');
  });
});

describe('Round-trip Conversion', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codeflow-roundtrip-'));
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('round-trip conversion preserves data integrity', async () => {
    const originalAgent = `---
description: Original agent for round-trip test
mode: subagent
model: gpt-4
temperature: 0.8
tools:
  read_file: true
  write_file: true
  search: false
custom_field: custom_value
---

# Original Agent

This is the original agent content with **markdown** formatting.

## Section 1

Content with lists:

1. Item 1
2. Item 2
3. Item 3

## Section 2

More content here.
`;

    const agentPath = path.join(tempDir, 'roundtrip-agent.md');
    await fs.writeFile(agentPath, originalAgent);

    // Parse the agent
    const parsedAgent = await parseAgentFile(agentPath, 'base');

    // Serialize it back
    const serializedAgent = serializeAgent(parsedAgent);

    // Parse the serialized version
    const roundtripPath = path.join(tempDir, 'roundtrip-serialized.md');
    await fs.writeFile(roundtripPath, serializedAgent);
    const reparsedAgent = await parseAgentFile(roundtripPath, 'base');

    // Compare key fields
    expect(reparsedAgent.frontmatter.description).toBe(parsedAgent.frontmatter.description);
    if (parsedAgent.frontmatter.mode) {
      expect(reparsedAgent.frontmatter.mode).toBe(parsedAgent.frontmatter.mode);
    }
    if (parsedAgent.frontmatter.model) {
      expect(reparsedAgent.frontmatter.model).toBe(parsedAgent.frontmatter.model);
    }
    if (parsedAgent.frontmatter.temperature !== undefined) {
      expect(reparsedAgent.frontmatter.temperature).toBe(parsedAgent.frontmatter.temperature);
    }
    if (parsedAgent.frontmatter.tools) {
      expect(reparsedAgent.frontmatter.tools).toEqual(parsedAgent.frontmatter.tools);
    }

    // Content should be preserved
    expect(reparsedAgent.content.trim()).toBe(parsedAgent.content.trim());
  });
});

describe('Agent Validation', () => {
  test('validates all existing agents in the repository', async () => {
    const codeflowRoot = path.join(import.meta.dir, '../..');

    // Test base agents
    const baseResult = await parseAgentsFromDirectory(
      path.join(codeflowRoot, 'codeflow-agents'),
      'base'
    );

    if (baseResult.errors.length > 0) {
      console.warn('Base agent parsing errors:', baseResult.errors);
    }

    expect(baseResult.agents.length).toBeGreaterThan(0);

    // Test Claude Code agents
    const claudeResult = await parseAgentsFromDirectory(
      path.join(codeflowRoot, 'claude-agents'),
      'claude-code'
    );

    if (claudeResult.errors.length > 0) {
      console.warn('Claude Code agent parsing errors:', claudeResult.errors);
    }

    // May not have Claude Code agents, so just check for no critical errors
    expect(
      claudeResult.errors.filter((e) => e.message.includes('Failed to read directory')).length
    ).toBe(0);

    // Test OpenCode agents
    const opencodeResult = await parseAgentsFromDirectory(
      path.join(codeflowRoot, 'deprecated', 'opencode-agents'),
      'opencode'
    );

    if (opencodeResult.errors.length > 0) {
      console.warn('OpenCode agent parsing errors:', opencodeResult.errors);
    }

    expect(opencodeResult.agents.length).toBeGreaterThan(0);

    // All agents should have required fields
    const allAgents = [...baseResult.agents, ...claudeResult.agents, ...opencodeResult.agents];

    for (const agent of allAgents) {
      expect(agent.name).toBeDefined();
      expect(agent.frontmatter.description).toBeDefined();
      expect(typeof agent.frontmatter.description).toBe('string');
      expect(agent.frontmatter.description.length).toBeGreaterThan(0);
    }
  });

  test('validates agent frontmatter schemas', async () => {
    const validationTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codeflow-validation-'));

    try {
      const testAgents = [
        {
          format: 'base' as const,
          content: `---
description: Base agent
mode: subagent
---
# Base Agent`,
        },
        {
          format: 'claude-code' as const,
          content: `---
description: Claude Code agent
mode: primary
---
# Claude Code Agent`,
        },
        {
          format: 'opencode' as const,
          content: `---
description: OpenCode agent
mode: subagent
usage: For testing
escalation: senior-agent
---
# OpenCode Agent`,
        },
      ];

      for (const testAgent of testAgents) {
        const agentPath = path.join(validationTempDir, `${testAgent.format}-validation.md`);
        await fs.writeFile(agentPath, testAgent.content);

        const agent = await parseAgentFile(agentPath, testAgent.format);

        // All formats should have basic fields
        expect(agent.frontmatter.description).toBeDefined();
        expect(typeof agent.frontmatter.description).toBe('string');

        // OpenCode should have additional fields
        if (testAgent.format === 'opencode') {
          const openCodeAgent = agent.frontmatter as OpenCodeAgent;
          expect(openCodeAgent.usage).toBeDefined();
          expect(openCodeAgent.escalation).toBeDefined();
        }
      }
    } finally {
      await fs.rm(validationTempDir, { recursive: true, force: true });
    }
  });
});

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { join } from 'node:path';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { getTargetFormat, getAgentSourceDirs, copyAgentsWithConversion } from '../src/cli/setup';
import { FormatConverter } from '../src/conversion/format-converter';
import { ValidationEngine } from '../src/yaml/validation-engine';
import { globalPerformanceMonitor } from '../src/optimization/performance';

describe('Setup Agents Functionality', () => {
  let tempDir: string;
  let converter: FormatConverter;
  let validator: ValidationEngine;

  beforeEach(async () => {
    tempDir = join(tmpdir(), 'setup-agents-test-' + Date.now());
    await mkdir(tempDir, { recursive: true });
    converter = new FormatConverter();
    validator = new ValidationEngine();
    globalPerformanceMonitor.reset();
  });

  afterEach(async () => {
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('getTargetFormat', () => {
    test('should detect Claude Code format from .claude directory', () => {
      const setupDir = '.claude/commands';
      expect(getTargetFormat(setupDir)).toBe('claude-code');
    });

    test('should detect OpenCode format from .opencode directory', () => {
      const setupDir = '.opencode/agent';
      expect(getTargetFormat(setupDir)).toBe('opencode');
    });

    test('should return null for unrecognized directory structure', () => {
      const setupDir = 'unknown/agent';
      expect(getTargetFormat(setupDir)).toBe(null);
    });

    test('should handle nested directory paths', () => {
      const setupDir = '/project/.claude/commands/subdir';
      expect(getTargetFormat(setupDir)).toBe('claude-code');
    });
  });

  describe('getAgentSourceDirs', () => {
    test('should return only base-agents directory as single source', () => {
      const sourcePath = tempDir;
      const targetFormat = 'claude-code';

      // After fix: only returns base-agents (single source of truth)
      const result = getAgentSourceDirs(sourcePath, targetFormat);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatch(/base-agents$/);
    });

    test('should return same base-agents directory regardless of target format', () => {
      const sourcePath = tempDir;

      // All formats should use the same base-agents source
      const claudeResult = getAgentSourceDirs(sourcePath, 'claude-code');
      const opencodeResult = getAgentSourceDirs(sourcePath, 'opencode');
      const cursorResult = getAgentSourceDirs(sourcePath, 'cursor');

      expect(claudeResult).toHaveLength(1);
      expect(opencodeResult).toHaveLength(1);
      expect(cursorResult).toHaveLength(1);
      expect(claudeResult[0]).toBe(opencodeResult[0]);
      expect(claudeResult[0]).toBe(cursorResult[0]);
    });
  });

  describe('copyAgentsWithConversion', () => {
    test('should successfully convert base agents to claude-code format', async () => {
      // Create base-agents subdirectory in temp location (new single source)
      const sourceDir = join(tempDir, 'base-agents');
      await mkdir(sourceDir, { recursive: true });

      const baseAgentContent = `---
name: test-agent
description: A test agent for conversion
mode: subagent
model: gpt-4o
temperature: 0.7
tools:
  read: true
  write: true
  bash: false
---

# Test Agent

This is a test agent.
`;

      await writeFile(join(sourceDir, 'test-agent.md'), baseAgentContent);

      // Create target directory
      const targetDir = join(tempDir, 'target');
      await mkdir(targetDir, { recursive: true });

      // Temporarily change to temp directory so cwd checks find our test base-agents
      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        // Run conversion
        const result = await copyAgentsWithConversion(tempDir, targetDir, 'claude-code');

        expect(result).toBe(1); // One agent converted

        // Verify converted file exists
        const convertedPath = join(targetDir, 'test-agent.md');
        const convertedContent = await require('node:fs/promises').readFile(convertedPath, 'utf-8');

        expect(convertedContent).toContain('name: test-agent');
        expect(convertedContent).toContain('description: A test agent for conversion');
        expect(convertedContent).toContain('tools: read, write');
        expect(convertedContent).not.toContain('mode:'); // Claude Code doesn't use mode
      } finally {
        process.chdir(originalCwd);
      }
    });

    test('should handle parsing errors gracefully', async () => {
      // Create base-agents directory with malformed agent
      const sourceDir = join(tempDir, 'base-agents');
      await mkdir(sourceDir, { recursive: true });

      const malformedContent = `---
name: malformed
description: ""
# Missing closing ---
# Invalid YAML structure
tools:
  read: not_boolean
---

# Malformed Agent
`;

      await writeFile(join(sourceDir, 'malformed.md'), malformedContent);

      const targetDir = join(tempDir, 'target');
      await mkdir(targetDir, { recursive: true });

      // Temporarily change to temp directory
      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        // Should not throw, but log errors and continue
        const result = await copyAgentsWithConversion(tempDir, targetDir, 'opencode');

        expect(result).toBe(0); // No agents successfully converted

        // Verify error was logged (we can't easily test console output, but ensure no crash)
        expect(result).toBeDefined();
      } finally {
        process.chdir(originalCwd);
      }
    });

    test('should fallback to package root base-agents when local base-agents missing', async () => {
      const targetDir = join(tempDir, 'target');
      await mkdir(targetDir, { recursive: true });

      // Temporarily change to temp directory where no base-agents exists
      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const result = await copyAgentsWithConversion(tempDir, targetDir, 'claude-code');

        // With new architecture, should fallback to package root base-agents (135 agents)
        expect(result).toBeGreaterThan(0); // Falls back to package root base-agents
        expect(result).toBeDefined(); // Should not throw
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('FormatConverter batch processing', () => {
    test('should convert batch of agents efficiently', async () => {
      // Create multiple base agents
      const agents: any[] = [];
      for (let i = 0; i < 10; i++) {
        const baseAgent = {
          name: `batch-agent-${i}`,
          format: 'base' as const,
          frontmatter: {
            name: `batch-agent-${i}`,
            description: `Batch test agent ${i}`,
            mode: 'subagent' as const,
            tools: { read: true, write: i % 2 === 0 },
          },
          content: `Content for agent ${i}`,
          filePath: `/test/agent-${i}.md`,
        };
        agents.push(baseAgent);
      }

      // Time the batch conversion
      const startTime = performance.now();
      const convertedAgents = converter.convertBatch(agents, 'opencode');
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(convertedAgents).toHaveLength(10);
      expect(duration).toBeLessThan(100); // Should be fast

      // Verify all conversions are valid
      convertedAgents.forEach((agent, index) => {
        expect(agent.format).toBe('opencode');
        expect(agent.frontmatter.name).toBe(`batch-agent-${index}`);
        const validation = validator.validate(agent);
        expect(validation.valid).toBe(true);
      });
    });
  });

  describe('FormatConverter round-trip integrity', () => {
    test('should maintain data integrity in round-trip conversions', () => {
      const originalAgent = {
        name: 'roundtrip-test',
        format: 'base' as const,
        frontmatter: {
          name: 'roundtrip-test',
          description: 'Test agent for round-trip conversion',
          mode: 'subagent' as const,
          model: 'anthropic/claude-sonnet-4',
          temperature: 0.8,
          tools: {
            read: true,
            write: true,
            bash: true,
            webfetch: false,
          },
          category: 'test',
          tags: ['conversion', 'integrity'],
        },
        content: '# Round-trip Test Agent\n\nThis agent tests data integrity.',
        filePath: '/test/roundtrip.md',
      };

      // Test round-trip: base -> opencode -> base
      const openCodeAgent = converter.convert(originalAgent, 'opencode');
      const roundTripAgent = converter.convert(openCodeAgent, 'base');

      // Verify key fields are preserved
      expect(roundTripAgent.name).toBe(originalAgent.name);
      expect(roundTripAgent.frontmatter.description).toBe(originalAgent.frontmatter.description);
      expect(roundTripAgent.frontmatter.mode).toBe(originalAgent.frontmatter.mode);
      // Model conversion is expected for OpenCode format - verify OpenCode format was used
      expect(openCodeAgent.frontmatter.model).toBe('opencode/grok-code');
      expect(roundTripAgent.frontmatter.temperature).toBe(originalAgent.frontmatter.temperature);
      expect(roundTripAgent.frontmatter.category).toBe(originalAgent.frontmatter.category);
      expect(roundTripAgent.frontmatter.tags).toEqual(originalAgent.frontmatter.tags);

      // Tools should be reconstructed from permissions
      expect(roundTripAgent.frontmatter.tools).toEqual({
        read: true,
        write: true,
        bash: true,
        webfetch: false,
        edit: false, // Default permission added
      });
    });
  });

  describe('Validation integration', () => {
    test('should validate converted agents automatically', () => {
      // Create agent with validation issues
      const invalidAgent = {
        name: 'invalid',
        format: 'base' as const,
        frontmatter: {
          name: 'invalid',
          description: '', // Empty description - should fail validation
          mode: 'invalid_mode', // Invalid mode
          temperature: 3.0, // Out of range
        },
        content: 'Invalid agent content',
        filePath: '/test/invalid.md',
      };

      // Attempt conversion
      const convertedAgent = converter.convert(invalidAgent as any, 'opencode');

      // Validate the result
      const validation = validator.validate(convertedAgent);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(
        validation.errors.some((e) => e.message.includes('required') || e.message.includes('empty'))
      ).toBe(true);
    });

    test('should pass validation for properly converted agents', () => {
      const validAgent = {
        name: 'valid-agent',
        format: 'base' as const,
        frontmatter: {
          name: 'valid-agent',
          description: 'A properly formatted agent for testing',
          mode: 'subagent',
          temperature: 0.7,
          tools: { read: true, write: false },
        },
        content: '# Valid Agent\n\nThis agent should pass all validations.',
        filePath: '/test/valid.md',
      };

      const convertedAgent = converter.convert(validAgent as any, 'claude-code');
      const validation = validator.validate(convertedAgent);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings).toHaveLength(0);
    });
  });

  describe('Performance monitoring integration', () => {
    test('should track agent parsing performance', async () => {
      // Create a test agent file in base-agents
      const agentDir = join(tempDir, 'base-agents');
      await mkdir(agentDir, { recursive: true });

      const agentContent = `---
name: perf-test
description: Performance test agent
mode: subagent
---

# Performance Test
`;

      await writeFile(join(agentDir, 'perf-test.md'), agentContent);

      const targetDir = join(tempDir, 'target');
      await mkdir(targetDir, { recursive: true });

      // Temporarily change to temp directory
      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        // Clear previous metrics
        globalPerformanceMonitor.reset();

        // Run conversion
        await copyAgentsWithConversion(tempDir, targetDir, 'opencode');

        // Check that performance metrics were updated
        const metrics = globalPerformanceMonitor.getMetrics();
        expect(metrics.agentParseTime).toBeGreaterThan(0);
        expect(metrics.cache.hitRate).toBeDefined();
      } finally {
        process.chdir(originalCwd);
      }
    });
  });
});

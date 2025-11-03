import { FormatConverter } from '../../../src/conversion/format-converter.js';
import { parseAgentFile } from '../../../src/conversion/agent-parser.js';
import { describe, it, expect } from 'bun:test';

describe('Format Converter with Dual Frontmatter', () => {
  it('should filter internal fields from OpenCode format', async () => {
    const agentPath = 'base-agents/development/full_stack_developer.md';

    const agent = await parseAgentFile(agentPath, 'base');

    const converter = new FormatConverter();
    const convertedAgent = converter.baseToOpenCode(agent);

    // Should have basic agent fields
    expect(convertedAgent.frontmatter.name).toBe('full_stack_developer');
    expect(convertedAgent.frontmatter.description).toBeDefined();

    // Should NOT have internal fields (these are filtered by the converter)
    expect((convertedAgent.frontmatter as any).output_format).toBeUndefined();
    expect((convertedAgent.frontmatter as any).requires_structured_output).toBeUndefined();
    expect((convertedAgent.frontmatter as any).validation_rules).toBeUndefined();
    expect((convertedAgent.frontmatter as any).primary_objective).toBeUndefined();
    expect((convertedAgent.frontmatter as any).anti_objectives).toBeUndefined();
    expect((convertedAgent.frontmatter as any).intended_followups).toBeUndefined();
  });

  it('should filter internal fields from Claude Code format', async () => {
    const agentPath = 'base-agents/development/full_stack_developer.md';

    const agent = await parseAgentFile(agentPath, 'base');

    const converter = new FormatConverter();
    const convertedAgent = converter.baseToClaudeCode(agent);

    // Should have basic agent fields
    expect(convertedAgent.frontmatter.name).toBe('full_stack_developer');
    expect(convertedAgent.frontmatter.description).toBeDefined();

    // Should NOT have internal fields (these are filtered by the converter)
    expect(convertedAgent.frontmatter.output_format).toBeUndefined();
    expect(convertedAgent.frontmatter.requires_structured_output).toBeUndefined();
    expect(convertedAgent.frontmatter.validation_rules).toBeUndefined();
    expect(convertedAgent.frontmatter.primary_objective).toBeUndefined();
    expect(convertedAgent.frontmatter.anti_objectives).toBeUndefined();
    expect(convertedAgent.frontmatter.intended_followups).toBeUndefined();
  });
});

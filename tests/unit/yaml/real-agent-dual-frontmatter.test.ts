import { YamlProcessor } from '../../../src/yaml/yaml-processor.js';
import { readFileSync } from 'fs';
import { describe, it, expect } from 'bun:test';

describe('Real Agent Dual Frontmatter Parsing', () => {
  it('should parse full_stack_developer.md correctly', () => {
    const agentContent = readFileSync('base-agents/development/full_stack_developer.md', 'utf8');

    const processor = new YamlProcessor();
    const result = processor.parse(agentContent);

    expect(result.success).toBe(true);
    if (result.success) {
      console.log('Frontmatter keys:', Object.keys(result.data.frontmatter));
      console.log('Has name:', 'name' in result.data.frontmatter);
      console.log('Has output_format:', 'output_format' in result.data.frontmatter);
      console.log('Has validation_rules:', 'validation_rules' in result.data.frontmatter);
      console.log('Body starts with:', result.data.body.substring(0, 50));

      // Should have keys from both blocks
      expect(result.data.frontmatter.name).toBe('full_stack_developer');
      expect(result.data.frontmatter.output_format).toBe('AGENT_OUTPUT_V1');
      expect(result.data.frontmatter.requires_structured_output).toBe(true);
      expect(Array.isArray(result.data.frontmatter.validation_rules)).toBe(true);
      expect(result.data.body).toContain('# Full-Stack Developer');
    }
  });
});

import { YamlProcessor } from '../../../src/yaml/yaml-processor.js';
import { readFileSync } from 'fs';
import { describe, it, expect } from 'bun:test';

describe('Current Agent Parsing', () => {
  it('should show current parsing behavior', () => {
    const agentContent = readFileSync('base-agents/development/full_stack_developer.md', 'utf8');

    const processor = new YamlProcessor();
    const result = processor.parse(agentContent);

    expect(result.success).toBe(true);
    if (result.success) {
      console.log('Current frontmatter keys:', Object.keys(result.data.frontmatter));
      console.log('Body starts with:', result.data.body.substring(0, 100));

      // Should now work with dual frontmatter parsing
      expect(result.data.frontmatter.name).toBe('full_stack_developer');
      expect(result.data.frontmatter.output_format).toBe('AGENT_OUTPUT_V1');
      expect(result.data.frontmatter.requires_structured_output).toBe(true);
      expect(Array.isArray(result.data.frontmatter.validation_rules)).toBe(true);
      expect(result.data.body).toContain('# Full-Stack Developer');
    }
  });
});

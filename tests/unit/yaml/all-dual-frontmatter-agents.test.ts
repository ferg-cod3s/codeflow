import { YamlProcessor } from '../../../src/yaml/yaml-processor.js';
import { readFileSync } from 'fs';
import { describe, it, expect } from 'bun:test';

describe('All Dual Frontmatter Agents', () => {
  const dualFrontmatterAgents = [
    'base-agents/development/full_stack_developer.md',
    'base-agents/business-analytics/growth_engineer.md',
    'base-agents/operations/deployment_wizard.md',
    'base-agents/operations/devops_operations_specialist.md',
  ];

  dualFrontmatterAgents.forEach((agentPath) => {
    it(`should parse ${agentPath.split('/').pop()} correctly`, () => {
      const agentContent = readFileSync(agentPath, 'utf8');

      const processor = new YamlProcessor();
      const result = processor.parse(agentContent);

      expect(result.success).toBe(true);
      if (result.success) {
        console.log(`\n=== ${agentPath.split('/').pop()} ===`);
        console.log('Frontmatter keys:', Object.keys(result.data.frontmatter));
        console.log('Has output_format:', 'output_format' in result.data.frontmatter);
        console.log('Has validation_rules:', 'validation_rules' in result.data.frontmatter);

        // Should have basic agent fields
        expect(result.data.frontmatter.name).toBeDefined();
        expect(result.data.frontmatter.description).toBeDefined();

        // Should have dual frontmatter fields
        expect(result.data.frontmatter.output_format).toBeDefined();
        expect(result.data.frontmatter.requires_structured_output).toBe(true);
        expect(Array.isArray(result.data.frontmatter.validation_rules)).toBe(true);

        // Body should not contain frontmatter content
        expect(result.data.body).not.toContain('output_format:');
        expect(result.data.body).not.toContain('requires_structured_output:');
        expect(result.data.body).not.toContain('validation_rules:');
      }
    });
  });
});

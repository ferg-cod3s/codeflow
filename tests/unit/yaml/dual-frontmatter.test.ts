import { YamlProcessor } from '../../../src/yaml/yaml-processor.js';
import { describe, it, expect } from 'bun:test';

describe('Dual Frontmatter Parsing', () => {
  it('should parse dual frontmatter blocks correctly', () => {
    const testContent = `---
name: test
---
---
output_format: TEST
requires_structured_output: true
validation_rules:
  - test
---

Body content here`;

    const processor = new YamlProcessor();
    const result = processor.parse(testContent);

    expect(result.success).toBe(true);
    if (result.success) {
      console.log('Frontmatter keys:', Object.keys(result.data.frontmatter));
      console.log('Frontmatter:', JSON.stringify(result.data.frontmatter, null, 2));
      console.log('Body:', JSON.stringify(result.data.body));

      // Should have keys from both blocks
      expect(result.data.frontmatter.name).toBe('test');
      expect(result.data.frontmatter.output_format).toBe('TEST');
      expect(result.data.frontmatter.requires_structured_output).toBe(true);
      expect(Array.isArray(result.data.frontmatter.validation_rules)).toBe(true);
      expect(result.data.body).toBe('Body content here');
    }
  });
});

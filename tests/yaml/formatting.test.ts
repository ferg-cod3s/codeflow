import { describe, test, expect, beforeEach } from 'bun:test';
import { YamlProcessor } from '../../src/yaml/yaml-processor';
import { ArrayParser } from '../../src/yaml/array-parser';
import { Agent, BaseAgent } from '../../src/conversion/agent-parser';

describe('YAML Formatting', () => {
  let yamlProcessor: YamlProcessor;
  let arrayParser: ArrayParser;

  beforeEach(() => {
    yamlProcessor = new YamlProcessor();
    arrayParser = new ArrayParser();
  });

  describe('Array Serialization', () => {
    test('serializes simple arrays correctly', () => {
      const items = ['item1', 'item2', 'item3'];
      const result = arrayParser.serializeInlineArray(items);
      expect(result).toBe('[item1, item2, item3]');
    });

    test('quotes items with special characters', () => {
      const items = ['normal', 'with space', 'with,comma', 'with:colon'];
      const result = arrayParser.serializeInlineArray(items);
      expect(result).toContain('"with space"');
      expect(result).toContain('"with,comma"');
      expect(result).toContain('"with:colon"');
    });

    test('handles empty arrays', () => {
      const result = arrayParser.serializeInlineArray([]);
      expect(result).toBe('[]');
    });

    test('handles null and undefined', () => {
      const result = arrayParser.serializeInlineArray(null as any);
      expect(result).toBe('[]');
    });

    test('serializes YAML list format', () => {
      const items = ['item1', 'item2', 'item3'];
      const result = arrayParser.serializeYamlList(items);
      const lines = result.trim().split('\n');
      expect(lines).toEqual(['- item1', '- item2', '- item3']);
    });

    test('quotes items in YAML list with special characters', () => {
      const items = ['normal', 'with space'];
      const result = arrayParser.serializeYamlList(items);
      expect(result).toContain('- "with space"');
    });
  });

  describe('Array Parsing', () => {
    test('parses simple inline arrays', () => {
      const result = arrayParser.parseInlineArray('[item1, item2, item3]');
      expect(result.success).toBe(true);
      expect(result.items).toEqual(['item1', 'item2', 'item3']);
    });

    test('handles quoted strings with commas', () => {
      const result = arrayParser.parseInlineArray('["item,with,comma", item2]');
      expect(result.success).toBe(true);
      expect(result.items).toEqual(['item,with,comma', 'item2']);
    });

    test('handles mixed quotes', () => {
      const result = arrayParser.parseInlineArray('["double", \'single\', unquoted]');
      expect(result.success).toBe(true);
      expect(result.items).toEqual(['double', 'single', 'unquoted']);
    });

    test('handles whitespace', () => {
      const result = arrayParser.parseInlineArray('[  item1  ,  item2  ]');
      expect(result.success).toBe(true);
      expect(result.items).toEqual(['item1', 'item2']);
    });

    test('rejects malformed arrays', () => {
      const result = arrayParser.parseInlineArray('[item1, item2');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Array must be enclosed in brackets [ ]');
    });

    test('handles unclosed quotes', () => {
      const result = arrayParser.parseInlineArray('["unclosed, quote]');
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('parses YAML list format', () => {
      const yamlList = `- item1
- item2
- "item with space"`;
      const result = arrayParser.parseYamlList(yamlList.split('\n'));
      expect(result.success).toBe(true);
      expect(result.items).toEqual(['item1', 'item2', 'item with space']);
    });
  });

  describe('YAML Processor Serialization', () => {
    test('serializes agent with proper block style', () => {
      const agent: Agent = {
        name: 'test-agent',
        format: 'base',
        filePath: '/test/path',
        content: '# Test content',
        frontmatter: {
          name: 'test-agent',
          description: 'Test agent',
          mode: 'subagent',
          model: 'gpt-4o',
          temperature: 0.7,
          tools: {
            read: true,
            write: true,
          },
          tags: ['test', 'utility'],
          allowed_directories: ['/tmp', '/home'],
        } as BaseAgent,
      };

      const result = yamlProcessor.serialize(agent);
      expect(result.success).toBe(true);

      if (!result.success) {
        throw new Error('Serialization failed');
      }
      const yaml = result.data;
      expect(yaml).toContain('---');
      expect(yaml).toContain('name: test-agent');
      expect(yaml).toContain('description: Test agent');
      expect(yaml).toContain('mode: subagent');
      expect(yaml).toContain('model: gpt-4o');
      expect(yaml).toContain('temperature: 0.7');
      expect(yaml).toContain('tools:');
      expect(yaml).toContain('  read: true');
      expect(yaml).toContain('  write: true');
      expect(yaml).toContain('tags:');
      expect(yaml).toContain('  - test');
      expect(yaml).toContain('  - utility');
      expect(yaml).toContain('allowed_directories:');
      expect(yaml).toContain('  - /tmp');
      expect(yaml).toContain('  - /home');
      expect(yaml).toContain('# Test content');
    });

    test('uses block style for arrays and objects', () => {
      const agent: Agent = {
        name: 'block-style-test',
        format: 'base',
        filePath: '/test/path',
        content: 'Test content',
        frontmatter: {
          name: 'block-style-test',
          description: 'Test block style formatting',
          tags: ['tag1', 'tag2', 'tag3'],
          config: {
            setting1: 'value1',
            setting2: 'value2',
          },
        } as BaseAgent,
      };

      const result = yamlProcessor.serialize(agent);
      expect(result.success).toBe(true);

      if (!result.success) {
        throw new Error('Serialization failed');
      }
      const yaml = result.data;
      // Should use block style (indented) for arrays and objects
      expect(yaml).toContain('tags:');
      expect(yaml).toContain('  - tag1');
      expect(yaml).toContain('  - tag2');
      expect(yaml).toContain('config:');
      expect(yaml).toContain('  setting1: value1');
      expect(yaml).toContain('  setting2: value2');

      // Should NOT contain flow style
      expect(yaml).not.toContain('tags: [');
      expect(yaml).not.toContain('config: {');
    });

    test('handles special characters in content', () => {
      const agent: Agent = {
        name: 'special-chars',
        format: 'base',
        filePath: '/test/path',
        content:
          '# Content with special chars\n\n- List item\n- Another item\n\n```code\nconsole.log("hello");\n```',
        frontmatter: {
          name: 'special-chars',
          description: 'Test special characters',
        } as BaseAgent,
      };

      const result = yamlProcessor.serialize(agent);
      expect(result.success).toBe(true);

      if (!result.success) {
        throw new Error('Serialization failed');
      }
      const yaml = result.data;
      expect(yaml).toContain('# Content with special chars');
      expect(yaml).toContain('- List item');
      expect(yaml).toContain('- Another item');
      expect(yaml).toContain('```code');
      expect(yaml).toContain('console.log("hello");');
    });

    test('handles empty and null values', () => {
      const agent: Agent = {
        name: 'empty-values',
        format: 'base',
        filePath: '/test/path',
        content: 'Test content',
        frontmatter: {
          name: 'empty-values',
          description: 'Test empty values',
          optionalField: null,
          emptyString: '',
          undefinedField: undefined,
        } as BaseAgent,
      };

      const result = yamlProcessor.serialize(agent);
      expect(result.success).toBe(true);

      if (!result.success) {
        throw new Error('Serialization failed');
      }
      const yaml = result.data;
      expect(yaml).toContain('name: empty-values');
      expect(yaml).toContain('description: Test empty values');
      // Null and undefined values should be omitted
      expect(yaml).not.toContain('optionalField');
      expect(yaml).not.toContain('undefinedField');
      // Empty strings should be preserved
      expect(yaml).toContain('emptyString: ""');
    });
  });

  describe('YAML Processor Parsing', () => {
    test('parses valid YAML content', () => {
      const yamlContent = `---
name: test-agent
description: Test agent
mode: subagent
tags:
  - test
  - utility
---

# Test Content

This is test content.`;

      const result = yamlProcessor.parse(yamlContent);
      expect(result.success).toBe(true);

      if (!result.success) {
        throw new Error('Parsing failed');
      }
      const parsed = result.data;
      expect(parsed.frontmatter.name).toBe('test-agent');
      expect(parsed.frontmatter.description).toBe('Test agent');
      expect(parsed.frontmatter.mode).toBe('subagent');
      expect(parsed.frontmatter.tags).toEqual(['test', 'utility']);
      expect(parsed.body).toContain('# Test Content');
      expect(parsed.body).toContain('This is test content.');
    });

    test('handles missing frontmatter', () => {
      const contentWithoutFrontmatter = `# Just content

No frontmatter here.`;

      const result = yamlProcessor.parse(contentWithoutFrontmatter);
      expect(result.success).toBe(false);
      if (result.success) {
        throw new Error('Expected parsing to fail');
      }
      expect(result.error.message).toContain('No frontmatter found');
    });

    test('handles malformed YAML', () => {
      const malformedYaml = `---
name: test
description: Test
# Missing closing bracket
tags: [incomplete, array

---

Content`;

      const result = yamlProcessor.parse(malformedYaml);
      expect(result.success).toBe(false);
      if (result.success) {
        throw new Error('Expected parsing to fail');
      }
      expect(result.error.message).toContain('YAML parsing failed');
    });

    test('handles empty frontmatter', () => {
      const emptyFrontmatter = `---
---

Content`;

      const result = yamlProcessor.parse(emptyFrontmatter);
      expect(result.success).toBe(true);
      if (!result.success) {
        throw new Error('Parsing failed');
      }
      expect(result.data.frontmatter).toEqual({});
      expect(result.data.body).toBe('Content');
    });
  });

  describe('Round-trip Serialization', () => {
    test('preserves data through parse and serialize', () => {
      const originalYaml = `---
name: roundtrip-test
description: Test round-trip serialization
mode: subagent
model: gpt-4o
temperature: 0.8
tools:
  read: true
  write: true
  bash: false
tags:
  - test
  - roundtrip
config:
  setting1: value1
  setting2: value2
allowed_directories:
  - /tmp
  - /home/user
---

# Round-trip Test

This tests that data is preserved through parsing and serialization.`;

      // Parse
      const parseResult = yamlProcessor.parse(originalYaml);
      expect(parseResult.success).toBe(true);

      if (!parseResult.success) {
        throw new Error('Parsing failed');
      }

      // Create agent from parsed data
      const agent: Agent = {
        name: 'roundtrip-test',
        format: 'base',
        filePath: '/test/path',
        content: parseResult.data.body,
        frontmatter: parseResult.data.frontmatter as BaseAgent,
      };

      // Serialize back
      const serializeResult = yamlProcessor.serialize(agent);
      expect(serializeResult.success).toBe(true);

      if (!serializeResult.success) {
        throw new Error('Serialization failed');
      }
      const roundTripYaml = serializeResult.data;

      // Parse again to verify
      const finalParseResult = yamlProcessor.parse(roundTripYaml);
      expect(finalParseResult.success).toBe(true);

      if (!finalParseResult.success) {
        throw new Error('Final parsing failed');
      }

      // Verify key data is preserved
      const finalData = finalParseResult.data;
      expect(finalData.frontmatter.name).toBe('roundtrip-test');
      expect(finalData.frontmatter.description).toBe('Test round-trip serialization');
      expect(finalData.frontmatter.mode).toBe('subagent');
      expect(finalData.frontmatter.model).toBe('gpt-4o');
      expect(finalData.frontmatter.temperature).toBe(0.8);
      expect(finalData.frontmatter.tools).toEqual({
        read: true,
        write: true,
        bash: false,
      });
      expect(finalData.frontmatter.tags).toEqual(['test', 'roundtrip']);
      expect(finalData.frontmatter.config).toEqual({
        setting1: 'value1',
        setting2: 'value2',
      });
      expect(finalData.frontmatter.allowed_directories).toEqual(['/tmp', '/home/user']);
      expect(finalData.body).toContain('# Round-trip Test');
    });
  });

  describe('Error Handling', () => {
    test('provides detailed error information', () => {
      const malformedYaml = `---
name: test
description: Test
# Invalid YAML syntax
invalid: [missing, closing
---

Content`;

      const result = yamlProcessor.parse(malformedYaml);
      expect(result.success).toBe(false);

      if (result.success) {
        throw new Error('Expected parsing to fail');
      }
      const error = result.error;
      expect(error.message).toContain('YAML parsing failed');
      expect(error.line).toBeDefined();
      expect(error.column).toBeDefined();
    });

    test('handles serialization errors', () => {
      const invalidAgent: Agent = {
        name: 'invalid',
        format: 'base',
        filePath: '/test/path',
        content: 'Test content',
        frontmatter: {
          // This would cause serialization issues
          circular: {} as any,
        } as unknown as BaseAgent,
      };

      // Create circular reference
      (invalidAgent.frontmatter as any).circular.self = invalidAgent.frontmatter;

      const result = yamlProcessor.serialize(invalidAgent);
      expect(result.success).toBe(false);
      if (result.success) {
        throw new Error('Expected serialization to fail');
      }
      expect(result.error.message).toContain('YAML serialization failed');
    });
  });
});

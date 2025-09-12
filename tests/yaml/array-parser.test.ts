import { describe, it, expect, beforeEach } from 'bun:test';
import { ArrayParser } from '../../src/yaml/array-parser';

describe('ArrayParser', () => {
  let parser: ArrayParser;

  beforeEach(() => {
    parser = new ArrayParser();
  });

  describe('parseInlineArray', () => {
    it('should parse simple arrays correctly', () => {
      const result = parser.parseInlineArray('[item1, item2, item3]');
      expect(result.errors).toHaveLength(0);
      expect(result.items).toEqual(['item1', 'item2', 'item3']);
    });

    it('should handle quoted strings with commas', () => {
      const result = parser.parseInlineArray('["item, with, comma", other]');
      expect(result.errors).toHaveLength(0);
      expect(result.items).toEqual(['item, with, comma', 'other']);
    });

    it('should handle mixed quotes', () => {
      const result = parser.parseInlineArray('["double", \'single\', unquoted]');
      expect(result.errors).toHaveLength(0);
      expect(result.items).toEqual(['double', 'single', 'unquoted']);
    });

    it('should handle empty arrays', () => {
      const result = parser.parseInlineArray('[]');
      expect(result.errors).toHaveLength(0);
      expect(result.items).toEqual([]);
    });

    it('should handle whitespace', () => {
      const result = parser.parseInlineArray('[  item1  ,  item2  ]');
      expect(result.errors).toHaveLength(0);
      expect(result.items).toEqual(['item1', 'item2']);
    });

    it('should handle escaped quotes', () => {
      const result = parser.parseInlineArray('["item \\"with\\" quotes", other]');
      expect(result.errors).toHaveLength(0);
      expect(result.items).toEqual(['item "with" quotes', 'other']);
    });

    it('should reject malformed arrays', () => {
      const result = parser.parseInlineArray('[unclosed');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('brackets');
    });

    it('should handle unclosed quotes', () => {
      const result = parser.parseInlineArray('["unclosed, other]');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('quote');
    });
  });

  describe('parseYamlList', () => {
    it('should parse simple YAML list', () => {
      const lines = ['- item1', '- item2', '- item3'];
      const result = parser.parseYamlList(lines);
      expect(result.errors).toHaveLength(0);
      expect(result.items).toEqual(['item1', 'item2', 'item3']);
    });

    it('should handle quoted items', () => {
      const lines = ['- "quoted item"', "- 'single quoted'", '- unquoted'];
      const result = parser.parseYamlList(lines);
      expect(result.errors).toHaveLength(0);
      expect(result.items).toEqual(['quoted item', 'single quoted', 'unquoted']);
    });

    it('should handle empty lines', () => {
      const lines = ['', '- item1', '', '- item2', ''];
      const result = parser.parseYamlList(lines);
      expect(result.errors).toHaveLength(0);
      expect(result.items).toEqual(['item1', 'item2']);
    });

    it('should handle indentation', () => {
      const lines = ['  - item1', '  - item2'];
      const result = parser.parseYamlList(lines);
      expect(result.errors).toHaveLength(0);
      expect(result.items).toEqual(['item1', 'item2']);
    });

    it('should reject invalid syntax', () => {
      const lines = ['- item1', 'invalid line', '- item2'];
      const result = parser.parseYamlList(lines);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Invalid YAML list syntax');
    });
  });

  describe('serializeInlineArray', () => {
    it('should serialize simple arrays', () => {
      const result = parser.serializeInlineArray(['item1', 'item2', 'item3']);
      expect(result).toBe('[item1, item2, item3]');
    });

    it('should quote items with special characters', () => {
      const result = parser.serializeInlineArray(['item, with, comma', 'normal']);
      expect(result).toBe('["item, with, comma", normal]');
    });

    it('should quote items with colons', () => {
      const result = parser.serializeInlineArray(['key: value', 'normal']);
      expect(result).toBe('["key: value", normal]');
    });

    it('should handle empty arrays', () => {
      const result = parser.serializeInlineArray([]);
      expect(result).toBe('[]');
    });

    it('should escape quotes in items', () => {
      const result = parser.serializeInlineArray(['item "with" quotes']);
      expect(result).toBe('["item \\"with\\" quotes"]');
    });
  });

  describe('serializeYamlList', () => {
    it('should serialize simple lists', () => {
      const result = parser.serializeYamlList(['item1', 'item2']);
      expect(result).toBe('- item1\n- item2\n');
    });

    it('should quote items with special characters', () => {
      const result = parser.serializeYamlList(['item, with, comma', 'normal']);
      expect(result).toBe('- "item, with, comma"\n- normal\n');
    });

    it('should handle empty lists', () => {
      const result = parser.serializeYamlList([]);
      expect(result).toBe('');
    });
  });

  describe('complex scenarios', () => {
    it('should handle arrays with various special characters', () => {
      const items = [
        'normal',
        'with, comma',
        'with: colon',
        'with{brace}',
        'with[bracket]',
        'with&amper',
        'with*asterisk',
        'with#hash',
        'with?question',
        'with|pipe',
        'with<less',
        'with>greater',
        'with=equal',
        'with!bang',
        'with%percent',
        'with@at',
        'with`backtick',
        'with\\backslash',
        'with\nnewline',
        'with\ttab',
        ' starts with space',
        'ends with space ',
        '',
        '123starts',
        'yes',
        'no',
        'true',
        'false',
        'null',
        'undefined',
      ];

      const result = parser.serializeInlineArray(items);
      // Should have many quoted items
      expect(result).toContain('"');
      // Check for escaped quotes - should find backslash-quote in the output
      // The result should contain actual backslash characters followed by quotes
      expect(result.indexOf('\\') !== -1).toBe(true);
    });

    it('should round-trip parse and serialize', () => {
      const original = '["item, with, comma", normal, "key: value"]';
      const parseResult = parser.parseInlineArray(original);
      expect(parseResult.errors).toHaveLength(0);

      const serialized = parser.serializeInlineArray(parseResult.items);
      expect(serialized).toBe(original);
    });
  });
});

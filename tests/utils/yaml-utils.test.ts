import { parseMarkdownFrontmatter, stringifyMarkdownFrontmatter } from '../../src/utils/yaml-utils';

describe('yaml-utils', () => {
  describe('parseMarkdownFrontmatter', () => {
    it('should parse frontmatter and body', () => {
      const content = `---
name: test_agent
description: Test description
---
# Body content`;

      const result = parseMarkdownFrontmatter(content);

      expect(result.frontmatter.name).toBe('test_agent');
      expect(result.frontmatter.description).toBe('Test description');
      expect(result.body).toContain('# Body content');
    });

    it('should handle empty frontmatter', () => {
      const content = `---
---
# Just body`;

      const result = parseMarkdownFrontmatter(content);

      expect(result.frontmatter).toEqual({});
      expect(result.body).toContain('# Just body');
    });

    it('should handle content without frontmatter', () => {
      const content = `# No frontmatter here`;

      const result = parseMarkdownFrontmatter(content);

      expect(result.frontmatter).toEqual({});
      expect(result.body).toContain('# No frontmatter here');
    });
  });

  describe('stringifyMarkdownFrontmatter', () => {
    it('should create valid markdown with frontmatter', () => {
      const frontmatter = {
        name: 'test',
        description: 'Test desc'
      };
      const body = '# Content';

      const result = stringifyMarkdownFrontmatter(frontmatter, body);

      expect(result).toContain('---');
      expect(result).toContain('name: test');
      expect(result).toContain('description: Test desc');
      expect(result).toContain('# Content');
    });
  });
});

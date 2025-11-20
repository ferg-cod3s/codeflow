import * as yaml from 'yaml';
import { ParsedFrontmatter } from '../types/base-types.js';

export function parseMarkdownFrontmatter(content: string): { frontmatter: ParsedFrontmatter; body: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { frontmatter: {}, body: content };
  }
  
  try {
    const frontmatter = yaml.parse(match[1]);
    const body = match[2];
    return { frontmatter, body };
  } catch (error) {
    throw new Error(`Failed to parse frontmatter: ${error}`);
  }
}

export function stringifyMarkdownFrontmatter(frontmatter: ParsedFrontmatter, body: string): string {
  const yamlString = yaml.stringify(frontmatter);
  return `---\n${yamlString}---\n\n${body}`;
}

export function validateYamlStructure(obj: any, requiredFields: string[]): boolean {
  return requiredFields.every(field => obj.hasOwnProperty(field));
}
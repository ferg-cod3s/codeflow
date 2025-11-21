export interface ParsedFrontmatter {
  [key: string]: any;
}

export function parseMarkdownFrontmatter(content: string): { frontmatter: ParsedFrontmatter; body: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { frontmatter: {}, body: content };
  }
  
  const frontmatterStr = match[1];
  const body = match[2];
  
  // Simple YAML parsing (basic implementation)
  const frontmatter: ParsedFrontmatter = {};
  const lines = frontmatterStr.split('\n');
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      frontmatter[key] = value;
    }
  }
  
  return { frontmatter, body };
}

export function stringifyMarkdownFrontmatter(frontmatter: ParsedFrontmatter, body: string): string {
  const frontmatterLines = ['---'];
  
  for (const [key, value] of Object.entries(frontmatter)) {
    if (typeof value === 'string') {
      frontmatterLines.push(`${key}: "${value}"`);
    } else {
      frontmatterLines.push(`${key}: ${value}`);
    }
  }
  
  frontmatterLines.push('---', '');
  
  return frontmatterLines.join('\n') + body;
}
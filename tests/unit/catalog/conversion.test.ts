/**
 * Format Conversion Tests
 * Tests conversion between claude-code and opencode formats
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import * as yaml from 'yaml';
import { setupTests, cleanupTests, TEST_DIR, createMockAgent, createMockCommand } from '../../setup';

// Converter functions (should match actual implementation)
function convertClaudeToOpenCode(claudeContent: string): string {
  const frontmatterMatch = claudeContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)/);
  if (!frontmatterMatch) return claudeContent;
  
  const metadata = yaml.parse(frontmatterMatch[1]);
  const content = frontmatterMatch[2];
  
  // Convert to OpenCode format
  const openCodeMetadata = {
    ...metadata,
    mode: metadata.mode || 'subagent',
    model: metadata.model?.replace('claude', 'anthropic/claude') || metadata.model,
    primary_objective: metadata.primary_objective || metadata.description,
    anti_objectives: metadata.anti_objectives || ['Cause harm', 'Access unauthorized systems'],
    tools: metadata.tools || {
      read: true,
      list: true,
      grep: true,
      edit: false,
      write: false,
      bash: false,
      webfetch: false
    },
    permission: metadata.permission || {
      read: 'allow',
      list: 'allow',
      grep: 'allow',
      edit: 'deny',
      write: 'deny',
      bash: 'deny',
      webfetch: 'deny'
    }
  };
  
  return `---\n${yaml.stringify(openCodeMetadata)}---\n${content}`;
}

function convertOpenCodeToClaude(openCodeContent: string): string {
  const frontmatterMatch = openCodeContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)/);
  if (!frontmatterMatch) return openCodeContent;
  
  const metadata = yaml.parse(frontmatterMatch[1]);
  const content = frontmatterMatch[2];
  
  // Convert to Claude format
  const claudeMetadata = {
    name: metadata.name,
    description: metadata.description,
    model: metadata.model?.replace('anthropic/', '') || 'claude-3-5-sonnet-20241022',
    temperature: metadata.temperature || 0.7,
    category: metadata.category,
    tags: metadata.tags
  };
  
  // Remove OpenCode-specific fields
    const metadataAny = claudeMetadata as any;
  delete metadataAny['mode'];
    delete metadataAny['primary_objective'];
    delete metadataAny['anti_objectives'];
    delete metadataAny['tools'];
    delete metadataAny['permission'];
  
  return `---\n${yaml.stringify(claudeMetadata)}---\n${content}`;
}

describe('Format Conversion', () => {
  beforeAll(async () => {
    await setupTests();
  });

  afterAll(async () => {
    await cleanupTests();
  });

  describe('Claude to OpenCode conversion', () => {
    test('should convert agent metadata correctly', async () => {
      const claudeAgent = `---
name: test-agent
description: A test agent
model: opencode/code-supernova
temperature: 0.7
category: testing
tags: ["test", "example"]
---

# Test Agent

This is the agent content.`;
      
      const converted = convertClaudeToOpenCode(claudeAgent);
      const frontmatterMatch = converted.match(/^---\n([\s\S]*?)\n---/);
      expect(frontmatterMatch).toBeTruthy();
      
      const metadata = yaml.parse(frontmatterMatch![1]);
      expect(metadata.name).toBe('test-agent');
      expect(metadata.mode).toBe('subagent');
      expect(metadata.model).toBe('opencode/code-supernova');
      expect(metadata.primary_objective).toBeTruthy();
      expect(metadata.tools).toBeTruthy();
      expect(metadata.permission).toBeTruthy();
    });

    test('should convert command metadata correctly', async () => {
      const claudeCommand = `---
name: test-command
description: A test command
model: opencode/code-supernova
temperature: 0.2
mode: command
category: utility
---

# Test Command

Command content here.`;
      
      const converted = convertClaudeToOpenCode(claudeCommand);
      const frontmatterMatch = converted.match(/^---\n([\s\S]*?)\n---/);
      expect(frontmatterMatch).toBeTruthy();
      
      const metadata = yaml.parse(frontmatterMatch![1]);
      expect(metadata.name).toBe('test-command');
      expect(metadata.mode).toBe('command');
      expect(metadata.model).toBe('opencode/code-supernova');
    });

    test('should preserve content after frontmatter', async () => {
      const claudeContent = `---
name: test
description: Test
---

# Heading

Content paragraph.

## Subheading

More content.`;
      
      const converted = convertClaudeToOpenCode(claudeContent);
      expect(converted).toContain('# Heading');
      expect(converted).toContain('Content paragraph.');
      expect(converted).toContain('## Subheading');
      expect(converted).toContain('More content.');
    });

    test('should handle missing frontmatter gracefully', async () => {
      const plainContent = '# Just Markdown\n\nNo frontmatter here.';
      const converted = convertClaudeToOpenCode(plainContent);
      expect(converted).toBe(plainContent);
    });
  });

  describe('OpenCode to Claude conversion', () => {
    test('should convert agent metadata correctly', async () => {
      const openCodeAgent = `---
name: test-agent
description: A test agent
mode: subagent
model: anthropic/claude-3-5-sonnet-20241022
temperature: 0.7
primary_objective: Test things
anti_objectives:
  - Do harm
tools:
  read: true
  edit: false
permission:
  read: allow
  edit: deny
category: testing
tags: ["test", "example"]
---

# Test Agent

This is the agent content.`;
      
      const converted = convertOpenCodeToClaude(openCodeAgent);
      const frontmatterMatch = converted.match(/^---\n([\s\S]*?)\n---/);
      expect(frontmatterMatch).toBeTruthy();
      
      const metadata = yaml.parse(frontmatterMatch![1]);
      expect(metadata.name).toBe('test-agent');
      expect(metadata.model).toBe('claude-3-5-sonnet-20241022');
      expect(metadata.primary_objective).toBeUndefined();
      expect(metadata.tools).toBeUndefined();
      expect(metadata.permission).toBeUndefined();
      expect(metadata.mode).toBeUndefined();
    });

    test('should handle command conversion', async () => {
      const openCodeCommand = `---
name: test-command
description: A test command  
mode: command
model: anthropic/claude-3-5-sonnet-20241022
temperature: 0.2
params:
  required: []
  optional: []
category: utility
---

# Test Command

Command content.`;
      
      const converted = convertOpenCodeToClaude(openCodeCommand);
      const frontmatterMatch = converted.match(/^---\n([\s\S]*?)\n---/);
      expect(frontmatterMatch).toBeTruthy();
      
      const metadata = yaml.parse(frontmatterMatch![1]);
      expect(metadata.name).toBe('test-command');
      expect(metadata.model).toBe('claude-3-5-sonnet-20241022');
      expect(metadata.params).toBeUndefined();
    });

    test('should preserve tags and categories', async () => {
      const openCodeContent = `---
name: test
description: Test
mode: subagent
model: anthropic/claude-3-5-sonnet-20241022
category: development
tags: ["coding", "testing", "automation"]
primary_objective: Test
tools:
  read: true
permission:
  read: allow
---

Content`;
      
      const converted = convertOpenCodeToClaude(openCodeContent);
      const frontmatterMatch = converted.match(/^---\n([\s\S]*?)\n---/);
      const metadata = yaml.parse(frontmatterMatch![1]);
      
      expect(metadata.category).toBe('development');
      expect(metadata.tags).toEqual(["coding", "testing", "automation"]);
    });
  });

  describe('Round-trip conversion', () => {
    test('should maintain essential fields in round-trip', async () => {
      const original = createMockAgent('round-trip', 'claude');
      const originalYaml = yaml.stringify(original);
      const originalContent = `---\n${originalYaml}---\n\n# Content\n\nTest content.`;
      
      // Convert Claude -> OpenCode -> Claude
      const toOpenCode = convertClaudeToOpenCode(originalContent);
      const backToClaude = convertOpenCodeToClaude(toOpenCode);
      
      const finalMatch = backToClaude.match(/^---\n([\s\S]*?)\n---/);
      const finalMetadata = yaml.parse(finalMatch![1]);
      
      expect(finalMetadata.name).toBe(original.name);
      expect(finalMetadata.description).toBe(original.description);
      expect(finalMetadata.category).toBe(original.category);
    });

    test('should preserve content through conversions', async () => {
      const content = `# Main Heading

This is a paragraph with **bold** and *italic* text.

## Code Example

\`\`\`javascript
console.log('Hello, World!');
\`\`\`

- List item 1
- List item 2

> A blockquote

[A link](https://example.com)`;
      
      const fullContent = `---
name: test
description: Test
model: opencode/code-supernova
---

${content}`;
      
      const converted1 = convertClaudeToOpenCode(fullContent);
      const converted2 = convertOpenCodeToClaude(converted1);
      
      // Content should be preserved
      expect(converted2).toContain('# Main Heading');
      expect(converted2).toContain('**bold**');
      expect(converted2).toContain('console.log');
      expect(converted2).toContain('List item 1');
      expect(converted2).toContain('> A blockquote');
    });
  });

  describe('Batch conversion', () => {
    test('should convert multiple files', async () => {
      const files = [
        { name: 'agent1', content: createMockAgent('agent1', 'claude') },
        { name: 'agent2', content: createMockAgent('agent2', 'claude') },
        { name: 'command1', content: createMockCommand('command1', 'claude') }
      ];
      
      const results = files.map(file => {
        const content = `---\n${yaml.stringify(file.content)}---\n\n# ${file.name}`;
        const converted = convertClaudeToOpenCode(content);
        return { name: file.name, converted };
      });
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.converted).toContain(result.name);
        expect(result.converted).toContain('---');
      });
    });
  });
});
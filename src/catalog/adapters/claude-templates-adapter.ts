import { readFile, readdir, mkdir, rm, writeFile } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { tmpdir } from 'os';
import crypto from 'crypto';
import { SourceAdapter, ImportResult } from './base-adapter.js';
import { CatalogItem } from '../index-builder.js';
import * as yaml from 'yaml';

const execAsync = promisify(exec);

export class ClaudeTemplatesAdapter extends SourceAdapter {
  name = 'claude-templates';
  version = '1.0.0';
  description = 'Adapter for davila7/claude-code-templates repository';

  private tempDir: string = '';
  private repoPath: string = '';

  async fetchRepository(): Promise<string> {
    // Create temp directory
    this.tempDir = join(tmpdir(), `codeflow-import-${Date.now()}`);
    await mkdir(this.tempDir, { recursive: true });

    this.repoPath = join(this.tempDir, 'claude-code-templates');

    console.log(`📥 Cloning ${this.config.repoUrl}...`);

    const branch = this.config.branch || 'main';
    const cloneCmd = `git clone --depth 1 --branch ${branch} ${this.config.repoUrl} ${this.repoPath}`;

    try {
      await execAsync(cloneCmd);
      console.log('✅ Repository cloned successfully');
      return this.repoPath;
    } catch (error) {
      throw new Error(`Failed to clone repository: ${error}`);
    }
  }

  async scan(): Promise<CatalogItem[]> {
    if (!this.repoPath) {
      this.repoPath = await this.fetchRepository();
    }

    const items: CatalogItem[] = [];

    // Scan .claude/agents/ directory for agent templates
    const agentsDir = join(this.repoPath, '.claude', 'agents');
    if (existsSync(agentsDir)) {
      console.log(`📂 Scanning ${agentsDir}...`);
      const agentFiles = await readdir(agentsDir);

      for (const file of agentFiles) {
        if (file.endsWith('.md')) {
          const fullPath = join(agentsDir, file);
          const relativePath = `.claude/agents/${file}`;

          if (!this.shouldImport(relativePath)) {
            continue;
          }

          try {
            const item = await this.parseMarkdownTemplate(fullPath, relativePath, 'agent');
            if (item) {
              items.push(item);
            }
          } catch (error) {
            console.warn(`⚠️  Failed to parse ${relativePath}: ${error}`);
          }
        }
      }
    }

    // Scan .claude/commands/ directory for command templates
    const commandsDir = join(this.repoPath, '.claude', 'commands');
    if (existsSync(commandsDir)) {
      console.log(`📂 Scanning ${commandsDir}...`);
      const commandFiles = await readdir(commandsDir);

      for (const file of commandFiles) {
        if (file.endsWith('.md')) {
          const fullPath = join(commandsDir, file);
          const relativePath = `.claude/commands/${file}`;

          if (!this.shouldImport(relativePath)) {
            continue;
          }

          try {
            const item = await this.parseMarkdownTemplate(fullPath, relativePath, 'command');
            if (item) {
              items.push(item);
            }
          } catch (error) {
            console.warn(`⚠️  Failed to parse ${relativePath}: ${error}`);
          }
        }
      }
    }

    console.log(`📊 Found ${items.length} templates`);
    return items;
  }

  private async parseMarkdownTemplate(
    filePath: string,
    relativePath: string,
    kind: 'agent' | 'command'
  ): Promise<CatalogItem | null> {
    const content = await readFile(filePath, 'utf-8');

    try {
      // Extract name from filename
      const fileName = basename(filePath, '.md');
      const sanitizedName = this.sanitizeName(fileName);

      // Try to extract frontmatter if it exists
      let metadata: any = {};
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (frontmatterMatch) {
        try {
          metadata = yaml.parse(frontmatterMatch[1]);
        } catch {
          // Ignore YAML parse errors
        }
      }

      // Extract description from content or metadata
      const description =
        metadata.description ||
        metadata.prompt ||
        content
          .split('\n')
          .find((line) => line.trim() && !line.startsWith('#'))
          ?.substring(0, 200) ||
        `Claude ${kind} template: ${fileName}`;

      const category = kind === 'agent' ? 'agents' : 'commands';
      const hash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 7);

      return {
        id: this.generateItemId('claude-templates', sanitizedName),
        kind: kind === 'agent' ? 'agent' : 'command',
        name: sanitizedName,
        version: '1.0.0',
        description: description.substring(0, 200),
        tags: this.extractTags(metadata, category),
        license: 'Apache-2.0', // From davila7 repo
        source: 'claude-templates',
        dependencies: [],
        install_targets: ['claude-code', 'opencode'], // Can be converted to both formats
        conversion_rules: {
          base_path: `imported/claude-templates/${relativePath}`,
          supports_all_formats: true, // Allow conversion to any format
          supports_formats: ['claude-code', 'opencode'],
          lossy_fields: ['model', 'temperature', 'max_tokens'],
        },
        provenance: {
          repo: 'davila7/claude-code-templates',
          path: relativePath,
          sha: hash,
          license: 'Apache-2.0',
          attribution: 'davila7',
          import_date: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.warn(`Failed to parse YAML in ${relativePath}: ${error}`);
      return null;
    }
  }

  private extractTags(template: any, category: string): string[] {
    const tags: string[] = ['template', 'claude'];

    // Add category as tag
    if (category && category !== '.') {
      tags.push(category.toLowerCase());
    }

    // Add tags from template if present
    if (template.tags) {
      if (Array.isArray(template.tags)) {
        tags.push(...template.tags.map((t: string) => t.toLowerCase()));
      }
    }

    // Add type-based tags
    if (template.type) {
      tags.push(template.type.toLowerCase());
    }

    return [...new Set(tags)]; // Deduplicate
  }

  async import(item: CatalogItem, targetPath: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      itemsImported: 0,
      errors: [],
      warnings: [],
    };

    try {
      // Read the original template file
      const originalPath = join(this.repoPath, item.provenance.path);
      const content = await readFile(originalPath, 'utf-8');

      // Convert to base format
      const baseContent = await this.convertToBase(content, item);

      // Create the import directory
      const importDir = dirname(targetPath);
      if (!existsSync(importDir)) {
        await mkdir(importDir, { recursive: true });
      }

      // Save the converted file
      await writeFile(targetPath, baseContent, 'utf-8');

      // Also save original for reference
      const originalTargetPath = targetPath.replace('.md', '.original.yaml');
      await writeFile(originalTargetPath, content, 'utf-8');

      result.success = true;
      result.itemsImported = 1;
      console.log(`✅ Imported ${item.name} to ${targetPath}`);
    } catch (error) {
      result.errors.push(`Failed to import ${item.name}: ${error}`);
    }

    return result;
  }

  async convertToBase(content: string, item: CatalogItem): Promise<string> {
    try {
      // Try to parse the YAML template file
      let template: any = {};

      try {
        template = yaml.parse(content);
      } catch {
        // If YAML parsing fails, try to extract frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)/);
        if (frontmatterMatch) {
          try {
            template = yaml.parse(frontmatterMatch[1]);
            template.content = frontmatterMatch[2];
          } catch (_e2) {
            // If all parsing fails, use raw content
            template = { content: content };
          }
        } else {
          template = { content: content };
        }
      }

      // Determine the kind (agent or command)
      const isCommand = item.kind === 'command';

      // Generate base format markdown compatible with both Claude and OpenCode
      const baseContent = `---
name: ${item.name}
description: ${item.description}
mode: ${isCommand ? 'command' : 'subagent'}
model: ${template.model || 'opencode/grok-code'}
temperature: ${template.temperature || 0.7}
category: ${item.tags[0] || 'imported'}
tags: ${JSON.stringify(item.tags)}
${
  isCommand
    ? ''
    : `primary_objective: ${item.description}
anti_objectives:
  - Modify code without permission
  - Access external systems without authorization
tools:
  read: true
  list: true
  grep: true
  edit: false
  write: false
  bash: false
  webfetch: false
permission:
  read: allow
  list: allow
  grep: allow
  edit: deny
  write: deny
  bash: deny
  webfetch: deny
`
}x-claude:
  original_name: "${template.name || item.name}"
  import_source: "${item.source}"
  import_path: "${item.provenance.path}"
  import_date: "${item.provenance.import_date}"
  original_model: "${template.model || 'unknown'}"
---

# ${item.name} (Imported Template)

${template.description || item.description}

## Original Prompt

${template.prompt || template.content || ''}

${template.instructions ? `## Instructions\n\n${template.instructions}` : ''}

${template.examples ? `## Examples\n\n${template.examples}` : ''}

## Metadata

- **Source**: [${item.provenance.repo}](https://github.com/${item.provenance.repo})
- **Original Path**: ${item.provenance.path}
- **License**: ${item.license}
- **Attribution**: ${item.provenance.attribution}
- **Import Date**: ${item.provenance.import_date}

## Usage

This template was imported from the Claude Templates collection. It's designed to work with Claude AI and can be used for:

${this.generateUsageFromTemplate(template)}

## Original Configuration

\`\`\`yaml
${yaml.stringify(template, null, 2)}
\`\`\`
`;

      return baseContent;
    } catch (error) {
      throw new Error(`Failed to convert template to base format: ${error}`);
    }
  }

  private generateUsageFromTemplate(template: any): string {
    const usage: string[] = [];

    if (template.use_cases) {
      usage.push(...template.use_cases.map((u: string) => `- ${u}`));
    }

    if (template.capabilities) {
      usage.push('### Capabilities');
      usage.push(...template.capabilities.map((c: string) => `- ${c}`));
    }

    if (usage.length === 0) {
      usage.push('- Use this template as configured in Claude');
      usage.push('- Customize the prompt and instructions as needed');
    }

    return usage.join('\n');
  }

  extractMetadata(content: string, _filePath: string): any {
    try {
      return yaml.parse(content);
    } catch (_error) {
      return null;
    }
  }

  validate(item: CatalogItem): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!item.name) {
      errors.push('Item must have a name');
    }

    if (!item.description) {
      errors.push('Item must have a description');
    }

    if (!item.provenance?.repo) {
      errors.push('Item must have provenance information');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async cleanup(): Promise<void> {
    if (this.tempDir && existsSync(this.tempDir)) {
      console.log('🧹 Cleaning up temporary files...');
      await rm(this.tempDir, { recursive: true, force: true });
    }
  }
}

export default ClaudeTemplatesAdapter;

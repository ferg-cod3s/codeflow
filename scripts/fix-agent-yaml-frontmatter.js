#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const AGENT_DIRECTORIES = [
  'codeflow-agents',
  'claude-agents',
  '.opencode/agent',
  'test-setup/.opencode/agent',
];

class YamlFrontmatterFixer {
  constructor() {
    this.fixedCount = 0;
    this.errorCount = 0;
    this.fixedFiles = [];
  }

  async fixAllAgents() {
    console.log('🔧 Starting YAML frontmatter fixes...\n');

    for (const dir of AGENT_DIRECTORIES) {
      if (existsSync(dir)) {
        await this.processDirectory(dir);
      } else {
        console.log(`⚠️  Directory not found: ${dir}`);
      }
    }

    this.printSummary();
  }

  async processDirectory(dirPath) {
    console.log(`📁 Processing directory: ${dirPath}`);

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('README')) {
          await this.fixAgentFile(path.join(dirPath, entry.name));
        } else if (entry.isDirectory()) {
          // Recursively process subdirectories
          await this.processDirectory(path.join(dirPath, entry.name));
        }
      }
    } catch (error) {
      console.error(`❌ Error processing directory ${dirPath}:`, error.message);
      this.errorCount++;
    }
  }

  async fixAgentFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const fileName = path.basename(filePath, '.md');

      // Check if file has frontmatter
      if (!content.startsWith('---')) {
        console.log(`⚠️  Skipping ${fileName} - no frontmatter`);
        return;
      }

      // Extract frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!frontmatterMatch) {
        console.log(`⚠️  Skipping ${fileName} - malformed frontmatter`);
        return;
      }

      const frontmatterYaml = frontmatterMatch[1];
      const bodyContent = frontmatterMatch[2];

      let frontmatter;
      try {
        frontmatter = parseYaml(frontmatterYaml);
      } catch (error) {
        console.log(`❌ Failed to parse YAML in ${fileName}: ${error.message}`);
        this.errorCount++;
        return;
      }

      let modified = false;

      // Fix missing required fields
      if (!frontmatter.mode) {
        // Determine appropriate mode based on agent name or existing fields
        frontmatter.mode = this.determineAgentMode(fileName, frontmatter);
        modified = true;
        console.log(`  ✅ Added mode: ${frontmatter.mode} to ${fileName}`);
      }

      if (!frontmatter.description || frontmatter.description.trim() === '') {
        // Try to extract description from body content or create a generic one
        const extractedDesc = this.extractDescriptionFromBody(bodyContent);
        if (extractedDesc) {
          frontmatter.description = extractedDesc;
          modified = true;
          console.log(`  ✅ Added description from body to ${fileName}`);
        } else {
          frontmatter.description = `Agent for ${fileName.replace(/-/g, ' ')} tasks`;
          modified = true;
          console.log(`  ✅ Added generic description to ${fileName}`);
        }
      }

      // Fix other common issues
      if (
        frontmatter.model &&
        typeof frontmatter.model === 'string' &&
        !frontmatter.model.includes('/')
      ) {
        // Convert model names to proper format if needed
        frontmatter.model = this.normalizeModelName(frontmatter.model);
        modified = true;
        console.log(`  ✅ Normalized model name in ${fileName}`);
      }

      if (frontmatter.temperature !== undefined && typeof frontmatter.temperature !== 'number') {
        // Fix temperature type
        const temp = parseFloat(frontmatter.temperature);
        if (!isNaN(temp)) {
          frontmatter.temperature = temp;
          modified = true;
          console.log(`  ✅ Fixed temperature type in ${fileName}`);
        }
      }

      // Fix tools array if it's malformed
      if (frontmatter.tools && typeof frontmatter.tools === 'string') {
        try {
          frontmatter.tools = JSON.parse(frontmatter.tools);
          modified = true;
          console.log(`  ✅ Fixed tools format in ${fileName}`);
        } catch {
          // If it's a comma-separated string, convert to array
          if (frontmatter.tools.includes(',')) {
            frontmatter.tools = frontmatter.tools.split(',').map((t) => t.trim());
            modified = true;
            console.log(`  ✅ Converted tools string to array in ${fileName}`);
          }
        }
      }

      // If any modifications were made, write the file back
      if (modified) {
        const newFrontmatterYaml = stringifyYaml(frontmatter).trim();
        const newContent = `---\n${newFrontmatterYaml}\n---\n${bodyContent}`;

        await fs.writeFile(filePath, newContent, 'utf-8');
        this.fixedCount++;
        this.fixedFiles.push(filePath);

        console.log(`  ✅ Fixed ${fileName}`);
      }
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error.message);
      this.errorCount++;
    }
  }

  determineAgentMode(fileName, frontmatter) {
    // Determine mode based on agent characteristics
    if (
      frontmatter.role === 'system' ||
      fileName.includes('architect') ||
      fileName.includes('orchestrator')
    ) {
      return 'primary';
    }

    // Most agents are subagents by default
    return 'subagent';
  }

  extractDescriptionFromBody(bodyContent) {
    // Try to extract description from the first paragraph of the body
    const lines = bodyContent.split('\n').filter((line) => line.trim());

    for (const line of lines.slice(0, 5)) {
      // Check first 5 lines
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.length > 20 && trimmed.length < 200) {
        // Looks like a description
        return trimmed.replace(/^You are /i, '').replace(/\.$/, '');
      }
    }

    return null;
  }

  normalizeModelName(model) {
    // Normalize model names to expected formats
    const modelMappings = {
      'claude-3.5-sonnet-20241022': 'anthropic/claude-3.5-sonnet-20241022',
      'claude-3-5-sonnet-latest': 'anthropic/claude-3.5-sonnet-20241022',
      'gpt-4': 'openai/gpt-4',
      'gpt-3.5-turbo': 'openai/gpt-3.5-turbo',
    };

    return modelMappings[model] || model;
  }

  printSummary() {
    console.log('\n📊 YAML Frontmatter Fix Summary');
    console.log('================================');

    console.log(`\n✅ Files fixed: ${this.fixedCount}`);
    console.log(`❌ Errors encountered: ${this.errorCount}`);

    if (this.fixedFiles.length > 0) {
      console.log('\n📝 Files that were modified:');
      this.fixedFiles.slice(0, 10).forEach((file) => {
        console.log(`  • ${path.relative(process.cwd(), file)}`);
      });

      if (this.fixedFiles.length > 10) {
        console.log(`  ... and ${this.fixedFiles.length - 10} more`);
      }
    }

    if (this.errorCount > 0) {
      console.log(`\n⚠️  ${this.errorCount} files had errors and could not be processed.`);
      console.log('   Check the error messages above for details.');
    }

    console.log('\n💡 Next steps:');
    console.log('1. Run the audit script again to verify fixes');
    console.log('2. Test agent validation: codeflow validate');
    console.log('3. Test agent conversion: codeflow convert-all');
  }
}

// Main execution
async function main() {
  const fixer = new YamlFrontmatterFixer();
  await fixer.fixAllAgents();
}

if (import.meta.main) {
  main().catch(console.error);
}

export { YamlFrontmatterFixer };

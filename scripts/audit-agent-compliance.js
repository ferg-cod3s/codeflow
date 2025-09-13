#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';

const AGENT_DIRECTORIES = [
  'codeflow-agents',
  'claude-agents',
  'opencode-agents',
  '.opencode/agent',
  'deprecated/claude-agents',
  'deprecated/opencode-agents',
  'backup/duplicates',
  'test-setup/.opencode/agent',
];

const REQUIRED_FRONTMATTER_FIELDS = ['description', 'mode'];
const VALID_MODES = ['primary', 'subagent', 'all'];

class AgentComplianceAuditor {
  constructor() {
    this.auditResults = {
      totalAgents: 0,
      compliantAgents: 0,
      issues: [],
      agentsByName: new Map(),
      agentsByLocation: new Map(),
      namingIssues: [],
      yamlIssues: [],
      duplicateIssues: [],
      missingAgents: [],
    };
  }

  async audit() {
    console.log('🔍 Starting comprehensive agent compliance audit...\n');

    // Audit all agent directories
    for (const dir of AGENT_DIRECTORIES) {
      await this.auditDirectory(dir);
    }

    // Analyze cross-directory issues
    this.analyzeDuplicates();
    this.analyzeNamingConsistency();
    this.generateReport();

    return this.auditResults;
  }

  async auditDirectory(dirPath) {
    if (!existsSync(dirPath)) {
      console.log(`⚠️  Directory not found: ${dirPath}`);
      return;
    }

    console.log(`📁 Auditing directory: ${dirPath}`);

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('README')) {
          await this.auditAgentFile(path.join(dirPath, entry.name));
        } else if (entry.isDirectory()) {
          // Recursively audit subdirectories
          await this.auditDirectory(path.join(dirPath, entry.name));
        }
      }
    } catch (error) {
      console.error(`❌ Error auditing directory ${dirPath}:`, error.message);
    }
  }

  async auditAgentFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const fileName = path.basename(filePath, '.md');
      const directory = path.dirname(filePath);

      this.auditResults.totalAgents++;

      // Track agents by name and location
      if (!this.auditResults.agentsByName.has(fileName)) {
        this.auditResults.agentsByName.set(fileName, []);
      }
      this.auditResults.agentsByName.get(fileName).push({
        filePath,
        directory,
        content,
      });

      // Track by location
      if (!this.auditResults.agentsByLocation.has(directory)) {
        this.auditResults.agentsByLocation.set(directory, []);
      }
      this.auditResults.agentsByLocation.get(directory).push(fileName);

      // Validate naming convention (kebab-case)
      this.validateNaming(fileName, filePath);

      // Validate YAML frontmatter
      await this.validateYamlFrontmatter(content, filePath);
    } catch (error) {
      this.auditResults.issues.push({
        type: 'file_error',
        severity: 'error',
        file: filePath,
        message: `Failed to read file: ${error.message}`,
      });
    }
  }

  validateNaming(fileName, filePath) {
    // Check if name follows kebab-case convention
    const kebabCaseRegex = /^[a-z]+(-[a-z]+)*$/;

    if (!kebabCaseRegex.test(fileName)) {
      this.auditResults.namingIssues.push({
        file: filePath,
        name: fileName,
        issue: 'not_kebab_case',
        suggestion: this.convertToKebabCase(fileName),
      });
    }
  }

  convertToKebabCase(name) {
    return name
      .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase to kebab-case
      .replace(/_/g, '-') // underscores to hyphens
      .replace(/[^a-zA-Z0-9-]/g, '') // remove special characters
      .toLowerCase();
  }

  async validateYamlFrontmatter(content, filePath) {
    const fileName = path.basename(filePath, '.md');

    // Check if file starts with frontmatter
    if (!content.startsWith('---')) {
      this.auditResults.yamlIssues.push({
        file: filePath,
        name: fileName,
        issue: 'no_frontmatter',
        message: 'File does not start with YAML frontmatter',
      });
      return;
    }

    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      this.auditResults.yamlIssues.push({
        file: filePath,
        name: fileName,
        issue: 'malformed_frontmatter',
        message: 'YAML frontmatter is malformed',
      });
      return;
    }

    try {
      const frontmatter = parseYaml(frontmatterMatch[1]);

      // Validate required fields
      for (const field of REQUIRED_FRONTMATTER_FIELDS) {
        if (!Object.prototype.hasOwnProperty.call(frontmatter, field)) {
          this.auditResults.yamlIssues.push({
            file: filePath,
            name: fileName,
            issue: 'missing_required_field',
            field,
            message: `Missing required field: ${field}`,
          });
        }
      }

      // Validate mode field
      if (frontmatter.mode && !VALID_MODES.includes(frontmatter.mode)) {
        this.auditResults.yamlIssues.push({
          file: filePath,
          name: fileName,
          issue: 'invalid_mode',
          field: 'mode',
          value: frontmatter.mode,
          message: `Invalid mode '${frontmatter.mode}'. Must be one of: ${VALID_MODES.join(', ')}`,
        });
      }

      // Check for description field specifically
      if (!frontmatter.description || frontmatter.description.trim() === '') {
        this.auditResults.yamlIssues.push({
          file: filePath,
          name: fileName,
          issue: 'empty_description',
          message: 'Description field is empty or missing',
        });
      }
    } catch (error) {
      this.auditResults.yamlIssues.push({
        file: filePath,
        name: fileName,
        issue: 'yaml_parse_error',
        message: `YAML parsing error: ${error.message}`,
      });
    }
  }

  analyzeDuplicates() {
    console.log('🔍 Analyzing duplicates across directories...');

    for (const [agentName, locations] of this.auditResults.agentsByName) {
      if (locations.length > 1) {
        // Check if this is a legitimate multi-format agent or a true duplicate
        const directories = locations.map((loc) => loc.directory);
        const uniqueDirs = [...new Set(directories)];

        if (uniqueDirs.length < directories.length) {
          // Same directory has multiple copies - this is a duplicate
          this.auditResults.duplicateIssues.push({
            agent: agentName,
            type: 'same_directory_duplicate',
            locations: locations.map((loc) => loc.filePath),
            message: `Multiple copies of ${agentName} in same directory`,
          });
        } else if (locations.length > 3) {
          // More than 3 copies (base, claude, opencode) - likely duplicates
          this.auditResults.duplicateIssues.push({
            agent: agentName,
            type: 'excessive_duplicates',
            locations: locations.map((loc) => loc.filePath),
            message: `${agentName} has ${locations.length} copies (expected max 3)`,
          });
        }
      }
    }
  }

  analyzeNamingConsistency() {
    console.log('🔍 Analyzing naming consistency...');

    // Check for agents that exist with different naming conventions
    const nameVariants = new Map();

    for (const agentName of this.auditResults.agentsByName.keys()) {
      const kebabCase = this.convertToKebabCase(agentName);
      if (!nameVariants.has(kebabCase)) {
        nameVariants.set(kebabCase, []);
      }
      nameVariants.get(kebabCase).push(agentName);
    }

    // Find agents with multiple naming variants
    for (const [kebabCase, variants] of nameVariants) {
      if (variants.length > 1) {
        this.auditResults.issues.push({
          type: 'naming_inconsistency',
          severity: 'warning',
          message: `Agent '${kebabCase}' exists with multiple naming variants: ${variants.join(', ')}`,
          variants,
          canonical: kebabCase,
        });
      }
    }
  }

  generateReport() {
    console.log('\n📊 AUDIT REPORT');
    console.log('================');

    console.log(`\n📈 Summary:`);
    console.log(`  Total agents found: ${this.auditResults.totalAgents}`);
    console.log(`  Agents with naming issues: ${this.auditResults.namingIssues.length}`);
    console.log(`  Agents with YAML issues: ${this.auditResults.yamlIssues.length}`);
    console.log(`  Duplicate issues: ${this.auditResults.duplicateIssues.length}`);
    console.log(`  General issues: ${this.auditResults.issues.length}`);

    // Naming issues
    if (this.auditResults.namingIssues.length > 0) {
      console.log(`\n🔤 Naming Issues (${this.auditResults.namingIssues.length}):`);
      this.auditResults.namingIssues.slice(0, 10).forEach((issue) => {
        console.log(`  ❌ ${issue.name} → ${issue.suggestion}`);
        console.log(`     ${issue.file}`);
      });
      if (this.auditResults.namingIssues.length > 10) {
        console.log(`  ... and ${this.auditResults.namingIssues.length - 10} more`);
      }
    }

    // YAML issues
    if (this.auditResults.yamlIssues.length > 0) {
      console.log(`\n📄 YAML Frontmatter Issues (${this.auditResults.yamlIssues.length}):`);
      const issueCounts = {};
      this.auditResults.yamlIssues.forEach((issue) => {
        issueCounts[issue.issue] = (issueCounts[issue.issue] || 0) + 1;
      });

      Object.entries(issueCounts).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

      // Show first few specific issues
      console.log('\n  Sample issues:');
      this.auditResults.yamlIssues.slice(0, 5).forEach((issue) => {
        console.log(`  ❌ ${issue.name}: ${issue.message}`);
      });
    }

    // Duplicate issues
    if (this.auditResults.duplicateIssues.length > 0) {
      console.log(`\n🔄 Duplicate Issues (${this.auditResults.duplicateIssues.length}):`);
      this.auditResults.duplicateIssues.slice(0, 5).forEach((issue) => {
        console.log(`  ❌ ${issue.agent}: ${issue.message}`);
        console.log(`     Locations: ${issue.locations.length}`);
      });
    }

    // General issues
    if (this.auditResults.issues.length > 0) {
      console.log(`\n⚠️  General Issues (${this.auditResults.issues.length}):`);
      this.auditResults.issues.slice(0, 5).forEach((issue) => {
        console.log(`  ⚠️  ${issue.message}`);
      });
    }

    // Recommendations
    console.log(`\n💡 Recommendations:`);
    if (this.auditResults.namingIssues.length > 0) {
      console.log(
        `  - Fix ${this.auditResults.namingIssues.length} naming issues (convert to kebab-case)`
      );
    }
    if (this.auditResults.yamlIssues.length > 0) {
      console.log(`  - Fix ${this.auditResults.yamlIssues.length} YAML frontmatter issues`);
    }
    if (this.auditResults.duplicateIssues.length > 0) {
      console.log(`  - Resolve ${this.auditResults.duplicateIssues.length} duplicate agent issues`);
    }

    console.log(`\n✅ Audit complete. Use the detailed results to guide compliance fixes.`);
  }
}

// Main execution
async function main() {
  const auditor = new AgentComplianceAuditor();
  await auditor.audit();
}

if (import.meta.main) {
  main().catch(console.error);
}

export { AgentComplianceAuditor };

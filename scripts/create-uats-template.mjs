#!/usr/bin/env node

/**
 * UATS v1.0 Template Generator
 *
 * Generates standardized UATS v1.0 frontmatter for agent files.
 * Based on the specification from security-scanner and web-search-researcher agents.
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const UATS_TEMPLATE = {
  name: '{{agent_name}}',
  uats_version: '1.0',
  spec_version: 'UATS-1.0',
  description: '{{existing_description}}',
  mode: '{{existing_mode}}',
  model: '{{existing_model}}',
  temperature: '{{existing_temperature}}',
  category: '{{existing_category}}',
  tags: '{{existing_tags}}',
  primary_objective: '{{derived_from_description}}',
  anti_objectives: ['{{domain_specific_anti_objectives}}'],
  owner: '{{domain_practice}}',
  author: 'codeflow-core',
  last_updated: '{{current_date}}',
  stability: 'stable',
  maturity: 'production',
  intended_followups: ['{{related_agents}}'],
  allowed_directories: ['{{existing_allowed_directories}}'],
  tools: '{{existing_tools_object}}',
  permission: {
    '{{tool_name}}': '{{allow|deny}}',
  },
  output_format: 'AGENT_OUTPUT_V1',
  requires_structured_output: true,
  validation_rules: ['{{domain_specific_rules}}'],
};

/**
 * Generate UATS v1.0 frontmatter for an agent
 */
function generateUATSFrontmatter(agentName, existingFrontmatter) {
  const template = { ...UATS_TEMPLATE };

  // Fill in known values
  template.name = agentName;
  template.last_updated = new Date().toISOString().split('T')[0];

  // Copy existing values where they exist
  if (existingFrontmatter.description) {
    template.description = existingFrontmatter.description;
  }
  if (existingFrontmatter.mode) {
    template.mode = existingFrontmatter.mode;
  }
  if (existingFrontmatter.model) {
    template.model = existingFrontmatter.model;
  }
  if (existingFrontmatter.temperature) {
    template.temperature = existingFrontmatter.temperature;
  }
  if (existingFrontmatter.category) {
    template.category = existingFrontmatter.category;
  }
  if (existingFrontmatter.tags) {
    template.tags = existingFrontmatter.tags;
  }
  if (existingFrontmatter.allowed_directories) {
    template.allowed_directories = existingFrontmatter.allowed_directories;
  }
  if (existingFrontmatter.tools) {
    template.tools = existingFrontmatter.tools;
  }

  // Derive primary objective from description
  if (template.description && template.description.includes('.')) {
    template.primary_objective = template.description.split('.')[0] + '.';
  }

  // Set domain-specific owner based on category
  const categoryToOwner = {
    generalist: 'platform-engineering',
    development: 'development-practice',
    operations: 'operations-practice',
    'quality-testing': 'quality-practice',
    'business-analytics': 'business-intelligence',
    'design-ux': 'design-practice',
    'ai-innovation': 'ai-practice',
    'product-strategy': 'product-practice',
  };
  template.owner = categoryToOwner[template.category] || 'platform-engineering';

  // Set basic anti-objectives (will be customized per agent)
  template.anti_objectives = [
    'Perform actions outside defined scope',
    'Modify source code without explicit approval',
  ];

  // Set basic intended followups (will be customized per agent)
  template.intended_followups = ['full-stack-developer', 'code-reviewer'];

  // Convert tools object to permissions
  if (template.tools && typeof template.tools === 'object') {
    template.permission = {};
    Object.keys(template.tools).forEach((tool) => {
      const value = template.tools[tool];
      if (typeof value === 'boolean') {
        template.permission[tool] = value ? 'allow' : 'deny';
      } else {
        template.permission[tool] = 'deny';
      }
    });
  }

  // Set basic validation rules (will be customized per agent)
  template.validation_rules = ['must_produce_structured_output', 'must_validate_inputs'];

  return template;
}

/**
 * Update an agent file with UATS v1.0 frontmatter
 */
function updateAgentFile(filePath) {
  console.log(`Processing ${filePath}...`);

  try {
    const content = readFileSync(filePath, 'utf8');

    // Split frontmatter and body
    const parts = content.split(/^---$/m);
    if (parts.length < 3) {
      console.error(`❌ No frontmatter found in ${filePath}`);
      return false;
    }

    const existingFrontmatter = parseYaml(parts[1]);
    const body = parts.slice(2).join('---');

    // Extract agent name
    const agentName = existingFrontmatter.name || filePath.split('/').pop().replace('.md', '');

    // Generate new UATS frontmatter
    const uatsFrontmatter = generateUATSFrontmatter(agentName, existingFrontmatter);

    // Create new content
    const newContent = `---\n${stringifyYaml(uatsFrontmatter)}---\n${body}`;

    // Write back to file
    writeFileSync(filePath, newContent);
    console.log(`✅ Updated ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 UATS v1.0 Template Generator\n');

  // Find all agent files using bash find
  const findCommand = "find codeflow-agents -name '*.md' -not -name 'README.md'";
  const agentFilesOutput = execSync(findCommand, { encoding: 'utf8' });
  const agentFiles = agentFilesOutput.trim().split('\n').filter(Boolean);

  console.log(`Found ${agentFiles.length} agent files\n`);

  let successCount = 0;
  let failCount = 0;

  for (const file of agentFiles) {
    if (updateAgentFile(file)) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`✅ Successfully updated: ${successCount} agents`);
  console.log(`❌ Failed to update: ${failCount} agents`);

  if (failCount === 0) {
    console.log('\n🎉 All agents updated with UATS v1.0 frontmatter!');
  } else {
    console.log('\n⚠️  Some agents failed to update. Check errors above.');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateUATSFrontmatter, updateAgentFile };

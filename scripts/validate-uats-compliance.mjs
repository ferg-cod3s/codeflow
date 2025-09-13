#!/usr/bin/env node

/**
 * UATS v1.0 Compliance Validation Script
 *
 * Validates that all agents in the ecosystem comply with UATS v1.0 specification.
 * Checks for required frontmatter fields, proper formatting, and escalation chain integrity.
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { parse as parseYaml } from 'yaml';

const REQUIRED_UATS_FIELDS = [
  'name',
  'uats_version',
  'spec_version',
  'description',
  'mode',
  'model',
  'temperature',
  'category',
  'tags',
  'primary_objective',
  'anti_objectives',
  'owner',
  'author',
  'last_updated',
  'stability',
  'maturity',
  'intended_followups',
  'allowed_directories',
  'tools',
  'permission',
  'output_format',
  'requires_structured_output',
  'validation_rules',
];

const VALID_SPEC_VERSIONS = ['UATS-1.0'];
const VALID_UATS_VERSIONS = ['1.0'];
const VALID_MODES = ['subagent', 'primary', 'agent'];
const VALID_STABILITIES = ['experimental', 'stable', 'deprecated'];
const VALID_MATURITIES = ['prototype', 'beta', 'production'];

/**
 * Validate a single agent file
 */
function validateAgentFile(filePath) {
  console.log(`🔍 Validating ${filePath}...`);

  const errors = [];
  const warnings = [];

  try {
    const content = readFileSync(filePath, 'utf8');

    // Split frontmatter and body
    const parts = content.split(/^---$/m);
    if (parts.length < 3) {
      errors.push('Missing or malformed YAML frontmatter');
      return { valid: false, errors, warnings };
    }

    const frontmatter = parseYaml(parts[1]);
    const body = parts.slice(2).join('---');

    // Check required fields
    for (const field of REQUIRED_UATS_FIELDS) {
      if (!(field in frontmatter)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate specific field values
    if (frontmatter.uats_version && !VALID_UATS_VERSIONS.includes(frontmatter.uats_version)) {
      errors.push(
        `Invalid uats_version: ${frontmatter.uats_version}. Must be one of: ${VALID_UATS_VERSIONS.join(', ')}`
      );
    }

    if (frontmatter.spec_version && !VALID_SPEC_VERSIONS.includes(frontmatter.spec_version)) {
      errors.push(
        `Invalid spec_version: ${frontmatter.spec_version}. Must be one of: ${VALID_SPEC_VERSIONS.join(', ')}`
      );
    }

    if (frontmatter.mode && !VALID_MODES.includes(frontmatter.mode)) {
      errors.push(`Invalid mode: ${frontmatter.mode}. Must be one of: ${VALID_MODES.join(', ')}`);
    }

    if (frontmatter.stability && !VALID_STABILITIES.includes(frontmatter.stability)) {
      warnings.push(
        `Unknown stability: ${frontmatter.stability}. Expected one of: ${VALID_STABILITIES.join(', ')}`
      );
    }

    if (frontmatter.maturity && !VALID_MATURITIES.includes(frontmatter.maturity)) {
      warnings.push(
        `Unknown maturity: ${frontmatter.maturity}. Expected one of: ${VALID_MATURITIES.join(', ')}`
      );
    }

    // Validate temperature range
    if (
      typeof frontmatter.temperature === 'number' &&
      (frontmatter.temperature < 0 || frontmatter.temperature > 2)
    ) {
      errors.push(`Invalid temperature: ${frontmatter.temperature}. Must be between 0 and 2`);
    }

    // Validate tools and permissions structure
    if (frontmatter.tools && typeof frontmatter.tools !== 'object') {
      errors.push('tools field must be an object');
    }

    if (frontmatter.permission && typeof frontmatter.permission !== 'object') {
      errors.push('permission field must be an object');
    }

    // Validate output_format
    if (frontmatter.output_format !== 'AGENT_OUTPUT_V1') {
      errors.push(`Invalid output_format: ${frontmatter.output_format}. Must be 'AGENT_OUTPUT_V1'`);
    }

    // Validate requires_structured_output
    if (frontmatter.requires_structured_output !== true) {
      errors.push('requires_structured_output must be true');
    }

    // Validate validation_rules
    if (!Array.isArray(frontmatter.validation_rules) || frontmatter.validation_rules.length === 0) {
      errors.push('validation_rules must be a non-empty array');
    }

    // Validate intended_followups references exist
    if (Array.isArray(frontmatter.intended_followups)) {
      // This would require checking against all agent names - for now just validate it's an array
    }

    return { valid: errors.length === 0, errors, warnings };
  } catch (error) {
    errors.push(`YAML parsing error: ${error.message}`);
    return { valid: false, errors, warnings };
  }
}

/**
 * Validate escalation chain integrity
 */
function validateEscalationChains() {
  console.log('\n🔗 Validating escalation chains...');

  const errors = [];
  const warnings = [];

  // Get all agent files
  const findCommand = "find codeflow-agents -name '*.md' -not -name 'README.md'";
  const agentFilesOutput = execSync(findCommand, { encoding: 'utf8' });
  const agentFiles = agentFilesOutput.trim().split('\n').filter(Boolean);

  // Extract all agent names
  const agentNames = new Set();
  for (const file of agentFiles) {
    try {
      const content = readFileSync(file, 'utf8');
      const parts = content.split(/^---$/m);
      if (parts.length >= 3) {
        const frontmatter = parseYaml(parts[1]);
        if (frontmatter.name) {
          agentNames.add(frontmatter.name);
        }
      }
    } catch (error) {
      // Skip files that can't be parsed
    }
  }

  // Check intended_followups references
  for (const file of agentFiles) {
    try {
      const content = readFileSync(file, 'utf8');
      const parts = content.split(/^---$/m);
      if (parts.length >= 3) {
        const frontmatter = parseYaml(parts[1]);
        const agentName = frontmatter.name;

        if (Array.isArray(frontmatter.intended_followups)) {
          for (const followup of frontmatter.intended_followups) {
            if (!agentNames.has(followup)) {
              errors.push(
                `${agentName} references non-existent agent in intended_followups: ${followup}`
              );
            }
          }
        }
      }
    } catch (error) {
      warnings.push(`Could not validate escalation chains for ${file}: ${error.message}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Main execution
 */
function main() {
  console.log('🛡️  UATS v1.0 Compliance Validation\n');

  // Find all agent files
  const findCommand = "find codeflow-agents -name '*.md' -not -name 'README.md'";
  const agentFilesOutput = execSync(findCommand, { encoding: 'utf8' });
  const agentFiles = agentFilesOutput.trim().split('\n').filter(Boolean);

  console.log(`Found ${agentFiles.length} agent files to validate\n`);

  let totalErrors = 0;
  let totalWarnings = 0;
  let validAgents = 0;

  // Validate each agent
  for (const file of agentFiles) {
    const result = validateAgentFile(file);

    if (result.valid) {
      validAgents++;
    } else {
      totalErrors += result.errors.length;
      console.log(`❌ ${result.errors.length} errors, ${result.warnings.length} warnings`);
    }

    totalWarnings += result.warnings.length;

    // Show errors and warnings
    result.errors.forEach((error) => console.log(`  ❌ ${error}`));
    result.warnings.forEach((warning) => console.log(`  ⚠️  ${warning}`));
  }

  // Validate escalation chains
  const chainResult = validateEscalationChains();
  totalErrors += chainResult.errors.length;
  totalWarnings += chainResult.warnings.length;

  chainResult.errors.forEach((error) => console.log(`❌ ${error}`));
  chainResult.warnings.forEach((warning) => console.log(`⚠️  ${warning}`));

  // Summary
  console.log(`\n📊 Validation Summary:`);
  console.log(`✅ Valid agents: ${validAgents}/${agentFiles.length}`);
  console.log(`❌ Total errors: ${totalErrors}`);
  console.log(`⚠️  Total warnings: ${totalWarnings}`);

  if (totalErrors === 0) {
    console.log('\n🎉 All agents are UATS v1.0 compliant!');
    process.exit(0);
  } else {
    console.log('\n💥 UATS compliance validation failed!');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateAgentFile, validateEscalationChains };

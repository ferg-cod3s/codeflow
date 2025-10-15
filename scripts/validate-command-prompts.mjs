#!/usr/bin/env node

/**
 * Command Prompt Validation Script
 *
 * Validates CodeFlow command prompts against the schema and style guide
 * Checks for compliance with caching integration and optimization standards
 */

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Command files to validate
const COMMAND_FILES = [
  'commit.md',
  'continue.md',
  'help.md',
  'document.md',
  'execute.md',
  'plan.md',
  'research.md',
  'review.md',
  'test.md',
];
// Validation results
class ValidationResult {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.score = 0;
    this.totalChecks = 0;
  }
  addError(message, file, line = null) {
    this.errors.push({ message, file, line });
  }


  addWarning(message, file, line = null) {
    this.warnings.push({ message, file, line });
  }

  incrementScore() {
    this.score++;
    this.totalChecks++;
  }

  addCheck() {
    this.totalChecks++;
  }

  getComplianceScore() {
    return this.totalChecks > 0 ? (this.score / this.totalChecks) * 100 : 0;
  }
}

/**
 * Validate frontmatter structure
 */
function validateFrontmatter(content, fileName, result) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    result.addError('Missing YAML frontmatter', fileName);
    return null;
  }

  result.incrementScore(); // Has frontmatter

  try {
    const frontmatter = frontmatterMatch[1];

    // Check required fields
    const requiredFields = ['name', 'description', 'version', 'last_updated'];
    for (const field of requiredFields) {
      if (!frontmatter.includes(`${field}:`)) {
        result.addError(`Missing required frontmatter field: ${field}`, fileName);
      } else {
        result.incrementScore();
      }
    }

    // Check for new fields from optimization
// Check for disallowed fields
    const disallowedFields = ['model', 'temperature', 'mode'];
    for (const field of disallowedFields) {
      if (frontmatter.includes(`${field}:`)) {
        result.addError(`Disallowed frontmatter field: ${field}`, fileName);
      } else {
        result.incrementScore();
      }
    }

// Check cache_strategy.type enum
    const hasValidCacheType = frontmatter.includes('type: agent_specific') || frontmatter.includes('type: shared') || frontmatter.includes('type: hierarchical');
    if (!hasValidCacheType) {
      result.addError('Invalid or missing cache_strategy.type. Must be one of: agent_specific, shared, hierarchical', fileName);
    } else {
      result.incrementScore();
    }
    const optimizationFields = [
      'command_schema_version',
      'cache_strategy',
      'success_signals',
      'failure_modes',
    ];
    for (const field of optimizationFields) {
      if (!frontmatter.includes(`${field}:`)) {
        result.addWarning(`Missing optimization field: ${field}`, fileName);
      } else {
        result.incrementScore();
      }
    }

    return frontmatter;
  } catch (error) {
    result.addError(`Invalid YAML frontmatter: ${error.message}`, fileName);
    return null;
  }
}

/**
 * Validate section structure
 */
function validateSections(content, fileName, result) {
  const lines = content.split('\n');
  const sections = {
    Purpose: false,
    Inputs: false,
    Preconditions: false,
    'Process Phases': false,
    'Error Handling': false,
    'Structured Output Specification': false,
    'Success Criteria': false,
    'Edge Cases': false,
    'Anti-Patterns': false,
    'Caching Guidelines': false,
  };

  // Find headings
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^#{1,6}\s(.+)$/);
    if (headingMatch) {
      const heading = headingMatch[1].trim();
      if (Object.prototype.hasOwnProperty.call(sections, heading)) {
        sections[heading] = true;
        result.incrementScore();
      }
    }
  }

  // Check for missing sections
  const missingSections = Object.entries(sections)
    .filter(([, present]) => !present)
    .map(([section]) => section);

  if (missingSections.length > 0) {
    result.addWarning(`Missing sections: ${missingSections.join(', ')}`, fileName);
  }

  // Check for required sections
  const requiredSections = ['Purpose', 'Inputs', 'Process Phases', 'Success Criteria'];
  const missingRequired = requiredSections.filter((section) => !sections[section]);

  if (missingRequired.length > 0) {
    result.addError(`Missing required sections: ${missingRequired.join(', ')}`, fileName);
  }
}

/**
 * Validate caching integration
 */
function validateCaching(content, fileName, result) {
  // Check for cache-related keywords
  const cacheKeywords = ['cache', 'Cache', 'caching', 'Caching'];
  let hasCacheContent = false;

  for (const keyword of cacheKeywords) {
    if (content.includes(keyword)) {
      hasCacheContent = true;
      break;
    }
  }

  if (!hasCacheContent) {
    result.addWarning('No caching integration detected', fileName);
  } else {
    result.incrementScore();
  }

  // Check for cache strategy in frontmatter
  if (!content.includes('cache_strategy:')) {
    result.addWarning('Missing cache_strategy in frontmatter', fileName);
  } else {
    result.incrementScore();
  }

  // Check for structured output blocks
  const structuredBlocks = content.match(/```[\w-]*\n/g);
  if (!structuredBlocks || structuredBlocks.length === 0) {
    result.addWarning('No structured output blocks detected', fileName);
  } else {
    result.incrementScore();
  }
}

/**
 * Validate terminology consistency
 */
function validateTerminology(content, fileName, result) {
  // Check for inconsistent terminology
  const inconsistencies = [
    { pattern: /\b(implement|execute)\b/g, issue: 'Mixed use of "implement" vs "execute"' },
    { pattern: /\b(turbo|bun)\b/g, issue: 'Mixed use of "turbo" vs "bun"' },
    { pattern: /\b(sub-?agent|agent)\b/g, issue: 'Inconsistent agent terminology' },
  ];

  for (const { pattern, issue } of inconsistencies) {
    const matches = content.match(pattern);
    if (matches && matches.length > 1) {
      // Check if there are different variations
      const uniqueMatches = [...new Set(matches.map((m) => m.toLowerCase()))];
      if (uniqueMatches.length > 1) {
        result.addWarning(`${issue}: ${uniqueMatches.join(', ')}`, fileName);
      } else {
        result.incrementScore();
      }
    } else {
      result.incrementScore();
    }
  }
}

/**
 * Validate token efficiency
 */
function validateTokenEfficiency(content, fileName, result) {
  const tokens = Math.ceil(content.length / 4); // Rough estimation

  // Check for token budget compliance
  let expectedMax = 2500; // Default
  if (fileName.includes('commit')) expectedMax = 500;
  else if (fileName.includes('test')) expectedMax = 1000;
  else if (fileName.includes('document') || fileName.includes('review')) expectedMax = 1500;

  if (tokens > expectedMax) {
    result.addWarning(`Token count (${tokens}) exceeds budget (${expectedMax})`, fileName);
  } else {
    result.incrementScore();
  }

  // Check for verbose patterns that could be optimized
  const verbosePatterns = [
    /Please note that/g,
    /It is important to/g,
    /Remember that/g,
    /Keep in mind that/g,
  ];

  for (const pattern of verbosePatterns) {
    if (pattern.test(content)) {
      result.addWarning('Detected potentially verbose language that could be condensed', fileName);
      break;
    }
  }
}

/**
 * Validate a single command file
 */
async function validateCommandFile(filePath, fileName) {
  const result = new ValidationResult();

  try {
    const content = await readFile(filePath, 'utf-8');

    // Validate frontmatter
    validateFrontmatter(content, fileName, result);

    // Validate sections
    validateSections(content, fileName, result);

    // Validate caching integration
    validateCaching(content, fileName, result);

    // Validate terminology
    validateTerminology(content, fileName, result);

    // Validate token efficiency
    validateTokenEfficiency(content, fileName, result);
  } catch (error) {
    result.addError(`Failed to read file: ${error.message}`, fileName);
  }

  return result;
}

/**
 * Main validation function
 */
async function validateAllCommands() {
  const commandDir = join(__dirname, '..', 'command');
  const results = {
    summary: {
      totalFiles: 0,
      totalErrors: 0,
      totalWarnings: 0,
      averageScore: 0,
    },
    files: {},
  };


  for (const fileName of COMMAND_FILES) {
    const filePath = join(commandDir, fileName);

    const result = await validateCommandFile(filePath, fileName);
    results.files[fileName] = {
      score: result.getComplianceScore(),
      errors: result.errors,
      warnings: result.warnings,
    };

    results.summary.totalFiles++;
    results.summary.totalErrors += result.errors.length;
    results.summary.totalWarnings += result.warnings.length;
    results.summary.averageScore += result.getComplianceScore();
  }

  results.summary.averageScore /= results.summary.totalFiles;

  return results;
}

/**
 * Print validation results
 */
function printResults(results) {


  for (const [fileName, result] of Object.entries(results.files)) {

    if (result.errors.length > 0) {
    }

    if (result.warnings.length > 0) {
    }
  }


  // Exit with error code if there are errors
  if (results.summary.totalErrors > 0) {
    process.exit(1);
  } else if (results.summary.averageScore < 95) {
    process.exit(1);
  } else {
  }
}

// Main execution
async function main() {
  try {
    const results = await validateAllCommands();
    printResults(results);
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateCommandFile, ValidationResult };

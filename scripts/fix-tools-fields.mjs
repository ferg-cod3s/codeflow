#!/usr/bin/env node

/**
 * Fix Tools Fields Script
 *
 * Fixes agents that have malformed tools fields after UATS template application.
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

/**
 * Fix tools field for an agent
 */
function fixToolsField(filePath) {
  console.log(`🔧 Fixing tools field in ${filePath}...`);

  try {
    const content = readFileSync(filePath, 'utf8');

    // Split frontmatter and body
    const parts = content.split(/^---$/m);
    if (parts.length < 3) {
      console.error(`❌ No frontmatter found in ${filePath}`);
      return false;
    }

    const frontmatter = parseYaml(parts[1]);
    const body = parts.slice(2).join('---');

    // Check if tools field needs fixing
    if (
      frontmatter.tools === '{{existing_tools_object}}' ||
      !frontmatter.tools ||
      typeof frontmatter.tools !== 'object'
    ) {
      // Set default tools based on agent category
      const category = frontmatter.category;
      let defaultTools = {};

      if (category === 'generalist') {
        defaultTools = {
          read: true,
          grep: true,
          list: true,
          glob: true,
          edit: false,
          write: false,
          patch: false,
          bash: false,
          webfetch: false,
        };
      } else if (category === 'development') {
        defaultTools = {
          read: true,
          grep: true,
          list: true,
          glob: true,
          edit: true,
          write: true,
          patch: true,
          bash: true,
          webfetch: false,
        };
      } else if (category === 'operations') {
        defaultTools = {
          read: true,
          grep: true,
          list: true,
          glob: true,
          edit: true,
          write: true,
          patch: true,
          bash: true,
          webfetch: false,
        };
      } else if (category === 'quality-testing') {
        defaultTools = {
          read: true,
          grep: true,
          list: true,
          glob: true,
          edit: false,
          write: false,
          patch: false,
          bash: false,
          webfetch: false,
        };
      } else {
        // Default for other categories
        defaultTools = {
          read: true,
          grep: true,
          list: true,
          glob: true,
          edit: true,
          write: true,
          bash: true,
          patch: false,
          webfetch: false,
        };
      }

      frontmatter.tools = defaultTools;

      // Also fix permission field
      frontmatter.permission = {};
      Object.keys(defaultTools).forEach((tool) => {
        frontmatter.permission[tool] = defaultTools[tool] ? 'allow' : 'deny';
      });
    }

    // Create new content
    const newContent = `---\n${stringifyYaml(frontmatter)}---\n${body}`;

    // Write back to file
    writeFileSync(filePath, newContent);
    console.log(`✅ Fixed ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔧 Tools Field Fix Script\n');

  // Find all agent files
  const findCommand = "find base-agents -name '*.md' -not -name 'README.md'";
  const agentFilesOutput = execSync(findCommand, { encoding: 'utf8' });
  const agentFiles = agentFilesOutput.trim().split('\n').filter(Boolean);

  console.log(`Found ${agentFiles.length} agent files\n`);

  let successCount = 0;
  let failCount = 0;

  for (const file of agentFiles) {
    if (fixToolsField(file)) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`✅ Successfully fixed: ${successCount} agents`);
  console.log(`❌ Failed to fix: ${failCount} agents`);

  if (failCount === 0) {
    console.log('\n🎉 All tools fields fixed!');
  } else {
    console.log('\n⚠️  Some agents failed to be fixed. Check errors above.');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

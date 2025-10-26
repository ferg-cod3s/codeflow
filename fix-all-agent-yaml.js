#!/usr/bin/env node

/**
 * Comprehensive fix for all YAML issues in agent files
 * Handles indentation, duplicate keys, and other common YAML problems
 */

import fs from 'fs';
import path from 'path';

function fixYamlIssues(content) {
  const lines = content.split('\n');
  let inFrontmatter = false;
  let fixedLines = [];
  let tagsEnded = false;
  let sections = new Map(); // Track sections to detect duplicates

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Start of frontmatter
    if (line.trim() === '---') {
      inFrontmatter = !inFrontmatter;
      fixedLines.push(line);
      sections.clear();
      continue;
    }

    if (!inFrontmatter) {
      fixedLines.push(line);
      continue;
    }

    // Inside frontmatter
    if (trimmed === 'tags:') {
      tagsEnded = false;
      sections.set('tags', i);
      fixedLines.push(line);
      continue;
    }

    // Check if we're past the tags section
    if (!tagsEnded && line.match(/^\s*-\s+\w+/)) {
      // This is a tag item, continue
      fixedLines.push(line);
      continue;
    }

    // Check if we've reached the end of tags (empty line or non-indented property)
    if (!tagsEnded && (trimmed === '' || (line.match(/^\w+:/) && !line.startsWith('  ')))) {
      tagsEnded = true;
      fixedLines.push(line);
      continue;
    }

    // Fix incorrectly indented properties
    if (tagsEnded && line.match(/^\s{2,}(\w+):/)) {
      const match = line.match(/^\s{2,}(\w+):/);
      if (match) {
        const property = match[1];
        // Check if this is a property that should be at root level
        const rootLevelProps = [
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
          'expertise',
          'capabilities',
          'examples',
          'best_practices',
          'integration_examples',
          'technologies',
          'deployment_considerations',
          'directory_permissions',
          'related_agents',
          'patterns',
        ];

        if (rootLevelProps.includes(property) || property.includes('_')) {
          // Check for duplicate sections
          if (sections.has(property)) {
            console.log(`  Removing duplicate section: ${property}`);
            continue; // Skip duplicate
          }

          // Remove the extra indentation
          const fixedLine = property + ':' + line.substring(line.indexOf(':') + 1);
          fixedLines.push(fixedLine);
          sections.set(property, i);
          console.log(`  Fixed indentation: ${property}`);
          continue;
        }
      }
    }

    // Fix nested tools and permission sections
    if (line.match(/^\s{2,}(tools|permission):/)) {
      const match = line.match(/^\s{2,}(tools|permission):/);
      if (match) {
        const section = match[1];
        if (sections.has(section)) {
          console.log(`  Removing duplicate section: ${section}`);
          continue; // Skip duplicate
        }
        const fixedLine = section + ':' + line.substring(line.indexOf(':') + 1);
        fixedLines.push(fixedLine);
        sections.set(section, i);
        console.log(`  Fixed section indentation: ${section}`);
        continue;
      }
    }

    // Fix nested tool/permission properties
    if (line.match(/^\s{4,}(\w+):/)) {
      const match = line.match(/^\s{4,}(\w+):/);
      if (match) {
        const property = match[1];
        // Check if this is a tool or permission property
        const parentMatch = fixedLines[fixedLines.length - 1];
        if (
          parentMatch &&
          (parentMatch.includes('tools:') || parentMatch.includes('permission:'))
        ) {
          const fixedLine = '  ' + property + ':' + line.substring(line.indexOf(':') + 1);
          fixedLines.push(fixedLine);
          console.log(`  Fixed nested property: ${property}`);
          continue;
        }
      }
    }

    // Handle duplicate sections by renaming them appropriately
    if (line.match(/^(\w+):/) && sections.has(trimmed.split(':')[0])) {
      const sectionName = trimmed.split(':')[0];
      if (
        ['tools', 'permission', 'best_practices', 'examples', 'capabilities'].includes(sectionName)
      ) {
        // Rename duplicate sections
        const renameMap = {
          tools: 'technologies',
          permission: 'permissions',
          best_practices: 'deployment_considerations',
          examples: 'integration_examples',
          capabilities: 'skills',
        };

        if (renameMap[sectionName]) {
          const fixedLine = renameMap[sectionName] + ':' + line.substring(line.indexOf(':') + 1);
          fixedLines.push(fixedLine);
          sections.set(renameMap[sectionName], i);
          console.log(`  Renamed duplicate section: ${sectionName} → ${renameMap[sectionName]}`);
          continue;
        }
      }
    }

    fixedLines.push(line);
  }

  return fixedLines.join('\n');
}

function findAgentFiles(dir) {
  const files = [];

  function scan(directory) {
    const items = fs.readdirSync(directory);

    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scan(fullPath);
      } else if (item.endsWith('.md') && (item.includes('agent') || directory.includes('agent'))) {
        files.push(fullPath);
      }
    }
  }

  scan(dir);
  return files;
}

function fixAgentFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixedContent = fixYamlIssues(content);

    if (fixedContent !== content) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      console.log(`✅ Fixed: ${path.basename(filePath)}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing all YAML issues in agent files...\n');

  const directories = ['./base-agents'];
  let totalFiles = 0;
  let fixedFiles = 0;

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.log(`📁 Directory not found: ${dir}`);
      continue;
    }

    console.log(`📂 Processing: ${dir}`);
    const files = findAgentFiles(dir);
    totalFiles += files.length;

    for (const file of files) {
      if (fixAgentFile(file)) {
        fixedFiles++;
      }
    }
  }

  console.log('\n📊 Fix Summary:');
  console.log(`   Total files processed: ${totalFiles}`);
  console.log(`   Files fixed: ${fixedFiles}`);

  if (fixedFiles > 0) {
    console.log('\n✅ All YAML issues fixed!');
    console.log('💡 Run the sync again: bun run src/sync-with-validation.ts --global');
  } else {
    console.log('\n✅ No YAML issues found!');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

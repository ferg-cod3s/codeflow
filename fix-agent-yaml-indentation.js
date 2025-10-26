#!/usr/bin/env node

/**
 * Fix YAML indentation issues in agent files
 * The issue: properties like primary_objective, anti_objectives, owner, etc.
 * are incorrectly indented, making them nested under the tags array
 */

import fs from 'fs';
import path from 'path';

function fixYamlIndentation(content) {
  const lines = content.split('\n');
  let inFrontmatter = false;
  let fixedLines = [];
  let tagsEnded = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Start of frontmatter
    if (line.trim() === '---') {
      inFrontmatter = !inFrontmatter;
      fixedLines.push(line);
      continue;
    }

    if (!inFrontmatter) {
      fixedLines.push(line);
      continue;
    }

    // Inside frontmatter
    if (trimmed === 'tags:') {
      tagsEnded = false;
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
      // This property is over-indented, fix it
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
        ];

        if (
          rootLevelProps.includes(property) ||
          property.includes('_') ||
          property.includes('capabilities') ||
          property.includes('examples') ||
          property.includes('best_practices')
        ) {
          // Remove the extra indentation
          const fixedLine = property + ':' + line.substring(line.indexOf(':') + 1);
          fixedLines.push(fixedLine);
          console.log(`  Fixed indentation: ${property}`);
          continue;
        }
      }
    }

    // Fix nested tools and permission sections
    if (line.match(/^\s{2,}tools:/) || line.match(/^\s{2,}permission:/)) {
      const match = line.match(/^\s{2,}(tools|permission):/);
      if (match) {
        const section = match[1];
        const fixedLine = section + ':' + line.substring(line.indexOf(':') + 1);
        fixedLines.push(fixedLine);
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
    const fixedContent = fixYamlIndentation(content);

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
  console.log('🔧 Fixing YAML indentation issues in agent files...\n');

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
    console.log('\n✅ YAML indentation issues fixed!');
    console.log('💡 Run the sync again: bun run src/sync-with-validation.ts --global');
  } else {
    console.log('\n✅ No indentation issues found!');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

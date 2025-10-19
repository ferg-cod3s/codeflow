#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Debug script to test YAML parsing of allowed_directories
 */

function parseFrontmatter(content) {
  const lines = content.split('\n');

  // Check if file starts with frontmatter delimiter
  if (lines[0] !== '---') {
    throw new Error('File does not start with YAML frontmatter');
  }

  // Find end of frontmatter
  let frontmatterEndIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      frontmatterEndIndex = i;
      break;
    }
  }

  if (frontmatterEndIndex === -1) {
    throw new Error('Could not find end of YAML frontmatter');
  }

  // Extract frontmatter and body
  const frontmatterLines = lines.slice(1, frontmatterEndIndex);
  const bodyLines = lines.slice(frontmatterEndIndex + 1);

  // Parse YAML frontmatter manually (simple key-value pairs)
  const frontmatter = {};
   
  let inTools = false;
  let toolsIndentLevel = 0;
  let inAllowedDirectories = false;
  let allowedDirectoriesIndentLevel = 0;

  console.log('🔍 Parsing frontmatter lines:');
  for (let i = 0; i < frontmatterLines.length; i++) {
    const line = frontmatterLines[i];
    console.log(`  ${i}: "${line}"`);
  }

  for (let i = 0; i < frontmatterLines.length; i++) {
    const line = frontmatterLines[i];
    const trimmedLine = line.trim();

    if (trimmedLine === '') continue;

    // Handle tools section specially
    if (trimmedLine === 'tools:') {
      inTools = true;
      frontmatter.tools = {};
      toolsIndentLevel = line.indexOf('tools:');
      continue;
    }

    // Handle allowed_directories section specially
    if (trimmedLine === 'allowed_directories:') {
      console.log('🎯 Found allowed_directories section');
      inAllowedDirectories = true;
      frontmatter.allowed_directories = [];
      allowedDirectoriesIndentLevel = line.indexOf('allowed_directories:');
      console.log(`   Indent level: ${allowedDirectoriesIndentLevel}`);
      continue;
    }

    if (inTools) {
      const indentLevel = line.length - line.trimLeft().length;

      // Exit tools section if we're back to the same or lesser indentation
      if (indentLevel <= toolsIndentLevel && trimmedLine !== '') {
        inTools = false;
      } else if (trimmedLine.includes(':')) {
        const [key, value] = trimmedLine.split(':').map((s) => s.trim());
        frontmatter.tools[key] = value === 'true' ? true : value === 'false' ? false : value;
        continue;
      }
    }

    if (inAllowedDirectories) {
      const indentLevel = line.length - line.trimLeft().length;
      console.log(`   Processing line in allowed_directories: "${line}" (indent: ${indentLevel})`);

      // Exit allowed_directories section if we're back to the same or lesser indentation
      if (indentLevel <= allowedDirectoriesIndentLevel && trimmedLine !== '') {
        console.log('   Exiting allowed_directories section');
        inAllowedDirectories = false;
      } else if (trimmedLine.startsWith('- ')) {
        // Handle array items (e.g., "- /path/to/dir")
        const directory = trimmedLine.substring(2).trim();
        if (directory) {
          console.log(`   Adding directory: "${directory}"`);
          frontmatter.allowed_directories.push(directory);
        }
        continue;
      }
    }

    if (!inTools && !inAllowedDirectories && trimmedLine.includes(':')) {
      const colonIndex = trimmedLine.indexOf(':');
      const key = trimmedLine.substring(0, colonIndex).trim();
      let value = trimmedLine.substring(colonIndex + 1).trim();

      // Handle different value types
      if (value === 'true' || value === 'false') {
        frontmatter[key] = value === 'true';
      } else if (!isNaN(Number(value)) && value !== '' && !value.includes('/')) {
        // Don't convert model names like "github-copilot/gpt-5" to numbers
        frontmatter[key] = Number(value);
      } else if (value.startsWith('"') && value.endsWith('"')) {
        frontmatter[key] = value.slice(1, -1);
      } else if (key === 'temperature' && !isNaN(Number(value)) && value !== '') {
        // Explicitly handle temperature as number
        frontmatter[key] = Number(value);
      } else {
        frontmatter[key] = value;
      }
    }
  }

  return {
    frontmatter,
    body: bodyLines.join('\n').trim(),
  };
}

async function debugParse() {
  const filePath = path.join(process.cwd(), 'codeflow-agents', 'generalist', 'agent-architect.md');
  console.log(`📁 Reading file: ${filePath}`);

  const content = await fs.readFile(filePath, 'utf-8');
  console.log('📄 File content (first 20 lines):');
  console.log(content.split('\n').slice(0, 20).join('\n'));
  console.log('...');

  const result = parseFrontmatter(content);
  console.log('\n📋 Parsed frontmatter:');
  console.log(JSON.stringify(result.frontmatter, null, 2));

  console.log('\n🎯 allowed_directories value:');
  console.log(result.frontmatter.allowed_directories);
}

debugParse().catch(console.error);

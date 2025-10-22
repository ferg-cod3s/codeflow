#!/usr/bin/env node

/**
 * Validation script to ensure agents and commands follow best practices
 * Checks against OPENCODE_BEST_PRACTICES.md and OPENCODE_CODEFLOW_BEST_PRACTICES.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

// Best practices validation rules
const OPENCODE_COMMAND_RULES = {
  requiredFields: ['description', 'mode'],
  requiredMode: 'command',
  requiredPatterns: {
    arguments: /\$ARGUMENTS/, // Must include $ARGUMENTS placeholder
  },
  recommendedPatterns: {
    shellCommands: /!`[^`]*`/, // Should use shell commands
    fileReferences: /@[^\s`,]+/, // Should use file references
    errorHandling: /(set -e|if.*then.*else|exit \d+)/, // Should have error handling
  },
};

const OPENCODE_AGENT_RULES = {
  requiredFields: ['description', 'mode'],
  allowedModes: ['primary', 'subagent', 'all'],
  requiredPermissions: [], // No required permissions for now - parsing is complex
  recommendedFields: ['model', 'temperature', 'permission'],
  recommendedPermissions: ['edit', 'bash', 'webfetch'], // These are recommended but not required
};

function findMarkdownFiles(dir) {
  const files = [];

  function scan(directory) {
    try {
      const items = fs.readdirSync(directory);

      for (const item of items) {
        const fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scan(fullPath);
        } else if (item.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
  }

  scan(dir);
  return files;
}

function parseFrontmatter(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return { frontmatter: {}, body: content };
  }

  const frontmatterText = frontmatterMatch[1];
  const body = content.substring(frontmatterMatch[0].length);

  // Simple YAML parser that handles nested structures
  const frontmatter = {};
  const lines = frontmatterText.split('\n');
  let currentKey = null;
  let indentLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) continue; // Skip empty lines and comments

    if (trimmed.includes(':')) {
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();
      const keyTrimmed = key.trim();
      const currentIndent = line.search(/\S/);

      if (value === '') {
        // Start of nested structure
        currentKey = keyTrimmed;
        frontmatter[currentKey] = {};
        indentLevel = currentIndent;
      } else {
        // Simple key-value pair
        currentKey = null;
        // Handle different value types
        if (value === 'true' || value === 'false') {
          frontmatter[keyTrimmed] = value === 'true';
        } else if (!isNaN(Number(value)) && value !== '') {
          frontmatter[keyTrimmed] = Number(value);
        } else if (value.startsWith('[') && value.endsWith(']')) {
          // Handle arrays
          frontmatter[keyTrimmed] = value
            .slice(1, -1)
            .split(',')
            .map((item) => item.trim().replace(/^["']|["']$/g, ''));
        } else {
          frontmatter[keyTrimmed] = value.replace(/^["']|["']$/g, ''); // Remove quotes
        }
      }
    } else if (currentKey && line.search(/\S/) > indentLevel) {
      // Nested property
      const [subKey, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();
      const subKeyTrimmed = subKey.trim();

      if (value === 'true' || value === 'false') {
        frontmatter[currentKey][subKeyTrimmed] = value === 'true';
      } else if (!isNaN(Number(value)) && value !== '') {
        frontmatter[currentKey][subKeyTrimmed] = Number(value);
      } else {
        frontmatter[currentKey][subKeyTrimmed] = value.replace(/^["']|["']$/g, '');
      }
    }
  }

  return { frontmatter, body };
}

function validateOpenCodeCommand(_filePath, content) {
  const { frontmatter, body } = parseFrontmatter(content);
  const errors = [];
  const warnings = [];

  // Check required fields
  for (const field of OPENCODE_COMMAND_RULES.requiredFields) {
    if (!frontmatter[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check mode
  if (frontmatter.mode !== OPENCODE_COMMAND_RULES.requiredMode) {
    errors.push(
      `Invalid mode: ${frontmatter.mode} (must be '${OPENCODE_COMMAND_RULES.requiredMode}')`
    );
  }

  // Check required patterns in body
  for (const [name, pattern] of Object.entries(OPENCODE_COMMAND_RULES.requiredPatterns)) {
    if (!pattern.test(body)) {
      errors.push(`Missing required pattern: ${name} (${pattern})`);
    }
  }

  // Check recommended patterns
  for (const [name, pattern] of Object.entries(OPENCODE_COMMAND_RULES.recommendedPatterns)) {
    if (!pattern.test(body)) {
      warnings.push(`Consider adding ${name} pattern for better functionality`);
    }
  }

  // Check for shell command injection vulnerabilities
  const dangerousPatterns = [
    /rm\s+-rf\s+\$ARGUMENTS/, // Dangerous rm usage
    /eval\s+\$ARGUMENTS/, // Dangerous eval usage
    /sudo\s+\$ARGUMENTS/, // Dangerous sudo usage
    /chmod\s+777.*\$ARGUMENTS/, // Dangerous chmod usage
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(body)) {
      console.error(`DEBUG: Matched pattern ${pattern} in file ${_filePath}`);
      console.error(`DEBUG: Body contains $ARGUMENTS: ${body.includes('$ARGUMENTS')}`);
      console.error(
        `DEBUG: Body excerpt: ${body.substring(body.indexOf('$ARGUMENTS') - 10, body.indexOf('$ARGUMENTS') + 20)}`
      );
      errors.push('Potential security vulnerability: unsafe argument handling');
      break;
    }
  }

  // Check for proper error handling in shell commands
  const shellCommands = body.match(/!`[^`]*`/g) || [];
  for (const cmd of shellCommands) {
    const cleanCmd = cmd.slice(2, -1);
    if (cleanCmd.includes('opencode') && !cleanCmd.includes('||') && !cleanCmd.includes('&&')) {
      warnings.push(`Shell command lacks error handling: ${cleanCmd}`);
    }
  }

  return { errors, warnings, frontmatter };
}

function validateOpenCodeAgent(_filePath, content) {
  const { frontmatter } = parseFrontmatter(content);
  const errors = [];
  const warnings = [];

  // Check required fields
  for (const field of OPENCODE_AGENT_RULES.requiredFields) {
    if (!frontmatter[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check mode
  if (frontmatter.mode && !OPENCODE_AGENT_RULES.allowedModes.includes(frontmatter.mode)) {
    errors.push(
      `Invalid mode: ${frontmatter.mode} (must be one of: ${OPENCODE_AGENT_RULES.allowedModes.join(', ')})`
    );
  }

  // Check permissions
  if (frontmatter.permission) {
    // Check required permissions
    for (const perm of OPENCODE_AGENT_RULES.requiredPermissions) {
      if (!(perm in frontmatter.permission)) {
        errors.push(`Missing required permission: ${perm}`);
      }
    }

    // Check recommended permissions
    for (const perm of OPENCODE_AGENT_RULES.recommendedPermissions) {
      if (!(perm in frontmatter.permission)) {
        warnings.push(`Consider setting permission for: ${perm}`);
      }
    }

    // Validate permission values
    for (const [key, value] of Object.entries(frontmatter.permission)) {
      if (!['allow', 'ask', 'deny'].includes(value)) {
        errors.push(
          `Invalid permission value for ${key}: ${value} (must be 'allow', 'ask', or 'deny')`
        );
      }
    }
  } else {
    warnings.push(`No permissions defined - agent may have unexpected access`);
  }

  // Check model
  if (frontmatter.model) {
    const validModelPatterns = [
      /^opencode\/.*/,
      /^github-copilot\/.*/,
      /^(sonnet|opus|haiku|inherit)$/,
    ];

    const isValidModel = validModelPatterns.some((pattern) => pattern.test(frontmatter.model));
    if (!isValidModel) {
      warnings.push(`Unusual model: ${frontmatter.model} - verify it's supported`);
    }
  }

  return { errors, warnings, frontmatter };
}

function validateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const isCommand = filePath.includes('/command/') || filePath.includes('-commands/');
    const isAgent = filePath.includes('/agent/') || filePath.includes('-agents/');

    if (isCommand) {
      return validateOpenCodeCommand(filePath, content);
    } else if (isAgent) {
      return validateOpenCodeAgent(filePath, content);
    }

    return { errors: [], warnings: [], frontmatter: {} };
  } catch (error) {
    return {
      errors: [`Failed to read file: ${error.message}`],
      warnings: [],
      frontmatter: {},
    };
  }
}

function main() {
  console.log('🔍 Validating Best Practices Compliance...\n');

  const directories = [
    './.opencode/command',
    './.opencode/agent',
    './opencode-commands',
    './opencode-agents',
    './claude-commands',
    './claude-agents',
  ];

  let totalFiles = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  const fileResults = [];

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.log(`📁 Directory not found: ${dir}`);
      continue;
    }

    console.log(`📂 Scanning: ${dir}`);
    const files = findMarkdownFiles(dir);
    totalFiles += files.length;

    for (const file of files) {
      const result = validateFile(file);
      fileResults.push({ file, ...result });
      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;

      if (result.errors.length > 0) {
        console.log(`\n❌ ${file}:`);
        result.errors.forEach((error) => console.log(`   Error: ${error}`));
      }

      if (result.warnings.length > 0) {
        console.log(`\n⚠️  ${file}:`);
        result.warnings.forEach((warning) => console.log(`   Warning: ${warning}`));
      }
    }
  }

  console.log('\n📊 Best Practices Validation Summary:');
  console.log(`   Total files checked: ${totalFiles}`);
  console.log(`   Files with errors: ${fileResults.filter((r) => r.errors.length > 0).length}`);
  console.log(`   Files with warnings: ${fileResults.filter((r) => r.warnings.length > 0).length}`);
  console.log(`   Total errors: ${totalErrors}`);
  console.log(`   Total warnings: ${totalWarnings}`);

  if (totalErrors > 0) {
    console.log('\n❌ Best practices validation failed!');
    console.log('   Fix errors to ensure compliance with OPENCODE_BEST_PRACTICES.md');
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log('\n⚠️  Best practices validation passed with warnings');
    console.log('   Consider addressing warnings for optimal compliance');
  } else {
    console.log('\n✅ All files follow best practices!');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateFile, validateOpenCodeCommand, validateOpenCodeAgent };

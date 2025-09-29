#!/usr/bin/env bun

/**
 * YAML Validator Utility
 * Ensures all YAML frontmatter is valid before writing files
 */

import * as yaml from 'yaml';
import { readFile, writeFile } from 'fs/promises';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fixed?: string;
}

/**
 * Common YAML issues that need fixing
 */
const YAML_FIXES = [
  // Fix unquoted colons in values
  {
    pattern:
      /^(\s*(?:description|help|prompt|text|message|content|value|default|example|note|comment|label|title|name|tooltip|placeholder|error|warning|info|success):\s*)([^"'\n]*?)\s*:\s*([^"'\n]*?)$/gm,
    fix: (match: string, prefix: string, beforeColon: string, afterColon: string) => {
      // If the line contains a colon in the value part, quote it
      if (beforeColon && afterColon) {
        const value = `${beforeColon}: ${afterColon}`.trim();
        // Use single quotes to avoid issues with double quotes in the value
        return `${prefix}'${value}'`;
      }
      return match;
    },
    description: 'Quote values containing colons',
  },
  // Fix parentheses with colons (common pattern like "default: true)")
  {
    pattern:
      /^(\s*(?:description|help|prompt|text|message|content|value|default|example|note|comment|label|title|name|tooltip|placeholder|error|warning|info|success):\s*)([^"'\n]*?\(.*?:.*?\)[^"'\n]*?)$/gm,
    fix: (match: string, prefix: string, value: string) => {
      // Quote values that contain parentheses with colons
      if (!value.startsWith('"') && !value.startsWith("'")) {
        return `${prefix}'${value}'`;
      }
      return match;
    },
    description: 'Quote values with parentheses containing colons',
  },
  // Fix multiline strings that should use pipe notation
  {
    pattern:
      /^(\s*(?:description|help|prompt|text|message|content|value|instructions):\s*)([^"'\n][^\n]*\n\s+[^\n]+)/gm,
    fix: (match: string, prefix: string, value: string) => {
      // Convert to pipe notation for multiline strings
      const lines = value.split('\n').map((l) => l.trim());
      return `${prefix}|\n  ${lines.join('\n  ')}`;
    },
    description: 'Use pipe notation for multiline strings',
  },
];

/**
 * Validate YAML content
 */
export function validateYAML(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Try to parse the YAML
    yaml.parse(content);
    return { valid: true, errors, warnings };
  } catch (error: any) {
    // Extract error details
    const errorMessage = error.message || 'Unknown YAML error';
    const line = error.mark?.line;
    const column = error.mark?.column;

    errors.push(`YAML Parse Error at line ${line}, column ${column}: ${errorMessage}`);

    // Try to auto-fix common issues
    const fixed = attemptAutoFix(content, error);

    if (fixed && fixed !== content) {
      // Validate the fixed version
      try {
        yaml.parse(fixed);
        warnings.push('YAML was auto-fixed');
        return { valid: true, errors: [], warnings, fixed };
      } catch (fixError) {
        // Auto-fix didn't work
        errors.push('Auto-fix attempted but failed');
      }
    }

    return { valid: false, errors, warnings };
  }
}

/**
 * Attempt to automatically fix common YAML issues
 */
function attemptAutoFix(content: string, error: any): string | null {
  let fixed = content;

  // Apply all fixes
  for (const fix of YAML_FIXES) {
    fixed = fixed.replace(fix.pattern, fix.fix as any);
  }

  // Additional specific fixes based on error type
  if (error.message.includes('incomplete explicit mapping pair')) {
    // This usually means there's an unquoted colon in a value
    const lines = fixed.split('\n');
    const errorLine = error.mark?.line - 1;

    if (errorLine >= 0 && errorLine < lines.length) {
      const line = lines[errorLine];

      // Check if this is a description or similar field with unquoted colon
      const match = line.match(
        /^(\s*)(description|help|prompt|text|message|content|value):\s*(.+)$/
      );
      if (match) {
        const [, indent, key, value] = match;

        // Check if value contains unquoted colon
        if (value.includes(':') && !value.startsWith('"') && !value.startsWith("'")) {
          lines[errorLine] = `${indent}${key}: '${value}'`;
          fixed = lines.join('\n');
        }
      }
    }
  }

  return fixed;
}

/**
 * Validate YAML frontmatter in a markdown file
 */
export async function validateMarkdownYAML(filePath: string): Promise<ValidationResult> {
  try {
    const content = await readFile(filePath, 'utf-8');

    // Extract frontmatter
    if (!content.startsWith('---\n')) {
      return { valid: true, errors: [], warnings: ['No frontmatter found'] };
    }

    const parts = content.split('---\n');
    if (parts.length < 3) {
      return {
        valid: false,
        errors: ['Invalid frontmatter structure'],
        warnings: [],
      };
    }

    const frontmatter = parts[1];
    const result = validateYAML(frontmatter);

    // If auto-fixed, update the file
    if (result.fixed) {
      const newContent = `---\n${result.fixed}---\n${parts.slice(2).join('---\n')}`;
      result.fixed = newContent;
    }

    return result;
  } catch (error: any) {
    return {
      valid: false,
      errors: [`Failed to read file: ${error.message}`],
      warnings: [],
    };
  }
}

/**
 * Fix YAML in a file
 */
export async function fixYAMLFile(filePath: string): Promise<boolean> {
  const result = await validateMarkdownYAML(filePath);

  if (result.fixed) {
    try {
      await writeFile(filePath, result.fixed, 'utf-8');
      console.log(`✅ Fixed YAML in ${filePath}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to write fixed file: ${error}`);
      return false;
    }
  }

  return result.valid;
}

/**
 * Validate all files in a directory
 */
export async function validateDirectory(dirPath: string): Promise<{
  total: number;
  valid: number;
  fixed: number;
  errors: { file: string; errors: string[] }[];
}> {
  const { readdir } = await import('fs/promises');
  const { join } = await import('path');

  const files = await readdir(dirPath);
  const mdFiles = files.filter((f) => f.endsWith('.md'));

  let valid = 0;
  let fixed = 0;
  const errors: { file: string; errors: string[] }[] = [];

  for (const file of mdFiles) {
    const filePath = join(dirPath, file);
    const result = await validateMarkdownYAML(filePath);

    if (result.valid) {
      valid++;
      if (result.fixed) {
        fixed++;
      }
    } else {
      errors.push({ file, errors: result.errors });
    }
  }

  return {
    total: mdFiles.length,
    valid,
    fixed,
    errors,
  };
}

// CLI interface
if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
YAML Validator for Codeflow

Usage:
  bun run yaml-validator.ts <file|directory> [--fix]

Options:
  --fix    Attempt to fix common YAML issues

Examples:
  bun run yaml-validator.ts .opencode/command/
  bun run yaml-validator.ts file.md --fix
`);
    process.exit(0);
  }

  const path = args[0];
  const shouldFix = args.includes('--fix');

  const { existsSync, statSync } = await import('fs');

  if (!existsSync(path)) {
    console.error(`Path not found: ${path}`);
    process.exit(1);
  }

  const stat = statSync(path);

  if (stat.isDirectory()) {
    console.log(`Validating directory: ${path}`);
    const result = await validateDirectory(path);

    console.log(`\nResults:`);
    console.log(`  Total files: ${result.total}`);
    console.log(`  Valid: ${result.valid}`);
    console.log(`  Fixed: ${result.fixed}`);
    console.log(`  Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\nFiles with errors:');
      for (const error of result.errors) {
        console.log(`  ❌ ${error.file}`);
        for (const err of error.errors) {
          console.log(`     ${err}`);
        }
      }
    }
  } else {
    if (shouldFix) {
      const success = await fixYAMLFile(path);
      if (!success) {
        process.exit(1);
      }
    } else {
      const result = await validateMarkdownYAML(path);

      if (result.valid) {
        console.log(`✅ ${path} has valid YAML`);
        if (result.warnings.length > 0) {
          console.log('Warnings:', result.warnings.join(', '));
        }
      } else {
        console.log(`❌ ${path} has invalid YAML`);
        console.log('Errors:', result.errors.join(', '));
        if (result.fixed) {
          console.log('💡 Can be auto-fixed with --fix flag');
        }
      }

      if (!result.valid) {
        process.exit(1);
      }
    }
  }
}

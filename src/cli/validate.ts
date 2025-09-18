import { AgentValidator } from '../conversion/validator.js';
import { parseAgentFile } from '../conversion/agent-parser.js';
import { readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Validate agent format compliance and detect duplicates
 */
export async function validate(options: {
  format?: 'all' | 'claude-code' | 'opencode' | 'base';
  path?: string;
  checkDuplicates?: boolean;
  canonicalCheck?: boolean;
  fix?: boolean;
  verbose?: boolean;
}) {
  const validator = new AgentValidator();
  const format = options.format || 'all';
  const searchPath = options.path || '.';

  // Find agent files based on format
  const directories = {
    'claude-code': ['claude-agents', '.claude/agents'],
    opencode: ['opencode-agents', '.opencode/agent'],
    base: ['agent'],
    all: ['agent', 'claude-agents', 'opencode-agents', '.claude/agents', '.opencode/agent'],
  };

  const dirsToSearch = directories[format] || directories.all;
  const files: string[] = [];

  // Recursive function to find all .md files in a directory
  async function findMarkdownFiles(dir: string): Promise<string[]> {
    const foundFiles: string[] = [];
    try {
      const entries = await readdir(dir);

      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stats = await stat(fullPath);

        if (stats.isDirectory()) {
          const subFiles = await findMarkdownFiles(fullPath);
          foundFiles.push(...subFiles);
        } else if (entry.endsWith('.md')) {
          foundFiles.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
      console.warn(`⚠️ Could not read directory ${dir}: ${(error as Error).message}`);
    }

    return foundFiles;
  }

  for (const dir of dirsToSearch) {
    const fullDir = path.isAbsolute(dir) ? dir : path.join(searchPath, dir);
    if (existsSync(fullDir)) {
      const foundFiles = await findMarkdownFiles(fullDir);
      files.push(...foundFiles);
    }
  }

  console.log(`🔍 Validating ${files.length} agent files (format: ${format})...`);

  // Handle duplicate detection
  if (options.checkDuplicates) {
    console.log(`\n🔄 Checking for duplicate agents...`);
    const duplicateResult = await validator.validateNoDuplicates([
      'codeflow-agents',
      'claude-agents',
      'opencode-agents',
    ]);

    console.log(`📊 Duplicate Detection Results:`);
    console.log(`  Total unique agents: ${duplicateResult.totalAgents}`);
    console.log(`  Canonical agents (exactly 3 formats): ${duplicateResult.canonicalAgentCount}`);
    console.log(`  Duplicate issues found: ${duplicateResult.duplicates.length}`);

    if (duplicateResult.duplicates.length > 0) {
      console.log(`\n❌ Duplicate Issues:`);
      duplicateResult.duplicates.forEach((dup) => {
        if (dup.issue === 'missing_canonical_formats') {
          console.log(`  ${dup.agentName}: Missing formats ${dup.missingFormats?.join(', ')}`);
        } else {
          console.log(`  ${dup.agentName}: ${dup.totalCopies} copies (expected 3)`);
          dup.extraCopies?.forEach((file) => console.log(`    Extra: ${file}`));
        }
      });
    }

    // Exit for critical issues: canonical conflicts, schema missing, permission violations
    const criticalIssues =
      duplicateResult.duplicates?.filter((d: any) =>
        ['canonical_conflict', 'schema_missing', 'permission_violation'].includes(d.issue)
      ) || [];
    if (criticalIssues.length > 0) {
      console.log(`\n❌ Critical validation issues found (${criticalIssues.length}), exiting...`);
      process.exit(1);
    }

    // Warn for legacy duplicates but don't fail
    const legacyIssues =
      duplicateResult.duplicates?.filter((d: any) => d.issue === 'legacy_duplicate') || [];
    if (legacyIssues.length > 0) {
      console.log(`\n⚠️ Legacy duplicates found (${legacyIssues.length}), continuing...`);
    }
  }

  // Handle canonical integrity check
  console.log(`Canonical check option: ${options.canonicalCheck}`);
  if (options.canonicalCheck) {
    console.log(`\n🏛️ Validating canonical source integrity...`);
    try {
      const canonicalResult = await validator.validateCanonicalIntegrity();

      console.log(`📊 Canonical Integrity Results:`);
      console.log(`  Expected agents: ${canonicalResult.expectedCount}`);
      console.log(`  Manifest agents: ${canonicalResult.manifestAgents}`);
      console.log(`  Integrity issues: ${canonicalResult.errors.length}`);

      if (canonicalResult.errors.length > 0) {
        console.log(`\n❌ Integrity Issues:`);
        canonicalResult.errors.forEach((error) => {
          console.log(`  ${error.agent}: ${error.issue}`);
          if (error.suggestion) {
            console.log(`    💡 ${error.suggestion}`);
          }
        });
      }

      if (!canonicalResult.valid) {
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Could not validate canonical integrity: ${(error as Error).message}`);
      console.error(`   Make sure AGENT_MANIFEST.json exists and is valid`);
      console.error(`   Try running setup from the codeflow repository root or copy the manifest manually`);
      process.exit(1);
    }
  }

  // Parse and validate agents
  const agents = [];
  const parseErrors = [];

  for (const file of files) {
    try {
      const formatType =
        file.includes('claude-agents') || file.includes('.claude/')
          ? 'claude-code'
          : file.includes('opencode-agents') || file.includes('.opencode/')
            ? 'opencode'
            : 'base';
      const agent = await parseAgentFile(file, formatType);
      if (agent) {
        agents.push(agent);
      }
    } catch (error) {
      parseErrors.push({ file, error: (error as Error).message });
    }
  }

  if (parseErrors.length > 0) {
    console.error(`❌ ${parseErrors.length} files failed to parse:`);
    parseErrors.forEach(({ file, error }) => {
      console.error(`  ${file}: ${error}`);
    });
  }

  const { results, summary } = await validator.validateBatchWithDetails(agents);

  // Print summary
  console.log(`\n📊 Validation Summary:`);
  console.log(`  Total: ${summary.total}`);
  console.log(`  ✅ Valid: ${summary.valid}`);
  console.log(`  ❌ Errors: ${summary.errors}`);
  console.log(`  ⚠️  Warnings: ${summary.warnings}`);

  if (summary.errors > 0) {
    console.log(`\nTop error categories:`);
    Object.entries(summary.errorsByType)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .forEach(([field, count]) => {
        console.log(`  ${field}: ${count} issues`);
      });
  }

  if (options.verbose) {
    console.log(`\n📝 Detailed Results:`);
    results.forEach((result) => {
      if (!result.valid) {
        console.log(`\n❌ ${result.agent}:`);
        result.errors.forEach((error) => {
          console.log(`  ${error.field}: ${error.message}`);
          if ('suggestion' in error && error.suggestion) {
            console.log(`    💡 ${error.suggestion}`);
          }
        });
      }

      if (result.warnings.length > 0) {
        console.log(`\n⚠️  ${result.agent} warnings:`);
        result.warnings.forEach((warning) => {
          console.log(`  ${warning.field}: ${warning.message}`);
        });
      }
    });
  }

  if (options.fix) {
    const fixScript = validator.generateFixScript(results);
    console.log(`\n🔧 Fix suggestions written to: agent-fixes.txt`);
    await Bun.write('agent-fixes.txt', fixScript);
  }

  // Exit with error code if validation failed
  if (summary.errors > 0) {
    process.exit(1);
  }
}

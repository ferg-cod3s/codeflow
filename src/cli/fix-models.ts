#!/usr/bin/env bun

/**
 * Fix model configurations for OpenCode and Claude Code
 * This ensures all agents and commands use the correct model format for each platform
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { ModelFixer } from '../catalog/model-fixer.js';

interface FixOptions {
  dryRun?: boolean;
  verbose?: boolean;
  global?: boolean;
}

interface FixResult {
  fixed: number;
  skipped: number;
  errors: number;
  details: string[];
}

export async function fixModels(options: FixOptions = {}): Promise<void> {
  const isGlobal = options.global !== false; // Default to global
  const modelFixer = new ModelFixer(process.cwd());
  
  console.log(`\n🔧 Fixing Model Configurations${isGlobal ? ' (Global)' : ' (Local)'}...\n`);
  
  if (options.dryRun) {
    console.log('🔍 Dry run mode - no changes will be made\n');
  }

  const results: Record<string, FixResult> = {};
  
  // Fix OpenCode models
  if (isGlobal) {
    results.openCodeCommands = await fixDirectory(
      join(homedir(), '.config', 'opencode', 'command'),
      'opencode',
      'command',
      modelFixer,
      options
    );
    
    results.openCodeAgents = await fixDirectory(
      join(homedir(), '.config', 'opencode', 'agent'),
      'opencode',
      'agent',
      modelFixer,
      options
    );
    
    results.claudeCommands = await fixDirectory(
      join(homedir(), '.claude', 'commands'),
      'claude-code',
      'command',
      modelFixer,
      options
    );
    
    results.claudeAgents = await fixDirectory(
      join(homedir(), '.claude', 'agents'),
      'claude-code',
      'agent',
      modelFixer,
      options
    );
  } else {
    // Fix local project directories
    results.localOpenCodeCommands = await fixDirectory(
      join(process.cwd(), '.opencode', 'command'),
      'opencode',
      'command',
      modelFixer,
      options
    );
    
    results.localOpenCodeAgents = await fixDirectory(
      join(process.cwd(), '.opencode', 'agent'),
      'opencode',
      'agent',
      modelFixer,
      options
    );
    
    results.localClaudeCommands = await fixDirectory(
      join(process.cwd(), '.claude', 'commands'),
      'claude-code',
      'command',
      modelFixer,
      options
    );
    
    results.localClaudeAgents = await fixDirectory(
      join(process.cwd(), '.claude', 'agents'),
      'claude-code',
      'agent',
      modelFixer,
      options
    );
  }
  
  // Print summary
  printSummary(results, options);
}

async function fixDirectory(
  dirPath: string,
  target: 'claude-code' | 'opencode',
  itemType: 'agent' | 'command',
  modelFixer: ModelFixer,
  options: FixOptions
): Promise<FixResult> {
  const result: FixResult = {
    fixed: 0,
    skipped: 0,
    errors: 0,
    details: []
  };
  
  if (!existsSync(dirPath)) {
    if (options.verbose) {
      console.log(`⏭️  Skipping ${dirPath} (directory doesn't exist)`);
    }
    return result;
  }
  
  const targetName = target === 'claude-code' ? 'Claude Code' : 'OpenCode';
  console.log(`📂 Processing ${targetName} ${itemType}s: ${dirPath}`);
  
  try {
    const files = readdirSync(dirPath).filter(f => f.endsWith('.md'));
    
    for (const file of files) {
      const filePath = join(dirPath, file);
      
      try {
        const content = await readFile(filePath, 'utf-8');
        const fixedContent = modelFixer.fixModel(content, target, itemType);
        
        if (content !== fixedContent) {
          if (!options.dryRun) {
            await writeFile(filePath, fixedContent, 'utf-8');
          }
          result.fixed++;
          result.details.push(`✓ Fixed ${file}`);
          if (options.verbose) {
            console.log(`  ✓ Fixed ${file}`);
          }
        } else {
          result.skipped++;
        }
      } catch (error) {
        result.errors++;
        result.details.push(`✗ Error processing ${file}: ${error}`);
        if (options.verbose) {
          console.error(`  ✗ Error processing ${file}: ${error}`);
        }
      }
    }
  } catch (error) {
    console.error(`  ✗ Error reading directory: ${error}`);
  }
  
  if (result.fixed === 0 && !options.verbose) {
    console.log('  ✓ All models already correct');
  }
  
  return result;
}

function printSummary(results: Record<string, FixResult>, options: FixOptions): void {
  console.log('\n📊 Summary:');
  console.log('═══════════════════════════════════');
  
  let totalFixed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  
  for (const [key, result] of Object.entries(results)) {
    if (result.fixed > 0 || result.errors > 0 || options.verbose) {
      const name = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^local /, 'Local ')
        .replace(/^open Code/, 'OpenCode')
        .replace(/^claude/, 'Claude')
        .trim();
      
      console.log(`\n${name}:`);
      console.log(`  Fixed: ${result.fixed}`);
      console.log(`  Skipped: ${result.skipped}`);
      if (result.errors > 0) {
        console.log(`  Errors: ${result.errors}`);
      }
    }
    
    totalFixed += result.fixed;
    totalSkipped += result.skipped;
    totalErrors += result.errors;
  }
  
  console.log('\n═══════════════════════════════════');
  console.log(`Total: ${totalFixed} fixed, ${totalSkipped} already correct, ${totalErrors} errors`);
  
  if (options.dryRun) {
    console.log('\n🔍 Dry run complete - no files were modified');
  } else if (totalFixed > 0) {
    console.log('\n✅ Model configurations fixed successfully!');
    console.log('🎯 OpenCode commands should now work correctly');
  } else if (totalErrors === 0) {
    console.log('\n✅ All model configurations are already correct!');
  }
  
  if (totalErrors > 0) {
    console.log('\n⚠️  Some errors occurred during processing');
    console.log('   Run with --verbose for detailed error information');
  }
}

// CLI entry point
if (import.meta.main) {
  const args = process.argv.slice(2);
  const options: FixOptions = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    global: !args.includes('--local')
  };
  
  await fixModels(options);
}
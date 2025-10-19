import { existsSync, readdirSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';

interface CleanOptions {
  dryRun?: boolean;
  force?: boolean;
  verbose?: boolean;
  type?: 'cache' | 'temp' | 'orphaned' | 'all';
}

/**
 * Clean cache files
 */
function cleanCache(projectPath: string): { files: string[]; size: number } {
  const cacheDirs = [join(projectPath, '.cache'), join(projectPath, 'node_modules/.cache')];

  const files: string[] = [];
  let totalSize = 0;

  for (const cacheDir of cacheDirs) {
    if (existsSync(cacheDir)) {
      try {
        const items = readdirSync(cacheDir, { recursive: true });

        for (const item of items) {
          const itemPath = join(cacheDir, item.toString());
          try {
            const stats = require('fs').statSync(itemPath);
            if (stats.isFile()) {
              files.push(itemPath);
              totalSize += stats.size;
            }
          } catch {
            // File might have been deleted already
          }
        }
      } catch {
        console.warn(`Warning: Could not read cache directory ${cacheDir}`);
      }
    }
  }

  return { files, size: totalSize };
}

/**
 * Clean temporary files
 */
function cleanTemp(projectPath: string): { files: string[]; size: number } {
  const files: string[] = [];
  let totalSize = 0;

  // Simple implementation - in a real scenario you'd use glob patterns
  const checkDirectories = [
    projectPath,
    join(projectPath, '.claude'),
    join(projectPath, '.opencode'),
  ];

  for (const dir of checkDirectories) {
    if (existsSync(dir)) {
      try {
        const items = readdirSync(dir, { recursive: true });

        for (const item of items) {
          const itemPath = join(dir, item.toString());
          const itemStr = item.toString();

          // Check if it matches temp patterns
          if (
            itemStr.endsWith('.tmp') ||
            itemStr.endsWith('.temp') ||
            itemStr === '.DS_Store' ||
            itemStr === 'Thumbs.db' ||
            itemStr.includes('/temp/')
          ) {
            try {
              const stats = require('fs').statSync(itemPath);
              if (stats.isFile()) {
                files.push(itemPath);
                totalSize += stats.size;
              }
            } catch {
              // File might have been deleted already
            }
          }
        }
      } catch {
        console.warn(`Warning: Could not read directory ${dir}`);
      }
    }
  }

  return { files, size: totalSize };
}

/**
 * Clean orphaned files (files that exist but are not referenced)
 */
function cleanOrphaned(projectPath: string): { files: string[]; size: number } {
  const files: string[] = [];
  let totalSize = 0;

  // This is a simplified implementation
  // In a real scenario, you'd check against a manifest or expected file list

  const orphanedPatterns = [
    join(projectPath, '.claude', 'commands', '*.bak'),
    join(projectPath, '.opencode', 'command', '*.bak'),
  ];

  for (const pattern of orphanedPatterns) {
    // Simple check for .bak files
    const dir = pattern.replace('/*.bak', '');
    if (existsSync(dir)) {
      try {
        const items = readdirSync(dir);
        for (const item of items) {
          if (item.endsWith('.bak')) {
            const filePath = join(dir, item);
            try {
              const stats = require('fs').statSync(filePath);
              files.push(filePath);
              totalSize += stats.size;
            } catch {
              // File might not exist
            }
          }
        }
      } catch {
        console.warn(`Warning: Could not read directory ${dir}`);
      }
    }
  }

  return { files, size: totalSize };
}

/**
 * Main clean function
 */
export async function clean(
  projectPath: string = process.cwd(),
  options: CleanOptions = {}
): Promise<void> {
  const projectPathResolved = resolve(projectPath);
  const { dryRun = false, force = false, verbose = false, type = 'all' } = options;

  console.log(`🧹 Cleaning Codeflow project: ${projectPathResolved}`);

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be deleted');
  }

  const results: { type: string; files: string[]; size: number }[] = [];

  // Clean based on type
  if (type === 'cache' || type === 'all') {
    console.log('\n📁 Cleaning cache files...');
    const cacheResult = cleanCache(projectPathResolved);
    results.push({ type: 'cache', ...cacheResult });

    if (cacheResult.files.length > 0) {
      console.log(
        `   Found ${cacheResult.files.length} cache files (${Math.round(cacheResult.size / 1024)}KB)`
      );
      if (verbose) {
        cacheResult.files.forEach((file) => console.log(`   ${file}`));
      }
    } else {
      console.log('   No cache files found');
    }
  }

  if (type === 'temp' || type === 'all') {
    console.log('\n🗂️  Cleaning temporary files...');
    const tempResult = cleanTemp(projectPathResolved);
    results.push({ type: 'temp', ...tempResult });

    if (tempResult.files.length > 0) {
      console.log(
        `   Found ${tempResult.files.length} temp files (${Math.round(tempResult.size / 1024)}KB)`
      );
      if (verbose) {
        tempResult.files.forEach((file) => console.log(`   ${file}`));
      }
    } else {
      console.log('   No temp files found');
    }
  }

  if (type === 'orphaned' || type === 'all') {
    console.log('\n🔍 Cleaning orphaned files...');
    const orphanedResult = cleanOrphaned(projectPathResolved);
    results.push({ type: 'orphaned', ...orphanedResult });

    if (orphanedResult.files.length > 0) {
      console.log(
        `   Found ${orphanedResult.files.length} orphaned files (${Math.round(orphanedResult.size / 1024)}KB)`
      );
      if (verbose) {
        orphanedResult.files.forEach((file) => console.log(`   ${file}`));
      }
    } else {
      console.log('   No orphaned files found');
    }
  }

  // Calculate totals
  const totalFiles = results.reduce((sum, r) => sum + r.files.length, 0);
  const totalSize = results.reduce((sum, r) => sum + r.size, 0);

  console.log(`\n📊 Summary:`);
  console.log(`   Total files to clean: ${totalFiles}`);
  console.log(`   Total size: ${Math.round(totalSize / 1024)}KB`);

  if (totalFiles === 0) {
    console.log('✅ Nothing to clean');
    return;
  }

  if (dryRun) {
    console.log('🔍 Dry run completed - no files were deleted');
    return;
  }

  // Confirm before deleting
  if (!force) {
    console.log('\n⚠️  This will delete the files listed above.');
    console.log('💡 Use --force to skip confirmation, or --dry-run to preview without deleting');

    // Simple confirmation - in a real CLI you'd use a proper prompt library
    const confirm = process.argv.includes('--yes') || process.argv.includes('-y');
    if (!confirm) {
      console.log('❌ Operation cancelled. Use --force to proceed without confirmation.');
      process.exit(1);
    }
  }

  // Delete files
  console.log('\n🗑️  Deleting files...');

  let deletedCount = 0;
  let errorCount = 0;

  for (const result of results) {
    for (const file of result.files) {
      try {
        unlinkSync(file);
        deletedCount++;
        if (verbose) {
          console.log(`   Deleted: ${file}`);
        }
      } catch (error) {
        errorCount++;
        console.warn(
          `   Failed to delete ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  }

  console.log(`\n✅ Clean completed:`);
  console.log(`   Files deleted: ${deletedCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Space freed: ${Math.round(totalSize / 1024)}KB`);
}

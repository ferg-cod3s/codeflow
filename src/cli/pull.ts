import { readdir, mkdir, copyFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { existsSync } from 'node:fs';
import { resolveProjectPath } from './utils';
import {
  applyOpenCodePermissionsToDirectory,
  DEFAULT_OPENCODE_PERMISSIONS,
} from '../security/opencode-permissions';
// import { applyPermissionInheritance } from '../security/validation';
import CLIErrorHandler from './error-handler.js';

async function* walkDir(dir: string): AsyncGenerator<string> {
  const files = await readdir(dir, { withFileTypes: true });
  for (const file of files) {
    const path = join(dir, file.name);
    if (file.isDirectory()) {
      yield* walkDir(path);
    } else {
      yield path;
    }
  }
}

export async function pull(projectPath: string | undefined) {
  try {
    // Resolve the project path (will exit if invalid)
    const resolvedProjectPath = resolveProjectPath(projectPath);

    // Load config - find the codeflow installation directory
    // import.meta.dir gives us the src/cli directory
    const codeflowDir = join(import.meta.dir, '../..');
    const configPath = join(codeflowDir, 'config.json');

    // Validate config file exists
    const configValidation = CLIErrorHandler.validatePath(configPath, 'file');
    if (!configValidation.valid) {
      CLIErrorHandler.displayValidationResult(configValidation, 'config file');
      return;
    }

    const config = await Bun.file(configPath).json();
    const includes = config.pull?.include || ['agent', 'command'];

    // Resolve paths
    const sourcePath = codeflowDir;
    const targetBase = join(resolvedProjectPath, '.opencode');

    CLIErrorHandler.displayProgress(`Pulling to: ${targetBase}`);
    CLIErrorHandler.displayProgress(`Including: ${includes.join(', ')}`);

    let fileCount = 0;

    for (const includeDir of includes) {
      const sourceDir = join(sourcePath, includeDir);

      // Check if source directory exists
      if (!existsSync(sourceDir)) {
        CLIErrorHandler.displayWarning(`Skipping '${includeDir}' - directory not found`, [
          'Check if the directory exists in the codeflow installation',
          'Verify the pull configuration in config.json',
        ]);
        continue;
      }

      // Check if it's a directory
      const stats = await stat(sourceDir);
      if (!stats.isDirectory()) {
        CLIErrorHandler.displayWarning(`Skipping '${includeDir}' - not a directory`, [
          'Check if the path points to a valid directory',
          'Verify the pull configuration in config.json',
        ]);
        continue;
      }

      // Walk through all files in the directory
      for await (const file of walkDir(sourceDir)) {
        const relativePath = relative(sourcePath, file);
        const targetPath = join(targetBase, relativePath);
        const targetDir = join(targetPath, '..');

        // Create target directory if it doesn't exist
        if (!existsSync(targetDir)) {
          await mkdir(targetDir, { recursive: true });
        }

        // Copy file
        await copyFile(file, targetPath);
        console.log(`  ✓ Copied: ${relativePath}`);

        fileCount++;
      }
    }

    // Apply permissions to pulled files
    if (fileCount > 0) {
      try {
        CLIErrorHandler.displayProgress(`Applying OpenCode permissions to ${targetBase}`);
        await applyOpenCodePermissionsToDirectory(targetBase, DEFAULT_OPENCODE_PERMISSIONS);
        CLIErrorHandler.displaySuccess('Applied OpenCode permissions');
      } catch (error: any) {
        CLIErrorHandler.displayWarning(`Failed to apply OpenCode permissions: ${error.message}`, [
          'Check file system permissions',
          'Verify OpenCode security configuration',
          'Files were copied but permissions may not be optimal',
        ]);
      }
    }

    if (fileCount === 0) {
      CLIErrorHandler.displayWarning('No files found to pull', [
        'Check the pull configuration in config.json',
        'Verify the source directories exist',
        'Run with --verbose for more details',
      ]);
    } else {
      CLIErrorHandler.displaySuccess(`Pulled ${fileCount} file${fileCount === 1 ? '' : 's'}`, [
        'Files have been copied to the project',
        'OpenCode permissions have been applied',
        'You can now use the installed agents and commands',
      ]);
    }
  } catch (error) {
    CLIErrorHandler.handleCommonError(error, 'pull');
  }
}

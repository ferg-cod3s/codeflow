import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { sync } from './sync';
import CLIErrorHandler from "./error-handler.js";

export async function startWatch(projectPath?: string) {
  const resolvedPath = projectPath || process.cwd();

  // Validate project path
  const pathValidation = CLIErrorHandler.validatePath(resolvedPath, 'directory');
  if (!pathValidation.valid) {
    CLIErrorHandler.displayValidationResult(pathValidation, 'project directory');
    return;
  }

  CLIErrorHandler.displayProgress(`Starting file watcher for: ${resolvedPath}`);
  console.log('Note: This is a simplified watcher that syncs once');
  console.log('For continuous watching, use external tools like nodemon\n');

  try {
    await sync(resolvedPath);
    CLIErrorHandler.displaySuccess(
      'Initial sync complete',
      [
        'Watcher started - files will be synced when this process runs',
        'Use external tools like nodemon for continuous watching'
      ]
    );
  } catch (error: any) {
    CLIErrorHandler.displayError(
      CLIErrorHandler.createErrorContext(
        'watch',
        'sync_execution',
        'sync_failed',
        'Successful sync operation',
        error.message,
        'Check sync operation and try again',
        {
          requiresUserInput: true,
          suggestions: [
            'Verify project directory exists and is accessible',
            'Check file permissions',
            'Run sync manually to see detailed errors'
          ]
        }
      )
    );
  }
}

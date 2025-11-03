import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { existsSync } from 'node:fs';

/**
 * Get the codeflow root directory (works in both development and compiled environments)
 * This replaces import.meta.dir which is Bun-specific and undefined in compiled binaries
 */
export function getCodeflowRoot(): string {
  // First try environment variable (useful for compiled binaries)
  if (process.env.CODEFLOW_ROOT) {
    return resolve(process.env.CODEFLOW_ROOT);
  }

  let currentModulePath: string;

  try {
    // Try import.meta.url first (ESM)
    currentModulePath = fileURLToPath(import.meta.url);
    console.error(`[DEBUG] import.meta.url: ${import.meta.url}`);
    console.error(`[DEBUG] currentModulePath: ${currentModulePath}`);
  } catch (error) {
    console.error(`[DEBUG] import.meta.url failed: ${error}`);
    // Fallback for CommonJS or other environments
    if (typeof __filename !== 'undefined') {
      currentModulePath = __filename;
      console.error(`[DEBUG] Using __filename: ${currentModulePath}`);
    } else {
      // Last resort: use process.cwd() and look for codeflow indicators
      const cwd = process.cwd();
      console.error(`[DEBUG] Using cwd: ${cwd}`);
      // Check if we're in a codeflow directory
      if (existsSync(join(cwd, 'package.json')) && existsSync(join(cwd, 'base-agents'))) {
        return cwd;
      }
      // Use process.cwd() and go up from src/utils
      currentModulePath = join(cwd, 'src', 'utils', 'path-resolver.ts');
    }
  }

  const currentDir = dirname(currentModulePath);
  const root = join(currentDir, '../..');

  console.error(`[DEBUG] currentDir: ${currentDir}`);
  console.error(`[DEBUG] calculated root: ${root}`);

  // Ensure we get an absolute path
  const resolvedRoot = resolve(root);
  console.error(`[DEBUG] resolvedRoot: ${resolvedRoot}`);

  // Validate that this looks like a codeflow root
  if (existsSync(join(resolvedRoot, 'base-agents')) && existsSync(join(resolvedRoot, 'command'))) {
    console.error(`[DEBUG] Validation passed, returning: ${resolvedRoot}`);
    return resolvedRoot;
  }

  // If validation fails, try current working directory as last resort
  const cwd = process.cwd();
  if (existsSync(join(cwd, 'base-agents')) && existsSync(join(cwd, 'command'))) {
    console.error(`[DEBUG] Using cwd as fallback: ${cwd}`);
    return cwd;
  }

  // Return the calculated root anyway
  console.error(`[DEBUG] Returning calculated root as last resort: ${resolvedRoot}`);
  return resolvedRoot;
}

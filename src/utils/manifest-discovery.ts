import { join, dirname } from 'node:path';
import { existsSync, copyFileSync, statSync } from 'node:fs';
import { copyFile } from 'node:fs/promises';

/**
 * Options for manifest discovery
 */
export interface ManifestDiscoveryOptions {
  /** Starting directory for search (defaults to process.cwd()) */
  cwd?: string;
  /** Whether to check legacy locations (defaults to true) */
  allowLegacy?: boolean;
  /** Maximum directory levels to search upward (defaults to 10) */
  maxDepth?: number;
}

/**
 * Result of manifest discovery
 */
export interface ManifestDiscoveryResult {
  /** Path to the found manifest file */
  path: string;
  /** Whether this is a legacy location */
  isLegacy: boolean;
  /** Directory level where manifest was found (0 = cwd) */
  level: number;
}

/**
 * Finds AGENT_MANIFEST.json by searching upward from the current directory
 * 
 * @param options Configuration options for manifest discovery
 * @returns Promise resolving to manifest discovery result
 * @throws Error if manifest cannot be found
 */
export async function findAgentManifest(
  options: ManifestDiscoveryOptions = {}
): Promise<ManifestDiscoveryResult> {
  const {
    cwd = process.cwd(),
    allowLegacy = true,
    maxDepth = 10
  } = options;

  let currentDir = cwd;
  let level = 0;

  // Search upward through directory tree
  while (level <= maxDepth) {
    // Check for manifest in current directory
    const manifestPath = join(currentDir, 'AGENT_MANIFEST.json');
    if (existsSync(manifestPath)) {
      return {
        path: manifestPath,
        isLegacy: false,
        level
      };
    }

    // Check legacy location if allowed
    if (allowLegacy) {
      const legacyPath = join(currentDir, '.codeflow', 'AGENT_MANIFEST.json');
      if (existsSync(legacyPath)) {
        return {
          path: legacyPath,
          isLegacy: true,
          level
        };
      }
    }

    // Move up one directory level
    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      // Reached root directory
      break;
    }
    currentDir = parentDir;
    level++;
  }

  // Manifest not found
  throw new Error(
    'AGENT_MANIFEST.json not found in current directory or any parent directories.\n' +
    '\nPossible solutions:\n' +
    '1. Run this command from the codeflow repository root\n' +
    '2. Copy AGENT_MANIFEST.json to your project directory\n' +
    '3. Run "codeflow setup" to initialize the project properly\n' +
    '\nFor more help, see: https://github.com/your-repo/codeflow#troubleshooting'
  );
}

/**
 * Options for manifest copying
 */
export interface ManifestCopyOptions {
  /** Whether to overwrite existing destination file */
  overwrite?: boolean;
  /** Whether to preserve file permissions */
  preserveMode?: boolean;
  /** Whether to check if destination is up-to-date before copying */
  checkFreshness?: boolean;
}

/**
 * Copies AGENT_MANIFEST.json from source to destination
 * 
 * @param sourcePath Path to source manifest file
 * @param destPath Path to destination manifest file
 * @param options Configuration options for copying
 * @throws Error if copy operation fails
 */
export async function copyAgentManifest(
  sourcePath: string,
  destPath: string,
  options: ManifestCopyOptions = {}
): Promise<void> {
  const {
    overwrite = true,
    preserveMode = true,
    checkFreshness = true
  } = options;

  // Validate source exists
  if (!existsSync(sourcePath)) {
    throw new Error(`Source manifest not found: ${sourcePath}`);
  }

  // Check if destination exists and handle overwrite logic
  const destExists = existsSync(destPath);
  if (destExists && !overwrite) {
    throw new Error(`Destination manifest already exists: ${destPath}`);
  }

  // Check if destination is up-to-date (if requested)
  if (destExists && checkFreshness && overwrite) {
    try {
      const sourceStats = statSync(sourcePath);
      const destStats = statSync(destPath);
      
      // If source is not newer than destination, skip copying
      if (sourceStats.mtime <= destStats.mtime) {
        console.log(`ℹ️  Manifest at ${destPath} is already up-to-date`);
        return;
      }
    } catch (error) {
      // If we can't check timestamps, proceed with copy
      console.warn(`⚠️  Could not check file freshness: ${error}`);
    }
  }

  try {
    // Perform the copy operation
    if (preserveMode) {
      await copyFile(sourcePath, destPath);
    } else {
      copyFileSync(sourcePath, destPath);
    }
    
    const action = destExists ? 'Updated' : 'Copied';
    console.log(`✅ ${action} AGENT_MANIFEST.json to ${destPath}`);
  } catch (error) {
    throw new Error(`Failed to copy manifest from ${sourcePath} to ${destPath}: ${error}`);
  }
}

/**
 * Discovers and copies AGENT_MANIFEST.json to a target directory
 * 
 * @param targetDir Directory to copy manifest to
 * @param discoveryOptions Options for manifest discovery
 * @param copyOptions Options for manifest copying
 * @returns Promise resolving when copy is complete
 */
export async function discoverAndCopyManifest(
  targetDir: string,
  discoveryOptions: ManifestDiscoveryOptions = {},
  copyOptions: ManifestCopyOptions = {}
): Promise<void> {
  try {
    // Discover the manifest
    const discovery = await findAgentManifest(discoveryOptions);
    
    // Determine destination path
    const destPath = join(targetDir, 'AGENT_MANIFEST.json');
    
    // Copy the manifest
    await copyAgentManifest(discovery.path, destPath, copyOptions);
    
    // Warn about legacy locations
    if (discovery.isLegacy) {
      console.warn(
        `⚠️  Found manifest in legacy location: ${discovery.path}\n` +
        `   Consider moving it to the project root for better compatibility.`
      );
    }
    
  } catch (error) {
    throw new Error(`Failed to discover and copy manifest: ${error}`);
  }
}

/**
 * Checks if a directory has a valid AGENT_MANIFEST.json
 * 
 * @param dir Directory to check
 * @returns True if manifest exists and is readable
 */
export function hasValidManifest(dir: string): boolean {
  try {
    const manifestPath = join(dir, 'AGENT_MANIFEST.json');
    return existsSync(manifestPath);
  } catch {
    return false;
  }
}

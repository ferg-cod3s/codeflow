import { join, dirname, resolve } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";

export interface FileSync {
  path: string;
  status: 'up-to-date' | 'outdated' | 'missing';
}

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

async function getFileHash(path: string): Promise<string> {
  const file = Bun.file(path);
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(await file.arrayBuffer());
  return hasher.digest("hex");
}

export function findAgenticInstallDir(): string {
  // Find where agentic is installed (with agent/command directories)
  // Check multiple possible locations
  const possiblePaths = [
    // Development mode - running from source
    join(import.meta.dir, "../.."),
    // When installed globally via npm/bun
    join(process.execPath, "../../../agentic-cli"),
    join(process.execPath, "../../.."),
    // Check relative to cwd for local development
    process.cwd(),
  ];
  
  for (const path of possiblePaths) {
    // Check if this directory has the agent and command directories
    if (existsSync(join(path, "agent")) && existsSync(join(path, "command"))) {
      return path;
    }
  }
  
  throw new Error("Could not find agentic installation directory with agent/command folders");
}

export async function findOutOfSyncFiles(targetPath: string): Promise<FileSync[]> {
  const sourceDir = findAgenticInstallDir();
  const results: FileSync[] = [];
  
  // Directories to sync
  const dirsToSync = ["agent", "command"];
  
  // Only check files from agentic source against target
  for (const dir of dirsToSync) {
    const sourceDirPath = join(sourceDir, dir);
    if (!existsSync(sourceDirPath)) continue;
    
    const stats = await stat(sourceDirPath);
    if (!stats.isDirectory()) continue;
    
    for await (const sourceFile of walkDir(sourceDirPath)) {
      const relativePath = sourceFile.slice(sourceDir.length + 1);
      const targetFile = join(targetPath, relativePath);
      
      if (!existsSync(targetFile)) {
        results.push({ path: relativePath, status: 'missing' });
      } else {
        // Compare file contents
        const sourceHash = await getFileHash(sourceFile);
        const targetHash = await getFileHash(targetFile);
        
        if (sourceHash === targetHash) {
          results.push({ path: relativePath, status: 'up-to-date' });
        } else {
          results.push({ path: relativePath, status: 'outdated' });
        }
      }
    }
  }
  
  return results;
}

export function resolveProjectPath(providedPath?: string, useGlobal: boolean = false): string {
  const home = homedir();
  
  // If using global flag, return the global config directory
  if (useGlobal) {
    const globalDir = join(home, ".config", "opencode");
    
    // Create the directory if it doesn't exist
    if (!existsSync(globalDir)) {
      mkdirSync(globalDir, { recursive: true });
    }
    
    return globalDir;
  }
  
  if (providedPath) {
    // Path was provided, check if .opencode exists
    const resolvedPath = resolve(providedPath);
    const opencodeDir = join(resolvedPath, ".opencode");
    
    if (!existsSync(opencodeDir)) {
      console.error(`Error: No .opencode directory found at ${opencodeDir}`);
      process.exit(1);
    }
    
    return resolvedPath;
  }
  
  // No path provided, start searching from current directory
  const cwd = process.cwd();
  
  // Ensure we're in a subdirectory of $HOME
  if (!cwd.startsWith(home)) {
    console.error(`Error: Current directory is not within home directory (${home})`);
    console.error("Automatic project detection only works within your home directory");
    process.exit(1);
  }
  
  // Search upward for .opencode directory
  let currentDir = cwd;
  
  while (currentDir !== home && currentDir !== "/") {
    const opencodeDir = join(currentDir, ".opencode");
    
    if (existsSync(opencodeDir)) {
      return currentDir;
    }
    
    currentDir = dirname(currentDir);
  }
  
  // No .opencode found
  console.error("Error: No .opencode directory found in current directory or any parent directories");
  console.error("Please run this command from a project directory or specify a path");
  process.exit(1);
}
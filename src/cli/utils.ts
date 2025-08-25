import { join, dirname, resolve } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";

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
import { join, dirname, resolve } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { readdir, stat, readFile } from "node:fs/promises";
import { homedir } from "node:os";

interface AgenticConfig {
  thoughts: string;
  agents: {
    model: string;
  };
}

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

async function readAgenticConfig(projectPath: string): Promise<AgenticConfig | null> {
  const configPath = join(projectPath, ".opencode", "agentic.json");

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const configContent = await readFile(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch {
    return null;
  }
}

export function resolveAgentModel(cliModel: string | undefined, projectPath: string): Promise<string | undefined> {
  return new Promise(async (resolve) => {
    // 1. CLI parameter has highest priority
    if (cliModel) {
      resolve(cliModel);
      return;
    }

    // 2. Check agentic.json config
    const config = await readAgenticConfig(projectPath);
    if (config?.agents?.model) {
      resolve(config.agents.model);
      return;
    }

    // 3. No model specified
    resolve(undefined);
  });
}

export async function processAgentTemplate(filePath: string, agentModel?: string): Promise<string> {
  const content = await readFile(filePath, 'utf-8');

  // If no agent model specified, return original content
  if (!agentModel) {
    return content;
  }

  // Replace model field in frontmatter
  const modelRegex = /^model:\s*.+$/gm;
  const newModelLine = `model: ${agentModel}`;

  return content.replace(modelRegex, newModelLine);
}

export function findAgenticInstallDir(): string {
  // When using bun link, the binary is in global node_modules/agentic-cli/bin/
  // and the source files are in global node_modules/agentic-cli/
  const binaryDir = dirname(process.execPath);

  // The source files should be in the same directory as the bin folder
  const packageDir = dirname(binaryDir);

  if (existsSync(join(packageDir, "agent")) && existsSync(join(packageDir, "command"))) {
    return packageDir;
  }

  // Fallback: check if we're running from local repo during development
  const localPackageDir = join(dirname(dirname(process.execPath)), "..");
  if (existsSync(join(localPackageDir, "agent")) && existsSync(join(localPackageDir, "command"))) {
    return localPackageDir;
  }

  throw new Error(`Could not find agent/command directories. Binary dir: ${binaryDir}, Package dir: ${packageDir}`);
}

export async function findOutOfSyncFiles(targetPath: string, agentModel?: string, projectPath?: string): Promise<FileSync[]> {
  const sourceDir = findAgenticInstallDir();
  const results: FileSync[] = [];

  // Resolve the project path (parent of .opencode directory)
  const resolvedProjectPath = projectPath || dirname(targetPath);

  // Resolve the agent model with proper priority
  const resolvedModel = await resolveAgentModel(agentModel, resolvedProjectPath);
  
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
        // For agent files, process as templates before comparison
        let sourceContent: string;
        if (relativePath.startsWith('agent/') && relativePath.endsWith('.md')) {
          sourceContent = await processAgentTemplate(sourceFile, resolvedModel);
        } else {
          sourceContent = await readFile(sourceFile, 'utf-8');
        }

        // Get target content
        const targetContent = await readFile(targetFile, 'utf-8');

        // Compare processed content
        if (sourceContent === targetContent) {
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
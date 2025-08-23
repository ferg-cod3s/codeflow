import { readdir, mkdir, copyFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { existsSync } from "node:fs";
import { resolveProjectPath } from "./utils";

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
  // Resolve the project path (will exit if invalid)
  const resolvedProjectPath = resolveProjectPath(projectPath);
  
  // Load config - find the agentic installation directory
  // import.meta.dir gives us the src/cli directory
  const agenticDir = join(import.meta.dir, "../..");
  const configPath = join(agenticDir, "config.json");
  const config = await Bun.file(configPath).json();
  const includes = config.pull?.include || ["agent", "command"];
  
  // Resolve paths
  const sourcePath = agenticDir;
  const targetBase = join(resolvedProjectPath, ".opencode");
  
  console.log(`📦 Pulling to: ${targetBase}`);
  console.log(`📁 Including: ${includes.join(", ")}\n`);
  
  let fileCount = 0;
  
  for (const includeDir of includes) {
    const sourceDir = join(sourcePath, includeDir);
    
    // Check if source directory exists
    if (!existsSync(sourceDir)) {
      console.log(`⚠️  Skipping '${includeDir}' - directory not found`);
      continue;
    }
    
    // Check if it's a directory
    const stats = await stat(sourceDir);
    if (!stats.isDirectory()) {
      console.log(`⚠️  Skipping '${includeDir}' - not a directory`);
      continue;
    }
    
    // Walk through all files in the directory
    for await (const file of walkDir(sourceDir)) {
      const relativePath = relative(sourcePath, file);
      const targetPath = join(targetBase, relativePath);
      const targetDir = join(targetPath, "..");
      
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
  
  if (fileCount === 0) {
    console.log("⚠️  No files found to pull");
  } else {
    console.log(`\n✅ Pulled ${fileCount} file${fileCount === 1 ? "" : "s"}`);
  }
}
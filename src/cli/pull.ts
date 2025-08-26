import { mkdir, copyFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { existsSync } from "node:fs";
import { resolveProjectPath, findOutOfSyncFiles, findAgenticInstallDir } from "./utils";

export async function pull(projectPath: string | undefined, useGlobal: boolean = false) {
  // Resolve the project path (will exit if invalid)
  const resolvedProjectPath = resolveProjectPath(projectPath, useGlobal);
  
  // Determine target directory
  const targetBase = useGlobal 
    ? resolvedProjectPath 
    : join(resolvedProjectPath, ".opencode");
  
  console.log(`📦 Pulling to: ${targetBase}`);
  
  // Find all out-of-sync files
  const syncStatus = await findOutOfSyncFiles(targetBase);
  const sourceDir = findAgenticInstallDir();
  
  // Filter files that need action (only missing or outdated)
  const filesToCopy = syncStatus.filter(f => f.status === 'missing' || f.status === 'outdated');
  
  if (filesToCopy.length === 0) {
    console.log("\n✨ All files are already up-to-date!");
    return;
  }
  
  console.log(`\n📁 Found ${filesToCopy.length} file(s) to update\n`);
  
  // Copy missing or outdated files
  for (const file of filesToCopy) {
    const sourceFile = join(sourceDir, file.path);
    const targetFile = join(targetBase, file.path);
    const targetDir = dirname(targetFile);
    
    // Create directory if it doesn't exist
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }
    
    // Copy the file
    await copyFile(sourceFile, targetFile);
    const action = file.status === 'missing' ? 'Added' : 'Updated';
    console.log(`  ✓ ${action}: ${file.path}`);
  }
  
  console.log(`\n✅ Updated ${filesToCopy.length} file${filesToCopy.length === 1 ? "" : "s"}`);
}
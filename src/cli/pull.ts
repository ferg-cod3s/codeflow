import { mkdir, copyFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { existsSync } from "node:fs";
import { resolveProjectPath, findOutOfSyncFiles, findAgenticInstallDir, processAgentTemplate, resolveAgentModel } from "./utils";

export async function pull(projectPath: string | undefined, useGlobal: boolean = false, agentModel?: string) {
  // Resolve the project path (will exit if invalid)
  const resolvedProjectPath = resolveProjectPath(projectPath, useGlobal);
  
  // Determine target directory
  const targetBase = useGlobal 
    ? resolvedProjectPath 
    : join(resolvedProjectPath, ".opencode");
  
  console.log(`📦 Pulling to: ${targetBase}`);

  // Resolve the agent model with proper priority
  const resolvedModel = await resolveAgentModel(agentModel, resolvedProjectPath);

  // Find all out-of-sync files
  const syncStatus = await findOutOfSyncFiles(targetBase, agentModel, resolvedProjectPath);
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

    // Process agent files as templates
    if (file.path.startsWith('agent/') && file.path.endsWith('.md')) {
      const processedContent = await processAgentTemplate(sourceFile, resolvedModel);
      await writeFile(targetFile, processedContent, 'utf-8');
    } else {
      // Copy non-agent files normally
      await copyFile(sourceFile, targetFile);
    }

    const action = file.status === 'missing' ? 'Added' : 'Updated';
    console.log(`  ✓ ${action}: ${file.path}`);
  }
  
  console.log(`\n✅ Updated ${filesToCopy.length} file${filesToCopy.length === 1 ? "" : "s"}`);
}
import { readdir, stat } from "node:fs/promises";
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

async function getFileHash(path: string): Promise<string> {
  const file = Bun.file(path);
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(await file.arrayBuffer());
  return hasher.digest("hex");
}

export async function status(projectPath: string | undefined) {
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
  
  console.log(`📊 Status for: ${targetBase}`);
  console.log(`📁 Checking: ${includes.join(", ")}\n`);
  
  let upToDateCount = 0;
  let outdatedCount = 0;
  let missingCount = 0;
  
  for (const includeDir of includes) {
    const sourceDir = join(sourcePath, includeDir);
    
    // Check if source directory exists
    if (!existsSync(sourceDir)) {
      continue;
    }
    
    // Check if it's a directory
    const stats = await stat(sourceDir);
    if (!stats.isDirectory()) {
      continue;
    }
    
    // Walk through all files in the source directory
    for await (const sourceFile of walkDir(sourceDir)) {
      const relativePath = relative(sourcePath, sourceFile);
      const targetFile = join(targetBase, relativePath);
      
      if (!existsSync(targetFile)) {
        console.log(`❌ ${relativePath} (missing in project)`);
        missingCount++;
      } else {
        // Compare file contents using hash
        const sourceHash = await getFileHash(sourceFile);
        const targetHash = await getFileHash(targetFile);
        
        if (sourceHash === targetHash) {
          console.log(`✅ ${relativePath}`);
          upToDateCount++;
        } else {
          console.log(`❌ ${relativePath} (outdated)`);
          outdatedCount++;
        }
      }
    }
  }
  
  // Check for extra files in target that don't exist in source
  for (const includeDir of includes) {
    const targetDir = join(targetBase, includeDir);
    
    if (!existsSync(targetDir)) {
      continue;
    }
    
    const stats = await stat(targetDir);
    if (!stats.isDirectory()) {
      continue;
    }
    
    for await (const targetFile of walkDir(targetDir)) {
      const relativePath = relative(targetBase, targetFile);
      const sourceFile = join(sourcePath, relativePath);
      
      if (!existsSync(sourceFile)) {
        console.log(`❌ ${relativePath} (extra file in project)`);
        outdatedCount++;
      }
    }
  }
  
  // Summary
  console.log("\n📋 Summary:");
  console.log(`  ✅ Up-to-date: ${upToDateCount}`);
  console.log(`  ❌ Outdated: ${outdatedCount}`);
  console.log(`  ❌ Missing: ${missingCount}`);
  
  const totalIssues = outdatedCount + missingCount;
  if (totalIssues === 0) {
    console.log("\n✨ All files are up-to-date!");
  } else {
    console.log(`\n⚠️  ${totalIssues} file${totalIssues === 1 ? "" : "s"} need${totalIssues === 1 ? "s" : ""} attention`);
    console.log("Run 'agentic pull' to update the project");
  }
}
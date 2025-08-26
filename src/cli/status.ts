import { join } from "node:path";
import { resolveProjectPath, findOutOfSyncFiles } from "./utils";

export async function status(projectPath: string | undefined, useGlobal: boolean = false) {
  // Resolve the project path (will exit if invalid)
  const resolvedProjectPath = resolveProjectPath(projectPath, useGlobal);
  
  // Determine target directory
  const targetBase = useGlobal 
    ? resolvedProjectPath 
    : join(resolvedProjectPath, ".opencode");
  
  console.log(`📊 Status for: ${targetBase}\n`);
  
  // Find all files and their sync status
  const syncStatus = await findOutOfSyncFiles(targetBase);
  
  // Count by status
  const upToDateCount = syncStatus.filter(f => f.status === 'up-to-date').length;
  const outdatedCount = syncStatus.filter(f => f.status === 'outdated').length;
  const missingCount = syncStatus.filter(f => f.status === 'missing').length;
  
  // Display files by status
  for (const file of syncStatus) {
    if (file.status === 'up-to-date') {
      console.log(`✅ ${file.path}`);
    } else if (file.status === 'outdated') {
      console.log(`⚠️  ${file.path} (outdated)`);
    } else if (file.status === 'missing') {
      console.log(`❌ ${file.path} (missing)`);
    }
  }
  
  // Summary
  console.log("\n📋 Summary:");
  console.log(`  ✅ Up-to-date: ${upToDateCount}`);
  console.log(`  ⚠️  Outdated: ${outdatedCount}`);
  console.log(`  ❌ Missing: ${missingCount}`);
  
  const totalIssues = outdatedCount + missingCount;
  if (totalIssues === 0) {
    console.log("\n✨ All agentic files are up-to-date!");
  } else {
    console.log(`\n⚠️  ${totalIssues} file${totalIssues === 1 ? "" : "s"} need${totalIssues === 1 ? "s" : ""} updating`);
    console.log("Run 'agentic pull' to sync the files");
  }
}
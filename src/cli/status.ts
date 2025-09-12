import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

export async function status(projectPath?: string) {
  const resolvedPath = projectPath || process.cwd();

  if (!existsSync(resolvedPath)) {
    console.error(`❌ Directory does not exist: ${resolvedPath}`);
    process.exit(1);
  }

  const codeflowDir = join(import.meta.dir, '../..');
  const targetBase = join(resolvedPath, '.opencode');

  console.log(`📊 Status for: ${resolvedPath}`);
  console.log(`📁 Checking: commands, agents\n`);

  let upToDateCount = 0;
  let outdatedCount = 0;
  let missingCount = 0;

  // Check commands
  const sourceCommandDir = join(codeflowDir, 'command');
  const targetCommandDir = join(targetBase, 'command');

  if (existsSync(sourceCommandDir)) {
    const sourceFiles = await readdir(sourceCommandDir);
    const mdFiles = sourceFiles.filter((f) => f.endsWith('.md'));

    for (const file of mdFiles) {
      const targetFile = join(targetCommandDir, file);

      if (!existsSync(targetFile)) {
        console.log(`❌ command/${file} (missing in project)`);
        missingCount++;
      } else {
        console.log(`✅ command/${file}`);
        upToDateCount++;
      }
    }
  }

  // Check agents
  const sourceAgentDir = join(codeflowDir, 'codeflow-agents');
  const targetAgentDir = join(targetBase, 'agent');

  if (existsSync(sourceAgentDir)) {
    const sourceFiles = await readdir(sourceAgentDir);
    const mdFiles = sourceFiles.filter((f) => f.endsWith('.md'));

    for (const file of mdFiles) {
      const targetFile = join(targetAgentDir, file);

      if (!existsSync(targetFile)) {
        console.log(`❌ agent/${file} (missing in project)`);
        missingCount++;
      } else {
        console.log(`✅ agent/${file}`);
        upToDateCount++;
      }
    }
  }

  // Summary
  console.log('\n📋 Summary:');
  console.log(`  ✅ Up-to-date: ${upToDateCount}`);
  console.log(`  ❌ Missing: ${missingCount}`);

  const totalIssues = outdatedCount + missingCount;
  if (totalIssues === 0) {
    console.log('\n✨ All files are up-to-date!');
  } else {
    console.log(
      `\n⚠️  ${totalIssues} file${totalIssues === 1 ? '' : 's'} need${totalIssues === 1 ? 's' : ''} attention`
    );
    console.log("Run 'codeflow sync' to update the project");
  }
}

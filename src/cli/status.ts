import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import CLIErrorHandler from './error-handler.js';
import { getCodeflowRoot } from '../utils/path-resolver.js';

export async function status(projectPath?: string) {
  const resolvedPath = projectPath || process.cwd();

  // Validate project path
  const pathValidation = CLIErrorHandler.validatePath(resolvedPath, 'directory');
  if (!pathValidation.valid) {
    CLIErrorHandler.displayValidationResult(pathValidation, 'project directory');
    return;
  }

  const codeflowDir = getCodeflowRoot();
  const targetBase = join(resolvedPath, '.opencode');

  CLIErrorHandler.displayProgress(`Checking status for: ${resolvedPath}`);
  CLIErrorHandler.displayProgress(`Checking: commands, agents`);

  try {
    let upToDateCount = 0;
    let outdatedCount = 0;
    let missingCount = 0;

    // Check commands in all possible locations
    const sourceCommandDir = join(codeflowDir, 'command');

    if (existsSync(sourceCommandDir)) {
      const sourceFiles = await readdir(sourceCommandDir);
      const mdFiles = sourceFiles.filter((f) => f.endsWith('.md'));

      for (const file of mdFiles) {
        // Check multiple possible command locations
        const possibleLocations = [
          join(targetBase, 'command'), // .opencode/command
          join(resolvedPath, '.claude', 'commands'), // .claude/commands
          join(resolvedPath, '.cursor', 'mcp.json'), // Cursor MCP (commands in config)
        ];

        const foundInProject = possibleLocations.some((location) => {
          if (location.includes('mcp.json')) {
            // Special handling for Cursor MCP config
            return existsSync(location);
          }
          return existsSync(join(location, file));
        });

        if (!foundInProject) {
          console.log(`❌ command/${file} (missing in project)`);
          missingCount++;
        } else {
          console.log(`✅ command/${file}`);
          upToDateCount++;
        }
      }
    }

    // Check agents
    const sourceAgentDir = join(codeflowDir, 'base-agents');
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
      CLIErrorHandler.displaySuccess('All files are up-to-date!', [
        'Your project is fully synchronized with codeflow',
        'No action needed',
      ]);
    } else {
      CLIErrorHandler.displayWarning(
        `${totalIssues} file${totalIssues === 1 ? '' : 's'} need${totalIssues === 1 ? 's' : ''} attention`,
        [
          "Run 'codeflow sync' to update the project",
          "Run 'codeflow pull' to install missing files",
        ]
      );
    }
  } catch (error) {
    CLIErrorHandler.handleCommonError(error, 'status');
  }
}

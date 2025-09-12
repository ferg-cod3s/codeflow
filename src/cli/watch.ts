import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { sync } from './sync';

export async function startWatch(projectPath?: string) {
  const resolvedPath = projectPath || process.cwd();

  if (!existsSync(resolvedPath)) {
    console.error(`❌ Directory does not exist: ${resolvedPath}`);
    process.exit(1);
  }

  console.log(`👀 Starting file watcher for: ${resolvedPath}`);
  console.log('Note: This is a simplified watcher that syncs once');
  console.log('For continuous watching, use external tools like nodemon\n');

  try {
    await sync(resolvedPath);
    console.log('\n✅ Initial sync complete');
    console.log('Watcher started - files will be synced when this process runs');
  } catch (error: any) {
    console.error(`❌ Failed to start watcher: ${error.message}`);
    process.exit(1);
  }
}

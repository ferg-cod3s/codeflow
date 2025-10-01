import { execSync } from 'node:child_process';
import packageJson from '../../package.json';

interface UpdateOptions {
  check?: boolean;
  force?: boolean;
  verbose?: boolean;
}

/**
 * Check if a newer version is available
 */
async function checkForUpdates(): Promise<{
  hasUpdate: boolean;
  latestVersion?: string;
  currentVersion: string;
}> {
  const currentVersion = packageJson.version;

  try {
    // Try to get latest version from npm registry
    const registryInfo = execSync('npm view codeflow version', { encoding: 'utf8' }).trim();
    const latestVersion = registryInfo;

    const hasUpdate = latestVersion !== currentVersion;
    return { hasUpdate, latestVersion, currentVersion };
  } catch (error) {
    // Fallback: try to check git tags if available
    try {
      const gitTags = execSync('git tag --sort=-version:refname | head -1', {
        encoding: 'utf8',
      }).trim();
      const latestVersion = gitTags;

      const hasUpdate = latestVersion !== currentVersion && latestVersion !== '';
      return { hasUpdate, latestVersion, currentVersion };
    } catch (gitError) {
      console.warn('Could not check for updates from git or npm');
      return { hasUpdate: false, currentVersion };
    }
  }
}

/**
 * Update the CLI to the latest version
 */
async function performUpdate(options: UpdateOptions): Promise<void> {
  const { force = false, verbose = false } = options;

  console.log('🔄 Updating Codeflow CLI...');

  try {
    if (verbose) {
      console.log('Running: npm install -g codeflow');
    }

    // Update globally
    execSync('npm install -g codeflow', {
      stdio: verbose ? 'inherit' : 'pipe',
    });

    console.log('✅ Codeflow CLI updated successfully!');
    console.log('💡 You may need to restart your terminal for changes to take effect.');
  } catch (error) {
    console.error(
      `❌ Failed to update Codeflow CLI: ${error instanceof Error ? error.message : 'Unknown error'}`
    );

    if (!force) {
      console.error('💡 Try running with --force if you encounter permission issues');
      process.exit(1);
    }
  }
}

/**
 * Main update function
 */
export async function update(options: UpdateOptions = {}): Promise<void> {
  const { check = false, force = false, verbose = false } = options;

  if (check) {
    console.log('🔍 Checking for Codeflow CLI updates...');

    const updateInfo = await checkForUpdates();
    console.log(`📦 Current version: ${updateInfo.currentVersion}`);

    if (updateInfo.hasUpdate && updateInfo.latestVersion) {
      console.log(`🚀 Update available: ${updateInfo.latestVersion}`);
      console.log('💡 Run "codeflow update" to install the latest version');
      return;
    } else {
      console.log('✅ Codeflow CLI is up to date');
      return;
    }
  }

  // Perform update
  const updateInfo = await checkForUpdates();

  if (updateInfo.hasUpdate && updateInfo.latestVersion) {
    console.log(`📦 Current version: ${updateInfo.currentVersion}`);
    console.log(`🚀 Latest version: ${updateInfo.latestVersion}`);
    console.log('🔄 Updating...');

    await performUpdate({ force, verbose });
  } else {
    console.log('✅ Codeflow CLI is already up to date');
  }
}

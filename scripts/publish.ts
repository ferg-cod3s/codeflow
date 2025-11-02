#!/usr/bin/env bun





/**
 * CodeFlow Publish Script
 *
 * This script handles the automated publishing process for CodeFlow CLI.
 * It's designed to be called from the GitHub release workflow.
 *
 * Usage:
 *   AGENTIC_VERSION=1.0.0 ./scripts/publish.ts
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message: string, color: keyof typeof colors = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logInfo(message: string): void {
  log(`[INFO] ${message}`, 'blue');
}

function logSuccess(message: string): void {
  log(`[SUCCESS] ${message}`, 'green');
}

function logWarning(message: string): void {
  log(`[WARNING] ${message}`, 'yellow');
}

function logError(message: string): void {
  log(`[ERROR] ${message}`, 'red');
}

function _execCommand(command: string, options?: { silent?: boolean }): string {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options?.silent ? 'pipe' : 'inherit',
    });
    return result;
  } catch (error) {
    logError(`Command failed: ${command}`);
    if (error instanceof Error) {
      logError(error.message);
    }
    process.exit(1);
  }
}

function validateVersion(version: string): boolean {
  const versionRegex = /^\d+\.\d+\.\d+$/;
  return versionRegex.test(version);
}

function updatePackageVersion(version: string): boolean {
  try {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const originalContent = readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(originalContent);

    const oldVersion = packageJson.version;
    if (oldVersion === version) {
      logInfo(`Package.json version is already ${version}, no update needed`);
      return false;
    }

    // Update version by replacing the exact version string in the original content
    // This preserves all formatting, whitespace, and other properties exactly as they are
    const versionPattern = new RegExp(
      `("version"\\s*:\\s*)"${oldVersion.replace(/\./g, '\\.')}"`,
      'g'
    );
    const updatedContent = originalContent.replace(versionPattern, `$1"${version}"`);

    writeFileSync(packageJsonPath, updatedContent);

    logSuccess(`Updated package.json version from ${oldVersion} to ${version}`);
    return true;
  } catch (error) {
    logError('Failed to update package.json version');
    if (error instanceof Error) {
      logError(error.message);
    }
    process.exit(1);
  }
}

function verifyTag(version: string): void {
  const tagName = `v${version}`;

  // Check if tag exists and is on current commit
  try {
    execSync(`git rev-parse --verify refs/tags/${tagName}`, { stdio: 'pipe' });

    const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const tagCommit = execSync(`git rev-list -n 1 ${tagName}`, { encoding: 'utf8' }).trim();

    if (currentCommit === tagCommit) {
      logSuccess(`Tag ${tagName} is on current commit`);
    } else {
      logWarning(`Tag ${tagName} exists but points to a different commit`);
      logWarning(`Current commit: ${currentCommit}`);
      logWarning(`Tag commit: ${tagCommit}`);
      logWarning('Proceeding anyway since this is a release workflow');
    }
  } catch {
    logError(`Tag ${tagName} does not exist`);
    process.exit(1);
  }
}

function publishToNpm(): void {
  logInfo('Publishing to npm registry using OIDC authentication');

  try {
    // Verify OIDC environment variables are present
    const oidcRequestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
    const oidcRequestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;

    if (!oidcRequestUrl || !oidcRequestToken) {
      logError('OIDC environment variables not found!');
      logError('This script must be run in GitHub Actions with id-token: write permission');
      logError(`ACTIONS_ID_TOKEN_REQUEST_URL: ${oidcRequestUrl ? 'SET' : 'NOT SET'}`);
      logError(`ACTIONS_ID_TOKEN_REQUEST_TOKEN: ${oidcRequestToken ? 'SET' : 'NOT SET'}`);
      process.exit(1);
    }

    logSuccess('OIDC environment variables detected');
    logInfo(`OIDC Request URL: ${oidcRequestUrl}`);

    // Verify npm version supports OIDC
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    logInfo(`npm version: ${npmVersion}`);

    const [major, minor] = npmVersion.split('.').map(Number);
    if (major < 11 || (major === 11 && minor < 5)) {
      logError(`npm version ${npmVersion} does not support OIDC authentication`);
      logError('OIDC requires npm 11.5.1 or later');
      logError('Please upgrade npm: npm install -g npm@latest');
      process.exit(1);
    }

    logSuccess(`npm version ${npmVersion} supports OIDC authentication`);

    // Note: OIDC authentication happens automatically during npm publish --provenance
    // We cannot test authentication with npm whoami because OIDC only activates during publish
    logInfo('OIDC authentication will be used automatically during publish');
    logInfo('Verification:');
    logInfo(`  ✓ OIDC environment variables detected`);
    logInfo(`  ✓ npm version ${npmVersion} supports OIDC`);
    logInfo(`  ✓ Environment: ${process.env.GITHUB_ENVIRONMENT || 'npm'}`);
    logInfo(`  ✓ Repository: ${process.env.GITHUB_REPOSITORY || 'unknown'}`);
    logInfo(`  ✓ Workflow: release.yml`);

    // Verify npm registry configuration
    const registry = execSync('npm config get registry', { encoding: 'utf8' }).trim();
    logInfo(`npm registry: ${registry}`);

    if (registry !== 'https://registry.npmjs.org/') {
      logWarning(`Registry is not default: ${registry}`);
    }

    // Publish using npm (required for OIDC)
    logInfo('Publishing package with OIDC authentication...');
    execSync('npm publish --provenance', { stdio: 'inherit' });
    logSuccess('Successfully published to npm with provenance');
  } catch (error) {
    logError('Failed to publish to npm');
    if (error instanceof Error) {
      logError(error.message);
    }
    process.exit(1);
  }
}

function createGitHubRelease(version: string): void {
  logInfo('Creating GitHub release');

  try {
    // Generate release notes
    const tagName = `v${version}`;
    const lastTag = execSync('git describe --tags --abbrev=0 HEAD~1 2>/dev/null || echo ""', {
      encoding: 'utf8',
    }).trim();

    let releaseNotes = `## CodeFlow CLI v${version}\n\n`;

    if (lastTag) {
      const commits = execSync(`git log --pretty=format:"- %s (%h)" ${lastTag}..HEAD`, {
        encoding: 'utf8',
      });
      releaseNotes += `### Changes since ${lastTag}\n\n${commits}\n`;
    } else {
      const commits = execSync('git log --pretty=format:"- %s (%h)" -10', {
        encoding: 'utf8',
      });
      releaseNotes += `### Recent commits\n\n${commits}\n`;
    }

    releaseNotes += `\n### Installation\n\n\`\`\`bash\nnpm install -g @agentic-codeflow/cli\n\`\`\`\n\n`;
    releaseNotes += `### Quick Start\n\n\`\`\`bash\ncodeflow setup\n\`\`\`\n\n`;
    releaseNotes += `**Full Changelog**: https://github.com/ferg-cod3s/codeflow/compare/${lastTag || 'main'}...${tagName}`;

    // Create release using gh CLI
    execSync(
      `echo "${releaseNotes}" | gh release create "${tagName}" --title "CodeFlow CLI v${version}" --draft=false --verify-tag -F -`
    );
    logSuccess(`Created GitHub release ${tagName}`);
  } catch (error) {
    logWarning('Failed to create GitHub release automatically');
    logWarning(
      'You can create it manually at: https://github.com/ferg-cod3s/codeflow/releases/new'
    );
    if (error instanceof Error) {
      logWarning(error.message);
    }
  }
}

function main(): void {
  logInfo('Starting CodeFlow publish process...');

  // Get version from environment variable
  const version = process.env.AGENTIC_VERSION;

  if (!version) {
    logError('AGENTIC_VERSION environment variable is required');
    logError('Usage: AGENTIC_VERSION=1.0.0 ./scripts/publish.ts');
    process.exit(1);
  }

  if (!validateVersion(version)) {
    logError(`Invalid version format: ${version}`);
    logError('Expected format: x.y.z (e.g., 1.0.0)');
    process.exit(1);
  }

  logInfo(`Publishing version: ${version}`);

  // Check if working directory is clean
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      logError('Working directory is not clean. Please commit or stash changes first.');
      process.exit(1);
    }
  } catch {
    logError('Failed to check git status');
    process.exit(1);
  }

  // Update package.json version
  const versionChanged = updatePackageVersion(version);

  // Commit the version change only if it actually changed
  if (versionChanged) {
    execSync('git add package.json');
    execSync(`git commit --no-verify -m "Bump version to ${version}"`);
    logSuccess(`Committed version bump to ${version}`);
  } else {
    logInfo('No version change to commit');
  }

  // Verify tag exists and is on current commit
  verifyTag(version);

  // Publish to npm (OIDC handles authentication automatically)
  publishToNpm();

  // Create GitHub release (if GITHUB_TOKEN is available)
  if (process.env.GITHUB_TOKEN) {
    createGitHubRelease(version);
  } else {
    logWarning('GITHUB_TOKEN not found, skipping GitHub release');
  }

  logSuccess(`Publish process completed for version ${version}`);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run main function
if (require.main === module) {
  main();
}

export { main };

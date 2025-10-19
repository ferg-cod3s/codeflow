#!/usr/bin/env node

/**
 * Update CHANGELOG.md with latest commit information
 * This script is designed to run as a pre-commit hook
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

function getLatestCommit() {
  try {
    const hash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const message = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
    const author = execSync('git log -1 --pretty=%an', { encoding: 'utf8' }).trim();
    const date = new Date().toISOString().split('T')[0];

    return { hash, message, author, date };
  } catch (error) {
    console.error('Error getting git commit info:', error.message);
    process.exit(1);
  }
}

function parseCommitMessage(message) {
  const lines = message.split('\n');
  const firstLine = lines[0];

  // Parse conventional commit format
  const match = firstLine.match(/^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?\s*:\s*(.+)/);

  if (match) {
    const [, type, scope, description] = match;
    return {
      type,
      scope: scope ? scope.slice(1, -1) : null, // Remove parentheses
      description,
      category: categorizeCommit(type),
    };
  }

  // Fallback for non-conventional commits
  return {
    type: 'chore',
    scope: null,
    description: firstLine,
    category: 'Other',
  };
}

function categorizeCommit(type) {
  const categories = {
    feat: 'Features',
    fix: 'Bug Fixes',
    docs: 'Documentation',
    style: 'Style',
    refactor: 'Code Refactoring',
    test: 'Tests',
    chore: 'Other',
  };

  return categories[type] || 'Other';
}

function updateChangelog() {
  try {
    const commit = getLatestCommit();
    const parsed = parseCommitMessage(commit.message);

    // Read current changelog
    const changelogPath = './CHANGELOG.md';
    let changelog = readFileSync(changelogPath, 'utf8');

    // Check if this commit is already in the changelog
    if (changelog.includes(commit.hash)) {
      console.log('✅ Commit already documented in CHANGELOG.md');
      return;
    }

    // Get current version (assuming format: # [0.14.0]...)
    const versionMatch = changelog.match(/^# \[(\d+\.\d+\.\d+)\]/m);
    const currentVersion = versionMatch ? versionMatch[1] : '0.14.0';

    // Prepare new entry
    const newEntry = `* ${parsed.description} ([${commit.hash}](https://github.com/ferg-cod3s/codeflow/commit/${commit.hash}))`;

    // Find the current version section and add the entry
    const versionSectionRegex = new RegExp(`(# \\[${currentVersion}\\].*?\\n\\n)(# \\[)`, 's');

    if (versionSectionRegex.test(changelog)) {
      // Add to existing version section
      changelog = changelog.replace(versionSectionRegex, (match, versionHeader, nextVersion) => {
        // Check if category exists in this version
        const categoryRegex = new RegExp(`### ${parsed.category}\\s*\\n`);
        if (categoryRegex.test(versionHeader)) {
          // Add to existing category
          return (
            versionHeader.replace(
              new RegExp(`(### ${parsed.category}\\s*\\n)`),
              `$1${newEntry}\n`
            ) + nextVersion
          );
        } else {
          // Create new category
          return (
            versionHeader.replace(/(### [^\n]+\n)/, `$1\n### ${parsed.category}\n${newEntry}\n`) +
            nextVersion
          );
        }
      });
    } else {
      // If no current version section found, add at the beginning
      changelog = `# [${currentVersion}](https://github.com/ferg-cod3s/codeflow/compare/v${currentVersion}...v${currentVersion}) (${commit.date})

### ${parsed.category}

${newEntry}


${changelog}`;
    }

    // Write updated changelog
    writeFileSync(changelogPath, changelog);

    // Stage the updated changelog
    execSync('git add CHANGELOG.md', { stdio: 'inherit' });

    console.log('✅ CHANGELOG.md updated successfully');
  } catch (error) {
    console.error('Error updating CHANGELOG.md:', error.message);
    process.exit(1);
  }
}

// Run the update
updateChangelog();

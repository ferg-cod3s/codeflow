#!/usr/bin/env node

/**
 * Validate agent frontmatter model fields against an allowlist.
 * - Loads allowlist from config/opencode-models.json if present
 * - Treats omitted model as valid (allows higher-level defaults)
 * - Only validates source-of-truth files (not generated artifacts)
 * - When a model value is present:
 *   - If allowlist exists: error if model not in allowlist
 *   - If allowlist missing: warn only (non-blocking)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadAllowlist() {
  try {
    const allowlistPath = path.join(process.cwd(), 'config', 'opencode-models.json');
    if (!fs.existsSync(allowlistPath)) return null;

    const raw = fs.readFileSync(allowlistPath, 'utf8');
    const parsed = JSON.parse(raw);

    let models;
    if (Array.isArray(parsed)) {
      models = parsed;
    } else if (parsed && Array.isArray(parsed.models)) {
      models = parsed.models;
    }

    if (!models) {
      console.warn('config/opencode-models.json present but not an array or {"models": []}. Ignoring allowlist.');
      return null;
    }

    // Normalize model names
    const normalized = models
      .filter((m) => typeof m === 'string')
      .map((m) => m.trim().replace(/^['"]|['"]$/g, ''))
      .filter((m) => m);

    return new Set(normalized);
  } catch (err) {
    console.warn('Failed to load config/opencode-models.json. Proceeding without enforcement.', err?.message || err);
    return null;
  }
}

function findAgentFiles(dir) {
  const files = [];

  function scan(directory) {
    const items = fs.readdirSync(directory);

    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scan(fullPath);
      } else if (item.endsWith('.md') && (item.includes('agent') || directory.includes('agent'))) {
        files.push(fullPath);
      }
    }
  }

  scan(dir);
  return files;
}

function extractModelValue(line) {
  // Handles: model: value OR model: "value" OR model: 'value'
  const raw = line.split(':').slice(1).join(':').trim();
  if (!raw) return undefined; // omitted value
  return raw.replace(/^['"]|['"]$/g, '');
}

function validateAgentFile(filePath, { allowlist }) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.startsWith('model:')) continue;

      const model = extractModelValue(line);

      // Omitted model is considered valid
      if (!model) continue;

      if (allowlist) {
        if (!allowlist.has(model)) {
          console.error(`❌ MODEL NOT IN ALLOWLIST at ${filePath}:${i + 1}`);
          console.error(`   Found: ${model}`);
          console.error('   Allowed models are defined in config/opencode-models.json');
          return false;
        }
      } else {
        console.warn(`⚠️  No allowlist found (config/opencode-models.json). Cannot validate model at ${filePath}:${i + 1}`);
        console.warn(`   Found: ${model}`);
      }
    }

    return true;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔍 Validating agent model configurations...\n');

  // Only validate source-of-truth directories, not generated artifacts
  const directories = [
    './codeflow-agents',
    './command',
  ];

  const allowlist = loadAllowlist();
  if (!allowlist) {
    console.log('ℹ️  No allowlist found at config/opencode-models.json. Models will not be strictly enforced.');
  }

  let totalFiles = 0;
  let validFiles = 0;
  let invalidFiles = 0;

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.log(`📁 Directory not found: ${dir}`);
      continue;
    }

    console.log(`📂 Scanning: ${dir}`);
    const files = findAgentFiles(dir);
    totalFiles += files.length;

    for (const file of files) {
      if (validateAgentFile(file, { allowlist })) {
        validFiles++;
      } else {
        invalidFiles++;
      }
    }
  }

  console.log('\n📊 Validation Summary:');
  console.log(`   Total files checked: ${totalFiles}`);
  console.log(`   Valid files: ${validFiles}`);
  console.log(`   Invalid files: ${invalidFiles}`);
  console.log('   (Generated artifacts in .opencode/ and .claude/ are not validated)');

  if (invalidFiles > 0) {
    console.log('\n❌ Validation failed! Fix the invalid model references above.');
    process.exit(1);
  } else {
    console.log('\n✅ All agent models are valid!');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateAgentFile, findAgentFiles };

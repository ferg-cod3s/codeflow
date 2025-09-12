import { convert } from './src/cli/convert.ts';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const codeflowDir = process.cwd();

console.log('🔄 Setting up canonical agent directories...\n');

// Convert from base format to canonical formats
const conversions = [
  {
    source: join(codeflowDir, 'codeflow-agents'),
    target: join(codeflowDir, 'claude-agents'),
    format: 'claude-code',
  },
  {
    source: join(codeflowDir, 'codeflow-agents'),
    target: join(codeflowDir, 'opencode-agents'),
    format: 'opencode',
  },
];

for (const conversion of conversions) {
  if (existsSync(conversion.source)) {
    console.log(`Converting ${conversion.source} → ${conversion.target} (${conversion.format})`);
    try {
      await convert({
        source: conversion.source,
        target: conversion.target,
        format: conversion.format,
        validate: true,
        dryRun: false,
      });
      console.log('✅ Conversion completed\n');
    } catch (error) {
      console.error(`❌ Conversion failed: ${error.message}\n`);
    }
  } else {
    console.log(`⚠️  Source directory does not exist: ${conversion.source}\n`);
  }
}

console.log('🎉 Canonical agent setup complete!');

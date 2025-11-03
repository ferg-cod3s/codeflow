#!/usr/bin/env node

import { setup } from './src/cli/setup.js';
import { join } from 'node:path';

async function testSetup() {
  try {
    const testDir = join(process.cwd(), 'test-setup-target');
    console.log(`Testing setup in: ${testDir}`);

    await setup(testDir, {
      type: 'claude-code',
      force: true,
      global: false,
    });

    console.log('✅ Setup test completed successfully');
  } catch (error) {
    console.error('❌ Setup test failed:', error);
    process.exit(1);
  }
}

testSetup();

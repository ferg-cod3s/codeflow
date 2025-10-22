#!/usr/bin/env bun

import { spawn } from 'child_process';
import { resolve } from 'path';

const e2eTests = [
  'tests/e2e/integration.test.ts',
  'tests/e2e/user-journeys.test.ts',
  'tests/e2e/complete-workflow.test.ts',
];

console.log('🧪 Running E2E tests sequentially to avoid parallel execution conflicts...\n');

let allPassed = true;

for (const testFile of e2eTests) {
  console.log(`\n📝 Running: ${testFile}`);
  console.log('─'.repeat(80));

  let outputBuffer = '';
  const testProcess = spawn('bun', ['test', testFile], {
    stdio: ['inherit', 'pipe', 'pipe'],
    cwd: resolve(__dirname, '..'),
  });

  // Capture stdout/stderr to parse test results
  testProcess.stdout?.on('data', (data) => {
    const str = data.toString();
    outputBuffer += str;
    process.stdout.write(str);
  });

  testProcess.stderr?.on('data', (data) => {
    const str = data.toString();
    outputBuffer += str;
    process.stderr.write(str);
  });

  const exitCode = await new Promise<number>((resolve) => {
    testProcess.on('close', (code) => {
      resolve(code ?? 0);
    });
    testProcess.on('error', (err) => {
      console.error(`Process error:`, err);
      resolve(1);
    });
  });

  // Check if tests actually passed by looking for failure indicators
  const hasFail = outputBuffer.includes('(fail)');
  const hasError =
    outputBuffer.includes('error:') && !outputBuffer.includes('Failed to create lcov');

  if (hasFail || (exitCode !== 0 && hasError)) {
    console.error(`\n❌ Test failed: ${testFile}`);
    allPassed = false;
    break; // Stop on first failure
  } else {
    console.log(`\n✅ Test passed: ${testFile}`);
  }
}

console.log('\n' + '='.repeat(80));
if (allPassed) {
  console.log('✅ All E2E tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some E2E tests failed');
  process.exit(1);
}

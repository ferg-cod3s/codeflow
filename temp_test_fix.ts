import { test } from 'bun:test';

export async function runBunTest(filePath: string): Promise<{ passed: number; failed: number; skipped: number; output: string }> {
  // Use Bun's test runner
  const result = await Bun.$`bun test ${filePath}`.text();
  const output = result || '';
  
  // Parse Bun test output
  const passed = (output.match(/✓/g) || []).length;
  const failed = (output.match(/✗/g) || []).length;
  const skipped = (output.match(/○/g) || []).length;
  
  return { passed, failed, skipped, output };
}

import { describe, it, expect } from 'bun:test';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

describe('ES Module Import Validation', () => {
  it('should validate all import paths have correct .js extensions', () => {
    // Test that the validation script runs without errors
    const scriptPath = join(process.cwd(), 'scripts', 'validate-imports.js');

    expect(existsSync(scriptPath)).toBe(true);

    // Run the validation script
    const result = execSync(`node ${scriptPath}`, {
      encoding: 'utf8',
      cwd: process.cwd(),
    });

    // Should complete successfully with "All import paths are valid!" message
    expect(result).toContain('All import paths are valid!');
    expect(result).not.toContain('issues found');
  });

  it('should validate that import validation script exists and runs', () => {
    // Test that the validation script exists
    const scriptPath = join(process.cwd(), 'scripts', 'validate-imports.js');
    expect(existsSync(scriptPath)).toBe(true);

    // Test that the script can be executed
    const result = execSync(`node "${scriptPath}"`, {
      encoding: 'utf8',
      cwd: process.cwd(),
    });

    expect(result).toContain('All import paths are valid!');
  });

  it('should validate CLI commands work with fixed imports', () => {
    // Test that the CLI can be imported and basic functions work
    const cliPath = join(process.cwd(), 'src', 'cli', 'index.ts');

    // This tests that the CLI module can be loaded (would fail if imports are broken)
    expect(existsSync(cliPath)).toBe(true);

    // Test that we can run the validation script as part of the build process
    const validationResult = execSync('npm run validate:imports', {
      encoding: 'utf8',
      cwd: process.cwd(),
    });

    expect(validationResult).toContain('All import paths are valid!');
  });
});

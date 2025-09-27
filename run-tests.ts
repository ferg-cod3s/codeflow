#!/usr/bin/env bun

/**
 * Codeflow Test Runner
 * Runs all test suites and generates coverage reports
 */

import { $ } from 'bun';
import { existsSync } from 'fs';
import { mkdir, rm, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import chalk from 'chalk';

interface TestSuite {
  name: string;
  path: string;
  type: 'unit' | 'integration' | 'e2e';
  timeout?: number;
}

interface TestResults {
  suite: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  coverage?: CoverageData;
}

interface CoverageData {
  lines: number;
  branches: number;
  functions: number;
  statements: number;
}

class TestRunner {
  private suites: TestSuite[] = [
    // Unit tests
    { name: 'CLI Commands', path: 'tests/unit/cli/cli-commands.test.ts', type: 'unit' },
    { name: 'Format Conversion', path: 'tests/unit/catalog/conversion.test.ts', type: 'unit' },
    { name: 'Agent Validation', path: 'tests/unit/agents/agent-validation.test.ts', type: 'unit' },
    { name: 'Command Validation', path: 'tests/unit/commands/command-validation.test.ts', type: 'unit' },
    
    // OpenCode Command tests
    { name: 'OpenCode Syntax Validation', path: 'tests/opencode-commands/syntax-validation.test.ts', type: 'unit' },
    { name: 'OpenCode Variable Substitution', path: 'tests/opencode-commands/variable-substitution.test.ts', type: 'unit' },
    { name: 'OpenCode Integration', path: 'tests/opencode-commands/integration.test.ts', type: 'integration', timeout: 30000 },
    
    // Integration tests
    { name: 'End-to-End', path: 'tests/e2e/integration.test.ts', type: 'e2e', timeout: 60000 }
  ];
  
  private results: TestResults[] = [];
  private coverageDir = '.coverage';
  private reportDir = 'test-reports';
  
  async run(options: { filter?: string; coverage?: boolean; watch?: boolean } = {}) {
    console.log(chalk.bold.cyan('\n🧪 Codeflow Test Suite\n'));
    console.log(chalk.gray('=' . repeat(50)));
    
    // Setup
    await this.setup();
    
    // Filter suites if requested
    let suitesToRun = this.suites;
    if (options.filter) {
      suitesToRun = this.suites.filter(s => 
        s.name.toLowerCase().includes(options.filter!.toLowerCase()) ||
        s.type === options.filter
      );
    }
    
    // Run tests
    const startTime = Date.now();
    
    for (const suite of suitesToRun) {
      await this.runSuite(suite, options.coverage || false);
    }
    
    const totalTime = Date.now() - startTime;
    
    // Generate reports
    await this.generateReports();
    
    // Print summary
    this.printSummary(totalTime);
    
    // Check if all tests passed
    const allPassed = this.results.every(r => r.failed === 0);
    
    if (!allPassed) {
      process.exit(1);
    }
  }
  
  private async setup() {
    // Create directories
    await mkdir(this.coverageDir, { recursive: true });
    await mkdir(this.reportDir, { recursive: true });
    
    // Clean previous coverage
    if (existsSync(join(this.coverageDir, 'lcov.info'))) {
      await rm(join(this.coverageDir, 'lcov.info'), { force: true });
    }
  }
  
  private async runSuite(suite: TestSuite, coverage: boolean): Promise<void> {
    console.log(chalk.blue(`\n📦 Running ${suite.name} (${suite.type})`));
    console.log(chalk.gray('-' . repeat(40)));
    
    const startTime = Date.now();
    
    try {
      // Build test command
      let cmd = `bun test ${suite.path}`;
      
      if (coverage) {
        cmd += ' --coverage';
      }
      
      if (suite.timeout) {
        cmd += ` --timeout ${suite.timeout}`;
      }
      
      // Run tests
      const result = await $`${cmd}`;
      
      // Parse results
      const output = result.stdout.toString();
      const passed = (output.match(/✓/g) || []).length;
      const failed = (output.match(/✗/g) || []).length;
      const skipped = (output.match(/○/g) || []).length;
      
      // Record results
      this.results.push({
        suite: suite.name,
        passed,
        failed,
        skipped,
        duration: Date.now() - startTime
      });
      
      // Print suite results
      if (failed > 0) {
        console.log(chalk.red(`  ✗ ${failed} tests failed`));
      }
      if (passed > 0) {
        console.log(chalk.green(`  ✓ ${passed} tests passed`));
      }
      if (skipped > 0) {
        console.log(chalk.yellow(`  ○ ${skipped} tests skipped`));
      }
      
      console.log(chalk.gray(`  Duration: ${((Date.now() - startTime) / 1000).toFixed(2)}s`));
      
    } catch (error: any) {
      // Test failure
      console.log(chalk.red(`  ✗ Suite failed: ${error.message}`));
      
      this.results.push({
        suite: suite.name,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: Date.now() - startTime
      });
    }
  }
  
  private async generateReports() {
    console.log(chalk.cyan('\n📊 Generating Reports...'));
    
    // Generate JSON report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      suites: this.results,
      totals: {
        passed: this.results.reduce((sum, r) => sum + r.passed, 0),
        failed: this.results.reduce((sum, r) => sum + r.failed, 0),
        skipped: this.results.reduce((sum, r) => sum + r.skipped, 0),
        duration: this.results.reduce((sum, r) => sum + r.duration, 0)
      }
    };
    
    await writeFile(
      join(this.reportDir, 'test-results.json'),
      JSON.stringify(jsonReport, null, 2)
    );
    
    // Generate Markdown report
    const mdReport = this.generateMarkdownReport(jsonReport);
    await writeFile(join(this.reportDir, 'test-results.md'), mdReport);
    
    console.log(chalk.green('  ✓ Reports generated in test-reports/'));
  }
  
  private generateMarkdownReport(data: any): string {
    const { timestamp, suites, totals } = data;
    
    let md = `# Test Results Report\n\n`;
    md += `**Generated:** ${timestamp}\n\n`;
    md += `## Summary\n\n`;
    md += `- **Total Tests:** ${totals.passed + totals.failed + totals.skipped}\n`;
    md += `- **Passed:** ${totals.passed} ✅\n`;
    md += `- **Failed:** ${totals.failed} ❌\n`;
    md += `- **Skipped:** ${totals.skipped} ⏭️\n`;
    md += `- **Duration:** ${(totals.duration / 1000).toFixed(2)}s\n\n`;
    
    md += `## Test Suites\n\n`;
    md += `| Suite | Passed | Failed | Skipped | Duration |\n`;
    md += `|-------|--------|--------|---------|----------|\n`;
    
    for (const suite of suites) {
      const status = suite.failed > 0 ? '❌' : '✅';
      md += `| ${status} ${suite.suite} | ${suite.passed} | ${suite.failed} | ${suite.skipped} | ${(suite.duration / 1000).toFixed(2)}s |\n`;
    }
    
    return md;
  }
  
  private printSummary(totalTime: number) {
    console.log(chalk.bold.cyan('\n📈 Test Summary\n'));
    console.log(chalk.gray('=' . repeat(50)));
    
    const totals = {
      passed: this.results.reduce((sum, r) => sum + r.passed, 0),
      failed: this.results.reduce((sum, r) => sum + r.failed, 0),
      skipped: this.results.reduce((sum, r) => sum + r.skipped, 0)
    };
    
    const total = totals.passed + totals.failed + totals.skipped;
    
    console.log(`  Total Tests: ${total}`);
    console.log(chalk.green(`  ✓ Passed: ${totals.passed}`));
    
    if (totals.failed > 0) {
      console.log(chalk.red(`  ✗ Failed: ${totals.failed}`));
    }
    
    if (totals.skipped > 0) {
      console.log(chalk.yellow(`  ○ Skipped: ${totals.skipped}`));
    }
    
    console.log(chalk.gray(`\n  Total Duration: ${(totalTime / 1000).toFixed(2)}s`));
    
    // Success/failure message
    if (totals.failed === 0) {
      console.log(chalk.bold.green('\n✅ All tests passed!'));
    } else {
      console.log(chalk.bold.red(`\n❌ ${totals.failed} test(s) failed`));
      
      // Show failed suites
      const failedSuites = this.results.filter(r => r.failed > 0);
      if (failedSuites.length > 0) {
        console.log(chalk.red('\nFailed suites:'));
        for (const suite of failedSuites) {
          console.log(chalk.red(`  - ${suite.suite} (${suite.failed} failures)`));
        }
      }
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new TestRunner();
  
  const options = {
    filter: args.find(a => !a.startsWith('--'))?.toLowerCase(),
    coverage: args.includes('--coverage'),
    watch: args.includes('--watch')
  };
  
  if (args.includes('--help')) {
    console.log(`
${chalk.bold('Codeflow Test Runner')}

Usage:
  bun run test [filter] [options]

Options:
  --coverage    Enable coverage reporting
  --watch       Watch mode (re-run on changes)
  --help        Show this help message

Filters:
  unit          Run only unit tests
  integration   Run only integration tests
  e2e           Run only e2e tests
  opencode      Run only OpenCode command tests
  [name]        Run tests matching name

Examples:
  bun run test                    # Run all tests
  bun run test unit               # Run unit tests only
  bun run test opencode           # Run OpenCode tests only
  bun run test conversion         # Run conversion tests
  bun run test --coverage         # Run with coverage
`);
    process.exit(0);
  }
  
  await runner.run(options);
}

// Run if called directly
if (import.meta.main) {
  main().catch(error => {
    console.error(chalk.red('Test runner failed:'), error);
    process.exit(1);
  });
}

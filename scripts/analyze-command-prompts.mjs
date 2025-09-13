#!/usr/bin/env node

/**
 * Command Prompt Analyzer Script
 *
 * Analyzes all 7 CodeFlow command files to establish baseline metrics:
 * - Token counts and file sizes
 * - Heading structure and presence of required sections
 * - Inconsistent terminology usage (implement vs execute, turbo vs bun)
 * - Frontmatter completeness and structure
 * - Structured output block presence
 * - Error handling patterns
 */

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Command files to analyze
const COMMAND_FILES = [
  'commit.md',
  'document.md',
  'execute.md',
  'plan.md',
  'research.md',
  'review.md',
  'test.md',
];

// Required conceptual sections that should be present
const REQUIRED_SECTIONS = ['Process', 'Inputs', 'Success Criteria', 'Error', 'Verification'];

// Inconsistent terminology patterns to detect
const TERMINOLOGY_PATTERNS = {
  implement: /implement/g,
  execute: /execute/g,
  turbo: /turbo/g,
  bun: /bun/g,
};

// Structured output patterns
const STRUCTURED_OUTPUT_PATTERNS = [
  /```.*?\n.*?\n```/g, // Generic fenced blocks
  /<.*?>.*?<\/.*?>/g, // XML/HTML style tags
  /\[.*?\]:/g, // Markdown link references
];

class CommandPromptAnalyzer {
  constructor() {
    this.results = {
      summary: {
        totalFiles: 0,
        totalTokens: 0,
        averageTokens: 0,
        totalSize: 0,
        averageSize: 0,
      },
      files: {},
      issues: [],
      recommendations: [],
    };
  }

  /**
   * Estimate token count (rough approximation)
   * @param {string} text
   * @returns {number}
   */
  estimateTokens(text) {
    // Rough approximation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Analyze a single command file
   * @param {string} filePath
   * @param {string} fileName
   * @returns {Promise<Object>}
   */
  async analyzeFile(filePath, fileName) {
    const content = await readFile(filePath, 'utf-8');

    // Basic metrics
    const lines = content.split('\n');
    const size = content.length;
    const tokens = this.estimateTokens(content);

    // Frontmatter analysis
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
    const frontmatterLines = frontmatter.split('\n').filter((line) => line.trim());

    // Heading analysis
    const headings = lines
      .filter((line) => line.match(/^#{1,6}\s/))
      .map((line) => line.replace(/^#{1,6}\s/, '').trim());

    // Section presence analysis
    const presentSections = REQUIRED_SECTIONS.filter((section) =>
      headings.some((heading) => heading.toLowerCase().includes(section.toLowerCase()))
    );

    // Terminology analysis
    const terminologyUsage = {};
    for (const [term, pattern] of Object.entries(TERMINOLOGY_PATTERNS)) {
      const matches = content.match(pattern);
      terminologyUsage[term] = matches ? matches.length : 0;
    }

    // Structured output analysis
    const structuredBlocks = STRUCTURED_OUTPUT_PATTERNS.reduce((total, pattern) => {
      const matches = content.match(pattern);
      return total + (matches ? matches.length : 0);
    }, 0);

    // Error handling patterns
    const errorPatterns = (content.match(/error|Error|fail|Fail/g) || []).length;
    const successPatterns = (content.match(/success|Success|✓|verified|Verified/g) || []).length;

    return {
      fileName,
      metrics: {
        lines: lines.length,
        size,
        tokens,
        frontmatterLines: frontmatterLines.length,
        headings: headings.length,
        presentSections: presentSections.length,
        structuredBlocks,
        errorPatterns,
        successPatterns,
      },
      analysis: {
        headings,
        presentSections,
        missingSections: REQUIRED_SECTIONS.filter(
          (section) =>
            !presentSections.some((present) =>
              present.toLowerCase().includes(section.toLowerCase())
            )
        ),
        terminologyUsage,
        hasFrontmatter: !!frontmatter,
        hasStructuredOutput: structuredBlocks > 0,
      },
    };
  }

  /**
   * Analyze all command files
   * @returns {Promise<void>}
   */
  async analyzeAll() {
    const commandDir = join(__dirname, '..', 'command');

    console.log('🔍 Analyzing CodeFlow command prompts...\n');

    for (const fileName of COMMAND_FILES) {
      const filePath = join(commandDir, fileName);

      try {
        console.log(`📄 Analyzing ${fileName}...`);
        const analysis = await this.analyzeFile(filePath, fileName);

        this.results.files[fileName] = analysis;
        this.results.summary.totalFiles++;
        this.results.summary.totalTokens += analysis.metrics.tokens;
        this.results.summary.totalSize += analysis.metrics.size;

        // Identify issues
        if (!analysis.analysis.hasFrontmatter) {
          this.results.issues.push(`${fileName}: Missing frontmatter`);
        }

        if (analysis.analysis.missingSections.length > 0) {
          this.results.issues.push(
            `${fileName}: Missing sections: ${analysis.analysis.missingSections.join(', ')}`
          );
        }

        if (!analysis.analysis.hasStructuredOutput) {
          this.results.issues.push(`${fileName}: No structured output blocks detected`);
        }

        // Check for inconsistent terminology
        const implementCount = analysis.analysis.terminologyUsage.implement;
        const executeCount = analysis.analysis.terminologyUsage.execute;
        if (implementCount > 0 && executeCount > 0) {
          this.results.issues.push(
            `${fileName}: Mixed terminology (implement: ${implementCount}, execute: ${executeCount})`
          );
        }

        const turboCount = analysis.analysis.terminologyUsage.turbo;
        const bunCount = analysis.analysis.terminologyUsage.bun;
        if (turboCount > 0 && bunCount > 0) {
          this.results.issues.push(
            `${fileName}: Mixed build tools (turbo: ${turboCount}, bun: ${bunCount})`
          );
        }
      } catch (error) {
        console.error(`❌ Error analyzing ${fileName}:`, error.message);
        this.results.issues.push(`${fileName}: Analysis failed - ${error.message}`);
      }
    }

    // Calculate averages
    if (this.results.summary.totalFiles > 0) {
      this.results.summary.averageTokens = Math.round(
        this.results.summary.totalTokens / this.results.summary.totalFiles
      );
      this.results.summary.averageSize = Math.round(
        this.results.summary.totalSize / this.results.summary.totalFiles
      );
    }

    this.generateRecommendations();
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations() {
    const files = Object.values(this.results.files);

    // Token efficiency recommendations
    const highTokenFiles = files.filter((f) => f.metrics.tokens > 1000);
    if (highTokenFiles.length > 0) {
      this.results.recommendations.push(
        `High token count files (${highTokenFiles.length}): ${highTokenFiles.map((f) => f.fileName).join(', ')} - Consider modularization`
      );
    }

    // Frontmatter consistency
    const filesWithoutFrontmatter = files.filter((f) => !f.analysis.hasFrontmatter);
    if (filesWithoutFrontmatter.length > 0) {
      this.results.recommendations.push(
        `Add standardized frontmatter to: ${filesWithoutFrontmatter.map((f) => f.fileName).join(', ')}`
      );
    }

    // Structured output coverage
    const filesWithoutStructuredOutput = files.filter((f) => !f.analysis.hasStructuredOutput);
    if (filesWithoutStructuredOutput.length > 0) {
      this.results.recommendations.push(
        `Add structured output blocks to: ${filesWithoutStructuredOutput.map((f) => f.fileName).join(', ')}`
      );
    }

    // Section completeness
    const filesWithMissingSections = files.filter((f) => f.analysis.missingSections.length > 0);
    if (filesWithMissingSections.length > 0) {
      this.results.recommendations.push(
        `Add missing sections to ${filesWithMissingSections.length} files - focus on Error Handling and Structured Output sections`
      );
    }
  }

  /**
   * Print analysis results
   */
  printResults() {
    console.log('\n📊 ANALYSIS RESULTS\n');

    console.log('SUMMARY METRICS:');
    console.log(`  Total Files: ${this.results.summary.totalFiles}`);
    console.log(`  Total Tokens: ${this.results.summary.totalTokens.toLocaleString()}`);
    console.log(`  Average Tokens: ${this.results.summary.averageTokens.toLocaleString()}`);
    console.log(`  Total Size: ${(this.results.summary.totalSize / 1024).toFixed(1)} KB`);
    console.log(`  Average Size: ${(this.results.summary.averageSize / 1024).toFixed(1)} KB`);

    console.log('\nFILE-BY-FILE METRICS:');
    for (const [fileName, analysis] of Object.entries(this.results.files)) {
      console.log(`\n  ${fileName}:`);
      console.log(`    Lines: ${analysis.metrics.lines}`);
      console.log(`    Tokens: ${analysis.metrics.tokens.toLocaleString()}`);
      console.log(`    Size: ${(analysis.metrics.size / 1024).toFixed(1)} KB`);
      console.log(`    Headings: ${analysis.metrics.headings}`);
      console.log(`    Frontmatter: ${analysis.analysis.hasFrontmatter ? '✅' : '❌'}`);
      console.log(`    Structured Output: ${analysis.analysis.hasStructuredOutput ? '✅' : '❌'}`);
      console.log(
        `    Present Sections: ${analysis.analysis.presentSections.length}/${REQUIRED_SECTIONS.length}`
      );
    }

    console.log('\nISSUES FOUND:');
    if (this.results.issues.length === 0) {
      console.log('  ✅ No issues detected');
    } else {
      this.results.issues.forEach((issue) => console.log(`  ❌ ${issue}`));
    }

    console.log('\nRECOMMENDATIONS:');
    if (this.results.recommendations.length === 0) {
      console.log('  ✅ No recommendations needed');
    } else {
      this.results.recommendations.forEach((rec) => console.log(`  💡 ${rec}`));
    }

    console.log('\n🎯 OPTIMIZATION TARGETS:');
    console.log('  Token Reduction: -15-25% from current average');
    console.log('  Frontmatter Coverage: 100%');
    console.log('  Structured Output: 100%');
    console.log('  Section Completeness: 100%');
  }

  /**
   * Export results as JSON
   * @param {string} outputPath
   */
  async exportResults(outputPath) {
    const fs = await import('node:fs/promises');
    await fs.writeFile(outputPath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Results exported to: ${outputPath}`);
  }
}

// Main execution
async function main() {
  const analyzer = new CommandPromptAnalyzer();

  try {
    await analyzer.analyzeAll();
    analyzer.printResults();

    // Export results
    const outputPath = join(
      __dirname,
      '..',
      'thoughts',
      'research',
      `command-prompt-baseline-${new Date().toISOString().split('T')[0]}.json`
    );
    await analyzer.exportResults(outputPath);
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { CommandPromptAnalyzer };

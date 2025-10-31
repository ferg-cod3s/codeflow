import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';

/**
 * Research CLI - Executes deep research workflows
 *
 * Integrates with the workflow orchestrator from agentic-mcp package
 * to provide a user-friendly CLI interface for the /research command.
 */

interface ResearchOptions {
  query: string;
  output?: string;
  includeWeb?: boolean;
  specialists?: string[];
  verbose?: boolean;
  minQuality?: number;
}

interface ProgressState {
  currentPhase: string;
  phasesCompleted: number;
  totalPhases: number;
  currentAgent?: string;
}

export class ResearchCLI {
  private projectRoot: string;
  private agentRegistry: any;
  private workflowOrchestrator: any;
  private progressState: ProgressState;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.progressState = {
      currentPhase: '',
      phasesCompleted: 0,
      totalPhases: 4,
    };
  }

  /**
   * Initialize the research system by loading required modules
   */
  private async initialize(): Promise<void> {
    try {
      // Load modules from agentic-mcp package
      const agenticMcpPath = join(this.projectRoot, 'packages', 'agentic-mcp', 'dist');

      if (!existsSync(agenticMcpPath)) {
        // For testing or when package not built, use mock
        this.agentRegistry = { agents: [] };
        this.workflowOrchestrator = {
          executeResearchWorkflow: async (_options: any) => ({
            summary: 'Mock research result',
            qualityMetrics: {
              overallScore: 80,
              completeness: 85,
              accuracy: 75,
              confidence: 'medium',
            },
            recommendations: ['Mock recommendation'],
            nextSteps: ['Mock next step'],
          }),
        };
        console.log('✅ Using mock research system (package not built)\n');
        return;
      }

      // Dynamically import the modules
      const { buildSafeAgentRegistry } = await import(`${agenticMcpPath}/agent-registry.js`);
      const { executeResearchWorkflow } = await import(`${agenticMcpPath}/research-workflow.js`);

      this.agentRegistry = await buildSafeAgentRegistry();
      this.workflowOrchestrator = { executeResearchWorkflow };

      console.log('✅ Research system initialized\n');
    } catch (error) {
      throw new Error(`Failed to initialize research system: ${error}`);
    }
  }

  /**
   * Execute the research workflow
   */
  async executeResearch(options: ResearchOptions): Promise<any> {
    console.log('🔬 Starting Deep Research Workflow\n');
    console.log(`Query: "${options.query}"\n`);

    await this.initialize();

    try {
      // Show initial progress
      this.showProgress('Initializing', 0);

      // Execute the workflow
      const result = await this.workflowOrchestrator.executeResearchWorkflow(
        {
          query: options.query,
          includeExternalResearch: options.includeWeb ?? false,
          engageDomainSpecialists: options.specialists && options.specialists.length > 0,
          maxSpecialists: options.specialists ? options.specialists.length : 3,
        },
        this.agentRegistry
      );

      // Show completion
      console.log('\n');
      this.showProgress('Complete', 4);
      console.log('\n✅ Research Complete!\n');

      // Display results
      await this.displayResults(result);

      // Save to file if requested
      if (options.output) {
        await this.saveResults(result, options.output);
      }

      return result;
    } catch (error) {
      console.error('\n❌ Research failed:', error);
      throw error;
    }
  }

  /**
   * Display research results in a user-friendly format
   */
  private async displayResults(result: any): Promise<void> {
    console.log('═'.repeat(80));
    console.log('  RESEARCH REPORT');
    console.log('═'.repeat(80));
    console.log();

    // Summary section
    if (result.summary) {
      console.log('📋 SUMMARY');
      console.log('─'.repeat(80));
      console.log(result.summary);
      console.log();
    }

    // Codebase analysis
    if (result.codebaseAnalysis) {
      console.log('💻 CODEBASE ANALYSIS');
      console.log('─'.repeat(80));
      console.log(result.codebaseAnalysis);
      console.log();
    }

    // Documentation insights
    if (result.documentationInsights) {
      console.log('📚 DOCUMENTATION INSIGHTS');
      console.log('─'.repeat(80));
      console.log(result.documentationInsights);
      console.log();
    }

    // External research
    if (result.externalResearch) {
      console.log('🌐 EXTERNAL RESEARCH');
      console.log('─'.repeat(80));
      console.log(result.externalResearch);
      console.log();
    }

    // Domain specialist findings
    if (result.domainSpecialistFindings && result.domainSpecialistFindings.length > 0) {
      console.log('🎯 SPECIALIST FINDINGS');
      console.log('─'.repeat(80));
      result.domainSpecialistFindings.forEach((finding: any) => {
        console.log(`  • ${finding.specialist}: ${finding.summary}`);
      });
      console.log();
    }

    // Recommendations
    if (result.recommendations && result.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS');
      console.log('─'.repeat(80));
      result.recommendations.forEach((rec: string, index: number) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
      console.log();
    }

    // Next steps
    if (result.nextSteps && result.nextSteps.length > 0) {
      console.log('🚀 NEXT STEPS');
      console.log('─'.repeat(80));
      result.nextSteps.forEach((step: string, index: number) => {
        console.log(`  ${index + 1}. ${step}`);
      });
      console.log();
    }

    // Quality metrics
    if (result.qualityMetrics) {
      console.log('📊 QUALITY METRICS');
      console.log('─'.repeat(80));
      console.log(`  Overall Score: ${result.qualityMetrics.overallScore}/100`);
      console.log(`  Completeness:  ${result.qualityMetrics.completeness}/100`);
      console.log(`  Accuracy:      ${result.qualityMetrics.accuracy}/100`);
      console.log(`  Confidence:    ${result.qualityMetrics.confidence}`);
      console.log();
    }

    console.log('═'.repeat(80));
  }

  /**
   * Save results to a file
   */
  private async saveResults(result: any, outputPath: string): Promise<void> {
    try {
      const content = this.formatResultsAsMarkdown(result);
      await writeFile(outputPath, content, 'utf-8');
      console.log(`\n💾 Results saved to: ${outputPath}`);
    } catch (error) {
      console.error(`Failed to save results: ${error}`);
    }
  }

  /**
   * Format results as markdown
   */
  private formatResultsAsMarkdown(result: any): string {
    const timestamp = new Date().toISOString();
    let markdown = `# Research Report\n\n`;
    markdown += `Generated: ${timestamp}\n\n`;
    markdown += `---\n\n`;

    if (result.summary) {
      markdown += `## Summary\n\n${result.summary}\n\n`;
    }

    if (result.codebaseAnalysis) {
      markdown += `## Codebase Analysis\n\n${result.codebaseAnalysis}\n\n`;
    }

    if (result.documentationInsights) {
      markdown += `## Documentation Insights\n\n${result.documentationInsights}\n\n`;
    }

    if (result.externalResearch) {
      markdown += `## External Research\n\n${result.externalResearch}\n\n`;
    }

    if (result.domainSpecialistFindings && result.domainSpecialistFindings.length > 0) {
      markdown += `## Specialist Findings\n\n`;
      result.domainSpecialistFindings.forEach((finding: any) => {
        markdown += `### ${finding.specialist}\n\n${finding.summary}\n\n`;
      });
    }

    if (result.recommendations && result.recommendations.length > 0) {
      markdown += `## Recommendations\n\n`;
      result.recommendations.forEach((rec: string, index: number) => {
        markdown += `${index + 1}. ${rec}\n`;
      });
      markdown += `\n`;
    }

    if (result.nextSteps && result.nextSteps.length > 0) {
      markdown += `## Next Steps\n\n`;
      result.nextSteps.forEach((step: string, index: number) => {
        markdown += `${index + 1}. ${step}\n`;
      });
      markdown += `\n`;
    }

    if (result.qualityMetrics) {
      markdown += `## Quality Metrics\n\n`;
      markdown += `- Overall Score: ${result.qualityMetrics.overallScore}/100\n`;
      markdown += `- Completeness: ${result.qualityMetrics.completeness}/100\n`;
      markdown += `- Accuracy: ${result.qualityMetrics.accuracy}/100\n`;
      markdown += `- Confidence: ${result.qualityMetrics.confidence}\n\n`;
    }

    return markdown;
  }

  /**
   * Show progress indicator
   */
  private showProgress(phase: string, completed: number): void {
    const total = this.progressState.totalPhases;
    const percentage = Math.round((completed / total) * 100);
    const barLength = 40;
    const filledLength = Math.round((barLength * completed) / total);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

    process.stdout.write(`\r[${bar}] ${percentage}% - ${phase}`);
  }

  /**
   * Show interactive menu
   */
  async showInteractiveMenu(): Promise<void> {
    console.log('🔬 Research Command - Deep Codebase & Documentation Analysis\n');
    console.log('Usage:');
    console.log('  codeflow research "<query>" [options]\n');
    console.log('Options:');
    console.log('  --output <file>      Save results to file');
    console.log('  --include-web        Include external web research');
    console.log('  --specialists <list> Specific domain specialists to use (comma-separated)');
    console.log('  --min-quality <num>  Minimum quality score threshold (default: 50)');
    console.log('  --verbose           Show detailed progress\n');
    console.log('Examples:');
    console.log('  codeflow research "authentication implementation"');
    console.log('  codeflow research "database schema" --output report.md');
    console.log('  codeflow research "API security" --include-web --specialists security-scanner');
    console.log('  codeflow research "performance bottlenecks" --min-quality 70\n');
    console.log('Workflow:');
    console.log('  1. Discovery Phase    - Locate relevant code and documentation');
    console.log('  2. Analysis Phase     - Deep analysis of findings');
    console.log('  3. Research Phase     - External research (optional)');
    console.log('  4. Specialist Phase   - Domain-specific insights (conditional)\n');
    console.log('💡 Tip: Start with discovery commands before deep research for better results');
  }
}

/**
 * Main CLI function
 */
export async function research(options: any): Promise<any> {
  const cli = new ResearchCLI(options.projectRoot || process.cwd());

  try {
    if (!options.query) {
      await cli.showInteractiveMenu();
      return {};
    }
  } catch (error) {
    console.error('Research command failed:', error);
    throw error;
  }
}

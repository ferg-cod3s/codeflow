import { CatalogCLI } from './catalog.js';
import CLIErrorHandler from './error-handler.js';

interface AgentDiscoveryOptions {
  useCase?: string;
  complexity?: 'beginner' | 'intermediate' | 'advanced';
  timeLimit?: string;
  domain?: string;
}

export class DiscoveryCLI {
  private catalogCli: CatalogCLI;

  constructor(projectRoot: string) {
    this.catalogCli = new CatalogCLI(projectRoot);
  }

  // HumanLayer-inspired agent discovery
  async discoverByUseCase(useCase: string, _options: AgentDiscoveryOptions = {}): Promise<void> {
    console.log(`🔍 Finding agents for: "${useCase}"`);

    const useCaseMap = {
      'understand code': ['codebase-locator', 'codebase-analyzer'],
      'build api': ['api-builder', 'database-expert', 'security-scanner'],
      'fix performance': ['performance-engineer', 'database-expert'],
      'add security': ['security-scanner', 'api-builder'],
      'grow users': ['growth-engineer', 'ux-optimizer', 'programmatic-seo-engineer'],
      'debug issue': ['codebase-locator', 'codebase-analyzer', 'performance-engineer'],
      'new feature': ['codebase-locator', 'full-stack-developer', 'smart-subagent-orchestrator'],
      'optimize ux': ['ux-optimizer', 'performance-engineer'],
      'scale system': ['infrastructure-builder', 'database-expert', 'performance-engineer'],
      'incident response': ['operations-incident-commander', 'security-scanner'],
    };

    const matchedAgents = this.findBestAgents(useCase, useCaseMap);

    if (matchedAgents.length === 0) {
      console.log('❓ No direct matches found. Here are some general suggestions:');
      await this.showGeneralRecommendations();
    } else {
      console.log(`\n✅ Recommended agents for "${useCase}":\n`);
      for (const [index, agent] of matchedAgents.entries()) {
        await this.showAgentSummary(agent, index + 1);
      }

      console.log('\n💡 Suggested workflow:');
      await this.suggestWorkflow(matchedAgents);
    }
  }

  async discoverByComplexity(complexity: string): Promise<void> {
    console.log(`🎯 Showing ${complexity} agents:\n`);

    const complexityMap = {
      beginner: ['codebase-locator', 'thoughts-locator', 'codebase-analyzer', 'thoughts-analyzer'],
      intermediate: [
        'api-builder',
        'database-expert',
        'performance-engineer',
        'security-scanner',
        'ux-optimizer',
        'growth-engineer',
      ],
      advanced: [
        'full-stack-developer',
        'operations-incident-commander',
        'infrastructure-builder',
        'ai-integration-expert',
        'programmatic-seo-engineer',
        'smart-subagent-orchestrator',
      ],
    };

    const agents = complexityMap[complexity as keyof typeof complexityMap] || [];

    for (const [index, agent] of agents.entries()) {
      await this.showAgentSummary(agent, index + 1);
    }
  }

  async showWorkflowSuggestions(): Promise<void> {
    console.log('🔄 Common Workflow Patterns:\n');

    const workflows = [
      {
        name: 'Feature Development',
        pattern: '/research → /plan → /execute → /test → /document → /review → /commit',
        description: 'Complete feature development lifecycle',
        timeEstimate: '2-4 hours',
      },
      {
        name: 'Bug Investigation',
        pattern: 'codebase-locator → codebase-analyzer → [specialist] → /plan → /execute',
        description: 'Systematic bug investigation and fixing',
        timeEstimate: '30-90 minutes',
      },
      {
        name: 'Performance Optimization',
        pattern: 'performance-engineer → database-expert → ux-optimizer → /test',
        description: 'Comprehensive performance improvement',
        timeEstimate: '1-2 hours',
      },
      {
        name: 'Architecture Review',
        pattern: 'thoughts-locator → codebase-pattern-finder → smart-subagent-orchestrator',
        description: 'Review and improve system architecture',
        timeEstimate: '2-6 hours',
      },
    ];

    workflows.forEach((workflow, index) => {
      console.log(`${index + 1}. **${workflow.name}** (${workflow.timeEstimate})`);
      console.log(`   ${workflow.description}`);
      console.log(`   Pattern: ${workflow.pattern}\n`);
    });
  }

  async interactiveDiscovery(): Promise<void> {
    console.log('🎯 Interactive Agent Discovery\n');

    console.log('What do you want to do?');
    console.log('1. Understand existing code');
    console.log('2. Build something new');
    console.log('3. Fix a problem');
    console.log('4. Optimize/scale something');
    console.log('5. Show all workflow patterns\n');

    console.log('Examples:');
    console.log('• codeflow discover "understand authentication code"');
    console.log('• codeflow discover "build user dashboard"');
    console.log('• codeflow discover "fix slow database queries"');
    console.log('• codeflow discover --complexity beginner');
    console.log('• codeflow discover --workflows');
  }

  private findBestAgents(useCase: string, useCaseMap: Record<string, string[]>): string[] {
    const lowerUseCase = useCase.toLowerCase();

    // Find exact matches
    for (const [key, agents] of Object.entries(useCaseMap)) {
      if (lowerUseCase.includes(key)) {
        return agents;
      }
    }

    // Find partial matches
    const partialMatches: string[] = [];
    for (const [key, agents] of Object.entries(useCaseMap)) {
      const keywords = key.split(' ');
      if (keywords.some((keyword) => lowerUseCase.includes(keyword))) {
        partialMatches.push(...agents);
      }
    }

    return [...new Set(partialMatches)]; // Remove duplicates
  }

  private async showAgentSummary(agentName: string, index: number): Promise<void> {
    const agentDescriptions = {
      'codebase-locator': {
        desc: 'Find files and components instantly',
        time: '2-5 min',
        complexity: 'Beginner',
      },
      'codebase-analyzer': {
        desc: 'Understand how specific code works',
        time: '5-15 min',
        complexity: 'Beginner',
      },
      'api-builder': {
        desc: 'Design and build production-ready APIs',
        time: '15-30 min',
        complexity: 'Intermediate',
      },
      'database-expert': {
        desc: 'Optimize queries and design schemas',
        time: '20-40 min',
        complexity: 'Intermediate',
      },
      'performance-engineer': {
        desc: 'Identify bottlenecks and optimize performance',
        time: '15-30 min',
        complexity: 'Intermediate',
      },
      'full-stack-developer': {
        desc: 'End-to-end feature development',
        time: '30-60 min',
        complexity: 'Advanced',
      },
    };

    const info = agentDescriptions[agentName as keyof typeof agentDescriptions] || {
      desc: 'Specialized agent',
      time: '15-30 min',
      complexity: 'Intermediate',
    };

    console.log(`${index}. **${agentName}**`);
    console.log(`   ${info.desc}`);
    console.log(`   Time: ${info.time} | Complexity: ${info.complexity}\n`);
  }

  private async suggestWorkflow(agents: string[]): Promise<void> {
    if (agents.includes('codebase-locator')) {
      console.log('1. Start with codebase-locator to find relevant files');
      console.log('2. Use codebase-analyzer to understand the implementation');
    }

    if (agents.includes('api-builder') || agents.includes('database-expert')) {
      console.log('3. Plan your implementation approach');
      console.log('4. Use specialized agents for implementation');
    }

    if (agents.includes('security-scanner') || agents.includes('performance-engineer')) {
      console.log('5. Run validation and optimization agents');
    }

    console.log('6. Use /review to validate your work');
    console.log('7. Use /commit to create structured commit');
  }

  private async showGeneralRecommendations(): Promise<void> {
    console.log('📚 General recommendations:');
    console.log('• For code understanding: codebase-locator + codebase-analyzer');
    console.log('• For building features: /research + /plan + /execute');
    console.log('• For debugging: codebase-locator + performance-engineer');
    console.log('• For optimization: performance-engineer + database-expert');
    console.log('\nTry: codeflow discover --help for more options');
  }
}

// Main CLI function
export async function discover(query?: string, options: AgentDiscoveryOptions = {}): Promise<void> {
  const cli = new DiscoveryCLI(process.cwd());

  try {
    if (options.complexity) {
      await cli.discoverByComplexity(options.complexity);
    } else if (query === '--workflows') {
      await cli.showWorkflowSuggestions();
    } else if (query) {
      await cli.discoverByUseCase(query, options);
    } else {
      await cli.interactiveDiscovery();
    }
  } catch (error) {
    CLIErrorHandler.handleCommonError(error, 'discover');
  }
}

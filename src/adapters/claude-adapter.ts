import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import {
  BasePlatformAdapter,
  AgentMetadata,
  AgentInvocationContext,
  AgentInvocationResult,
  createErrorResult,
  createSuccessResult,
} from './platform-adapter.js';
import { Platform } from '../config/platform-detector.js';

/**
 * Claude Code Platform Adapter
 * 
 * Implements platform adapter for Claude Code:
 * - Discovers agents from .claude/agents/*.md files
 * - Parses agent metadata from markdown frontmatter
 * - Invokes agents using Task tool with subagent_type parameter
 * 
 * Note: This is a simulation for CLI use. In production, Claude Code
 * handles agent invocation internally.
 */
export class ClaudeCodeAdapter extends BasePlatformAdapter {
  readonly platform = Platform.CLAUDE_CODE;
  readonly projectRoot: string;
  private agentsDirectory: string;

  constructor(projectRoot: string) {
    super();
    this.projectRoot = projectRoot;
    this.agentsDirectory = join(projectRoot, '.claude', 'agents');
  }

  /**
   * Initialize the adapter
   */
  async initialize(): Promise<void> {
    if (!existsSync(this.agentsDirectory)) {
      throw new Error(`Claude Code agents directory not found: ${this.agentsDirectory}`);
    }

    this.initialized = true;
  }

  /**
   * Check if Claude Code is available
   */
  async isAvailable(): Promise<boolean> {
    return existsSync(this.agentsDirectory);
  }

  /**
   * Discover agents from .claude/agents/ directory
   */
  async discoverAgents(): Promise<AgentMetadata[]> {
    this.ensureInitialized();

    const agents: AgentMetadata[] = [];

    try {
      const files = await readdir(this.agentsDirectory);
      const agentFiles = files.filter(file => file.endsWith('.md'));

      for (const file of agentFiles) {
        const filePath = join(this.agentsDirectory, file);
        const metadata = await this.parseAgentMetadata(filePath);
        
        if (metadata) {
          agents.push(metadata);
        }
      }
    } catch (error) {
      throw new Error(`Failed to discover Claude Code agents: ${error}`);
    }

    // Cache agents
    agents.forEach(agent => this.agentCache.set(agent.name, agent));

    return agents;
  }

  /**
   * Parse agent metadata from markdown file
   */
  private async parseAgentMetadata(filePath: string): Promise<AgentMetadata | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const fileName = filePath.split('/').pop()!;
      const agentName = fileName.replace('.md', '');

      // Extract description from first heading or paragraph
      const description = this.extractDescription(content);
      
      // Extract capabilities from content (look for keywords)
      const capabilities = this.extractCapabilities(content);

      // Infer permissions (Claude Code agents can read/write by default)
      const permissions: ('read' | 'write' | 'execute')[] = ['read', 'write', 'execute'];

      return {
        name: agentName,
        description,
        capabilities,
        permissions,
        platform: Platform.CLAUDE_CODE,
        path: filePath,
      };
    } catch (error) {
      console.warn(`Failed to parse agent metadata from ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Extract description from markdown content
   */
  private extractDescription(content: string): string | undefined {
    // Look for first heading or paragraph
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and frontmatter
      if (!trimmed || trimmed === '---') {
        continue;
      }

      // Extract from heading
      if (trimmed.startsWith('#')) {
        return trimmed.replace(/^#+\s*/, '').trim();
      }

      // Extract from paragraph
      if (trimmed.length > 0 && !trimmed.startsWith('```')) {
        return trimmed;
      }
    }

    return undefined;
  }

  /**
   * Extract capabilities from content
   */
  private extractCapabilities(content: string): string[] {
    const capabilities: string[] = [];
    const keywords = [
      'search', 'analyze', 'research', 'locate', 'document',
      'review', 'test', 'deploy', 'monitor', 'optimize',
      'security', 'performance', 'database', 'api', 'frontend',
      'backend', 'architecture', 'design', 'ux', 'data',
    ];

    const lowerContent = content.toLowerCase();
    
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        capabilities.push(keyword);
      }
    }

    return [...new Set(capabilities)]; // Remove duplicates
  }

  /**
   * Invoke a Claude Code agent
   * 
   * Note: In CLI context, this is a simulation. In production Claude Code,
   * the platform handles invocation via Task tool.
   */
  async invokeAgent(
    agentName: string,
    context: AgentInvocationContext
  ): Promise<AgentInvocationResult> {
    this.ensureInitialized();
    this.validateContext(context);

    const startTime = Date.now();

    try {
      // Get agent metadata
      const metadata = await this.getAgentMetadata(agentName);
      
      if (!metadata) {
        return createErrorResult(agentName, `Agent '${agentName}' not found`);
      }

      // In production, this would invoke via Task tool
      // For CLI simulation, we return a mock result
      const output = this.simulateAgentInvocation(agentName, context);

      const duration = Date.now() - startTime;

      return createSuccessResult(agentName, output, {
        duration,
        platform: Platform.CLAUDE_CODE,
        agentPath: metadata.path,
      });
    } catch (error) {
      return createErrorResult(
        agentName,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Simulate agent invocation
   * In production, this would call the actual Task tool
   */
  private simulateAgentInvocation(
    agentName: string,
    context: AgentInvocationContext
  ): string {
    // This is a placeholder for CLI testing
    // In production Claude Code, the platform handles the actual invocation
    return `[Claude Code Agent: ${agentName}]\n\nObjective: ${context.objective}\n\n` +
           `This is a simulated response. In production Claude Code, ` +
           `the agent would be invoked via the Task tool.`;
  }

  /**
   * Batch invocation (parallel)
   */
  async invokeAgentsBatch(requests: any[]): Promise<AgentInvocationResult[]> {
    this.ensureInitialized();

    // Claude Code supports parallel invocations
    return Promise.all(
      requests.map(request => 
        this.invokeAgent(request.agentName, request.context)
      )
    );
  }

  /**
   * Cleanup
   */
  async dispose(): Promise<void> {
    await super.dispose();
  }
}

/**
 * Create Claude Code adapter
 */
export function createClaudeAdapter(projectRoot: string): ClaudeCodeAdapter {
  return new ClaudeCodeAdapter(projectRoot);
}

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
  BasePlatformAdapter,
  AgentMetadata,
  AgentInvocationContext,
  AgentInvocationResult,
  StreamingCallback,
  createErrorResult,
  createSuccessResult,
} from './platform-adapter.js';
import { Platform } from '../config/platform-detector.js';

/**
 * OpenCode Platform Adapter
 *
 * Implements platform adapter for OpenCode:
 * - Discovers agents from .opencode/agent/*.md files
 * - Connects to MCP server for agent invocations
 * - Supports streaming responses
 * - Uses codeflow.agent.<name> tool pattern
 */
export class OpenCodeAdapter extends BasePlatformAdapter {
  readonly platform = Platform.OPENCODE;
  private agentsDirectory: string;
  private mcpClient?: Client;
  private mcpEndpoint?: string;

  constructor(projectRoot: string, mcpEndpoint?: string) {
    super();
    this.agentsDirectory = join(projectRoot, '.opencode', 'agent');
    this.mcpEndpoint = mcpEndpoint;
  }

  /**
   * Initialize the adapter
   */
  async initialize(): Promise<void> {
    if (!existsSync(this.agentsDirectory)) {
      throw new Error(`OpenCode agents directory not found: ${this.agentsDirectory}`);
    }

    // Initialize MCP client if endpoint is provided
    if (this.mcpEndpoint) {
      await this.initializeMCPClient();
    }

    this.initialized = true;
  }

  /**
   * Initialize MCP client connection
   */
  private async initializeMCPClient(): Promise<void> {
    try {
      // Create MCP client with stdio transport
      const transport = new StdioClientTransport({
        command: 'opencode',
        args: ['mcp'],
      });

      this.mcpClient = new Client(
        {
          name: 'codeflow-research',
          version: '1.0.0',
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );

      await this.mcpClient.connect(transport);
    } catch (error) {
      throw new Error(`Failed to initialize MCP client: ${error}`);
    }
  }

  /**
   * Check if OpenCode is available
   */
  async isAvailable(): Promise<boolean> {
    return existsSync(this.agentsDirectory);
  }

  /**
   * Discover agents from .opencode/agent/ directory
   */
  async discoverAgents(): Promise<AgentMetadata[]> {
    this.ensureInitialized();

    const agents: AgentMetadata[] = [];

    try {
      // If MCP client is available, query available tools
      if (this.mcpClient) {
        const tools = await this.discoverAgentsViaMCP();
        agents.push(...tools);
      } else {
        // Fallback: discover from filesystem
        const fileAgents = await this.discoverAgentsFromFiles();
        agents.push(...fileAgents);
      }
    } catch {
      // Fallback to filesystem if MCP fails
      try {
        const fileAgents = await this.discoverAgentsFromFiles();
        agents.push(...fileAgents);
      } catch (_fsError) {
        throw new Error(`Failed to discover OpenCode agents: ${_fsError}`);
      }
    }

    // Cache agents
    agents.forEach((agent) => this.agentCache.set(agent.name, agent));

    return agents;
  }

  /**
   * Discover agents via MCP protocol
   */
  private async discoverAgentsViaMCP(): Promise<AgentMetadata[]> {
    if (!this.mcpClient) {
      return [];
    }

    const agents: AgentMetadata[] = [];

    try {
      const toolsResult = await this.mcpClient.listTools();

      // Filter for codeflow.agent.* tools
      const agentTools = toolsResult.tools.filter((tool) =>
        tool.name.startsWith('codeflow.agent.')
      );

      for (const tool of agentTools) {
        const agentName = tool.name.replace('codeflow.agent.', '');

        agents.push({
          name: agentName,
          description: tool.description,
          capabilities: this.parseCapabilitiesFromDescription(tool.description || ''),
          permissions: ['read', 'write', 'execute'],
          platform: Platform.OPENCODE,
        });
      }
    } catch (error) {
      console.warn('Failed to discover agents via MCP:', error);
    }

    return agents;
  }

  /**
   * Discover agents from filesystem
   */
  private async discoverAgentsFromFiles(): Promise<AgentMetadata[]> {
    const agents: AgentMetadata[] = [];

    const files = await readdir(this.agentsDirectory);
    const agentFiles = files.filter((file) => file.endsWith('.md'));

    for (const file of agentFiles) {
      const filePath = join(this.agentsDirectory, file);
      const metadata = await this.parseAgentMetadata(filePath);

      if (metadata) {
        agents.push(metadata);
      }
    }

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

      const description = this.extractDescription(content);
      const capabilities = this.extractCapabilities(content);

      return {
        name: agentName,
        description,
        capabilities,
        permissions: ['read', 'write', 'execute'],
        platform: Platform.OPENCODE,
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
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed === '---') {
        continue;
      }

      if (trimmed.startsWith('#')) {
        return trimmed.replace(/^#+\s*/, '').trim();
      }

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
    return this.parseCapabilitiesFromDescription(content);
  }

  /**
   * Parse capabilities from description text
   */
  private parseCapabilitiesFromDescription(text: string): string[] {
    const capabilities: string[] = [];
    const keywords = [
      'search',
      'analyze',
      'research',
      'locate',
      'document',
      'review',
      'test',
      'deploy',
      'monitor',
      'optimize',
      'security',
      'performance',
      'database',
      'api',
      'frontend',
      'backend',
      'architecture',
      'design',
      'ux',
      'data',
    ];

    const lowerText = text.toLowerCase();

    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        capabilities.push(keyword);
      }
    }

    return [...new Set(capabilities)];
  }

  /**
   * Invoke an OpenCode agent via MCP
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

      let output: string;

      if (this.mcpClient) {
        // Invoke via MCP
        output = await this.invokeViaMCP(agentName, context);
      } else {
        // Fallback: simulation
        output = this.simulateAgentInvocation(agentName, context);
      }

      const duration = Date.now() - startTime;

      return createSuccessResult(agentName, output, {
        duration,
        platform: Platform.OPENCODE,
        agentPath: metadata.path,
      });
    } catch (error) {
      return createErrorResult(agentName, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Invoke agent via MCP protocol
   */
  private async invokeViaMCP(agentName: string, context: AgentInvocationContext): Promise<string> {
    if (!this.mcpClient) {
      throw new Error('MCP client not initialized');
    }

    const toolName = `codeflow.agent.${agentName}`;

    const result = await this.mcpClient.callTool({
      name: toolName,
      arguments: {
        prompt: context.objective,
        ...context.context,
      },
    });

    // Extract text content from result
    if (Array.isArray(result.content)) {
      const textContent = result.content
        .filter((item) => item.type === 'text')
        .map((item) => ('text' in item ? item.text : ''))
        .join('\n');

      return textContent;
    }

    return String(result.content);
  }

  /**
   * Invoke agent with streaming
   */
  async invokeAgentStream(
    agentName: string,
    context: AgentInvocationContext,
    onChunk: StreamingCallback
  ): Promise<AgentInvocationResult> {
    this.ensureInitialized();
    this.validateContext(context);

    const startTime = Date.now();

    try {
      const metadata = await this.getAgentMetadata(agentName);

      if (!metadata) {
        return createErrorResult(agentName, `Agent '${agentName}' not found`);
      }

      // For now, simulate streaming by chunking the output
      const output = await this.invokeViaMCP(agentName, context);

      // Simulate streaming
      const chunkSize = 50;
      for (let i = 0; i < output.length; i += chunkSize) {
        const chunk = output.slice(i, i + chunkSize);
        onChunk(chunk);

        // Small delay to simulate streaming
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const duration = Date.now() - startTime;

      return createSuccessResult(agentName, output, {
        duration,
        platform: Platform.OPENCODE,
        streaming: true,
      });
    } catch (error) {
      return createErrorResult(agentName, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Simulate agent invocation
   */
  private simulateAgentInvocation(agentName: string, context: AgentInvocationContext): string {
    return (
      `[OpenCode Agent: ${agentName}]\n\nObjective: ${context.objective}\n\n` +
      `This is a simulated response. MCP client not available.`
    );
  }

  /**
   * Batch invocation (parallel)
   */
  async invokeAgentsBatch(requests: any[]): Promise<AgentInvocationResult[]> {
    this.ensureInitialized();

    // OpenCode supports parallel invocations via MCP
    return Promise.all(
      requests.map((request) => this.invokeAgent(request.agentName, request.context))
    );
  }

  /**
   * Cleanup
   */
  async dispose(): Promise<void> {
    if (this.mcpClient) {
      try {
        await this.mcpClient.close();
      } catch {
        console.warn('Failed to close MCP client');
      }
    }

    await super.dispose();
  }
}

/**
 * Create OpenCode adapter
 */
export function createOpenCodeAdapter(projectRoot: string, mcpEndpoint?: string): OpenCodeAdapter {
  return new OpenCodeAdapter(projectRoot, mcpEndpoint);
}

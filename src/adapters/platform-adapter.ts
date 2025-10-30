import { Platform } from '../config/platform-detector.js';

/**
 * Agent metadata from platform
 */
export interface AgentMetadata {
  name: string;
  description?: string;
  capabilities?: string[];
  permissions?: ('read' | 'write' | 'execute')[];
  platform: Platform;
  path?: string;
}

/**
 * Agent invocation context
 */
export interface AgentInvocationContext {
  objective: string;
  context?: Record<string, any>;
  timeout?: number;
  streaming?: boolean;
}

/**
 * Agent invocation result
 */
export interface AgentInvocationResult {
  agentName: string;
  success: boolean;
  output?: string;
  error?: string;
  metadata?: Record<string, any>;
  duration?: number;
}

/**
 * Batch invocation request
 */
export interface BatchInvocationRequest {
  agentName: string;
  context: AgentInvocationContext;
}

/**
 * Streaming callback for agent output
 */
export type StreamingCallback = (chunk: string) => void;

/**
 * Platform Adapter Interface
 * 
 * Abstracts platform-specific agent invocation mechanisms:
 * - Claude Code: File-based agents, Task tool invocations
 * - OpenCode: MCP client, tool invocations, streaming support
 * 
 * All implementations must provide these capabilities.
 */
export interface PlatformAdapter {
  /**
   * Platform this adapter supports
   */
  readonly platform: Platform;

  /**
   * Project root directory
   */
  readonly projectRoot: string;

  /**
   * Initialize the adapter
   * Must be called before any other operations
   */
  initialize(): Promise<void>;

  /**
   * Check if the adapter is available and properly configured
   */
  isAvailable(): Promise<boolean>;

  /**
   * Discover available agents
   * Returns metadata for all agents the platform can invoke
   */
  discoverAgents(): Promise<AgentMetadata[]>;

  /**
   * Get metadata for a specific agent
   */
  getAgentMetadata(agentName: string): Promise<AgentMetadata | null>;

  /**
   * Invoke a single agent
   * 
   * @param agentName - Name of the agent to invoke
   * @param context - Invocation context (objective, parameters, etc.)
   * @returns Promise resolving to invocation result
   */
  invokeAgent(
    agentName: string,
    context: AgentInvocationContext
  ): Promise<AgentInvocationResult>;

  /**
   * Invoke multiple agents in parallel
   * 
   * @param requests - Array of batch invocation requests
   * @returns Promise resolving to array of results
   */
  invokeAgentsBatch(
    requests: BatchInvocationRequest[]
  ): Promise<AgentInvocationResult[]>;

  /**
   * Invoke an agent with streaming support
   * Only supported by platforms that implement streaming (OpenCode)
   * 
   * @param agentName - Name of the agent to invoke
   * @param context - Invocation context
   * @param onChunk - Callback for streaming chunks
   * @returns Promise resolving to final result
   */
  invokeAgentStream?(
    agentName: string,
    context: AgentInvocationContext,
    onChunk: StreamingCallback
  ): Promise<AgentInvocationResult>;

  /**
   * Cleanup and dispose resources
   */
  dispose(): Promise<void>;
}

/**
 * Abstract base class for platform adapters
 * Provides common functionality and validation
 */
export abstract class BasePlatformAdapter implements PlatformAdapter {
  abstract readonly platform: Platform;
  protected initialized: boolean = false;
  protected agentCache: Map<string, AgentMetadata> = new Map();

  abstract initialize(): Promise<void>;
  abstract isAvailable(): Promise<boolean>;
  abstract discoverAgents(): Promise<AgentMetadata[]>;
  abstract invokeAgent(
    agentName: string,
    context: AgentInvocationContext
  ): Promise<AgentInvocationResult>;

  /**
   * Get agent metadata (with caching)
   */
  async getAgentMetadata(agentName: string): Promise<AgentMetadata | null> {
    // Check cache first
    if (this.agentCache.has(agentName)) {
      return this.agentCache.get(agentName)!;
    }

    // Discover agents and update cache
    const agents = await this.discoverAgents();
    agents.forEach(agent => this.agentCache.set(agent.name, agent));

    return this.agentCache.get(agentName) || null;
  }

  /**
   * Default batch implementation (sequential)
   * Subclasses can override for true parallel execution
   */
  async invokeAgentsBatch(
    requests: BatchInvocationRequest[]
  ): Promise<AgentInvocationResult[]> {
    const results: AgentInvocationResult[] = [];

    for (const request of requests) {
      try {
        const result = await this.invokeAgent(request.agentName, request.context);
        results.push(result);
      } catch (error) {
        results.push({
          agentName: request.agentName,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  /**
   * Default cleanup (no-op)
   * Subclasses can override for resource cleanup
   */
  async dispose(): Promise<void> {
    this.agentCache.clear();
    this.initialized = false;
  }

  /**
   * Ensure adapter is initialized
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(`${this.platform} adapter not initialized. Call initialize() first.`);
    }
  }

  /**
   * Validate invocation context
   */
  protected validateContext(context: AgentInvocationContext): void {
    if (!context.objective || context.objective.trim().length === 0) {
      throw new Error('Invocation context must include a non-empty objective');
    }
  }
}

/**
 * Create an error result
 */
export function createErrorResult(
  agentName: string,
  error: Error | string
): AgentInvocationResult {
  return {
    agentName,
    success: false,
    error: error instanceof Error ? error.message : error,
  };
}

/**
 * Create a success result
 */
export function createSuccessResult(
  agentName: string,
  output: string,
  metadata?: Record<string, any>
): AgentInvocationResult {
  return {
    agentName,
    success: true,
    output,
    metadata,
  };
}

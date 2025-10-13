/**
 * Platform Adapters - Barrel Export
 * 
 * Unified interface for multi-platform agent invocation.
 * Supports Claude Code and OpenCode with automatic platform detection.
 */

// Core adapter interface and base class
export type {
  PlatformAdapter,
  AgentMetadata,
  AgentInvocationContext,
  AgentInvocationResult,
  BatchInvocationRequest,
  StreamingCallback
} from './platform-adapter.js';

export {
  BasePlatformAdapter,
  createErrorResult,
  createSuccessResult
} from './platform-adapter.js';

// Platform-specific implementations
export { ClaudeCodeAdapter, createClaudeAdapter } from './claude-adapter.js';
export { OpenCodeAdapter, createOpenCodeAdapter } from './opencode-adapter.js';

// Adapter factory for automatic creation
export {
  AdapterFactory,
  createAdapter
} from './adapter-factory.js';

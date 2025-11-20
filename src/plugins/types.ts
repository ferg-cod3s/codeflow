/**
 * Plugin Type Definitions for OpenCode Plugin System
 */

import type { Plugin } from "@opencode-ai/plugin"

// Re-export OpenCode Plugin type for convenience
export type { Plugin }

export interface PluginManifest {
  name: string
  version: string
  description: string
  category: PluginCategory
  author?: {
    name: string
    email?: string
    url?: string
  }
  repository?: {
    type: string
    url: string
  }
  keywords?: string[]
  dependencies?: string[]
  engines?: {
    opencode?: string
    node?: string
  }
  main: string
  files?: string[]
  exports?: Record<string, string>
}

export type PluginCategory = 
  | 'output-style'
  | 'mcp-wrapper' 
  | 'anthropic-converter'
  | 'command'
  | 'agent'
  | 'skill'

export interface OutputStyleConfig {
  mode: 'explanatory' | 'learning' | 'walkthrough' | 'concise' | 'none'
  showInsights: boolean
  interactiveMode: boolean
  validationEnabled: boolean
}

export interface MCPWrapperConfig {
  serverName: string
  serverPath: string
  timeout?: number
  retryAttempts?: number
  autoConnect?: boolean
}

export interface AnthropicConverterConfig {
  sourceFormat: 'claude-code' | 'claude-desktop'
  targetFormat: 'opencode'
  preserveHooks?: boolean
  convertCommands?: boolean
  convertAgents?: boolean
  convertSkills?: boolean
}

export interface PluginContext {
  workspace: string
  config: Record<string, any>
  logger: {
    info: (message: string, ...args: any[]) => void
    warn: (message: string, ...args: any[]) => void
    error: (message: string, ...args: any[]) => void
    debug: (message: string, ...args: any[]) => void
  }
}

export interface PluginEvent {
  type: string
  data?: any
  timestamp: Date
}

export interface PluginHook {
  before?: (context: PluginContext, event: PluginEvent) => Promise<void> | void
  after?: (context: PluginContext, event: PluginEvent) => Promise<void> | void
  onError?: (context: PluginContext, error: Error, event: PluginEvent) => Promise<void> | void
}

export interface PluginLifecycle {
  onLoad?: (context: PluginContext) => Promise<void> | void
  onUnload?: (context: PluginContext) => Promise<void> | void
  onEnable?: (context: PluginContext) => Promise<void> | void
  onDisable?: (context: PluginContext) => Promise<void> | void
}

export interface ExtendedPlugin extends Plugin {
  manifest?: PluginManifest
  lifecycle?: PluginLifecycle
  hooks?: Record<string, PluginHook>
  config?: Record<string, any>
}
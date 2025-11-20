/**
 * Plugin Registry System for OpenCode
 * 
 * Provides centralized loading and management of plugins across different categories:
 * - Output Styles: Modify Claude's response behavior and formatting
 * - MCP Wrappers: Integrate MCP servers as OpenCode plugins
 * - Anthropic Converters: Convert Claude Code plugins to OpenCode format
 */

import type { Plugin } from "@opencode-ai/plugin"

export interface PluginMetadata {
  name: string
  version: string
  description: string
  category: 'output-style' | 'mcp-wrapper' | 'anthropic-converter'
  author?: string
  tags?: string[]
  dependencies?: string[]
}

export interface PluginRegistration {
  metadata: PluginMetadata
  plugin: Plugin
  enabled: boolean
  loadedAt?: Date
}

export class PluginRegistry {
  private plugins = new Map<string, PluginRegistration>()
  private categories = new Map<string, Set<string>>()

  /**
   * Register a plugin with the registry
   */
  register(metadata: PluginMetadata, plugin: Plugin): void {
    const registration: PluginRegistration = {
      metadata,
      plugin,
      enabled: true,
      loadedAt: new Date()
    }

    this.plugins.set(metadata.name, registration)
    
    // Track by category
    if (!this.categories.has(metadata.category)) {
      this.categories.set(metadata.category, new Set())
    }
    this.categories.get(metadata.category)!.add(metadata.name)
  }

  /**
   * Get a specific plugin by name
   */
  get(name: string): PluginRegistration | undefined {
    return this.plugins.get(name)
  }

  /**
   * Get all plugins in a specific category
   */
  getByCategory(category: string): PluginRegistration[] {
    const pluginNames = this.categories.get(category) || new Set()
    return Array.from(pluginNames)
      .map(name => this.plugins.get(name))
      .filter(Boolean) as PluginRegistration[]
  }

  /**
   * Get all registered plugins
   */
  getAll(): PluginRegistration[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Enable or disable a plugin
   */
  setEnabled(name: string, enabled: boolean): boolean {
    const registration = this.plugins.get(name)
    if (registration) {
      registration.enabled = enabled
      return true
    }
    return false
  }

  /**
   * Unregister a plugin
   */
  unregister(name: string): boolean {
    const registration = this.plugins.get(name)
    if (registration) {
      // Remove from category
      this.categories.get(registration.metadata.category)?.delete(name)
      // Remove from registry
      this.plugins.delete(name)
      return true
    }
    return false
  }

  /**
   * Get plugin statistics
   */
  getStats() {
    const total = this.plugins.size
    const enabled = Array.from(this.plugins.values()).filter(p => p.enabled).length
    const byCategory = Object.fromEntries(
      Array.from(this.categories.entries()).map(([cat, plugins]) => [
        cat,
        plugins.size
      ])
    )

    return {
      total,
      enabled,
      disabled: total - enabled,
      byCategory
    }
  }
}

// Global registry instance
export const pluginRegistry = new PluginRegistry()
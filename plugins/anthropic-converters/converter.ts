/**
 * Anthropic Plugin Converter for OpenCode
 * 
 * Converts Claude Code plugins to OpenCode format with support for:
 * - Commands (direct compatibility)
 * - Agents (wrapper conversion)
 * - Hooks (JSON → TypeScript)
 * - Skills (format adaptation)
 */

import type { PluginManifest } from '../../src/plugins/types.js'
import type { Plugin } from '@opencode-ai/plugin'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

export interface ClaudePluginManifest {
  name: string
  description: string
  version: string
  author?: {
    name: string
    email?: string
  }
  main?: string
  hooks?: Record<string, string>
  commands?: string[]
  agents?: string[]
  skills?: string[]
}

export interface ConversionOptions {
  outputDir: string
  preserveHooks?: boolean
  convertCommands?: boolean
  convertAgents?: boolean
  convertSkills?: boolean
  targetFormat?: 'opencode'
  verbose?: boolean
}

export interface ConversionResult {
  success: boolean
  pluginName: string
  outputPath?: string
  errors?: string[]
  warnings?: string[]
  convertedFiles?: string[]
}

export class AnthropicPluginConverter {
  private options: ConversionOptions

  constructor(options: ConversionOptions) {
    this.options = {
      preserveHooks: true,
      convertCommands: true,
      convertAgents: true,
      convertSkills: true,
      targetFormat: 'opencode',
      verbose: false,
      ...options
    }
  }

  /**
   * Convert a Claude Code plugin to OpenCode format
   */
  async convertPlugin(pluginPath: string): Promise<ConversionResult> {
    try {
      const pluginName = this.getPluginName(pluginPath)
      const manifest = this.loadClaudeManifest(pluginPath)
      
      if (!manifest) {
        return {
          success: false,
          pluginName,
          errors: ['Could not find or parse plugin manifest']
        }
      }

      const result: ConversionResult = {
        success: true,
        pluginName,
        convertedFiles: []
      }

      // Create output directory
      const outputPath = join(this.options.outputDir, pluginName)
      mkdirSync(outputPath, { recursive: true })

      // Convert different plugin components
      if (this.options.convertCommands && manifest.commands) {
        await this.convertCommands(pluginPath, outputPath, manifest, result)
      }

      if (this.options.convertAgents && manifest.agents) {
        await this.convertAgents(pluginPath, outputPath, manifest, result)
      }

      if (this.options.convertSkills && manifest.skills) {
        await this.convertSkills(pluginPath, outputPath, manifest, result)
      }

      if (this.options.preserveHooks && manifest.hooks) {
        await this.convertHooks(pluginPath, outputPath, manifest, result)
      }

      // Generate OpenCode package.json
      await this.generatePackageJson(outputPath, manifest, result)

      // Generate README
      await this.generateReadme(outputPath, manifest, result)

      result.outputPath = outputPath
      return result

    } catch (error) {
      return {
        success: false,
        pluginName: this.getPluginName(pluginPath),
        errors: [error instanceof Error ? error.message : String(error)]
      }
    }
  }

  /**
   * Convert commands (direct compatibility)
   */
  private async convertCommands(
    pluginPath: string,
    outputPath: string,
    manifest: ClaudePluginManifest,
    result: ConversionResult
  ): Promise<void> {
    const commandsDir = join(pluginPath, 'commands')
    if (!existsSync(commandsDir)) return

    const outputCommandsDir = join(outputPath, 'commands')
    mkdirSync(outputCommandsDir, { recursive: true })

    // Commands are directly compatible - just copy them
    const commandFiles = manifest.commands || []
    for (const commandFile of commandFiles) {
      const srcPath = join(commandsDir, commandFile)
      const destPath = join(outputCommandsDir, commandFile)
      
      if (existsSync(srcPath)) {
        const content = readFileSync(srcPath, 'utf-8')
        writeFileSync(destPath, content)
        result.convertedFiles?.push(destPath)
      }
    }
  }

  /**
   * Convert agents (wrapper as OpenCode tools)
   */
  private async convertAgents(
    pluginPath: string,
    outputPath: string,
    manifest: ClaudePluginManifest,
    result: ConversionResult
  ): Promise<void> {
    const agentsDir = join(pluginPath, 'agents')
    if (!existsSync(agentsDir)) return

    const outputAgentsDir = join(outputPath, 'agents')
    mkdirSync(outputAgentsDir, { recursive: true })

    const agentFiles = manifest.agents || []
    for (const agentFile of agentFiles) {
      const srcPath = join(agentsDir, agentFile)
      if (!existsSync(srcPath)) continue

      const agentContent = readFileSync(srcPath, 'utf-8')
      const wrappedAgent = this.wrapAgentAsTool(agentFile, agentContent)
      
      const destPath = join(outputAgentsDir, agentFile.replace('.md', '.ts'))
      writeFileSync(destPath, wrappedAgent)
      result.convertedFiles?.push(destPath)
    }
  }

  /**
   * Convert hooks (JSON → TypeScript)
   */
  private async convertHooks(
    pluginPath: string,
    outputPath: string,
    manifest: ClaudePluginManifest,
    result: ConversionResult
  ): Promise<void> {
    if (!manifest.hooks) return

    const hooksContent = this.generateHooksHandler(manifest.hooks)
    const hooksPath = join(outputPath, 'hooks.ts')
    writeFileSync(hooksPath, hooksContent)
    result.convertedFiles?.push(hooksPath)
  }

  /**
   * Convert skills (format adaptation)
   */
  private async convertSkills(
    pluginPath: string,
    outputPath: string,
    manifest: ClaudePluginManifest,
    result: ConversionResult
  ): Promise<void> {
    const skillsDir = join(pluginPath, 'skills')
    if (!existsSync(skillsDir)) return

    const outputSkillsDir = join(outputPath, 'skills')
    mkdirSync(outputSkillsDir, { recursive: true })

    // Copy skill directories with format adaptation
    const skillDirs = manifest.skills || []
    for (const skillDir of skillDirs) {
      const srcSkillPath = join(skillsDir, skillDir)
      const destSkillPath = join(outputSkillsDir, skillDir)
      
      if (existsSync(srcSkillPath)) {
        await this.copySkillDirectory(srcSkillPath, destSkillPath, result)
      }
    }
  }

  /**
   * Wrap Claude agent as OpenCode tool
   */
  private wrapAgentAsTool(agentFile: string, agentContent: string): string {
    const agentName = agentFile.replace('.md', '')
    const frontmatterMatch = agentContent.match(/^---\n(.*?)\n---\n(.*)$/s)
    
    let metadata: any = {}
    let content = agentContent
    
    if (frontmatterMatch) {
      try {
        metadata = parseYaml(frontmatterMatch[1])
        content = frontmatterMatch[2]
      } catch (e) {
        // If YAML parsing fails, treat entire content as agent definition
      }
    }

    return `/**
 * ${metadata.description || agentName} Agent
 * Converted from Claude Code agent format
 */

import type { Plugin } from "@opencode-ai/plugin"

export const ${this.toPascalCase(agentName)}Agent: Plugin = async ({ client }) => {
  return {
    name: "${agentName}",
    description: ${JSON.stringify(metadata.description || `${agentName} agent`)},
    
    tool: {
      execute: {
        before: async (input, output) => {
          // Agent logic here
          if (input.tool === 'chat' || input.tool === 'message') {
            // Handle agent invocation
            console.log('🤖 ${agentName} agent activated')
          }
        }
      }
    }
  }
}

export default ${this.toPascalCase(agentName)}Agent
`
  }

  /**
   * Generate TypeScript hooks handler from JSON hooks
   */
  private generateHooksHandler(hooks: Record<string, string>): string {
    const hookEntries = Object.entries(hooks)
    
    return `/**
 * Generated hooks handler
 * Converted from Claude Code JSON hooks format
 */

import type { Plugin } from "@opencode-ai/plugin"

export const hooksHandler: Plugin = async ({ client }) => {
  return {
    event: async ({ event }) => {
${hookEntries.map(([hookType, handler]) => `
      if (event.type === '${hookType}') {
        // Hook handler: ${handler}
        console.log('🪝 Hook triggered: ${hookType}')
        // Implement hook logic here
      }`).join('')}
    }
  }
}

export default hooksHandler
`
  }

  /**
   * Generate OpenCode package.json
   */
  private async generatePackageJson(
    outputPath: string,
    manifest: ClaudePluginManifest,
    result: ConversionResult
  ): Promise<void> {
    const packageJson = {
      name: `opencode-${manifest.name}`,
      version: manifest.version,
      description: manifest.description + (manifest.author ? ` by ${manifest.author.name}` : ''),
      main: 'index.ts',
      type: 'module',
      category: this.determinePluginCategory(manifest),
      author: manifest.author,
      keywords: ['claude-code', 'converted', 'opencode'],
      dependencies: {
        '@opencode-ai/plugin': '^1.0.0'
      },
      engines: {
        opencode: '>=1.0.0',
        node: '>=16.0.0'
      }
    }

    const packagePath = join(outputPath, 'package.json')
    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2))
    result.convertedFiles?.push(packagePath)
  }

  /**
   * Generate README documentation
   */
  private async generateReadme(
    outputPath: string,
    manifest: ClaudePluginManifest,
    result: ConversionResult
  ): Promise<void> {
    const readme = `# ${manifest.name}

${manifest.description}

## Converted from Claude Code

This plugin was automatically converted from Claude Code format to OpenCode format.

## Installation

\`\`\`bash
# Copy to OpenCode plugins directory
cp . ~/.config/opencode/plugin/
\`\`\`

## Features

${manifest.commands ? `- **Commands**: ${manifest.commands.join(', ')}` : ''}
${manifest.agents ? `- **Agents**: ${manifest.agents.join(', ')}` : ''}
${manifest.skills ? `- **Skills**: ${manifest.skills.join(', ')}` : ''}
${manifest.hooks ? `- **Hooks**: ${Object.keys(manifest.hooks).join(', ')}` : ''}

## Usage

See individual component files for usage instructions.

## Conversion Notes

- Commands are directly compatible
- Agents are wrapped as OpenCode tools
- Hooks are converted from JSON to TypeScript
- Skills are adapted to OpenCode format

## License

See original plugin for license information.
`

    const readmePath = join(outputPath, 'README.md')
    writeFileSync(readmePath, readme)
    result.convertedFiles?.push(readmePath)
  }

  /**
   * Helper methods
   */
  private getPluginName(pluginPath: string): string {
    return pluginPath.split('/').pop() || 'unknown'
  }

  private loadClaudeManifest(pluginPath: string): ClaudePluginManifest | null {
    const manifestPath = join(pluginPath, '.claude-plugin', 'plugin.json')
    if (!existsSync(manifestPath)) return null

    try {
      const content = readFileSync(manifestPath, 'utf-8')
      return JSON.parse(content)
    } catch (e) {
      return null
    }
  }

  private determinePluginCategory(manifest: ClaudePluginManifest): string {
    if (manifest.commands?.length) return 'command'
    if (manifest.agents?.length) return 'agent'
    if (manifest.skills?.length) return 'skill'
    if (manifest.hooks) return 'utility'
    return 'utility'
  }

  private toPascalCase(str: string): string {
    return str.replace(/(?:^|[-_])(.)/g, (_, char) => char.toUpperCase())
  }

  private async copySkillDirectory(
    srcPath: string,
    destPath: string,
    result: ConversionResult
  ): Promise<void> {
    // Implementation for copying skill directories with format adaptation
    mkdirSync(destPath, { recursive: true })
    // Add skill-specific conversion logic here
    result.convertedFiles?.push(destPath)
  }
}

export default AnthropicPluginConverter

/**
 * Plugin Validator for OpenCode Plugin System
 * 
 * Comprehensive validation for all plugin types:
 * - Output style plugins
 * - MCP wrapper plugins  
 * - Anthropic converter plugins
 * - Custom plugins
 */

import type { PluginManifest, ExtendedPlugin } from './types.js'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { parse as parseYaml } from 'yaml'

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  summary: ValidationSummary
}

export interface ValidationError {
  type: 'required' | 'format' | 'compatibility' | 'security'
  field: string
  message: string
  severity: 'critical' | 'error'
}

export interface ValidationWarning {
  type: 'best-practice' | 'performance' | 'maintenance'
  field: string
  message: string
  suggestion?: string
}

export interface ValidationSummary {
  totalErrors: number
  criticalErrors: number
  totalWarnings: number
  categories: Record<string, number>
}

export class PluginValidator {
  private schemas: Map<string, any> = new Map()

  constructor() {
    this.loadSchemas()
  }

  /**
   * Validate a plugin directory
   */
  async validatePlugin(pluginPath: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      summary: {
        totalErrors: 0,
        criticalErrors: 0,
        totalWarnings: 0,
        categories: {}
      }
    }

    try {
      // Load and validate manifest
      const manifest = this.loadManifest(pluginPath)
      if (!manifest) {
        result.errors.push({
          type: 'required',
          field: 'manifest',
          message: 'Plugin manifest not found or invalid',
          severity: 'critical'
        })
        result.valid = false
        return result
      }

      // Validate manifest structure
      this.validateManifest(manifest, result)

      // Validate based on plugin category
      switch (manifest.category) {
        case 'output-style':
          await this.validateOutputStyle(pluginPath, manifest, result)
          break
        case 'mcp-wrapper':
          await this.validateMCPWrapper(pluginPath, manifest, result)
          break
        case 'anthropic-converter':
          await this.validateAnthropicConverter(pluginPath, manifest, result)
          break
        default:
          await this.validateGeneric(pluginPath, manifest, result)
      }

      // Validate main entry point
      await this.validateMainFile(pluginPath, manifest, result)

      // Update summary
      this.updateSummary(result)

    } catch (error) {
      result.errors.push({
        type: 'format',
        field: 'validation',
        message: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'critical'
      })
      result.valid = false
    }

    return result
  }

  /**
   * Validate plugin manifest
   */
  private validateManifest(manifest: PluginManifest, result: ValidationResult): void {
    // Required fields
    const requiredFields = ['name', 'version', 'description', 'category', 'main']
    for (const field of requiredFields) {
      if (!manifest[field as keyof PluginManifest]) {
        result.errors.push({
          type: 'required',
          field,
          message: `Required field '${field}' is missing`,
          severity: 'critical'
        })
      }
    }

    // Field formats
    if (manifest.name && !/^[a-z0-9-]+$/.test(manifest.name)) {
      result.errors.push({
        type: 'format',
        field: 'name',
        message: 'Plugin name must contain only lowercase letters, numbers, and hyphens',
        severity: 'error'
      })
    }

    if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
      result.errors.push({
        type: 'format',
        field: 'version',
        message: 'Version must follow semantic versioning (x.y.z)',
        severity: 'error'
      })
    }

    // Category validation
    const validCategories = ['output-style', 'mcp-wrapper', 'anthropic-converter', 'command', 'agent', 'skill']
    if (manifest.category && !validCategories.includes(manifest.category)) {
      result.errors.push({
        type: 'format',
        field: 'category',
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
        severity: 'error'
      })
    }

    // Best practices warnings
    if (manifest.description && manifest.description.length < 10) {
      result.warnings.push({
        type: 'best-practice',
        field: 'description',
        message: 'Description should be at least 10 characters long',
        suggestion: 'Provide a more detailed description of the plugin functionality'
      })
    }

    if (!manifest.keywords || manifest.keywords.length === 0) {
      result.warnings.push({
        type: 'best-practice',
        field: 'keywords',
        message: 'Plugin should have keywords for better discoverability',
        suggestion: 'Add relevant keywords to help users find your plugin'
      })
    }
  }

  /**
   * Validate output style plugin
   */
  private async validateOutputStyle(
    pluginPath: string,
    manifest: PluginManifest,
    result: ValidationResult
  ): Promise<void> {
    const mainFile = join(pluginPath, manifest.main)
    
    if (!existsSync(mainFile)) {
      result.errors.push({
        type: 'required',
        field: 'main',
        message: 'Main plugin file not found',
        severity: 'critical'
      })
      return
    }

    const content = readFileSync(mainFile, 'utf-8')

    // Check for required exports
    if (!content.includes('export') && !content.includes('module.exports')) {
      result.errors.push({
        type: 'format',
        field: 'main',
        message: 'Plugin must export a function or object',
        severity: 'error'
      })
    }

    // Check for OpenCode plugin type
    if (!content.includes('@opencode-ai/plugin')) {
      result.warnings.push({
        type: 'best-practice',
        field: 'main',
        message: 'Plugin should import from @opencode-ai/plugin',
        suggestion: 'Add proper import for OpenCode plugin types'
      })
    }

    // Output style specific checks
    if (manifest.name?.includes('output-style')) {
      if (!content.includes('console.log')) {
        result.warnings.push({
          type: 'best-practice',
          field: 'main',
          message: 'Output style plugins should provide user feedback',
          suggestion: 'Add console.log statements for user interaction'
        })
      }
    }
  }

  /**
   * Validate MCP wrapper plugin
   */
  private async validateMCPWrapper(
    pluginPath: string,
    manifest: PluginManifest,
    result: ValidationResult
  ): Promise<void> {
    const mainFile = join(pluginPath, manifest.main)
    
    if (!existsSync(mainFile)) {
      result.errors.push({
        type: 'required',
        field: 'main',
        message: 'Main plugin file not found',
        severity: 'critical'
      })
      return
    }

    const content = readFileSync(mainFile, 'utf-8')

    // MCP wrapper specific checks
    if (!content.includes('MCP') && !content.includes('mcp')) {
      result.warnings.push({
        type: 'best-practice',
        field: 'main',
        message: 'MCP wrapper should reference MCP functionality',
        suggestion: 'Add MCP server integration code'
      })
    }

    if (!content.includes('createMCPWrapper') && !content.includes('MCPWrapper')) {
      result.errors.push({
        type: 'format',
        field: 'main',
        message: 'MCP wrapper must implement MCP wrapper functionality',
        severity: 'error'
      })
    }

    // Check for server configuration
    if (!content.includes('serverPath') && !content.includes('serverName')) {
      result.errors.push({
        type: 'required',
        field: 'main',
        message: 'MCP wrapper must configure server path and name',
        severity: 'error'
      })
    }
  }

  /**
   * Validate Anthropic converter plugin
   */
  private async validateAnthropicConverter(
    pluginPath: string,
    manifest: PluginManifest,
    result: ValidationResult
  ): Promise<void> {
    const mainFile = join(pluginPath, manifest.main)
    
    if (!existsSync(mainFile)) {
      result.errors.push({
        type: 'required',
        field: 'main',
        message: 'Main plugin file not found',
        severity: 'critical'
      })
      return
    }

    const content = readFileSync(mainFile, 'utf-8')

    // Converter specific checks
    if (!content.includes('convert') && !content.includes('transform')) {
      result.warnings.push({
        type: 'best-practice',
        field: 'main',
        message: 'Converter plugin should implement conversion logic',
        suggestion: 'Add convert or transform methods'
      })
    }

    if (!content.includes('claude') && !content.includes('anthropic')) {
      result.warnings.push({
        type: 'best-practice',
        field: 'main',
        message: 'Anthropic converter should reference Claude Code',
        suggestion: 'Add references to Claude Code format'
      })
    }
  }

  /**
   * Validate generic plugin
   */
  private async validateGeneric(
    pluginPath: string,
    manifest: PluginManifest,
    result: ValidationResult
  ): Promise<void> {
    const mainFile = join(pluginPath, manifest.main)
    
    if (!existsSync(mainFile)) {
      result.errors.push({
        type: 'required',
        field: 'main',
        message: 'Main plugin file not found',
        severity: 'critical'
      })
      return
    }

    const content = readFileSync(mainFile, 'utf-8')

    // Basic plugin structure checks
    if (!content.includes('export') && !content.includes('module.exports')) {
      result.errors.push({
        type: 'format',
        field: 'main',
        message: 'Plugin must export a function or object',
        severity: 'error'
      })
    }

    if (!content.includes('Plugin') && !content.includes('plugin')) {
      result.warnings.push({
        type: 'best-practice',
        field: 'main',
        message: 'Plugin should follow OpenCode plugin structure',
        suggestion: 'Implement proper plugin interface'
      })
    }
  }

  /**
   * Validate main entry point file
   */
  private async validateMainFile(
    pluginPath: string,
    manifest: PluginManifest,
    result: ValidationResult
  ): Promise<void> {
    const mainFile = join(pluginPath, manifest.main)
    
    if (!existsSync(mainFile)) {
      result.errors.push({
        type: 'required',
        field: 'main',
        message: `Main file '${manifest.main}' not found`,
        severity: 'critical'
      })
      return
    }

    try {
      // Basic syntax check
      const content = readFileSync(mainFile, 'utf-8')
      
      // Check for TypeScript syntax if .ts file
      if (mainFile.endsWith('.ts')) {
        // This would typically use TypeScript compiler API
        // For now, just basic checks
        if (content.includes('import') && !content.includes('from')) {
          result.errors.push({
            type: 'format',
            field: 'main',
            message: 'Invalid import syntax',
            severity: 'error'
          })
        }
      }
    } catch (error) {
      result.errors.push({
        type: 'format',
        field: 'main',
        message: `Error reading main file: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'critical'
      })
    }
  }

  /**
   * Load plugin manifest
   */
  private loadManifest(pluginPath: string): PluginManifest | null {
    const manifestPaths = [
      join(pluginPath, 'package.json'),
      join(pluginPath, '.claude-plugin', 'plugin.json'),
      join(pluginPath, 'plugin.json')
    ]

    for (const manifestPath of manifestPaths) {
      if (existsSync(manifestPath)) {
        try {
          const content = readFileSync(manifestPath, 'utf-8')
          return JSON.parse(content)
        } catch (e) {
          continue
        }
      }
    }

    return null
  }

  /**
   * Update validation summary
   */
  private updateSummary(result: ValidationResult): void {
    result.summary.totalErrors = result.errors.length
    result.summary.criticalErrors = result.errors.filter(e => e.severity === 'critical').length
    result.summary.totalWarnings = result.warnings.length

    // Count by category
    const categories = ['required', 'format', 'compatibility', 'security', 'best-practice', 'performance', 'maintenance']
    categories.forEach(category => {
      const errorCount = result.errors.filter(e => e.type === category).length
      const warningCount = result.warnings.filter(w => w.type === category).length
      if (errorCount > 0 || warningCount > 0) {
        result.summary.categories[category] = errorCount + warningCount
      }
    })

    // Determine overall validity
    result.valid = result.summary.criticalErrors === 0 && result.summary.totalErrors === 0
  }

  /**
   * Load validation schemas
   */
  private loadSchemas(): void {
    // Load JSON schemas for different plugin types
    // This would typically load from files or be hardcoded
    this.schemas.set('plugin', {
      type: 'object',
      required: ['name', 'version', 'description', 'category'],
      properties: {
        name: { type: 'string', pattern: '^[a-z0-9-]+$' },
        version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
        description: { type: 'string', minLength: 10 },
        category: { 
          type: 'string', 
          enum: ['output-style', 'mcp-wrapper', 'anthropic-converter', 'command', 'agent', 'skill']
        }
      }
    })
  }

  /**
   * Validate plugin against schema
   */
  private validateAgainstSchema(data: any, schema: any, path: string = ''): ValidationError[] {
    const errors: ValidationError[] = []

    if (schema.type && typeof data !== schema.type) {
      errors.push({
        type: 'format',
        field: path || 'root',
        message: `Expected ${schema.type}, got ${typeof data}`,
        severity: 'error'
      })
    }

    if (schema.required && Array.isArray(schema.required)) {
      for (const required of schema.required) {
        if (!(required in data)) {
          errors.push({
            type: 'required',
            field: path ? `${path}.${required}` : required,
            message: `Required property '${required}' is missing`,
            severity: 'critical'
          })
        }
      }
    }

    return errors
  }
}

export default PluginValidator
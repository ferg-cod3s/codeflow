import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYAML } from 'yaml';
import { Platform } from './platform-detector.js';

/**
 * Research workflow configuration
 */
export interface ResearchConfig {
  // Core settings
  includeWeb?: boolean;
  minQualityScore?: number;
  timeout?: number;
  maxAgents?: number;

  // Output settings
  outputFormat?: 'terminal' | 'markdown' | 'json' | 'html' | 'pdf';
  outputPath?: string;
  verbose?: boolean;

  // Theme settings
  theme?: 'default' | 'minimal' | 'rich' | 'neon' | 'professional';
  colorEnabled?: boolean;

  // Watch mode settings
  watchMode?: boolean;
  watchPaths?: string[];
  watchDebounce?: number;

  // Interactive mode settings
  interactive?: boolean;

  // Platform-specific settings
  platform?: {
    claude?: {
      timeout?: number;
      maxConcurrent?: number;
    };
    opencode?: {
      mcpEndpoint?: string;
      streaming?: boolean;
      timeout?: number;
    };
  };

  // Agent preferences
  preferredAgents?: {
    locator?: string;
    analyzer?: string;
    researcher?: string;
  };

  // Quality thresholds
  qualityThresholds?: {
    completeness?: number;
    accuracy?: number;
    confidence?: number;
  };
}

/**
 * Configuration file formats
 */
type ConfigFormat = 'json' | 'yaml';

/**
 * Configuration file names to search for
 */
const CONFIG_FILENAMES: { name: string; format: ConfigFormat }[] = [
  { name: '.codeflowrc.json', format: 'json' },
  { name: '.codeflowrc.yaml', format: 'yaml' },
  { name: '.codeflowrc.yml', format: 'yaml' },
  { name: 'codeflow.config.json', format: 'json' },
  { name: 'codeflow.config.yaml', format: 'yaml' },
];

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ResearchConfig = {
  includeWeb: false,
  minQualityScore: 50,
  timeout: 300000, // 5 minutes
  maxAgents: 10,
  outputFormat: 'terminal',
  verbose: false,
  theme: 'default',
  colorEnabled: true,
  watchMode: false,
  watchDebounce: 1000,
  interactive: false,
  qualityThresholds: {
    completeness: 70,
    accuracy: 80,
    confidence: 0.7,
  },
};

/**
 * Configuration Loader
 * 
 * Loads research workflow configuration from:
 * 1. Configuration files (.codeflowrc.json, .codeflowrc.yaml)
 * 2. Package.json (codeflow section)
 * 3. Environment variables
 * 4. Default values
 * 
 * Supports platform-specific overrides and merging strategies.
 */
export class ConfigLoader {
  private projectRoot: string;
  private platform?: Platform;

  constructor(projectRoot: string, platform?: Platform) {
    this.projectRoot = projectRoot;
    this.platform = platform;
  }

  /**
   * Load configuration from all sources
   * Priority: CLI args > config file > package.json > env vars > defaults
   */
  async load(cliOverrides?: Partial<ResearchConfig>): Promise<ResearchConfig> {
    // Start with defaults
    let config: ResearchConfig = { ...DEFAULT_CONFIG };

    // Load from environment variables
    const envConfig = this.loadFromEnv();
    config = this.merge(config, envConfig);

    // Load from package.json
    const packageConfig = await this.loadFromPackageJson();
    if (packageConfig) {
      config = this.merge(config, packageConfig);
    }

    // Load from config file
    const fileConfig = await this.loadFromFile();
    if (fileConfig) {
      config = this.merge(config, fileConfig);
    }

    // Apply CLI overrides
    if (cliOverrides) {
      config = this.merge(config, cliOverrides);
    }

    // Apply platform-specific overrides
    if (this.platform) {
      config = this.applyPlatformOverrides(config, this.platform);
    }

    return config;
  }

  /**
   * Load configuration from file
   */
  private async loadFromFile(): Promise<ResearchConfig | null> {
    for (const { name, format } of CONFIG_FILENAMES) {
      const filePath = join(this.projectRoot, name);
      
      if (existsSync(filePath)) {
        try {
          const content = await readFile(filePath, 'utf-8');
          
          if (format === 'json') {
            return JSON.parse(content);
          } else {
            return parseYAML(content);
          }
        } catch (error) {
          console.warn(`Warning: Failed to parse ${name}:`, error);
        }
      }
    }

    return null;
  }

  /**
   * Load configuration from package.json
   */
  private async loadFromPackageJson(): Promise<ResearchConfig | null> {
    const packageJsonPath = join(this.projectRoot, 'package.json');
    
    if (!existsSync(packageJsonPath)) {
      return null;
    }

    try {
      const content = await readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);
      
      return packageJson.codeflow || null;
    } catch (error) {
      console.warn('Warning: Failed to parse package.json:', error);
      return null;
    }
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnv(): Partial<ResearchConfig> {
    const config: Partial<ResearchConfig> = {};

    if (process.env.CODEFLOW_INCLUDE_WEB) {
      config.includeWeb = process.env.CODEFLOW_INCLUDE_WEB === 'true';
    }

    if (process.env.CODEFLOW_MIN_QUALITY) {
      config.minQualityScore = parseInt(process.env.CODEFLOW_MIN_QUALITY, 10);
    }

    if (process.env.CODEFLOW_TIMEOUT) {
      config.timeout = parseInt(process.env.CODEFLOW_TIMEOUT, 10);
    }

    if (process.env.CODEFLOW_OUTPUT_FORMAT) {
      config.outputFormat = process.env.CODEFLOW_OUTPUT_FORMAT as any;
    }

    if (process.env.CODEFLOW_THEME) {
      config.theme = process.env.CODEFLOW_THEME as any;
    }

    if (process.env.CODEFLOW_VERBOSE) {
      config.verbose = process.env.CODEFLOW_VERBOSE === 'true';
    }

    if (process.env.CODEFLOW_WATCH) {
      config.watchMode = process.env.CODEFLOW_WATCH === 'true';
    }

    return config;
  }

  /**
   * Merge two configurations
   * Deep merge for nested objects, shallow for primitives
   */
  private merge(base: ResearchConfig, override: Partial<ResearchConfig>): ResearchConfig {
    const merged = { ...base };

    for (const key in override) {
      const value = override[key as keyof ResearchConfig];
      
      if (value === undefined) {
        continue;
      }

      if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        // Deep merge for nested objects
        merged[key as keyof ResearchConfig] = {
          ...(merged[key as keyof ResearchConfig] as any),
          ...value,
        } as any;
      } else {
        // Shallow copy for primitives and arrays
        merged[key as keyof ResearchConfig] = value as any;
      }
    }

    return merged;
  }

  /**
   * Apply platform-specific overrides
   */
  private applyPlatformOverrides(config: ResearchConfig, platform: Platform): ResearchConfig {
    const merged = { ...config };

    if (platform === Platform.CLAUDE_CODE && config.platform?.claude) {
      if (config.platform.claude.timeout) {
        merged.timeout = config.platform.claude.timeout;
      }
      if (config.platform.claude.maxConcurrent) {
        merged.maxAgents = config.platform.claude.maxConcurrent;
      }
    }

    if (platform === Platform.OPENCODE && config.platform?.opencode) {
      if (config.platform.opencode.timeout) {
        merged.timeout = config.platform.opencode.timeout;
      }
    }

    return merged;
  }

  /**
   * Validate configuration
   */
  validate(config: ResearchConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.minQualityScore !== undefined) {
      if (config.minQualityScore < 0 || config.minQualityScore > 100) {
        errors.push('minQualityScore must be between 0 and 100');
      }
    }

    if (config.timeout !== undefined && config.timeout < 0) {
      errors.push('timeout must be positive');
    }

    if (config.maxAgents !== undefined && config.maxAgents < 1) {
      errors.push('maxAgents must be at least 1');
    }

    if (config.outputFormat) {
      const validFormats = ['terminal', 'markdown', 'json', 'html', 'pdf'];
      if (!validFormats.includes(config.outputFormat)) {
        errors.push(`outputFormat must be one of: ${validFormats.join(', ')}`);
      }
    }

    if (config.theme) {
      const validThemes = ['default', 'minimal', 'rich', 'neon', 'professional'];
      if (!validThemes.includes(config.theme)) {
        errors.push(`theme must be one of: ${validThemes.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Quick configuration loader helper
 */
export async function loadConfig(
  projectRoot: string,
  platform?: Platform,
  cliOverrides?: Partial<ResearchConfig>
): Promise<ResearchConfig> {
  const loader = new ConfigLoader(projectRoot, platform);
  const config = await loader.load(cliOverrides);
  
  const validation = loader.validate(config);
  if (!validation.valid) {
    throw new Error(`Invalid configuration:\n${validation.errors.join('\n')}`);
  }

  return config;
}

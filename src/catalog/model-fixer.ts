/**
 * Model fixer for catalog items
 * Ensures correct model configuration when installing agents and commands
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface ModelConfig {
  opencode: {
    commands: string;
    agents: string;
    fallback?: string;
  };
  claude: {
    default: string;
  };
}

export class ModelFixer {
  private modelConfig: ModelConfig;

  constructor(projectRoot: string) {
    this.modelConfig = this.loadModelConfig(projectRoot);
  }

  private loadModelConfig(projectRoot: string): ModelConfig {
    try {
      const configPath = join(projectRoot, 'config', 'models.json');
      if (existsSync(configPath)) {
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));
        return config;
      }
    } catch (_error) {
      console.warn('⚠️  Could not load model config, using defaults');
    }

    // Default configuration
    return {
      opencode: {
        commands: 'opencode/code-supernova',
        agents: 'opencode/grok-code',
        fallback: 'opencode/grok-code',
      },
      claude: {
        default: 'claude-sonnet-4-20250514',
      },
    };
  }

  /**
   * Fix model in content based on target format
   */
  fixModel(
    content: string,
    target: 'claude-code' | 'opencode',
    itemType: 'agent' | 'command'
  ): string {
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      return content;
    }

    let frontmatter = frontmatterMatch[1];
    const bodyContent = content.substring(frontmatterMatch[0].length);

    // Determine the correct model based on target and type
    let correctModel: string;
    if (target === 'claude-code') {
      correctModel = this.modelConfig.claude.default;
    } else if (target === 'opencode') {
      correctModel =
        itemType === 'command'
          ? this.modelConfig.opencode.commands
          : this.modelConfig.opencode.agents;
    } else {
      return content; // Unknown target, don't modify
    }

    // Replace model line in frontmatter
    const modelLineRegex = /^model:.*$/m;
    if (modelLineRegex.test(frontmatter)) {
      frontmatter = frontmatter.replace(modelLineRegex, `model: ${correctModel}`);
    } else {
      // Add model if it doesn't exist
      frontmatter += `\nmodel: ${correctModel}`;
    }

    return `---\n${frontmatter}\n---${bodyContent}`;
  }

  /**
   * Get the correct model for a given target and type
   */
  getModel(target: 'claude-code' | 'opencode', itemType: 'agent' | 'command'): string {
    if (target === 'claude-code') {
      return this.modelConfig.claude.default;
    } else if (target === 'opencode') {
      return itemType === 'command'
        ? this.modelConfig.opencode.commands
        : this.modelConfig.opencode.agents;
    }
    return this.modelConfig.opencode.fallback || 'opencode/grok-code';
  }

  /**
   * Check if a model string is valid for a target
   */
  isValidModel(model: string, target: 'claude-code' | 'opencode'): boolean {
    if (target === 'claude-code') {
      // Claude Code doesn't need provider prefix
      return !model.includes('/');
    } else if (target === 'opencode') {
      // OpenCode needs provider/model format
      return model.includes('/');
    }
    return false;
  }
}

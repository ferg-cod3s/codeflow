/**
 * Interactive Prompts
 * Question flows for CLI configuration
 */

import inquirer from 'inquirer';
import type { Theme } from '../themes/types.js';
import { getTheme, listPresets, getPresetDescriptions } from '../themes/index.js';

/**
 * Research configuration from interactive prompts
 */
export interface ResearchConfig {
  query: string;
  agentType?: string;
  platform?: 'claude' | 'opencode' | 'auto';
  theme?: string;
  outputFormat?: 'text' | 'json' | 'markdown';
  verbose?: boolean;
  depth?: 'shallow' | 'medium' | 'deep';
}

/**
 * Interactive prompt manager
 */
export class InteractivePrompts {
  private theme: Theme;

  constructor(theme?: Theme) {
    this.theme = theme ?? getTheme();
  }

  /**
   * Run research configuration flow
   */
  async promptResearchConfig(defaults?: Partial<ResearchConfig>): Promise<ResearchConfig> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'query',
        message: 'What would you like to research?',
        default: defaults?.query,
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Query cannot be empty';
          }
          if (input.trim().length < 3) {
            return 'Query must be at least 3 characters';
          }
          return true;
        },
      },
      {
        type: 'list',
        name: 'depth',
        message: 'Research depth:',
        choices: [
          { name: 'Shallow - Quick overview', value: 'shallow' },
          { name: 'Medium - Balanced analysis (recommended)', value: 'medium' },
          { name: 'Deep - Comprehensive investigation', value: 'deep' },
        ],
        default: defaults?.depth ?? 'medium',
      },
      {
        type: 'input',
        name: 'agentType',
        message: 'Preferred agent (leave empty for auto-selection):',
        default: defaults?.agentType ?? '',
      },
      {
        type: 'list',
        name: 'platform',
        message: 'Platform preference:',
        choices: [
          { name: 'Auto-detect (recommended)', value: 'auto' },
          { name: 'Claude Code', value: 'claude' },
          { name: 'OpenCode', value: 'opencode' },
        ],
        default: defaults?.platform ?? 'auto',
      },
      {
        type: 'list',
        name: 'outputFormat',
        message: 'Output format:',
        choices: [
          { name: 'Text (styled)', value: 'text' },
          { name: 'JSON', value: 'json' },
          { name: 'Markdown', value: 'markdown' },
        ],
        default: defaults?.outputFormat ?? 'text',
      },
      {
        type: 'confirm',
        name: 'verbose',
        message: 'Enable verbose output?',
        default: defaults?.verbose ?? false,
      },
    ]);

    return {
      query: answers.query,
      agentType: answers.agentType || undefined,
      platform: answers.platform,
      outputFormat: answers.outputFormat,
      verbose: answers.verbose,
      depth: answers.depth,
    };
  }

  /**
   * Prompt for theme selection
   */
  async promptThemeSelection(currentTheme?: string): Promise<string> {
    const presets = listPresets();
    const descriptions = getPresetDescriptions();

    const choices = presets.map((preset) => ({
      name: `${preset} - ${descriptions[preset]}`,
      value: preset,
    }));

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'theme',
        message: 'Select a theme:',
        choices,
        default: currentTheme ?? 'default',
      },
    ]);

    return answer.theme;
  }

  /**
   * Prompt for agent selection
   */
  async promptAgentSelection(
    agents: Array<{ name: string; description?: string; tags?: string[] }>,
    category?: string
  ): Promise<string> {
    const choices = agents.map((agent) => ({
      name: `${agent.name}${agent.description ? ` - ${agent.description}` : ''}`,
      value: agent.name,
    }));

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'agent',
        message: category ? `Select ${category} agent:` : 'Select an agent:',
        choices,
        pageSize: 15,
      },
    ]);

    return answer.agent;
  }

  /**
   * Prompt for confirmation
   */
  async promptConfirm(message: string, defaultValue = true): Promise<boolean> {
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message,
        default: defaultValue,
      },
    ]);

    return answer.confirmed;
  }

  /**
   * Prompt for multiple choices
   */
  async promptMultipleChoice<T extends string>(
    message: string,
    choices: Array<{ name: string; value: T }>,
    defaultValue?: T
  ): Promise<T> {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message,
        choices,
        default: defaultValue,
      },
    ]);

    return answer.choice;
  }

  /**
   * Prompt for checkbox selection
   */
  async promptCheckbox<T extends string>(
    message: string,
    choices: Array<{ name: string; value: T; checked?: boolean }>,
    validate?: (selected: T[]) => boolean | string
  ): Promise<T[]> {
    const promptConfig: any = {
      type: 'checkbox',
      name: 'selected',
      message,
      choices,
    };

    if (validate) {
      promptConfig.validate = validate;
    }

    const answer = await inquirer.prompt([promptConfig]);

    return answer.selected;
  }

  /**
   * Prompt for text input
   */
  async promptInput(
    message: string,
    defaultValue?: string,
    validate?: (input: string) => boolean | string
  ): Promise<string> {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message,
        default: defaultValue,
        validate,
      },
    ]);

    return answer.input;
  }

  /**
   * Prompt for password/secret input
   */
  async promptPassword(
    message: string,
    validate?: (input: string) => boolean | string
  ): Promise<string> {
    const answer = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message,
        mask: '*',
        validate,
      },
    ]);

    return answer.password;
  }

  /**
   * Prompt for editor input (multi-line)
   */
  async promptEditor(message: string, defaultValue?: string): Promise<string> {
    const answer = await inquirer.prompt([
      {
        type: 'editor',
        name: 'content',
        message,
        default: defaultValue,
      },
    ]);

    return answer.content;
  }
}

/**
 * Global interactive prompts instance
 */
let globalPrompts: InteractivePrompts | null = null;

/**
 * Get global prompts instance
 */
export function getPrompts(theme?: Theme): InteractivePrompts {
  if (!globalPrompts || theme) {
    globalPrompts = new InteractivePrompts(theme);
  }
  return globalPrompts;
}

/**
 * Convenience function to run research config flow
 */
export async function promptResearchConfig(
  defaults?: Partial<ResearchConfig>
): Promise<ResearchConfig> {
  return getPrompts().promptResearchConfig(defaults);
}

/**
 * Convenience function to prompt for theme
 */
export async function promptTheme(currentTheme?: string): Promise<string> {
  return getPrompts().promptThemeSelection(currentTheme);
}

/**
 * Convenience function to prompt for agent
 */
export async function promptAgent(
  agents: Array<{ name: string; description?: string; tags?: string[] }>,
  category?: string
): Promise<string> {
  return getPrompts().promptAgentSelection(agents, category);
}

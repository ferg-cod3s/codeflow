/**
 * Interactive Wizard
 * Step-by-step guided flows
 */

import chalk from 'chalk';
import type { Theme } from '../themes/types.js';
import { getTheme } from '../themes/index.js';
import { InteractivePrompts } from './prompts.js';
import { renderBox, renderInfo } from '../display/index.js';

/**
 * Wizard step
 */
export interface WizardStep {
  name: string;
  title: string;
  description?: string;
  action: () => Promise<unknown>;
  validate?: (result: unknown) => boolean | string;
  onComplete?: (result: unknown) => void;
}

/**
 * Wizard configuration
 */
export interface WizardConfig {
  title: string;
  description?: string;
  steps: WizardStep[];
  theme?: Theme;
  showProgress?: boolean;
}

/**
 * Wizard result
 */
export interface WizardResult {
  completed: boolean;
  results: Map<string, unknown>;
  cancelled?: boolean;
  error?: Error;
}

/**
 * Interactive Wizard
 */
export class Wizard {
  private theme: Theme;
  private prompts: InteractivePrompts;
  private config: WizardConfig;
  private results: Map<string, unknown> = new Map();
  private currentStep = 0;

  constructor(config: WizardConfig) {
    this.config = config;
    this.theme = config.theme ?? getTheme();
    this.prompts = new InteractivePrompts(this.theme);
  }

  /**
   * Run the wizard
   */
  async run(): Promise<WizardResult> {
    try {
      // Show welcome
      this.showWelcome();

      // Execute steps
      for (let i = 0; i < this.config.steps.length; i++) {
        this.currentStep = i;
        const step = this.config.steps[i];

        if (this.config.showProgress ?? true) {
          this.showProgress(i + 1, this.config.steps.length);
        }

        // Show step info
        this.showStepInfo(step);

        // Execute step action
        const result = await step.action();

        // Validate result
        if (step.validate) {
          const validation = step.validate(result);
          if (validation !== true) {
            console.log(
              (chalk as any)[this.theme.colors.error](
                typeof validation === 'string' ? validation : 'Validation failed'
              )
            );

            // Ask to retry or skip
            const retry = await this.prompts.promptConfirm('Retry this step?', true);
            if (retry) {
              i--; // Retry current step
              continue;
            } else {
              const skip = await this.prompts.promptConfirm('Skip this step?', false);
              if (!skip) {
                return {
                  completed: false,
                  results: this.results,
                  cancelled: true,
                };
              }
            }
          }
        }

        // Store result
        this.results.set(step.name, result);

        // Call onComplete callback
        if (step.onComplete) {
          step.onComplete(result);
        }
      }

      // Show completion
      this.showCompletion();

      return {
        completed: true,
        results: this.results,
      };
    } catch (error) {
      return {
        completed: false,
        results: this.results,
        error: error as Error,
      };
    }
  }

  /**
   * Show welcome screen
   */
  private showWelcome(): void {
    const title = (chalk.bold as any)[this.theme.colors.primary](this.config.title);
    const description = this.config.description
      ? (chalk as any)[this.theme.colors.muted](this.config.description)
      : '';

    console.log(
      '\n' +
        renderBox(`${title}\n${description}`, {
          theme: this.theme,
          borderColor: this.theme.colors.primary,
          padding: 2,
        })
    );
    console.log('');
  }

  /**
   * Show step info
   */
  private showStepInfo(step: WizardStep): void {
    console.log((chalk.bold as any)[this.theme.colors.secondary](`\n${step.title}`));
    if (step.description) {
      console.log((chalk as any)[this.theme.colors.muted](step.description));
    }
    console.log('');
  }

  /**
   * Show progress
   */
  private showProgress(current: number, total: number): void {
    const percentage = Math.round((current / total) * 100);
    const bar = this.renderProgressBar(current, total);
    console.log(chalk.dim(`Step ${current} of ${total} (${percentage}%)`));
    console.log(bar);
  }

  /**
   * Render simple progress bar
   */
  private renderProgressBar(current: number, total: number): string {
    const width = 40;
    const filled = Math.round((current / total) * width);
    const empty = width - filled;

    return (
      (chalk as any)[this.theme.colors.success]('█'.repeat(filled)) + chalk.dim('░'.repeat(empty))
    );
  }

  /**
   * Show completion screen
   */
  private showCompletion(): void {
    console.log('\n' + renderInfo('Wizard completed successfully!', '✓ Completed', this.theme));
  }

  /**
   * Get a result by step name
   */
  getResult<T = unknown>(stepName: string): T | undefined {
    return this.results.get(stepName) as T | undefined;
  }

  /**
   * Get all results
   */
  getAllResults(): Map<string, unknown> {
    return this.results;
  }
}

/**
 * Create and run a wizard
 */
export async function runWizard(config: WizardConfig): Promise<WizardResult> {
  const wizard = new Wizard(config);
  return wizard.run();
}

/**
 * Create a simple setup wizard
 */
export async function createSetupWizard(theme?: Theme): Promise<WizardResult> {
  const prompts = new InteractivePrompts(theme);

  return runWizard({
    title: 'CodeFlow Research Setup',
    description: 'Configure your research environment',
    theme,
    steps: [
      {
        name: 'theme',
        title: '🎨 Choose Theme',
        description: 'Select your preferred visual theme',
        action: async () => prompts.promptThemeSelection(),
      },
      {
        name: 'platform',
        title: '🔌 Platform Configuration',
        description: 'Select your platform preference',
        action: async () =>
          prompts.promptMultipleChoice('Platform:', [
            { name: 'Auto-detect', value: 'auto' },
            { name: 'Claude Code', value: 'claude' },
            { name: 'OpenCode', value: 'opencode' },
          ]),
      },
      {
        name: 'defaults',
        title: '⚙️ Default Settings',
        description: 'Configure default research settings',
        action: async () => ({
          verbose: await prompts.promptConfirm('Enable verbose output by default?', false),
          depth: await prompts.promptMultipleChoice(
            'Default research depth:',
            [
              { name: 'Shallow', value: 'shallow' },
              { name: 'Medium', value: 'medium' },
              { name: 'Deep', value: 'deep' },
            ],
            'medium'
          ),
        }),
      },
    ],
  });
}

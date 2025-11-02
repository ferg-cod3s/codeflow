/**
 * Progress Display Component
 * Shows progress bars, spinners, and status indicators
 */





import ora, { Ora } from 'ora';
import chalk from 'chalk';
import type { Theme } from '../themes/types.js';
import { getTheme } from '../themes/index.js';

/**
 * Progress bar options
 */
export interface ProgressBarOptions {
  theme?: Theme;
  total: number;
  width?: number;
  format?: string;
}

/**
 * Spinner options
 */
export interface SpinnerOptions {
  theme?: Theme;
  text?: string;
  color?: string;
  spinner?: string;
}

/**
 * Progress Display Component
 */
export class ProgressDisplay {
  private theme: Theme;
  private spinner: Ora | null = null;

  constructor(theme?: Theme) {
    this.theme = theme ?? getTheme();
  }

  /**
   * Start a spinner
   */
  startSpinner(text: string, options: Omit<SpinnerOptions, 'text'> = {}): Ora {
    const color = options.color ?? (this.theme.colors.primary as any);
    const spinner = options.spinner ?? (this.theme.spinner.spinner as any);

    this.spinner = ora({
      text: (chalk as any)[color](text),
      color,
      spinner,
    }).start();

    return this.spinner;
  }

  /**
   * Update spinner text
   */
  updateSpinner(text: string): void {
    if (this.spinner) {
      this.spinner.text = (chalk as any)[this.theme.colors.primary](text);
    }
  }

  /**
   * Stop spinner with success
   */
  succeedSpinner(text?: string): void {
    if (this.spinner) {
      this.spinner.succeed(text ? (chalk as any)[this.theme.colors.success](text) : undefined);
      this.spinner = null;
    }
  }

  /**
   * Stop spinner with failure
   */
  failSpinner(text?: string): void {
    if (this.spinner) {
      this.spinner.fail(text ? (chalk as any)[this.theme.colors.error](text) : undefined);
      this.spinner = null;
    }
  }

  /**
   * Stop spinner with warning
   */
  warnSpinner(text?: string): void {
    if (this.spinner) {
      this.spinner.warn(text ? (chalk as any)[this.theme.colors.warning](text) : undefined);
      this.spinner = null;
    }
  }

  /**
   * Stop spinner with info
   */
  infoSpinner(text?: string): void {
    if (this.spinner) {
      this.spinner.info(text ? (chalk as any)[this.theme.colors.info](text) : undefined);
      this.spinner = null;
    }
  }

  /**
   * Stop spinner
   */
  stopSpinner(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  /**
   * Render a static progress bar
   */
  renderProgressBar(
    current: number,
    total: number,
    options: Partial<ProgressBarOptions> = {}
  ): string {
    const width = options.width ?? 40;
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * width);
    const empty = width - filled;

    const config = options.theme?.progressBar ?? this.theme.progressBar;
    const completeChar = config.barCompleteChar ?? '█';
    const incompleteChar = config.barIncompleteChar ?? '░';

    const bar =
      (chalk as any)[this.theme.colors.success](completeChar.repeat(filled)) +
      chalk.dim(incompleteChar.repeat(empty));

    const format = config.format ?? '[{bar}] {percentage}%';
    return format
      .replace('{bar}', bar)
      .replace('{percentage}', String(percentage))
      .replace('{current}', String(current))
      .replace('{total}', String(total));
  }

  /**
   * Render a multi-step progress indicator
   */
  renderSteps(
    steps: Array<{ label: string; status: 'pending' | 'active' | 'complete' | 'error' }>,
    currentStep?: number
  ): string {
    const lines: string[] = [];

    steps.forEach((step, index) => {
      const symbol = this.getStepSymbol(step.status);
      const color = this.getStepColor(step.status);
      const isActive = currentStep !== undefined && index === currentStep;

      const label = isActive
        ? (chalk.bold as any)[color](step.label)
        : (chalk as any)[color](step.label);

      lines.push(`${(chalk as any)[color](symbol)} ${label}`);
    });

    return lines.join('\n');
  }

  /**
   * Render a phase indicator
   */
  renderPhase(phase: string, step: number, total: number): string {
    const percentage = Math.round((step / total) * 100);
    const bar = this.renderProgressBar(step, total, { width: 30 });

    return [
      (chalk as any)[this.theme.colors.primary].bold(`Phase: ${phase}`),
      chalk.dim(`Step ${step} of ${total} (${percentage}%)`),
      bar,
    ].join('\n');
  }

  /**
   * Get step symbol based on status
   */
  private getStepSymbol(status: string): string {
    switch (status) {
      case 'complete':
        return '✓';
      case 'active':
        return '▶';
      case 'error':
        return '✗';
      case 'pending':
      default:
        return '○';
    }
  }

  /**
   * Get step color based on status
   */
  private getStepColor(status: string): string {
    switch (status) {
      case 'complete':
        return this.theme.colors.success;
      case 'active':
        return this.theme.colors.info;
      case 'error':
        return this.theme.colors.error;
      case 'pending':
      default:
        return this.theme.colors.muted;
    }
  }
}

/**
 * Global progress display instance
 */
let globalProgressDisplay: ProgressDisplay | null = null;

/**
 * Get global progress display instance
 */
export function getProgressDisplay(theme?: Theme): ProgressDisplay {
  if (!globalProgressDisplay || theme) {
    globalProgressDisplay = new ProgressDisplay(theme);
  }
  return globalProgressDisplay;
}

/**
 * Convenience function to start a spinner
 */
export function startSpinner(text: string, options?: SpinnerOptions): Ora {
  return getProgressDisplay(options?.theme).startSpinner(text, options);
}

/**
 * Convenience function to render progress bar
 */
export function renderProgressBar(
  current: number,
  total: number,
  options?: ProgressBarOptions
): string {
  return getProgressDisplay(options?.theme).renderProgressBar(current, total, options);
}

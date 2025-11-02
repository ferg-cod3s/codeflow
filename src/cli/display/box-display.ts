/**
 * Box Display Component
 * Renders content in styled boxes
 */





import boxen from 'boxen';
import chalk from 'chalk';
import type { Theme } from '../themes/types.js';
import { getTheme } from '../themes/index.js';

/**
 * Box display options
 */
export interface BoxDisplayOptions {
  theme?: Theme;
  title?: string;
  padding?: number;
  margin?: number;
  borderColor?: string;
  borderStyle?:
    | 'single'
    | 'double'
    | 'round'
    | 'bold'
    | 'singleDouble'
    | 'doubleSingle'
    | 'classic'
    | 'arrow';
  dimBorder?: boolean;
  textAlignment?: 'left' | 'center' | 'right';
}

/**
 * Box Display Component
 */
export class BoxDisplay {
  private theme: Theme;

  constructor(theme?: Theme) {
    this.theme = theme ?? getTheme();
  }

  /**
   * Render content in a box
   */
  render(content: string, options: BoxDisplayOptions = {}): string {
    const boxOptions = {
      padding: options.padding ?? this.theme.box.padding ?? 1,
      margin: options.margin ?? this.theme.box.margin ?? 0,
      borderColor: options.borderColor ?? this.theme.box.borderColor,
      borderStyle: options.borderStyle ?? this.theme.box.borderStyle ?? 'round',
      dimBorder: options.dimBorder ?? this.theme.box.dimBorder ?? false,
      title: options.title,
      titleAlignment: 'center' as const,
      textAlignment: options.textAlignment ?? ('left' as const),
    };

    return boxen(content, boxOptions);
  }

  /**
   * Render a success box
   */
  renderSuccess(content: string, title?: string): string {
    return this.render((chalk as any)[this.theme.colors.success](content), {
      title: title ?? '✓ Success',
      borderColor: this.theme.colors.success,
    });
  }

  /**
   * Render an error box
   */
  renderError(content: string, title?: string): string {
    return this.render((chalk as any)[this.theme.colors.error](content), {
      title: title ?? '✗ Error',
      borderColor: this.theme.colors.error,
    });
  }

  /**
   * Render a warning box
   */
  renderWarning(content: string, title?: string): string {
    return this.render((chalk as any)[this.theme.colors.warning](content), {
      title: title ?? '⚠ Warning',
      borderColor: this.theme.colors.warning,
    });
  }

  /**
   * Render an info box
   */
  renderInfo(content: string, title?: string): string {
    return this.render((chalk as any)[this.theme.colors.info](content), {
      title: title ?? 'ℹ Info',
      borderColor: this.theme.colors.info,
    });
  }

  /**
   * Render a header box
   */
  renderHeader(title: string, subtitle?: string): string {
    const content = subtitle
      ? `${(chalk.bold as any)[this.theme.colors.primary](title)}\n${(chalk as any)[this.theme.colors.secondary](subtitle)}`
      : (chalk.bold as any)[this.theme.colors.primary](title);

    return this.render(content, {
      borderStyle: this.theme.box.borderStyle,
      borderColor: this.theme.colors.primary,
      textAlignment: 'center',
    });
  }

  /**
   * Render results in a box
   */
  renderResults(results: Record<string, unknown>, title?: string): string {
    const lines = Object.entries(results).map(([key, value]) =>
      this.theme.formatLabel(key, String(value))
    );

    return this.render(lines.join('\n'), {
      title: title ?? 'Results',
      borderColor: this.theme.colors.accent,
    });
  }

  /**
   * Render agent info in a box
   */
  renderAgentInfo(agent: { name: string; description?: string; tags?: string[] }): string {
    const lines = [
      (chalk.bold as any)[this.theme.colors.primary](agent.name),
      agent.description ? (chalk as any)[this.theme.colors.muted](agent.description) : '',
      agent.tags ? chalk.dim(`Tags: ${agent.tags.join(', ')}`) : '',
    ].filter(Boolean);

    return this.render(lines.join('\n'), {
      borderColor: this.theme.colors.accent,
    });
  }
}

/**
 * Global box display instance
 */
let globalBoxDisplay: BoxDisplay | null = null;

/**
 * Get global box display instance
 */
export function getBoxDisplay(theme?: Theme): BoxDisplay {
  if (!globalBoxDisplay || theme) {
    globalBoxDisplay = new BoxDisplay(theme);
  }
  return globalBoxDisplay;
}

/**
 * Convenience functions
 */
export function renderBox(content: string, options?: BoxDisplayOptions): string {
  return getBoxDisplay(options?.theme).render(content, options);
}

export function renderSuccess(content: string, title?: string, theme?: Theme): string {
  return getBoxDisplay(theme).renderSuccess(content, title);
}

export function renderError(content: string, title?: string, theme?: Theme): string {
  return getBoxDisplay(theme).renderError(content, title);
}

export function renderWarning(content: string, title?: string, theme?: Theme): string {
  return getBoxDisplay(theme).renderWarning(content, title);
}

export function renderInfo(content: string, title?: string, theme?: Theme): string {
  return getBoxDisplay(theme).renderInfo(content, title);
}

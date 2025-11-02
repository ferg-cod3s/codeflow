/**
 * Theme Manager
 * Manages theme lifecycle, caching, and application
 */





import chalk from 'chalk';
import type {
  Theme,
  ThemePreset,
  ThemeOptions,
  ThemeManagerConfig,
  ColorPalette,
  Typography,
  BoxStyle,
  SpinnerConfig,
  ProgressBarConfig,
  TableStyle,
} from './types.js';

/**
 * Theme Manager - Handles theme selection, customization, and caching
 */
export class ThemeManager {
  private themes: Map<ThemePreset, Theme> = new Map();
  private currentTheme: Theme | null = null;
  private config: Required<ThemeManagerConfig>;

  constructor(config: ThemeManagerConfig = {}) {
    this.config = {
      defaultTheme: config.defaultTheme ?? 'default',
      allowCustomization: config.allowCustomization ?? true,
      cacheThemes: config.cacheThemes ?? true,
    };
  }

  /**
   * Get the current active theme
   */
  getTheme(preset?: ThemePreset): Theme {
    const themePreset = preset ?? this.config.defaultTheme;

    if (this.config.cacheThemes && this.themes.has(themePreset)) {
      return this.themes.get(themePreset)!;
    }

    const theme = this.createTheme(themePreset);

    if (this.config.cacheThemes) {
      this.themes.set(themePreset, theme);
    }

    this.currentTheme = theme;
    return theme;
  }

  /**
   * Set the current theme
   */
  setTheme(preset: ThemePreset): Theme {
    return this.getTheme(preset);
  }

  /**
   * Get current active theme (or default)
   */
  getCurrentTheme(): Theme {
    if (!this.currentTheme) {
      this.currentTheme = this.getTheme();
    }
    return this.currentTheme;
  }

  /**
   * Create a customized theme
   */
  createCustomTheme(options: ThemeOptions): Theme {
    if (!this.config.allowCustomization) {
      throw new Error('Theme customization is disabled');
    }

    const baseTheme = this.getTheme(options.preset);

    return {
      ...baseTheme,
      name: `${baseTheme.name}-custom`,
      colors: { ...baseTheme.colors, ...options.customColors },
      box: { ...baseTheme.box, ...options.customBox },
      spinner: { ...baseTheme.spinner, ...options.customSpinner },
      progressBar: { ...baseTheme.progressBar, ...options.customProgressBar },
      table: { ...baseTheme.table, ...options.customTable },
    };
  }

  /**
   * Clear theme cache
   */
  clearCache(): void {
    this.themes.clear();
    this.currentTheme = null;
  }

  /**
   * Create a theme based on preset
   */
  private createTheme(preset: ThemePreset): Theme {
    const colors = this.getColorPalette(preset);
    const typography = this.createTypography(colors);
    const box = this.getBoxStyle(preset, colors);
    const spinner = this.getSpinnerConfig(preset, colors);
    const progressBar = this.getProgressBarConfig(preset);
    const table = this.getTableStyle(preset);

    return {
      name: preset,
      description: this.getThemeDescription(preset),
      colors,
      typography,
      box,
      spinner,
      progressBar,
      table,
      applyStatus: this.createStatusApplier(colors),
      formatLabel: this.createLabelFormatter(colors),
      formatSection: this.createSectionFormatter(typography),
    };
  }

  /**
   * Get color palette for theme preset
   */
  private getColorPalette(preset: ThemePreset): ColorPalette {
    switch (preset) {
      case 'minimal':
        return {
          primary: 'white',
          secondary: 'gray',
          accent: 'cyan',
          success: 'green',
          warning: 'yellow',
          error: 'red',
          info: 'blue',
          muted: 'gray',
          subtle: 'dim',
          border: 'gray',
          background: 'black',
          highlight: 'white',
          dimmed: 'dim',
        };

      case 'rich':
        return {
          primary: 'magentaBright',
          secondary: 'cyanBright',
          accent: 'yellowBright',
          success: 'greenBright',
          warning: 'yellowBright',
          error: 'redBright',
          info: 'blueBright',
          muted: 'gray',
          subtle: 'dim',
          border: 'cyan',
          background: 'bgBlack',
          highlight: 'whiteBright',
          dimmed: 'dim',
        };

      case 'neon':
        return {
          primary: 'magenta',
          secondary: 'cyan',
          accent: 'yellow',
          success: 'green',
          warning: 'yellow',
          error: 'red',
          info: 'blue',
          muted: 'gray',
          subtle: 'dim',
          border: 'magenta',
          background: 'bgBlack',
          highlight: 'whiteBright',
          dimmed: 'dim',
        };

      case 'professional':
        return {
          primary: 'blue',
          secondary: 'blueBright',
          accent: 'cyan',
          success: 'green',
          warning: 'yellow',
          error: 'red',
          info: 'blue',
          muted: 'gray',
          subtle: 'dim',
          border: 'blue',
          background: 'bgBlack',
          highlight: 'blueBright',
          dimmed: 'dim',
        };

      case 'default':
      default:
        return {
          primary: 'cyan',
          secondary: 'blue',
          accent: 'green',
          success: 'green',
          warning: 'yellow',
          error: 'red',
          info: 'cyan',
          muted: 'gray',
          subtle: 'dim',
          border: 'gray',
          background: 'black',
          highlight: 'white',
          dimmed: 'dim',
        };
    }
  }

  /**
   * Create typography helper functions
   */
  private createTypography(colors: ColorPalette): Typography {
    return {
      heading1: (text: string) => (chalk.bold as any)[colors.primary](text),
      heading2: (text: string) => (chalk as any)[colors.secondary](text),
      heading3: (text: string) => (chalk as any)[colors.accent](text),
      bold: (text: string) => chalk.bold(text),
      italic: (text: string) => chalk.italic(text),
      underline: (text: string) => chalk.underline(text),
      code: (text: string) => (chalk as any)[colors.accent](`\`${text}\``),
      link: (text: string) => (chalk.underline as any)[colors.info](text),
    };
  }

  /**
   * Get box style configuration
   */
  private getBoxStyle(preset: ThemePreset, colors: ColorPalette): BoxStyle {
    switch (preset) {
      case 'minimal':
        return { borderStyle: 'single', padding: 1, margin: 0, dimBorder: true };
      case 'rich':
        return { borderStyle: 'double', padding: 2, margin: 1, borderColor: colors.border };
      case 'neon':
        return { borderStyle: 'bold', padding: 1, margin: 1, borderColor: colors.primary };
      case 'professional':
        return { borderStyle: 'round', padding: 1, margin: 1, borderColor: colors.primary };
      default:
        return { borderStyle: 'round', padding: 1, margin: 0 };
    }
  }

  /**
   * Get spinner configuration
   */
  private getSpinnerConfig(preset: ThemePreset, colors: ColorPalette): SpinnerConfig {
    const spinnerType = preset === 'minimal' ? 'dots' : preset === 'neon' ? 'arc' : 'dots';
    return {
      spinner: spinnerType,
      color: colors.primary,
    };
  }

  /**
   * Get progress bar configuration
   */
  private getProgressBarConfig(preset: ThemePreset): ProgressBarConfig {
    switch (preset) {
      case 'minimal':
        return {
          format: '│{bar}│ {percentage}%',
          barCompleteChar: '=',
          barIncompleteChar: '-',
        };
      case 'rich':
        return {
          format: '┃{bar}┃ {percentage}% │ {message}',
          barCompleteChar: '█',
          barIncompleteChar: '░',
        };
      case 'neon':
        return {
          format: '▐{bar}▌ {percentage}%',
          barCompleteChar: '▓',
          barIncompleteChar: '▒',
        };
      default:
        return {
          format: '[{bar}] {percentage}%',
          barCompleteChar: '█',
          barIncompleteChar: '░',
        };
    }
  }

  /**
   * Get table style configuration
   */
  private getTableStyle(preset: ThemePreset): TableStyle {
    switch (preset) {
      case 'minimal':
        return { compact: true };
      case 'rich':
        return {
          compact: false,
          style: { 'padding-left': 2, 'padding-right': 2 },
        };
      default:
        return { compact: false };
    }
  }

  /**
   * Create status applier function
   */
  private createStatusApplier(colors: ColorPalette) {
    return (status: 'success' | 'warning' | 'error' | 'info', text: string): string => {
      const color = colors[status];
      return (chalk as any)[color](text);
    };
  }

  /**
   * Create label formatter function
   */
  private createLabelFormatter(colors: ColorPalette) {
    return (label: string, value: string): string => {
      return `${(chalk as any)[colors.muted](label)}: ${(chalk as any)[colors.highlight](value)}`;
    };
  }

  /**
   * Create section formatter function
   */
  private createSectionFormatter(typography: Typography) {
    return (title: string): string => {
      return `\n${typography.heading2(title)}\n${chalk.dim('─'.repeat(title.length))}\n`;
    };
  }

  /**
   * Get theme description
   */
  private getThemeDescription(preset: ThemePreset): string {
    switch (preset) {
      case 'minimal':
        return 'Clean, simple output with minimal styling';
      case 'rich':
        return 'Colorful, detailed output with enhanced visual elements';
      case 'neon':
        return 'Bold, vibrant colors for high-contrast displays';
      case 'professional':
        return 'Business-appropriate styling with subtle colors';
      default:
        return 'Balanced default theme with good readability';
    }
  }
}

/**
 * Global theme manager instance
 */
export const themeManager = new ThemeManager();

/**
 * Convenience function to get current theme
 */
export function getTheme(preset?: ThemePreset): Theme {
  return themeManager.getTheme(preset);
}

/**
 * Convenience function to set theme
 */
export function setTheme(preset: ThemePreset): Theme {
  return themeManager.setTheme(preset);
}

/**
 * Theme System Types
 * Defines color schemes, styling options, and theme presets for CLI output
 */

// import type { ChalkInstance } from 'chalk';

/**
 * Color palette for a theme
 */
export interface ColorPalette {
  // Primary colors
  primary: string;
  secondary: string;
  accent: string;

  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // UI colors
  muted: string;
  subtle: string;
  border: string;
  background: string;

  // Semantic colors
  highlight: string;
  dimmed: string;
}

/**
 * Typography styles
 */
export interface Typography {
  heading1: (text: string) => string;
  heading2: (text: string) => string;
  heading3: (text: string) => string;
  bold: (text: string) => string;
  italic: (text: string) => string;
  underline: (text: string) => string;
  code: (text: string) => string;
  link: (text: string) => string;
}

/**
 * Box styling options for boxen
 */
export interface BoxStyle {
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
  padding?: number;
  margin?: number;
  backgroundColor?: string;
  dimBorder?: boolean;
}

/**
 * Spinner configuration
 */
export interface SpinnerConfig {
  spinner?:
    | string
    | {
        interval: number;
        frames: string[];
      };
  color?: string;
  prefixText?: string;
  suffixText?: string;
}

/**
 * Progress bar configuration
 */
export interface ProgressBarConfig {
  format: string;
  barCompleteChar?: string;
  barIncompleteChar?: string;
  barGlue?: string;
  complete?: string;
  incomplete?: string;
  width?: number;
}

/**
 * Table styling configuration
 */
export interface TableStyle {
  head?: string[];
  border?: string[];
  compact?: boolean;
  colWidths?: number[];
  style?: {
    'padding-left'?: number;
    'padding-right'?: number;
    head?: string[];
    border?: string[];
    compact?: boolean;
  };
}

/**
 * Complete theme configuration
 */
export interface Theme {
  name: string;
  description: string;
  colors: ColorPalette;
  typography: Typography;
  box: BoxStyle;
  spinner: SpinnerConfig;
  progressBar: ProgressBarConfig;
  table: TableStyle;

  // Utility methods
  applyStatus: (status: 'success' | 'warning' | 'error' | 'info', text: string) => string;
  formatLabel: (label: string, value: string) => string;
  formatSection: (title: string) => string;
}

/**
 * Theme preset names
 */
export type ThemePreset = 'default' | 'minimal' | 'rich' | 'neon' | 'professional';

/**
 * Theme options for customization
 */
export interface ThemeOptions {
  preset?: ThemePreset;
  customColors?: Partial<ColorPalette>;
  customBox?: Partial<BoxStyle>;
  customSpinner?: Partial<SpinnerConfig>;
  customProgressBar?: Partial<ProgressBarConfig>;
  customTable?: Partial<TableStyle>;
}

/**
 * Theme manager configuration
 */
export interface ThemeManagerConfig {
  defaultTheme?: ThemePreset;
  allowCustomization?: boolean;
  cacheThemes?: boolean;
}

/**
 * Display component types
 */
export interface DisplayComponent {
  render: (data: unknown) => string | void;
  update?: (data: unknown) => void;
  clear?: () => void;
}

/**
 * Status indicator configuration
 */
export interface StatusIndicator {
  symbol: string;
  color: string;
  label?: string;
}

/**
 * Agent status display data
 */
export interface AgentStatus {
  name: string;
  status: 'idle' | 'running' | 'success' | 'error' | 'warning';
  message?: string;
  progress?: number;
  startTime?: Date;
  endTime?: Date;
}

/**
 * Research progress data
 */
export interface ResearchProgress {
  phase: string;
  currentStep: number;
  totalSteps: number;
  message: string;
  percentage: number;
  details?: Record<string, unknown>;
}

/**
 * Result display data
 */
export interface ResultDisplay {
  title: string;
  summary: string;
  details: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

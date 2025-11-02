/**
 * Theme Presets
 * Pre-configured themes ready to use
 */





import type { Theme, ThemePreset } from './types.js';
import { getTheme } from './theme-manager.js';

/**
 * Get a preset theme by name
 */
export function getPreset(name: ThemePreset): Theme {
  return getTheme(name);
}

/**
 * List all available preset names
 */
export function listPresets(): ThemePreset[] {
  return ['default', 'minimal', 'rich', 'neon', 'professional'];
}

/**
 * Get preset descriptions
 */
export function getPresetDescriptions(): Record<ThemePreset, string> {
  return {
    default: 'Balanced theme with good readability (cyan/blue)',
    minimal: 'Clean, simple output with minimal styling',
    rich: 'Colorful, detailed output with enhanced visuals',
    neon: 'Bold, vibrant colors for high-contrast displays',
    professional: 'Business-appropriate styling with subtle colors',
  };
}

/**
 * Default theme export
 */
export const defaultTheme = getTheme('default');

/**
 * Minimal theme export
 */
export const minimalTheme = getTheme('minimal');

/**
 * Rich theme export
 */
export const richTheme = getTheme('rich');

/**
 * Neon theme export
 */
export const neonTheme = getTheme('neon');

/**
 * Professional theme export
 */
export const professionalTheme = getTheme('professional');

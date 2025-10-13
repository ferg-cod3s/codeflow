/**
 * Theme System - Barrel Export
 */

export * from './types.js';
export * from './theme-manager.js';
export * from './presets.js';

// Re-export commonly used items
export { ThemeManager, themeManager, getTheme, setTheme } from './theme-manager.js';
export { getPreset, listPresets, getPresetDescriptions } from './presets.js';
export type { Theme, ThemePreset, ThemeOptions, ColorPalette } from './types.js';

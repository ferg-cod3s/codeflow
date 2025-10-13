/**
 * Configuration System - Barrel Export
 * 
 * Platform detection and configuration loading for CodeFlow Research.
 * Supports multi-source config hierarchy and platform-specific overrides.
 */

// Platform detection
export {
  Platform,
  type PlatformDetectionResult,
  PlatformDetector,
  detectPlatform
} from './platform-detector.js';

// Configuration loading and types
export {
  type ResearchConfig,
  ConfigLoader,
  loadConfig
} from './config-loader.js';

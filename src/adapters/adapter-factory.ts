import { Platform, PlatformDetector } from '../config/platform-detector.js';
import { PlatformAdapter } from './platform-adapter.js';
import { createClaudeAdapter } from './claude-adapter.js';
import { createOpenCodeAdapter } from './opencode-adapter.js';
import { ResearchConfig } from '../config/config-loader.js';

/**
 * Adapter Factory
 * 
 * Creates the appropriate platform adapter based on:
 * 1. Explicit platform specification
 * 2. Auto-detection
 * 3. Configuration overrides
 */
export class AdapterFactory {
  /**
   * Create adapter for a specific platform
   */
  static createAdapter(
    platform: Platform,
    projectRoot: string,
    config?: ResearchConfig
  ): PlatformAdapter {
    switch (platform) {
      case Platform.CLAUDE_CODE:
        return createClaudeAdapter(projectRoot);

      case Platform.OPENCODE:
        const mcpEndpoint = config?.platform?.opencode?.mcpEndpoint;
        return createOpenCodeAdapter(projectRoot, mcpEndpoint);

      case Platform.UNKNOWN:
      default:
        throw new Error(
          `Unsupported platform: ${platform}. ` +
          `Supported platforms: Claude Code, OpenCode`
        );
    }
  }

  /**
   * Auto-detect platform and create adapter
   */
  static async createAdapterAuto(
    projectRoot: string,
    config?: ResearchConfig
  ): Promise<PlatformAdapter> {
    const detector = new PlatformDetector(projectRoot);
    const detection = await detector.detect();

    if (detection.platform === Platform.UNKNOWN) {
      throw new Error(
        'Could not detect platform. Please ensure either:\n' +
        '  - .claude/agents/ directory exists (Claude Code)\n' +
        '  - .opencode/agent/ directory exists (OpenCode)\n' +
        '\nEvidence collected:\n' +
        detection.evidence.map(e => `  - ${e}`).join('\n')
      );
    }

    if (detection.confidence === 'low') {
      console.warn(
        `⚠️  Low confidence platform detection (${detection.platform})\n` +
        `Evidence:\n${detection.evidence.map(e => `  - ${e}`).join('\n')}`
      );
    }

    return this.createAdapter(detection.platform, projectRoot, config);
  }

  /**
   * Check if a platform is supported
   */
  static isSupported(platform: Platform): boolean {
    return platform === Platform.CLAUDE_CODE || platform === Platform.OPENCODE;
  }

  /**
   * Get list of supported platforms
   */
  static getSupportedPlatforms(): Platform[] {
    return [Platform.CLAUDE_CODE, Platform.OPENCODE];
  }

  /**
   * Get platform name for display
   */
  static getPlatformDisplayName(platform: Platform): string {
    switch (platform) {
      case Platform.CLAUDE_CODE:
        return 'Claude Code';
      case Platform.OPENCODE:
        return 'OpenCode';
      default:
        return 'Unknown';
    }
  }
}

/**
 * Quick helper to create adapter with auto-detection
 */
export async function createAdapter(
  projectRoot: string,
  config?: ResearchConfig,
  platform?: Platform
): Promise<PlatformAdapter> {
  if (platform && platform !== Platform.UNKNOWN) {
    return AdapterFactory.createAdapter(platform, projectRoot, config);
  }

  return AdapterFactory.createAdapterAuto(projectRoot, config);
}

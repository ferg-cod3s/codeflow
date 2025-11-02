import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readdir } from 'node:fs/promises';





/**
 * Supported AI development platforms
 */
export enum Platform {
  CLAUDE_CODE = 'claude-code',
  OPENCODE = 'opencode',
  UNKNOWN = 'unknown',
}

/**
 * Platform detection result with metadata
 */
export interface PlatformDetectionResult {
  platform: Platform;
  confidence: 'high' | 'medium' | 'low';
  agentDirectory?: string;
  configFile?: string;
  evidence: string[];
}

/**
 * Platform Detector
 *
 * Detects which AI development platform the project is using:
 * - Claude Code: File-based agents in .claude/agents/
 * - OpenCode: MCP-based agents in .opencode/agent/ + opencode.json
 *
 * Uses multiple detection strategies with confidence scoring.
 */
export class PlatformDetector {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Detect the platform being used
   *
   * Uses a multi-criteria detection strategy:
   * 1. Check for OpenCode-specific files (highest priority)
   * 2. Check for Claude Code-specific files
   * 3. Analyze directory structure
   * 4. Count agent files
   */
  async detect(): Promise<PlatformDetectionResult> {
    const evidence: string[] = [];
    let platform: Platform = Platform.UNKNOWN;
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let agentDirectory: string | undefined;
    let configFile: string | undefined;

    // Strategy 1: Check for OpenCode config file (strongest signal)
    const opencodeConfigPath = join(this.projectRoot, 'opencode.json');
    const hasOpencodeConfig = existsSync(opencodeConfigPath);

    if (hasOpencodeConfig) {
      evidence.push('Found opencode.json config file');
      platform = Platform.OPENCODE;
      confidence = 'high';
      configFile = opencodeConfigPath;
    }

    // Strategy 2: Check for .opencode directory
    const opencodeDir = join(this.projectRoot, '.opencode');
    const hasOpencodeDir = existsSync(opencodeDir);

    if (hasOpencodeDir) {
      evidence.push('Found .opencode/ directory');

      // Check for agent directory
      const opencodeAgentDir = join(opencodeDir, 'agent');
      if (existsSync(opencodeAgentDir)) {
        evidence.push('Found .opencode/agent/ directory');
        agentDirectory = opencodeAgentDir;

        // Count agents
        try {
          const agentFiles = await this.countAgentFiles(opencodeAgentDir, '.md');
          if (agentFiles > 0) {
            evidence.push(`Found ${agentFiles} agent file(s) in .opencode/agent/`);
            platform = Platform.OPENCODE;
            confidence = 'high';
          }
        } catch {
          evidence.push('Could not read .opencode/agent/ directory');
        }
      }
    }

    // Strategy 3: Check for Claude Code directory
    const claudeDir = join(this.projectRoot, '.claude');
    const hasClaudeDir = existsSync(claudeDir);

    if (hasClaudeDir && platform === Platform.UNKNOWN) {
      evidence.push('Found .claude/ directory');

      // Check for agents directory
      const claudeAgentsDir = join(claudeDir, 'agents');
      if (existsSync(claudeAgentsDir)) {
        evidence.push('Found .claude/agents/ directory');
        agentDirectory = claudeAgentsDir;

        // Count agents
        try {
          const agentFiles = await this.countAgentFiles(claudeAgentsDir, '.md');
          if (agentFiles > 0) {
            evidence.push(`Found ${agentFiles} agent file(s) in .claude/agents/`);
            platform = Platform.CLAUDE_CODE;
            confidence = 'high';
          } else {
            platform = Platform.CLAUDE_CODE;
            confidence = 'medium';
          }
        } catch {
          evidence.push('Could not read .claude/agents/ directory');
          platform = Platform.CLAUDE_CODE;
          confidence = 'low';
        }
      }
    }

    // Strategy 4: Resolve conflicts (OpenCode takes precedence)
    if (hasOpencodeConfig || hasOpencodeDir) {
      if (hasClaudeDir) {
        evidence.push('Both platforms detected - prioritizing OpenCode');
      }
      platform = Platform.OPENCODE;
      confidence = hasOpencodeConfig ? 'high' : 'medium';
    }

    // If still unknown, check parent directory
    if (platform === Platform.UNKNOWN) {
      const parentResult = await this.detectInParent();
      if (parentResult.platform !== Platform.UNKNOWN) {
        evidence.push('Platform detected in parent directory');
        return parentResult;
      }
    }

    return {
      platform,
      confidence,
      agentDirectory,
      configFile,
      evidence,
    };
  }

  /**
   * Detect platform in parent directory
   * Useful when running from a subdirectory
   */
  private async detectInParent(): Promise<PlatformDetectionResult> {
    const parentDir = join(this.projectRoot, '..');

    // Don't recurse too far up
    if (parentDir === this.projectRoot || parentDir === '/') {
      return {
        platform: Platform.UNKNOWN,
        confidence: 'low',
        evidence: ['Reached filesystem root without detecting platform'],
      };
    }

    const parentDetector = new PlatformDetector(parentDir);
    return parentDetector.detect();
  }

  /**
   * Count agent files in a directory
   */
  private async countAgentFiles(directory: string, extension: string): Promise<number> {
    try {
      const files = await readdir(directory);
      return files.filter((file) => file.endsWith(extension)).length;
    } catch {
      return 0;
    }
  }

  /**
   * Get a human-readable platform name
   */
  static getPlatformName(platform: Platform): string {
    switch (platform) {
      case Platform.CLAUDE_CODE:
        return 'Claude Code';
      case Platform.OPENCODE:
        return 'OpenCode';
      default:
        return 'Unknown';
    }
  }

  /**
   * Check if platform is supported for research workflows
   */
  static isSupported(platform: Platform): boolean {
    return platform === Platform.CLAUDE_CODE || platform === Platform.OPENCODE;
  }
}

/**
 * Quick platform detection helper
 */
export async function detectPlatform(projectRoot: string): Promise<PlatformDetectionResult> {
  const detector = new PlatformDetector(projectRoot);
  return detector.detect();
}

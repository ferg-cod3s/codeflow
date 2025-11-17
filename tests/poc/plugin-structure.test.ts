/**
 * Tests for POC plugin structure and format validation
 *
 * These tests validate that the POC plugin conversions maintain
 * correct structure and include all necessary components.
 */

import { describe, it, expect } from 'bun:test';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const POC_BASE = join(process.cwd(), 'examples/poc-anthropic-plugins');

describe('POC Plugin Structure Tests', () => {
  describe('Claude Code Format - Explanatory Plugin', () => {
    const pluginPath = join(POC_BASE, 'claude-code-format/explanatory-output-style');

    it('should have plugin.json with required fields', () => {
      const pluginJsonPath = join(pluginPath, '.claude-plugin/plugin.json');
      expect(existsSync(pluginJsonPath)).toBe(true);

      const content = JSON.parse(readFileSync(pluginJsonPath, 'utf-8'));

      expect(content.name).toBe('explanatory-output-style');
      expect(content.version).toBe('1.0.0');
      expect(content.description).toContain('educational insights');
      expect(content.author).toBeDefined();
      expect(content.author.name).toBe('Dickson Tsai');
    });

    it('should have hooks.json with SessionStart hook', () => {
      const hooksJsonPath = join(pluginPath, 'hooks/hooks.json');
      expect(existsSync(hooksJsonPath)).toBe(true);

      const content = JSON.parse(readFileSync(hooksJsonPath, 'utf-8'));

      expect(content.hooks).toBeDefined();
      expect(content.hooks.SessionStart).toBeDefined();
      expect(Array.isArray(content.hooks.SessionStart)).toBe(true);
      expect(content.hooks.SessionStart[0].type).toBe('command');
      expect(content.hooks.SessionStart[0].handler).toContain('session-start.sh');
    });

    it('should have executable session-start.sh hook handler', () => {
      const handlerPath = join(pluginPath, 'hooks-handlers/session-start.sh');
      expect(existsSync(handlerPath)).toBe(true);

      const content = readFileSync(handlerPath, 'utf-8');

      expect(content).toContain('#!/usr/bin/env bash');
      expect(content).toContain('hookSpecificOutput');
      expect(content).toContain('SessionStart');
      expect(content).toContain('additionalContext');
      expect(content).toContain('explanatory');
      expect(content).toContain('★ Insight');
    });

    it('should have README.md', () => {
      const readmePath = join(pluginPath, 'README.md');
      expect(existsSync(readmePath)).toBe(true);

      const content = readFileSync(readmePath, 'utf-8');
      expect(content).toContain('Explanatory Output Style');
      expect(content).toContain('SessionStart hook');
    });
  });

  describe('Claude Code Format - Learning Plugin', () => {
    const pluginPath = join(POC_BASE, 'claude-code-format/learning-output-style');

    it('should have plugin.json with required fields', () => {
      const pluginJsonPath = join(pluginPath, '.claude-plugin/plugin.json');
      expect(existsSync(pluginJsonPath)).toBe(true);

      const content = JSON.parse(readFileSync(pluginJsonPath, 'utf-8'));

      expect(content.name).toBe('learning-output-style');
      expect(content.version).toBe('1.0.0');
      expect(content.description).toContain('Interactive learning');
      expect(content.author.name).toBe('Boris Cherny');
    });

    it('should have hooks.json with SessionStart hook', () => {
      const hooksJsonPath = join(pluginPath, 'hooks/hooks.json');
      expect(existsSync(hooksJsonPath)).toBe(true);

      const content = JSON.parse(readFileSync(hooksJsonPath, 'utf-8'));

      expect(content.hooks.SessionStart).toBeDefined();
      expect(content.hooks.SessionStart[0].type).toBe('command');
    });

    it('should have session-start.sh with learning instructions', () => {
      const handlerPath = join(pluginPath, 'hooks-handlers/session-start.sh');
      expect(existsSync(handlerPath)).toBe(true);

      const content = readFileSync(handlerPath, 'utf-8');

      expect(content).toContain('learning');
      expect(content).toContain('Request contributions for:');
      expect(content).toContain('Implement directly:');
      expect(content).toContain('★ Insight');
    });
  });

  describe('OpenCode Format - Explanatory Plugin', () => {
    const pluginPath = join(POC_BASE, 'opencode-format/explanatory-output-style');

    it('should have TypeScript plugin file', () => {
      const pluginTsPath = join(pluginPath, 'explanatory-output-style.ts');
      expect(existsSync(pluginTsPath)).toBe(true);

      const content = readFileSync(pluginTsPath, 'utf-8');

      expect(content).toContain('import type { Plugin }');
      expect(content).toContain('@opencode-ai/plugin');
      expect(content).toContain('export const ExplanatoryOutputStyle');
      expect(content).toContain('Plugin = async');
    });

    it('should have proper event hook implementation', () => {
      const pluginTsPath = join(pluginPath, 'explanatory-output-style.ts');
      const content = readFileSync(pluginTsPath, 'utf-8');

      expect(content).toContain('event: async ({ event })');
      expect(content).toContain('session.start');
      expect(content).toContain('explanatory mode');
    });

    it('should have tool execution hooks', () => {
      const pluginTsPath = join(pluginPath, 'explanatory-output-style.ts');
      const content = readFileSync(pluginTsPath, 'utf-8');

      expect(content).toContain('tool: {');
      expect(content).toContain('execute: {');
      expect(content).toContain('before:');
      expect(content).toContain('after:');
    });

    it('should have package.json with proper metadata', () => {
      const packageJsonPath = join(pluginPath, 'package.json');
      expect(existsSync(packageJsonPath)).toBe(true);

      const content = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      expect(content.name).toBe('opencode-explanatory-output-style');
      expect(content.version).toBe('1.0.0');
      expect(content.main).toBe('explanatory-output-style.ts');
      expect(content.type).toBe('module');
      expect(content.peerDependencies).toBeDefined();
      expect(content.peerDependencies['@opencode-ai/plugin']).toBeDefined();
    });

    it('should have comprehensive README', () => {
      const readmePath = join(pluginPath, 'README.md');
      expect(existsSync(readmePath)).toBe(true);

      const content = readFileSync(readmePath, 'utf-8');

      expect(content).toContain('Explanatory Output Style Plugin for OpenCode');
      expect(content).toContain('Converted from');
      expect(content).toContain('Installation');
      expect(content).toContain('Differences from Claude Code');
      expect(content).toContain('.opencode/rules.md');
    });
  });

  describe('OpenCode Format - Learning Plugin', () => {
    const pluginPath = join(POC_BASE, 'opencode-format/learning-output-style');

    it('should have TypeScript plugin file', () => {
      const pluginTsPath = join(pluginPath, 'learning-output-style.ts');
      expect(existsSync(pluginTsPath)).toBe(true);

      const content = readFileSync(pluginTsPath, 'utf-8');

      expect(content).toContain('import type { Plugin }');
      expect(content).toContain('export const LearningOutputStyle');
      expect(content).toContain('Plugin = async');
    });

    it('should contain learning instructions constant', () => {
      const pluginTsPath = join(pluginPath, 'learning-output-style.ts');
      const content = readFileSync(pluginTsPath, 'utf-8');

      expect(content).toContain('LEARNING_INSTRUCTIONS');
      expect(content).toContain('Interactive Learning');
      expect(content).toContain('Request contributions for:');
      expect(content).toContain('Implement directly:');
    });

    it('should have event and tool hooks', () => {
      const pluginTsPath = join(pluginPath, 'learning-output-style.ts');
      const content = readFileSync(pluginTsPath, 'utf-8');

      expect(content).toContain('event: async ({ event })');
      expect(content).toContain('tool: {');
      expect(content).toContain('execute: {');
      expect(content).toContain('before:');
      expect(content).toContain('after:');
    });

    it('should have package.json', () => {
      const packageJsonPath = join(pluginPath, 'package.json');
      expect(existsSync(packageJsonPath)).toBe(true);

      const content = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      expect(content.name).toBe('opencode-learning-output-style');
      expect(content.main).toBe('learning-output-style.ts');
    });
  });

  describe('POC Documentation', () => {
    it('should have POC_CONVERSION_GUIDE.md', () => {
      const guidePath = join(POC_BASE, 'POC_CONVERSION_GUIDE.md');
      expect(existsSync(guidePath)).toBe(true);

      const content = readFileSync(guidePath, 'utf-8');

      expect(content).toContain('POC: Converting Anthropic');
      // Check for Architecture section (case-insensitive)
      const hasArchitecture = content.includes('Architecture') || content.includes('architecture');
      expect(hasArchitecture).toBe(true);
      expect(content).toContain('Conversion Methodology');
      expect(content).toContain('Automation Feasibility');
      expect(content.length).toBeGreaterThan(10000); // Should be comprehensive
    });

    it('should have POC README.md', () => {
      const readmePath = join(POC_BASE, 'README.md');
      expect(existsSync(readmePath)).toBe(true);

      const content = readFileSync(readmePath, 'utf-8');

      expect(content).toContain('Anthropic Claude Code Plugins');
      expect(content).toContain('Conversion POC');
      expect(content).toContain('Quick Links');
    });
  });

  describe('Conversion Completeness', () => {
    it('should have both formats for each plugin', () => {
      const plugins = ['explanatory-output-style', 'learning-output-style'];

      for (const plugin of plugins) {
        const claudePath = join(POC_BASE, `claude-code-format/${plugin}`);
        const opencodePath = join(POC_BASE, `opencode-format/${plugin}`);

        expect(existsSync(claudePath)).toBe(true);
        expect(existsSync(opencodePath)).toBe(true);
      }
    });

    it('should preserve author attribution in conversions', () => {
      // Check explanatory plugin
      const claudePluginJson = join(POC_BASE, 'claude-code-format/explanatory-output-style/.claude-plugin/plugin.json');
      const opencodePackageJson = join(POC_BASE, 'opencode-format/explanatory-output-style/package.json');

      const claudeContent = JSON.parse(readFileSync(claudePluginJson, 'utf-8'));
      const opencodeContent = JSON.parse(readFileSync(opencodePackageJson, 'utf-8'));

      expect(claudeContent.author.name).toBe('Dickson Tsai');
      expect(opencodeContent.author.name).toContain('Dickson Tsai');

      // Check learning plugin
      const claudeLearningJson = join(POC_BASE, 'claude-code-format/learning-output-style/.claude-plugin/plugin.json');
      const opencodeLearningJson = join(POC_BASE, 'opencode-format/learning-output-style/package.json');

      const claudeLearning = JSON.parse(readFileSync(claudeLearningJson, 'utf-8'));
      const opencodeLearning = JSON.parse(readFileSync(opencodeLearningJson, 'utf-8'));

      expect(claudeLearning.author.name).toBe('Boris Cherny');
      expect(opencodeLearning.author.name).toContain('Boris Cherny');
    });
  });
});

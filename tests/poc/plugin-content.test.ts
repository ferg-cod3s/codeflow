/**
 * Tests for POC plugin content and logic validation
 *
 * These tests validate that the converted plugins maintain
 * functional equivalence with the original Claude Code plugins.
 */

import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';

const POC_BASE = join(process.cwd(), 'examples/poc-anthropic-plugins');

describe('POC Plugin Content Validation', () => {
  describe('Instructions Preservation', () => {
    it('should preserve explanatory instructions from Claude Code to OpenCode', () => {
      const claudeHandlerPath = join(
        POC_BASE,
        'claude-code-format/explanatory-output-style/hooks-handlers/session-start.sh'
      );
      const opencodePluginPath = join(
        POC_BASE,
        'opencode-format/explanatory-output-style/explanatory-output-style.ts'
      );

      const claudeContent = readFileSync(claudeHandlerPath, 'utf-8');
      const opencodeContent = readFileSync(opencodePluginPath, 'utf-8');

      // Extract key instruction phrases
      const keyPhrases = [
        'explanatory',
        'educational insights',
        '★ Insight',
        'implementation choices',
        'codebase'
      ];

      for (const phrase of keyPhrases) {
        expect(claudeContent.toLowerCase()).toContain(phrase.toLowerCase());
        expect(opencodeContent.toLowerCase()).toContain(phrase.toLowerCase());
      }
    });

    it('should preserve learning instructions from Claude Code to OpenCode', () => {
      const claudeHandlerPath = join(
        POC_BASE,
        'claude-code-format/learning-output-style/hooks-handlers/session-start.sh'
      );
      const opencodePluginPath = join(
        POC_BASE,
        'opencode-format/learning-output-style/learning-output-style.ts'
      );

      const claudeContent = readFileSync(claudeHandlerPath, 'utf-8');
      const opencodeContent = readFileSync(opencodePluginPath, 'utf-8');

      const keyPhrases = [
        'learning',
        'interactive',
        'Request contributions',
        'Implement directly',
        'Business logic',
        'Error handling',
        'Boilerplate'
      ];

      for (const phrase of keyPhrases) {
        expect(claudeContent).toContain(phrase);
        expect(opencodeContent).toContain(phrase);
      }
    });

    it('should preserve insight marker format', () => {
      const plugins = [
        'explanatory-output-style',
        'learning-output-style'
      ];

      for (const plugin of plugins) {
        const claudePath = join(POC_BASE, `claude-code-format/${plugin}/hooks-handlers/session-start.sh`);
        const opencodePath = join(POC_BASE, `opencode-format/${plugin}/${plugin}.ts`);

        const claudeContent = readFileSync(claudePath, 'utf-8');
        const opencodeContent = readFileSync(opencodePath, 'utf-8');

        // Check for insight marker
        expect(claudeContent).toContain('★ Insight');
        expect(opencodeContent).toContain('★ Insight');

        // Check for insight formatting
        expect(claudeContent).toContain('─────────────────────────────────────');
        expect(opencodeContent).toContain('─────────────────────────────────────');
      }
    });
  });

  describe('Hook Mapping Validation', () => {
    it('should map SessionStart hook to session.start event', () => {
      const claudeHooksPath = join(
        POC_BASE,
        'claude-code-format/explanatory-output-style/hooks/hooks.json'
      );
      const opencodePluginPath = join(
        POC_BASE,
        'opencode-format/explanatory-output-style/explanatory-output-style.ts'
      );

      const claudeHooks = JSON.parse(readFileSync(claudeHooksPath, 'utf-8'));
      const opencodeContent = readFileSync(opencodePluginPath, 'utf-8');

      // Verify Claude Code has SessionStart
      expect(claudeHooks.hooks.SessionStart).toBeDefined();

      // Verify OpenCode has session.start event handling
      expect(opencodeContent).toContain('event: async ({ event })');
      expect(opencodeContent).toContain('session.start');
    });

    it('should implement tool execution hooks in OpenCode', () => {
      const opencodePlugins = [
        'explanatory-output-style/explanatory-output-style.ts',
        'learning-output-style/learning-output-style.ts'
      ];

      for (const plugin of opencodePlugins) {
        const pluginPath = join(POC_BASE, `opencode-format/${plugin}`);
        const content = readFileSync(pluginPath, 'utf-8');

        // Check for tool hooks structure
        expect(content).toContain('tool: {');
        expect(content).toContain('execute: {');

        // Should have before or after hooks
        const hasBeforeHook = content.includes('before: async');
        const hasAfterHook = content.includes('after: async');

        expect(hasBeforeHook || hasAfterHook).toBe(true);
      }
    });
  });

  describe('TypeScript Syntax Validation', () => {
    it('should have valid TypeScript imports', () => {
      const opencodePlugins = [
        'explanatory-output-style/explanatory-output-style.ts',
        'learning-output-style/learning-output-style.ts'
      ];

      for (const plugin of opencodePlugins) {
        const pluginPath = join(POC_BASE, `opencode-format/${plugin}`);
        const content = readFileSync(pluginPath, 'utf-8');

        // Check for proper imports
        expect(content).toContain('import type { Plugin }');
        expect(content).toContain('@opencode-ai/plugin');
      }
    });

    it('should export plugin correctly', () => {
      const opencodePlugins = [
        { path: 'explanatory-output-style/explanatory-output-style.ts', name: 'ExplanatoryOutputStyle' },
        { path: 'learning-output-style/learning-output-style.ts', name: 'LearningOutputStyle' }
      ];

      for (const plugin of opencodePlugins) {
        const pluginPath = join(POC_BASE, `opencode-format/${plugin.path}`);
        const content = readFileSync(pluginPath, 'utf-8');

        // Check for proper export
        expect(content).toContain(`export const ${plugin.name}: Plugin`);
        expect(content).toContain('= async');
        expect(content).toContain('export default');
      }
    });

    it('should have async plugin function', () => {
      const opencodePlugins = [
        'explanatory-output-style/explanatory-output-style.ts',
        'learning-output-style/learning-output-style.ts'
      ];

      for (const plugin of opencodePlugins) {
        const pluginPath = join(POC_BASE, `opencode-format/${plugin}`);
        const content = readFileSync(pluginPath, 'utf-8');

        // Plugin should be async and return hooks
        expect(content).toMatch(/Plugin\s*=\s*async/);
        expect(content).toContain('return {');
      }
    });
  });

  describe('Documentation Quality', () => {
    it('should document conversion differences in OpenCode READMEs', () => {
      const readmes = [
        'explanatory-output-style/README.md',
        'learning-output-style/README.md'
      ];

      for (const readme of readmes) {
        const readmePath = join(POC_BASE, `opencode-format/${readme}`);
        const content = readFileSync(readmePath, 'utf-8');

        expect(content).toContain('Differences from Claude Code');
        expect(content).toContain('Claude Code Approach');
        expect(content).toContain('OpenCode Approach');
      }
    });

    it('should provide installation instructions for both formats', () => {
      const readmes = [
        'explanatory-output-style/README.md',
        'learning-output-style/README.md'
      ];

      for (const readme of readmes) {
        const readmePath = join(POC_BASE, `opencode-format/${readme}`);
        const content = readFileSync(readmePath, 'utf-8');

        expect(content).toContain('Installation');
        expect(content).toContain('.opencode/plugin');
        // Check for either package.json or opencode.json
        const hasConfigMention = content.includes('package.json') || content.includes('opencode.json');
        expect(hasConfigMention).toBe(true);
      }
    });

    it('should recommend .opencode/rules.md configuration', () => {
      const readmes = [
        'explanatory-output-style/README.md',
        'learning-output-style/README.md'
      ];

      for (const readme of readmes) {
        const readmePath = join(POC_BASE, `opencode-format/${readme}`);
        const content = readFileSync(readmePath, 'utf-8');

        expect(content).toContain('.opencode/rules.md');
        expect(content).toContain('Configuration');
      }
    });

    it('should warn about token costs', () => {
      const readmes = [
        'explanatory-output-style/README.md',
        'learning-output-style/README.md'
      ];

      for (const readme of readmes) {
        const readmePath = join(POC_BASE, `opencode-format/${readme}`);
        const content = readFileSync(readmePath, 'utf-8');

        expect(content.toLowerCase()).toContain('token');
        expect(content.toLowerCase()).toContain('cost');
      }
    });
  });

  describe('Feature Completeness', () => {
    it('should document all explanatory plugin features', () => {
      const readmePath = join(
        POC_BASE,
        'opencode-format/explanatory-output-style/README.md'
      );
      const content = readFileSync(readmePath, 'utf-8');

      const features = [
        'educational insights',
        'implementation choices',
        'codebase patterns',
        '★ Insight'
      ];

      for (const feature of features) {
        expect(content.toLowerCase()).toContain(feature.toLowerCase());
      }
    });

    it('should document all learning plugin features', () => {
      const readmePath = join(
        POC_BASE,
        'opencode-format/learning-output-style/README.md'
      );
      const content = readFileSync(readmePath, 'utf-8');

      const features = [
        'Interactive Learning',
        'code contributions',
        'decision points',
        '5-10 lines',
        'constructive feedback'
      ];

      for (const feature of features) {
        expect(content).toContain(feature);
      }
    });
  });

  describe('Conversion Guide Completeness', () => {
    it('should document conversion methodology', () => {
      const guidePath = join(POC_BASE, 'POC_CONVERSION_GUIDE.md');
      const content = readFileSync(guidePath, 'utf-8');

      const sections = [
        'Overview',
        'Conversion Methodology',
        'Key Insights',
        'Automation Feasibility',
        'Recommendations'
      ];

      for (const section of sections) {
        expect(content).toContain(section);
      }
    });

    it('should provide conversion steps', () => {
      const guidePath = join(POC_BASE, 'POC_CONVERSION_GUIDE.md');
      const content = readFileSync(guidePath, 'utf-8');

      expect(content).toContain('Step 1');
      expect(content).toContain('Step 2');
      expect(content).toContain('Step 3');
    });

    it('should document challenges and solutions', () => {
      const guidePath = join(POC_BASE, 'POC_CONVERSION_GUIDE.md');
      const content = readFileSync(guidePath, 'utf-8');

      expect(content).toContain('Challenges');
      expect(content).toContain('Solution');
      expect(content).toContain('Workaround');
    });

    it('should include automation feasibility assessment', () => {
      const guidePath = join(POC_BASE, 'POC_CONVERSION_GUIDE.md');
      const content = readFileSync(guidePath, 'utf-8');

      expect(content).toContain('Automatable');
      expect(content).toContain('70-80%');
      expect(content).toContain('Manual Intervention');
    });
  });

  describe('Metadata Consistency', () => {
    it('should maintain version consistency', () => {
      const plugins = [
        'explanatory-output-style',
        'learning-output-style'
      ];

      for (const plugin of plugins) {
        const claudeJsonPath = join(POC_BASE, `claude-code-format/${plugin}/.claude-plugin/plugin.json`);
        const opencodeJsonPath = join(POC_BASE, `opencode-format/${plugin}/package.json`);

        const claudeJson = JSON.parse(readFileSync(claudeJsonPath, 'utf-8'));
        const opencodeJson = JSON.parse(readFileSync(opencodeJsonPath, 'utf-8'));

        expect(claudeJson.version).toBe('1.0.0');
        expect(opencodeJson.version).toBe('1.0.0');
      }
    });

    it('should maintain description consistency', () => {
      const plugins = [
        'explanatory-output-style',
        'learning-output-style'
      ];

      for (const plugin of plugins) {
        const claudeJsonPath = join(POC_BASE, `claude-code-format/${plugin}/.claude-plugin/plugin.json`);
        const opencodeJsonPath = join(POC_BASE, `opencode-format/${plugin}/package.json`);

        const claudeJson = JSON.parse(readFileSync(claudeJsonPath, 'utf-8'));
        const opencodeJson = JSON.parse(readFileSync(opencodeJsonPath, 'utf-8'));

        // Descriptions should have similar content
        const claudeDesc = claudeJson.description.toLowerCase();
        const opencodeDesc = opencodeJson.description.toLowerCase();

        // Check key terms are preserved
        if (claudeDesc.includes('educational')) {
          expect(opencodeDesc).toContain('educational');
        }
        if (claudeDesc.includes('learning')) {
          expect(opencodeDesc).toContain('learning');
        }
      }
    });
  });
});

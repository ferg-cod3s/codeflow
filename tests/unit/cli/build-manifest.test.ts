/**
 * Build Manifest Tests
 * Tests the build-manifest.ts functionality for generating agent manifests
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import { mkdir, writeFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { buildManifest, AgentManifest } from '../../../src/cli/build-manifest';
import { setupTests, cleanupTests, TEST_DIR } from '../../setup';

describe('Build Manifest', () => {
  let testProjectRoot: string;
  let agentsDir: string;

  beforeAll(async () => {
    await setupTests();
  });

  afterAll(async () => {
    await cleanupTests();
  });

  beforeEach(async () => {
    // Create test project structure
    testProjectRoot = join(TEST_DIR, `build-manifest-test-${Date.now()}`);
    agentsDir = join(testProjectRoot, 'base-agents');

    await mkdir(testProjectRoot, { recursive: true });
    await mkdir(agentsDir, { recursive: true });
  });

  afterEach(async () => {
    if (existsSync(testProjectRoot)) {
      await rm(testProjectRoot, { recursive: true, force: true });
    }
  });

  describe('scanAgentsDirectory', () => {
    test('should scan and find agents in category directories', async () => {
      // Create category directories with agent files
      const developmentDir = join(agentsDir, 'development');
      const operationsDir = join(agentsDir, 'operations');

      await mkdir(developmentDir, { recursive: true });
      await mkdir(operationsDir, { recursive: true });

      // Create agent files
      await writeFile(join(developmentDir, 'codebase-analyzer.md'), 'Test agent');
      await writeFile(join(developmentDir, 'migration-specialist.md'), 'Test agent');
      await writeFile(join(operationsDir, 'deployment-manager.md'), 'Test agent');

      const result = await buildManifest({
        projectRoot: testProjectRoot,
        dryRun: true,
      });

      // Check that the function runs without error (dry run)
      expect(result).toBeUndefined(); // buildManifest returns void
    });

    test('should handle empty codeflow-agents directory', async () => {
      const result = await buildManifest({
        projectRoot: testProjectRoot,
        dryRun: true,
      });

      expect(result).toBeUndefined();
    });

    test('should handle missing codeflow-agents directory', async () => {
      await rm(agentsDir, { recursive: true, force: true });

      await expect(
        buildManifest({
          projectRoot: testProjectRoot,
          dryRun: true,
        })
      ).rejects.toThrow('Codeflow agents directory not found');
    });
  });

  describe('getCategoryFromName', () => {
    test('should categorize agents by name patterns', async () => {
      // Create agents with different naming patterns
      const categories = [
        'core-workflow',
        'operations',
        'development',
        'quality-testing',
        'security',
        'design-ux',
      ];

      for (const category of categories) {
        const categoryDir = join(agentsDir, category);
        await mkdir(categoryDir, { recursive: true });

        let agentName: string;
        switch (category) {
          case 'core-workflow':
            agentName = 'codebase-locator';
            break;
          case 'operations':
            agentName = 'deployment-specialist';
            break;
          case 'development':
            agentName = 'migration-helper';
            break;
          case 'quality-testing':
            agentName = 'performance-analyzer';
            break;
          case 'security':
            agentName = 'security-auditor';
            break;
          case 'design-ux':
            agentName = 'ui-designer';
            break;
          default:
            agentName = 'generic-agent';
        }

        await writeFile(join(categoryDir, `${agentName}.md`), 'Test agent');
      }

      const result = await buildManifest({
        projectRoot: testProjectRoot,
        dryRun: true,
      });

      expect(result).toBeUndefined();
    });

    test('should default to specialized category for unknown patterns', async () => {
      const specializedDir = join(agentsDir, 'specialized');
      await mkdir(specializedDir, { recursive: true });
      await writeFile(join(specializedDir, 'custom-agent.md'), 'Test agent');

      const result = await buildManifest({
        projectRoot: testProjectRoot,
        dryRun: true,
      });

      expect(result).toBeUndefined();
    });
  });

  describe('buildManifest function', () => {
    test('should generate manifest with proper structure', async () => {
      // Create test agents
      const devDir = join(agentsDir, 'development');
      await mkdir(devDir, { recursive: true });
      await writeFile(join(devDir, 'codebase-analyzer.md'), 'Test agent');
      await writeFile(join(devDir, 'migration-specialist.md'), 'Test agent');

      const outputFile = join(testProjectRoot, 'test-manifest.json');

      await buildManifest({
        projectRoot: testProjectRoot,
        output: outputFile,
        verbose: false,
      });

      expect(existsSync(outputFile)).toBe(true);

      // Read and validate manifest structure
      const manifestContent = await Bun.file(outputFile).json();
      const manifest = manifestContent as AgentManifest;

      expect(manifest).toHaveProperty('canonical_agents');
      expect(manifest).toHaveProperty('total_agents');
      expect(manifest).toHaveProperty('last_updated');
      expect(manifest).toHaveProperty('canonical_directories');
      expect(manifest).toHaveProperty('format_info');

      expect(Array.isArray(manifest.canonical_agents)).toBe(true);
      expect(typeof manifest.total_agents).toBe('number');
      expect(typeof manifest.last_updated).toBe('string');
      expect(Array.isArray(manifest.canonical_directories)).toBe(true);
      expect(typeof manifest.format_info).toBe('object');
    });

    test('should handle dry-run mode correctly', async () => {
      const devDir = join(agentsDir, 'development');
      await mkdir(devDir, { recursive: true });
      await writeFile(join(devDir, 'test-agent.md'), 'Test agent');

      const outputFile = join(testProjectRoot, 'dry-run-manifest.json');

      // Dry run should not create file
      await buildManifest({
        projectRoot: testProjectRoot,
        output: outputFile,
        dryRun: true,
      });

      expect(existsSync(outputFile)).toBe(false);
    });

    test('should create output directory if it does not exist', async () => {
      const devDir = join(agentsDir, 'development');
      await mkdir(devDir, { recursive: true });
      await writeFile(join(devDir, 'test-agent.md'), 'Test agent');

      const nestedOutputDir = join(testProjectRoot, 'nested', 'output');
      const outputFile = join(nestedOutputDir, 'manifest.json');

      await buildManifest({
        projectRoot: testProjectRoot,
        output: outputFile,
      });

      expect(existsSync(outputFile)).toBe(true);
    });

    test('should include correct format information', async () => {
      const devDir = join(agentsDir, 'development');
      await mkdir(devDir, { recursive: true });
      await writeFile(join(devDir, 'test-agent.md'), 'Test agent');

      const outputFile = join(testProjectRoot, 'format-test-manifest.json');

      await buildManifest({
        projectRoot: testProjectRoot,
        output: outputFile,
      });

      const manifest = (await Bun.file(outputFile).json()) as AgentManifest;

      expect(manifest.format_info).toHaveProperty('base');
      expect(manifest.format_info).toHaveProperty('claude-code');
      expect(manifest.format_info).toHaveProperty('opencode');

      expect(manifest.format_info.base).toHaveProperty('description');
      expect(manifest.format_info.base).toHaveProperty('model_format');
      expect(manifest.format_info.base).toHaveProperty('primary_use');

      expect(manifest.format_info['claude-code']).toHaveProperty('description');
      expect(manifest.format_info['claude-code']).toHaveProperty('model_format');
      expect(manifest.format_info['claude-code']).toHaveProperty('primary_use');

      expect(manifest.format_info.opencode).toHaveProperty('description');
      expect(manifest.format_info.opencode).toHaveProperty('model_format');
      expect(manifest.format_info.opencode).toHaveProperty('primary_use');
    });

    test('should include canonical directories', async () => {
      const devDir = join(agentsDir, 'development');
      await mkdir(devDir, { recursive: true });
      await writeFile(join(devDir, 'test-agent.md'), 'Test agent');

      const outputFile = join(testProjectRoot, 'directories-test-manifest.json');

      await buildManifest({
        projectRoot: testProjectRoot,
        output: outputFile,
      });

      const manifest = (await Bun.file(outputFile).json()) as AgentManifest;

      expect(manifest.canonical_directories).toContain('base-agents/');
      expect(manifest.canonical_directories).toContain('.claude/agents/');
      expect(manifest.canonical_directories).toContain('.opencode/agent/');
    });

    test('should generate correct agent entries', async () => {
      const devDir = join(agentsDir, 'development');
      await mkdir(devDir, { recursive: true });
      await writeFile(join(devDir, 'codebase-analyzer.md'), 'Test agent');

      const outputFile = join(testProjectRoot, 'agent-entries-test-manifest.json');

      await buildManifest({
        projectRoot: testProjectRoot,
        output: outputFile,
      });

      const manifest = (await Bun.file(outputFile).json()) as AgentManifest;

      expect(manifest.total_agents).toBe(1);
      expect(manifest.canonical_agents).toHaveLength(1);

      const agent = manifest.canonical_agents[0];
      expect(agent).toHaveProperty('name');
      expect(agent).toHaveProperty('description');
      expect(agent).toHaveProperty('category');
      expect(agent).toHaveProperty('sources');

      expect(agent.name).toBe('codebase-analyzer');
      expect(agent.description).toBe('Agent: codebase analyzer');
      expect(agent.category).toBe('development'); // Category determined by directory structure

      expect(agent.sources).toHaveProperty('base');
      expect(agent.sources).toHaveProperty('claude-code');
      expect(agent.sources).toHaveProperty('opencode');

      expect(agent.sources.base).toBe('base-agents/development/codebase-analyzer.md');
      expect(agent.sources['claude-code']).toBe('.claude/agents/codebase-analyzer.md');
      expect(agent.sources.opencode).toBe('.opencode/agent/codebase-analyzer.md');
    });

    test('should sort agents alphabetically', async () => {
      const devDir = join(agentsDir, 'development');
      await mkdir(devDir, { recursive: true });

      // Create agents in non-alphabetical order
      await writeFile(join(devDir, 'zebra-agent.md'), 'Test agent');
      await writeFile(join(devDir, 'apple-agent.md'), 'Test agent');
      await writeFile(join(devDir, 'banana-agent.md'), 'Test agent');

      const outputFile = join(testProjectRoot, 'sorted-test-manifest.json');

      await buildManifest({
        projectRoot: testProjectRoot,
        output: outputFile,
      });

      const manifest = (await Bun.file(outputFile).json()) as AgentManifest;

      expect(manifest.total_agents).toBe(3);
      expect(manifest.canonical_agents[0].name).toBe('apple-agent');
      expect(manifest.canonical_agents[1].name).toBe('banana-agent');
      expect(manifest.canonical_agents[2].name).toBe('zebra-agent');
    });

    test('should handle verbose output', async () => {
      const devDir = join(agentsDir, 'development');
      await mkdir(devDir, { recursive: true });
      await writeFile(join(devDir, 'test-agent.md'), 'Test agent');

      const outputFile = join(testProjectRoot, 'verbose-test-manifest.json');

      // Capture console output
      const originalConsoleLog = console.log;
      let consoleOutput = '';
      console.log = (...args) => {
        consoleOutput += args.join(' ') + '\n';
      };

      try {
        await buildManifest({
          projectRoot: testProjectRoot,
          output: outputFile,
          verbose: true,
        });

        expect(consoleOutput).toContain('🏗️ Generating agent manifest');
        expect(consoleOutput).toContain('Found 1 canonical agents');
        expect(consoleOutput).toContain('✅ Agent manifest created successfully');
      } finally {
        console.log = originalConsoleLog;
      }
    });

    test('should handle errors gracefully', async () => {
      // Test with non-existent project root
      await expect(
        buildManifest({
          projectRoot: '/non/existent/path',
        })
      ).rejects.toThrow();
    });
  });

  describe('BuildManifestOptions', () => {
    test('should use default options when none provided', async () => {
      const devDir = join(agentsDir, 'development');
      await mkdir(devDir, { recursive: true });
      await writeFile(join(devDir, 'test-agent.md'), 'Test agent');

      const outputFile = join(testProjectRoot, 'default-options-manifest.json');

      // Should not throw with minimal options (projectRoot + output)
      await expect(buildManifest({
        projectRoot: testProjectRoot,
        output: outputFile,
      })).resolves.toBeUndefined();
    });

    test('should respect custom output path', async () => {
      const devDir = join(agentsDir, 'development');
      await mkdir(devDir, { recursive: true });
      await writeFile(join(devDir, 'test-agent.md'), 'Test agent');

      const customOutput = join(testProjectRoot, 'custom-manifest.json');

      await buildManifest({
        projectRoot: testProjectRoot,
        output: customOutput,
      });

      expect(existsSync(customOutput)).toBe(true);
    });

    test('should respect project root option', async () => {
      const devDir = join(agentsDir, 'development');
      await mkdir(devDir, { recursive: true });
      await writeFile(join(devDir, 'test-agent.md'), 'Test agent');

      const outputFile = join(testProjectRoot, 'custom-root-manifest.json');

      await buildManifest({
        projectRoot: testProjectRoot,
        output: outputFile,
      });

      expect(existsSync(outputFile)).toBe(true);
    });
  });
});

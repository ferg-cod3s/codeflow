/**
 * Manifest Integration Tests
 * Tests manifest build/validation in setup/sync workflows
 */





import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import { mkdir, writeFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { buildManifest } from '../../src/cli/build-manifest';
import { setupTests, cleanupTests, TEST_DIR } from '../setup';

describe('Manifest Integration', () => {
  let testProjectRoot: string;

  beforeAll(async () => {
    await setupTests();
  });

  afterAll(async () => {
    await cleanupTests();
  });

  beforeEach(async () => {
    testProjectRoot = join(TEST_DIR, `manifest-integration-${Date.now()}`);
    await mkdir(testProjectRoot, { recursive: true });
  });

  afterEach(async () => {
    if (existsSync(testProjectRoot)) {
      await rm(testProjectRoot, { recursive: true, force: true });
    }
  });

  describe('Setup Workflow Integration', () => {
    test('should build manifest after agent setup', async () => {
      // Simulate agent setup by creating agent directories and files
      const agentsDir = join(testProjectRoot, 'codeflow-agents');
      await mkdir(join(agentsDir, 'development'), { recursive: true });
      await mkdir(join(agentsDir, 'operations'), { recursive: true });

      // Create agent files
      await writeFile(join(agentsDir, 'development', 'codebase-analyzer.md'), 'Test agent');
      await writeFile(join(agentsDir, 'development', 'migration-specialist.md'), 'Test agent');
      await writeFile(join(agentsDir, 'operations', 'deployment-manager.md'), 'Test agent');

      // Build manifest
      const manifestFile = join(testProjectRoot, 'AGENT_MANIFEST.json');
      await buildManifest({
        projectRoot: testProjectRoot,
        output: manifestFile,
        verbose: false,
      });

      expect(existsSync(manifestFile)).toBe(true);

      // Verify manifest content
      const manifest = await Bun.file(manifestFile).json();
      expect(manifest.total_agents).toBe(3);
      expect(manifest.canonical_agents).toHaveLength(3);

      const agentNames = manifest.canonical_agents.map((a: any) => a.name);
      expect(agentNames).toContain('codebase-analyzer');
      expect(agentNames).toContain('migration-specialist');
      expect(agentNames).toContain('deployment-manager');
    });

    test('should rebuild manifest after agent additions', async () => {
      // Initial setup
      const agentsDir = join(testProjectRoot, 'codeflow-agents');
      await mkdir(join(agentsDir, 'development'), { recursive: true });
      await writeFile(join(agentsDir, 'development', 'initial-agent.md'), 'Initial agent');

      // Build initial manifest
      const manifestFile = join(testProjectRoot, 'AGENT_MANIFEST.json');
      await buildManifest({
        projectRoot: testProjectRoot,
        output: manifestFile,
        verbose: false,
      });

      let manifest = await Bun.file(manifestFile).json();
      expect(manifest.total_agents).toBe(1);

      // Add more agents
      await mkdir(join(agentsDir, 'quality-testing'), { recursive: true });
      await writeFile(join(agentsDir, 'quality-testing', 'test-generator.md'), 'Test generator');
      await writeFile(join(agentsDir, 'development', 'code-reviewer.md'), 'Code reviewer');

      // Rebuild manifest
      await buildManifest({
        projectRoot: testProjectRoot,
        output: manifestFile,
        verbose: false,
      });

      // Verify updated manifest
      manifest = await Bun.file(manifestFile).json();
      expect(manifest.total_agents).toBe(3);

      const agentNames = manifest.canonical_agents.map((a: any) => a.name);
      expect(agentNames).toContain('initial-agent');
      expect(agentNames).toContain('test-generator');
      expect(agentNames).toContain('code-reviewer');
    });

    test('should handle agent removal gracefully', async () => {
      // Initial setup with multiple agents
      const agentsDir = join(testProjectRoot, 'codeflow-agents');
      await mkdir(join(agentsDir, 'development'), { recursive: true });
      await mkdir(join(agentsDir, 'operations'), { recursive: true });

      await writeFile(join(agentsDir, 'development', 'agent1.md'), 'Agent 1');
      await writeFile(join(agentsDir, 'development', 'agent2.md'), 'Agent 2');
      await writeFile(join(agentsDir, 'operations', 'agent3.md'), 'Agent 3');

      // Build initial manifest
      const manifestFile = join(testProjectRoot, 'AGENT_MANIFEST.json');
      await buildManifest({
        projectRoot: testProjectRoot,
        output: manifestFile,
        verbose: false,
      });

      let manifest = await Bun.file(manifestFile).json();
      expect(manifest.total_agents).toBe(3);

      // Remove an agent
      await rm(join(agentsDir, 'development', 'agent2.md'));

      // Rebuild manifest
      await buildManifest({
        projectRoot: testProjectRoot,
        output: manifestFile,
        verbose: false,
      });

      // Verify updated manifest
      manifest = await Bun.file(manifestFile).json();
      expect(manifest.total_agents).toBe(2);

      const agentNames = manifest.canonical_agents.map((a: any) => a.name);
      expect(agentNames).toContain('agent1');
      expect(agentNames).toContain('agent3');
      expect(agentNames).not.toContain('agent2');
    });
  });

  describe('Sync Workflow Integration', () => {
    test('should validate manifest during sync', async () => {
      // Create agents and build manifest
      const agentsDir = join(testProjectRoot, 'codeflow-agents');
      await mkdir(join(agentsDir, 'development'), { recursive: true });
      await writeFile(join(agentsDir, 'development', 'test-agent.md'), 'Test agent');

      const manifestFile = join(testProjectRoot, 'AGENT_MANIFEST.json');
      await buildManifest({
        projectRoot: testProjectRoot,
        output: manifestFile,
        verbose: false,
      });

      // Verify manifest structure
      const manifest = await Bun.file(manifestFile).json();
      expect(manifest).toHaveProperty('canonical_agents');
      expect(manifest).toHaveProperty('total_agents');
      expect(manifest).toHaveProperty('last_updated');
      expect(manifest).toHaveProperty('canonical_directories');
      expect(manifest).toHaveProperty('format_info');

      // Verify canonical directories
      expect(manifest.canonical_directories).toContain('codeflow-agents/');
      expect(manifest.canonical_directories).toContain('.claude/agents/');
      expect(manifest.canonical_directories).toContain('.opencode/agent/');
    });

    test('should maintain manifest consistency during sync', async () => {
      // Create initial setup
      const agentsDir = join(testProjectRoot, 'codeflow-agents');
      await mkdir(join(agentsDir, 'development'), { recursive: true });
      await writeFile(join(agentsDir, 'development', 'consistent-agent.md'), 'Consistent agent');

      // Build manifest
      const manifestFile = join(testProjectRoot, 'AGENT_MANIFEST.json');
      await buildManifest({
        projectRoot: testProjectRoot,
        output: manifestFile,
        verbose: false,
      });

      // Simulate sync operations by modifying agent files
      await writeFile(
        join(agentsDir, 'development', 'consistent-agent.md'),
        'Updated agent content'
      );

      // Rebuild manifest to ensure consistency
      await buildManifest({
        projectRoot: testProjectRoot,
        output: manifestFile,
        verbose: false,
      });

      // Verify manifest is still consistent
      const manifest = await Bun.file(manifestFile).json();
      expect(manifest.total_agents).toBe(1);
      expect(manifest.canonical_agents[0].name).toBe('consistent-agent');
    });

    test('should handle manifest corruption gracefully', async () => {
      // Create corrupted manifest
      const manifestFile = join(testProjectRoot, 'AGENT_MANIFEST.json');
      await writeFile(manifestFile, 'invalid json content');

      // Create agents
      const agentsDir = join(testProjectRoot, 'codeflow-agents');
      await mkdir(join(agentsDir, 'development'), { recursive: true });
      await writeFile(join(agentsDir, 'development', 'recovery-agent.md'), 'Recovery agent');

      // Rebuild manifest (should overwrite corrupted one)
      await buildManifest({
        projectRoot: testProjectRoot,
        output: manifestFile,
        verbose: false,
      });

      // Verify manifest is now valid
      const manifest = await Bun.file(manifestFile).json();
      expect(manifest.total_agents).toBe(1);
      expect(manifest.canonical_agents[0].name).toBe('recovery-agent');
    });
  });

  describe('Category Detection Integration', () => {
    test('should categorize agents correctly in manifest', async () => {
      // Create agents in different categories
      const agentsDir = join(testProjectRoot, 'codeflow-agents');
      const categories = ['development', 'operations', 'quality-testing', 'security'];

      for (const category of categories) {
        await mkdir(join(agentsDir, category), { recursive: true });
        await writeFile(join(agentsDir, category, `${category}-agent.md`), `${category} agent`);
      }

      // Build manifest
      const manifestFile = join(testProjectRoot, 'AGENT_MANIFEST.json');
      await buildManifest({
        projectRoot: testProjectRoot,
        output: manifestFile,
        verbose: false,
      });

      // Verify categorization
      const manifest = await Bun.file(manifestFile).json();
      expect(manifest.total_agents).toBe(4);

      const agentCategories = manifest.canonical_agents.map((a: any) => a.category);
      expect(agentCategories).toContain('development');
      expect(agentCategories).toContain('operations');
      expect(agentCategories).toContain('quality-testing');
      expect(agentCategories).toContain('security');
    });

    test('should handle mixed category scenarios', async () => {
      // Create agents with mixed categorization
      const agentsDir = join(testProjectRoot, 'codeflow-agents');
      await mkdir(join(agentsDir, 'mixed-category'), { recursive: true });

      // Agents that should be auto-categorized
      await writeFile(
        join(agentsDir, 'mixed-category', 'codebase-analyzer.md'),
        'Development agent'
      );
      await writeFile(
        join(agentsDir, 'mixed-category', 'performance-analyzer.md'),
        'Quality agent'
      );
      await writeFile(
        join(agentsDir, 'mixed-category', 'deployment-manager.md'),
        'Operations agent'
      );
      await writeFile(join(agentsDir, 'mixed-category', 'custom-agent.md'), 'Specialized agent');

      // Build manifest
      const manifestFile = join(testProjectRoot, 'AGENT_MANIFEST.json');
      await buildManifest({
        projectRoot: testProjectRoot,
        output: manifestFile,
        verbose: false,
      });

      // Verify mixed categorization
      const manifest = await Bun.file(manifestFile).json();
      expect(manifest.total_agents).toBe(4);

      const agents = manifest.canonical_agents;
      const analyzerAgent = agents.find((a: any) => a.name === 'codebase-analyzer');
      const performanceAgent = agents.find((a: any) => a.name === 'performance-analyzer');
      const deploymentAgent = agents.find((a: any) => a.name === 'deployment-manager');
      const customAgent = agents.find((a: any) => a.name === 'custom-agent');

      expect(analyzerAgent.category).toBe('development');
      expect(performanceAgent.category).toBe('quality-testing');
      expect(deploymentAgent.category).toBe('operations');
      expect(customAgent.category).toBe('specialized');
    });
  });

  describe('Manifest Validation Integration', () => {
    test('should validate manifest structure during build', async () => {
      // Create agents
      const agentsDir = join(testProjectRoot, 'codeflow-agents');
      await mkdir(join(agentsDir, 'development'), { recursive: true });
      await writeFile(join(agentsDir, 'development', 'validation-agent.md'), 'Validation agent');

      // Build manifest
      const manifestFile = join(testProjectRoot, 'AGENT_MANIFEST.json');
      await buildManifest({
        projectRoot: testProjectRoot,
        output: manifestFile,
        verbose: false,
      });

      // Validate manifest structure
      const manifest = await Bun.file(manifestFile).json();

      // Check required top-level properties
      expect(manifest).toHaveProperty('canonical_agents');
      expect(manifest).toHaveProperty('total_agents');
      expect(manifest).toHaveProperty('last_updated');
      expect(manifest).toHaveProperty('canonical_directories');
      expect(manifest).toHaveProperty('format_info');

      // Check canonical_agents structure
      expect(Array.isArray(manifest.canonical_agents)).toBe(true);
      if (manifest.canonical_agents.length > 0) {
        const agent = manifest.canonical_agents[0];
        expect(agent).toHaveProperty('name');
        expect(agent).toHaveProperty('description');
        expect(agent).toHaveProperty('category');
        expect(agent).toHaveProperty('sources');

        // Check sources structure
        expect(agent.sources).toHaveProperty('base');
        expect(agent.sources).toHaveProperty('claude-code');
        expect(agent.sources).toHaveProperty('opencode');
      }

      // Check format_info structure
      expect(manifest.format_info).toHaveProperty('base');
      expect(manifest.format_info).toHaveProperty('claude-code');
      expect(manifest.format_info).toHaveProperty('opencode');

      // Check each format info
      Object.values(manifest.format_info).forEach((format: any) => {
        expect(format).toHaveProperty('description');
        expect(format).toHaveProperty('model_format');
        expect(format).toHaveProperty('primary_use');
      });
    });

    test('should validate agent count consistency', async () => {
      // Create agents
      const agentsDir = join(testProjectRoot, 'codeflow-agents');
      await mkdir(join(agentsDir, 'development'), { recursive: true });

      for (let i = 0; i < 5; i++) {
        await writeFile(join(agentsDir, 'development', `agent-${i}.md`), `Agent ${i}`);
      }

      // Build manifest
      const manifestFile = join(testProjectRoot, 'AGENT_MANIFEST.json');
      await buildManifest({
        projectRoot: testProjectRoot,
        output: manifestFile,
        verbose: false,
      });

      // Validate count consistency
      const manifest = await Bun.file(manifestFile).json();
      expect(manifest.total_agents).toBe(5);
      expect(manifest.canonical_agents).toHaveLength(5);
      expect(manifest.total_agents).toBe(manifest.canonical_agents.length);
    });

    test('should validate timestamp format', async () => {
      // Create agents
      const agentsDir = join(testProjectRoot, 'codeflow-agents');
      await mkdir(join(agentsDir, 'development'), { recursive: true });
      await writeFile(join(agentsDir, 'development', 'timestamp-agent.md'), 'Timestamp agent');

      // Build manifest
      const manifestFile = join(testProjectRoot, 'AGENT_MANIFEST.json');
      await buildManifest({
        projectRoot: testProjectRoot,
        output: manifestFile,
        verbose: false,
      });

      // Validate timestamp
      const manifest = await Bun.file(manifestFile).json();
      expect(manifest.last_updated).toBeDefined();

      // Should be a valid ISO timestamp
      const timestamp = new Date(manifest.last_updated);
      expect(timestamp.getTime()).not.toBeNaN();
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });
  });

  describe('Performance Integration', () => {
    test('should build manifest efficiently with many agents', async () => {
      // Create many agents
      const agentsDir = join(testProjectRoot, 'codeflow-agents');
      await mkdir(join(agentsDir, 'development'), { recursive: true });

      const startTime = Date.now();

      // Create 100 agents
      for (let i = 0; i < 100; i++) {
        await writeFile(join(agentsDir, 'development', `agent-${i}.md`), `Agent ${i} content`);
      }

      // Build manifest
      const manifestFile = join(testProjectRoot, 'AGENT_MANIFEST.json');
      await buildManifest({
        projectRoot: testProjectRoot,
        output: manifestFile,
        verbose: false,
      });

      const duration = Date.now() - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000);

      // Verify manifest
      const manifest = await Bun.file(manifestFile).json();
      expect(manifest.total_agents).toBe(100);
    });

    test('should handle incremental manifest updates efficiently', async () => {
      // Create initial agents
      const agentsDir = join(testProjectRoot, 'codeflow-agents');
      await mkdir(join(agentsDir, 'development'), { recursive: true });

      for (let i = 0; i < 10; i++) {
        await writeFile(join(agentsDir, 'development', `initial-${i}.md`), `Initial agent ${i}`);
      }

      // Build initial manifest
      const manifestFile = join(testProjectRoot, 'AGENT_MANIFEST.json');
      await buildManifest({
        projectRoot: testProjectRoot,
        output: manifestFile,
        verbose: false,
      });

      // Add more agents incrementally
      const startTime = Date.now();

      for (let i = 0; i < 5; i++) {
        await writeFile(
          join(agentsDir, 'development', `incremental-${i}.md`),
          `Incremental agent ${i}`
        );

        // Rebuild manifest
        await buildManifest({
          projectRoot: testProjectRoot,
          output: manifestFile,
          verbose: false,
        });
      }

      const duration = Date.now() - startTime;

      // Should complete efficiently
      expect(duration).toBeLessThan(2000);

      // Verify final manifest
      const manifest = await Bun.file(manifestFile).json();
      expect(manifest.total_agents).toBe(15);
    });
  });
});

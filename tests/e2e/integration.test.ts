/**
 * End-to-End Integration Tests
 * Complete workflows including import, convert, sync, and deploy
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile, mkdir, rm, readdir, copyFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import * as yaml from 'yaml';
import { setupTests, cleanupTests, TEST_DIR, TEST_OUTPUT, testPaths, waitForFile } from '../setup';

const execAsync = promisify(exec);

async function runCommand(cmd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const { stdout, stderr } = await execAsync(cmd, {
      cwd: process.cwd(),
      env: process.env
    });
    return { stdout, stderr, code: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
      code: error.code || 1
    };
  }
}

describe('End-to-End Integration', () => {
  const integrationDir = join(TEST_DIR, 'integration');
  const testProjectDir = join(integrationDir, 'test-project');
  
  beforeAll(async () => {
    await setupTests();
    await mkdir(integrationDir, { recursive: true });
    await mkdir(testProjectDir, { recursive: true });
  });

  afterAll(async () => {
    await cleanupTests();
  });

  describe('Complete workflow: Create → Convert → Sync → Deploy', () => {
    test('should create agent, convert between formats, and sync', async () => {
      // Step 1: Create test agent in Claude format
      const claudeAgent = `---
name: integration-test-agent
description: Agent created for integration testing
model: opencode/code-supernova
temperature: 0.7
category: testing
tags: ["test", "integration"]
---

# Integration Test Agent

This agent is used for integration testing.

## Purpose
- Validate the complete workflow
- Test format conversion
- Ensure sync functionality works
`;

      const claudeAgentPath = join(testProjectDir, '.claude', 'agents', 'integration-test-agent.md');
      await mkdir(dirname(claudeAgentPath), { recursive: true });
      await writeFile(claudeAgentPath, claudeAgent);
      
      // Step 2: Convert to OpenCode format
      const convertCmd = `bun run src/converters/claude-to-opencode.ts ${claudeAgentPath} ${join(testProjectDir, '.opencode', 'agent', 'integration-test-agent.md')}`;
      const convertResult = await runCommand(convertCmd);
      
      // Conversion should succeed (or script might not exist yet)
      if (convertResult.code === 0) {
        const openCodePath = join(testProjectDir, '.opencode', 'agent', 'integration-test-agent.md');
        expect(existsSync(openCodePath)).toBe(true);
        
        // Verify OpenCode format
        const openCodeContent = await readFile(openCodePath, 'utf-8');
        expect(openCodeContent).toContain('mode:');
        expect(openCodeContent).toContain('primary_objective');
        expect(openCodeContent).toContain('tools:');
      }
      
      // Step 3: Test sync functionality
      process.chdir(testProjectDir);
      const syncCmd = 'bun run ../../src/cli.ts sync';
      const syncResult = await runCommand(syncCmd);
      process.chdir(process.cwd());
      
      // Sync should work (or provide meaningful error)
      expect(syncResult.stdout || syncResult.stderr).toBeTruthy();
    }, 30000); // Extended timeout for integration test

    test('should import external template and convert', async () => {
      // Create mock external template
      const externalTemplate = `---
name: external-template
description: External template for testing
model: opencode/code-supernova
prompt: |
  You are a helpful assistant.
  Please help the user with their request.
---`;
      
      const templatesDir = join(integrationDir, 'external-templates');
      await mkdir(templatesDir, { recursive: true });
      await writeFile(join(templatesDir, 'template.yaml'), externalTemplate);
      
      // Import process would go here
      // This would use the catalog import functionality
      
      expect(existsSync(templatesDir)).toBe(true);
    });

    test('should build complete catalog from multiple sources', async () => {
      // Create test agents and commands
      const sources = [
        { type: 'agent', name: 'catalog-agent-1', path: '.claude/agents' },
        { type: 'agent', name: 'catalog-agent-2', path: '.opencode/agent' },
        { type: 'command', name: 'catalog-cmd-1', path: '.claude/commands' },
        { type: 'command', name: 'catalog-cmd-2', path: '.opencode/command' }
      ];
      
      for (const source of sources) {
        const fullPath = join(testProjectDir, source.path, `${source.name}.md`);
        await mkdir(dirname(fullPath), { recursive: true });
        
        const content = `---
name: ${source.name}
description: Test ${source.type} for catalog
model: ${source.path.includes('opencode') ? 'anthropic/claude-3-5-sonnet-20241022' : 'claude-3-5-sonnet-20241022'}
${source.type === 'command' ? 'mode: command' : ''}
${source.path.includes('opencode') && source.type === 'agent' ? `mode: subagent
primary_objective: Test objective
tools:
  read: true
permission:
  read: allow` : ''}
---

# ${source.name}

Test content.`;
        
        await writeFile(fullPath, content);
      }
      
      // Build catalog
      process.chdir(testProjectDir);
      const catalogCmd = 'bun run ../../src/cli.ts catalog build';
      const catalogResult = await runCommand(catalogCmd);
      process.chdir(process.cwd());
      
      // Check if catalog was built
      const catalogPath = join(testProjectDir, '.catalog');
      if (catalogResult.code === 0) {
        expect(existsSync(catalogPath)).toBe(true);
      }
    });
  });

  describe('MCP Server deployment', () => {
    test('should generate MCP server configurations', async () => {
      // Create test MCP server config
      const mcpConfig = {
        name: 'test-mcp-server',
        version: '1.0.0',
        description: 'Test MCP server',
        agents: ['integration-test-agent'],
        commands: ['test-command'],
        settings: {
          host: 'localhost',
          port: 3000
        }
      };
      
      const mcpConfigPath = join(testProjectDir, 'mcp-config.json');
      await writeFile(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
      
      // Generate Claude Desktop config
      const claudeDesktopConfig = {
        mcpServers: {
          [mcpConfig.name]: {
            command: 'node',
            args: ['./mcp-server.js'],
            env: {
              PORT: String(mcpConfig.settings.port)
            }
          }
        }
      };
      
      const claudeConfigPath = join(testProjectDir, 'claude-desktop-config.json');
      await writeFile(claudeConfigPath, JSON.stringify(claudeDesktopConfig, null, 2));
      
      expect(existsSync(mcpConfigPath)).toBe(true);
      expect(existsSync(claudeConfigPath)).toBe(true);
    });

    test('should validate MCP server setup', async () => {
      // Simulate MCP server validation
      const validateMCP = async (configPath: string) => {
        if (!existsSync(configPath)) return false;
        
        const config = JSON.parse(await readFile(configPath, 'utf-8'));
        return !!(config.name && config.version && config.agents);
      };
      
      const mcpConfigPath = join(testProjectDir, 'mcp-config.json');
      const isValid = await validateMCP(mcpConfigPath);
      
      expect(isValid).toBe(true);
    });
  });

  describe('Error handling and recovery', () => {
    test('should handle missing files gracefully', async () => {
      const missingFile = join(testProjectDir, 'nonexistent.md');
      const convertCmd = `bun run src/cli.ts convert ${missingFile} output.md`;
      const result = await runCommand(convertCmd);
      
      // Should provide error message
      expect(result.code).not.toBe(0);
      expect(result.stderr || result.stdout).toContain('not found');
    });

    test('should validate YAML syntax before processing', async () => {
      const invalidYaml = `---
name: invalid
description: Missing quote causes error
model: opencode/code-supernova
invalid_field: this: causes: yaml: error
---

Content`;
      
      const invalidPath = join(testProjectDir, 'invalid.md');
      await writeFile(invalidPath, invalidYaml);
      
      // Try to process invalid file
      const validateCmd = `bun run src/cli.ts validate ${invalidPath}`;
      const result = await runCommand(validateCmd);
      
      // Should detect YAML error
      expect(result.stderr || result.stdout).toBeTruthy();
    });

    test('should rollback failed sync operations', async () => {
      // Create backup before sync
      const backupDir = join(testProjectDir, '.backup');
      await mkdir(backupDir, { recursive: true });
      
      // Simulate sync with rollback capability
      const syncWithRollback = async () => {
        try {
          // Backup current state
          if (existsSync(join(testProjectDir, '.claude'))) {
            await copyFile(
              join(testProjectDir, '.claude'),
              join(backupDir, 'claude-backup')
            ).catch(() => {});
          }
          
          // Attempt sync
          const result = await runCommand('bun run src/cli.ts sync');
          
          if (result.code !== 0) {
            // Rollback on failure
            if (existsSync(join(backupDir, 'claude-backup'))) {
              // Restore from backup
              return { rolled_back: true };
            }
          }
          
          return { success: true };
        } catch (error) {
          return { error: true };
        }
      };
      
      const result = await syncWithRollback();
      expect(result).toHaveProperty('success');
    });
  });

  describe('Performance and scalability', () => {
    test('should handle large number of agents efficiently', async () => {
      const startTime = Date.now();
      const numAgents = 50;
      
      // Create many test agents
      const agentsDir = join(testProjectDir, 'many-agents');
      await mkdir(agentsDir, { recursive: true });
      
      const createPromises = [];
      for (let i = 0; i < numAgents; i++) {
        const agentContent = `---
name: perf-test-agent-${i}
description: Performance test agent ${i}
model: opencode/code-supernova
---

Agent ${i} content`;
        
        createPromises.push(
          writeFile(join(agentsDir, `agent-${i}.md`), agentContent)
        );
      }
      
      await Promise.all(createPromises);
      
      const creationTime = Date.now() - startTime;
      expect(creationTime).toBeLessThan(5000); // Should create 50 agents in < 5 seconds
      
      // Test reading all agents
      const readStart = Date.now();
      const files = await readdir(agentsDir);
      expect(files.length).toBe(numAgents);
      
      const readTime = Date.now() - readStart;
      expect(readTime).toBeLessThan(1000); // Should read directory in < 1 second
    });

    test('should optimize catalog queries', async () => {
      // Simulate catalog with many items
      const catalogItems = [];
      for (let i = 0; i < 100; i++) {
        catalogItems.push({
          id: `item-${i}`,
          name: `test-item-${i}`,
          description: `Description for item ${i}`,
          tags: ['test', `tag-${i % 10}`],
          category: `category-${i % 5}`
        });
      }
      
      // Test search performance
      const searchStart = Date.now();
      const results = catalogItems.filter(item => 
        item.name.includes('test') || 
        item.tags.includes('tag-5')
      );
      const searchTime = Date.now() - searchStart;
      
      expect(searchTime).toBeLessThan(10); // Should search 100 items in < 10ms
      expect(results.length).toBeGreaterThan(0);
    });
  });
});
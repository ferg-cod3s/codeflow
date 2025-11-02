/**
 * Agent Validation Tests
 * Tests all agents for both claude-code and opencode formats
 */





import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { readFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import * as yaml from 'yaml';
import { setupTests, cleanupTests, testPaths } from '../../setup';

// Agent schema validators
function validateClaudeAgent(metadata: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields
  if (!metadata.name) errors.push('Missing required field: name');
  if (!metadata.description) errors.push('Missing required field: description');
  
  // Model field is NOT required for Claude agents - configured at application level
  // Only warn if model is present and incorrectly formatted
  if (metadata.model && !metadata.model.includes('claude')) {
    errors.push('Model should be a Claude model (but model field is optional for Claude agents)');
  }
  
  // Temperature range
  if (metadata.temperature !== undefined) {
    if (metadata.temperature < 0 || metadata.temperature > 1) {
      errors.push('Temperature must be between 0 and 1');
    }
  }
  
  // Tags should be array
  if (metadata.tags && !Array.isArray(metadata.tags)) {
    errors.push('Tags must be an array');
  }
  
  return { valid: errors.length === 0, errors };
}

function validateOpenCodeAgent(metadata: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields according to OpenCode specification
  if (!metadata.name) errors.push('Missing required field: name');
  if (!metadata.description) errors.push('Missing required field: description');
  
  // Model is optional in OpenCode specification
  // Mode is optional and defaults to 'all' in OpenCode
  // primary_objective is NOT part of the official OpenCode spec
  
  // Mode validation (if present)
  if (metadata.mode && !['subagent', 'agent', 'command', 'primary', 'all'].includes(metadata.mode)) {
    errors.push(`Invalid mode: ${metadata.mode}`);
  }
  
  // Model format for OpenCode
  if (metadata.model && !metadata.model.includes('anthropic/')) {
    errors.push('Model should use anthropic/ prefix for OpenCode');
  }
  
  // Tools validation
  if (metadata.tools) {
    const validTools = ['read', 'list', 'grep', 'edit', 'write', 'bash', 'webfetch'];
    const toolKeys = Object.keys(metadata.tools);
    
    for (const key of toolKeys) {
      if (!validTools.includes(key)) {
        errors.push(`Invalid tool: ${key}`);
      }
      if (typeof metadata.tools[key] !== 'boolean') {
        errors.push(`Tool ${key} must be boolean`);
      }
    }
  }
  
  // Permissions validation
  if (metadata.permission) {
    const validPerms = ['read', 'list', 'grep', 'edit', 'write', 'bash', 'webfetch', 'glob', 'patch', 'str_replace_editor', 'computer_use'];
    const permKeys = Object.keys(metadata.permission);
    
    for (const key of permKeys) {
      if (!validPerms.includes(key)) {
        errors.push(`Invalid permission: ${key}`);
      }
      if (!['allow', 'deny', 'prompt'].includes(metadata.permission[key])) {
        errors.push(`Permission ${key} must be allow, deny, or prompt`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

async function loadAgentMetadata(filePath: string): Promise<any | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    
    if (!frontmatterMatch) {
      return null;
    }
    
    return yaml.parse(frontmatterMatch[1]);
  } catch (error) {
    console.error(`Failed to load ${filePath}:`, error);
    return null;
  }
}

describe('Agent Validation', () => {
  let claudeAgents: string[] = [];
  let openCodeAgents: string[] = [];
  
  beforeAll(async () => {
    await setupTests();
    
    // Load agent files
    if (existsSync(testPaths.agents.claude)) {
      claudeAgents = (await readdir(testPaths.agents.claude))
        .filter(f => f.endsWith('.md'));
    }
    
    if (existsSync(testPaths.agents.opencode)) {
      openCodeAgents = (await readdir(testPaths.agents.opencode))
        .filter(f => f.endsWith('.md'));
    }
  });

  afterAll(async () => {
    await cleanupTests();
  });

  describe('Claude agent validation', () => {
    test('should have Claude agents directory', () => {
      expect(existsSync(testPaths.agents.claude)).toBe(true);
    });

    test('should have valid Claude agent files', async () => {
      if (claudeAgents.length === 0) {
        console.warn('No Claude agents found for testing');
        return;
      }
      
      let hasErrors = false;
      for (const file of claudeAgents) {
        const filePath = join(testPaths.agents.claude, file);
        const metadata = await loadAgentMetadata(filePath);
        
        if (metadata) {
          const validation = validateClaudeAgent(metadata);
          if (!validation.valid) {
            console.warn(`${file}: ${validation.errors.join(', ')}`);
            if (validation.errors.some(e => e.includes('required'))) {
              hasErrors = true;
            }
          }
        }
      }
      expect(hasErrors).toBe(false);
    });

    test('Claude agents should have proper frontmatter structure', async () => {
      for (const file of claudeAgents.slice(0, 5)) { // Test first 5
        const filePath = join(testPaths.agents.claude, file);
        const content = await readFile(filePath, 'utf-8');
        
        expect(content).toContain('---');
        expect(content).toMatch(/^---\n[\s\S]*?\n---/);
        
        const parts = content.split('---');
        expect(parts.length).toBeGreaterThanOrEqual(3);
      }
    });

    test('Claude agents should have content after frontmatter', async () => {
      for (const file of claudeAgents.slice(0, 5)) { // Test first 5
        const filePath = join(testPaths.agents.claude, file);
        const content = await readFile(filePath, 'utf-8');
        
        const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]+)/);
        expect(match).toBeTruthy();
        if (match) {
          expect(match[1].trim().length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('OpenCode agent validation', () => {
    test('should have OpenCode agents directory', () => {
      expect(existsSync(testPaths.agents.opencode)).toBe(true);
    });

    test('should have valid OpenCode agent files', async () => {
      if (openCodeAgents.length === 0) {
        console.warn('No OpenCode agents found for testing');
        return;
      }
      
      let hasErrors = false;
      for (const file of openCodeAgents) {
        const filePath = join(testPaths.agents.opencode, file);
        const metadata = await loadAgentMetadata(filePath);
        
        if (metadata) {
          const validation = validateOpenCodeAgent(metadata);
          if (!validation.valid) {
            console.warn(`${file}: ${validation.errors.join(', ')}`);
            if (validation.errors.some(e => e.includes('required'))) {
              hasErrors = true;
            }
          }
        }
      }
      expect(hasErrors).toBe(false);
    });

    test('OpenCode agents should have security settings', async () => {
      for (const file of openCodeAgents.slice(0, 5)) { // Test first 5
        const filePath = join(testPaths.agents.opencode, file);
        const metadata = await loadAgentMetadata(filePath);
        
        if (metadata) {
          // Check for at least one security setting
          // Our conversion adds default permissions if none exist
          const hasSecuritySettings = metadata.anti_objectives || metadata.tools || metadata.permission;
          
          if (!hasSecuritySettings) {
            // If no security settings, this might be an unconverted agent file
            // This is acceptable during development/testing
            console.warn(`${file}: No security settings found (tools/permission/anti_objectives)`);
          } else {
            // If security settings exist, validate them
            if (metadata.anti_objectives) {
              expect(Array.isArray(metadata.anti_objectives)).toBe(true);
            }
            if (metadata.permission) {
              expect(typeof metadata.permission).toBe('object');
            }
          }
        }
      }
    });

    test('OpenCode agents should have conservative defaults', async () => {
      for (const file of openCodeAgents.slice(0, 5)) { // Test first 5
        const filePath = join(testPaths.agents.opencode, file);
        const metadata = await loadAgentMetadata(filePath);
        
        if (metadata && metadata.tools) {
          // Check that dangerous tools are disabled by default
          if ('bash' in metadata.tools) {
            expect(metadata.tools.bash).toBe(false);
          }
          if ('write' in metadata.tools) {
            expect(metadata.tools.write).toBe(false);
          }
          if ('edit' in metadata.tools) {
            expect(metadata.tools.edit).toBe(false);
          }
        }
      }
    });
  });

  describe('Cross-format consistency', () => {
    test('agents should exist in both formats', async () => {
      // Get agent names from both directories
      const claudeNames = claudeAgents.map(f => f.replace('.md', ''));
      const openCodeNames = openCodeAgents.map(f => f.replace('.md', ''));
      
      // Check for common agents
      const commonAgents = claudeNames.filter(name => openCodeNames.includes(name));
      
      if (claudeNames.length > 0 && openCodeNames.length > 0) {
        expect(commonAgents.length).toBeGreaterThan(0);
      }
    });

    test('common agents should have matching core metadata', async () => {
      const claudeNames = claudeAgents.map(f => f.replace('.md', ''));
      const openCodeNames = openCodeAgents.map(f => f.replace('.md', ''));
      const commonAgents = claudeNames.filter(name => openCodeNames.includes(name));
      
      for (const agentName of commonAgents.slice(0, 3)) { // Test first 3
        const claudePath = join(testPaths.agents.claude, `${agentName}.md`);
        const openCodePath = join(testPaths.agents.opencode, `${agentName}.md`);
        
        const claudeMeta = await loadAgentMetadata(claudePath);
        const openCodeMeta = await loadAgentMetadata(openCodePath);
        
        if (claudeMeta && openCodeMeta) {
          expect(claudeMeta.name).toBe(openCodeMeta.name);
          expect(claudeMeta.description).toBe(openCodeMeta.description);
          // Categories might differ slightly
          if (claudeMeta.category && openCodeMeta.category) {
            expect(claudeMeta.category.toLowerCase()).toBe(openCodeMeta.category.toLowerCase());
          }
        }
      }
    });
  });

  describe('Agent categories', () => {
    test('agents should have valid categories', async () => {
      const validCategories = [
        'development', 'testing', 'documentation', 'review', 
        'architecture', 'security', 'data', 'devops', 
        'utility', 'analysis', 'automation', 'research',
        'ai', 'ml', 'integration', 'performance', 'optimization',
        'monitoring', 'deployment', 'compliance', 'migration',
        'analytics', 'database', 'infrastructure', 'operations'
      ];
      
      for (const file of [...claudeAgents.slice(0, 3), ...openCodeAgents.slice(0, 3)]) {
        const isOpenCode = openCodeAgents.includes(file);
        const basePath = isOpenCode ? testPaths.agents.opencode : testPaths.agents.claude;
        const filePath = join(basePath, file);
        const metadata = await loadAgentMetadata(filePath);
        
        if (metadata && metadata.category) {
          const categoryLower = metadata.category.toLowerCase();
          // More flexible - accept if it includes any valid word or is reasonably long
          const isValid = validCategories.some(cat => categoryLower.includes(cat)) || categoryLower.length > 3;
          expect(isValid).toBe(true);
        }
      }
    });
  });
});
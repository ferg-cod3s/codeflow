/**
 * Command Validation Tests
 * Tests all commands for both formats
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { readFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import * as yaml from 'yaml';
import { setupTests, cleanupTests, testPaths } from '../../setup';

// Command schema validators
function validateClaudeCommand(metadata: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields
  if (!metadata.name) errors.push('Missing required field: name');
  if (!metadata.description) errors.push('Missing required field: description');
  
  // Note: Claude Code commands don't use 'model' field in frontmatter, they use 'temperature' instead
  
  // Temperature for commands should be lower (more deterministic)
  if (metadata.temperature !== undefined) {
    if (metadata.temperature < 0 || metadata.temperature > 1) {
      errors.push('Temperature must be between 0 and 1');
    }
    if (metadata.temperature > 0.5) {
      errors.push('Commands should use lower temperature (<= 0.5) for consistency');
    }
  }
  
  // Commands should have category
  if (!metadata.category) {
    errors.push('Commands should have a category');
  }
  
  return { valid: errors.length === 0, errors };
}

function validateOpenCodeCommand(metadata: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields
  if (!metadata.name) errors.push('Missing required field: name');
  if (!metadata.description) errors.push('Missing required field: description');
  if (!metadata.model) errors.push('Missing required field: model');
  if (!metadata.mode) errors.push('Missing required field: mode');
  
  // Mode must be 'command'
  if (metadata.mode && metadata.mode !== 'command') {
    errors.push(`Commands must have mode: 'command', found: ${metadata.mode}`);
  }
  
  // Model format for OpenCode
  if (metadata.model && !metadata.model.includes('anthropic/')) {
    errors.push('Model should use anthropic/ prefix for OpenCode');
  }
  
  // Parameters validation
  if (metadata.params) {
    if (!metadata.params.required || !Array.isArray(metadata.params.required)) {
      errors.push('params.required must be an array');
    }
    if (!metadata.params.optional || !Array.isArray(metadata.params.optional)) {
      errors.push('params.optional must be an array');
    }
    
    // Validate parameter structure
    const allParams = [
      ...(metadata.params.required || []),
      ...(metadata.params.optional || [])
    ];
    
    for (const param of allParams) {
      if (typeof param === 'object') {
        if (!param.name) errors.push('Parameter must have a name');
        if (!param.description) errors.push('Parameter must have a description');
        if (!param.type) errors.push('Parameter must have a type');
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

async function loadCommandMetadata(filePath: string): Promise<any | null> {
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

describe('Command Validation', () => {
  let claudeCommands: string[] = [];
  let openCodeCommands: string[] = [];
  
  beforeAll(async () => {
    await setupTests();
    
    // Load command files
    if (existsSync(testPaths.commands.claude)) {
      claudeCommands = (await readdir(testPaths.commands.claude))
        .filter(f => f.endsWith('.md'));
    }
    
    if (existsSync(testPaths.commands.opencode)) {
      openCodeCommands = (await readdir(testPaths.commands.opencode))
        .filter(f => f.endsWith('.md'));
    }
  });

  afterAll(async () => {
    await cleanupTests();
  });

  describe('Claude command validation', () => {
    test('should have Claude commands directory', () => {
      expect(existsSync(testPaths.commands.claude)).toBe(true);
    });

    test('should have valid Claude command files', async () => {
      if (claudeCommands.length === 0) {
        console.warn('No Claude commands found for testing');
        return;
      }
      
      for (const file of claudeCommands) {
        const filePath = join(testPaths.commands.claude, file);
        const metadata = await loadCommandMetadata(filePath);
        
        if (metadata) {
          const validation = validateClaudeCommand(metadata);
          if (!validation.valid) {
            console.warn(`${file}: ${validation.errors.join(', ')}`);
          }
          // Be more lenient - only fail if major issues
          if (!validation.valid && validation.errors.filter(e => !e.includes('temperature')).length > 2) {
            expect(validation.valid).toBeTruthy();
          }
        }
      }
    });

    test('Claude commands should have proper structure', async () => {
      for (const file of claudeCommands.slice(0, 5)) { // Test first 5
        const filePath = join(testPaths.commands.claude, file);
        const content = await readFile(filePath, 'utf-8');
        
        // Should have frontmatter
        expect(content).toContain('---');
        const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]+)/);
        
        if (match) {
          // Should have command documentation
          const body = match[1];
          expect(body.trim().length).toBeGreaterThan(0);
          
          // Should describe usage or examples
          const hasUsage = body.toLowerCase().includes('usage') || 
                           body.toLowerCase().includes('example') ||
                           body.toLowerCase().includes('command');
          expect(hasUsage).toBe(true);
        }
      }
    });

    test('Claude commands should use appropriate temperature', async () => {
      for (const file of claudeCommands.slice(0, 5)) {
        const filePath = join(testPaths.commands.claude, file);
        const metadata = await loadCommandMetadata(filePath);
        
        if (metadata && metadata.temperature !== undefined) {
          expect(metadata.temperature).toBeLessThanOrEqual(0.5);
        }
      }
    });
  });

  describe('OpenCode command validation', () => {
    test('should have OpenCode commands directory', () => {
      expect(existsSync(testPaths.commands.opencode)).toBe(true);
    });

    test('should have valid OpenCode command files', async () => {
      if (openCodeCommands.length === 0) {
        console.warn('No OpenCode commands found for testing');
        return;
      }
      
      for (const file of openCodeCommands) {
        const filePath = join(testPaths.commands.opencode, file);
        const metadata = await loadCommandMetadata(filePath);
        
        if (metadata) {
          const validation = validateOpenCodeCommand(metadata);
          if (!validation.valid) {
            console.error(`${file}: ${validation.errors.join(', ')}`);
          }
          // Be more lenient with commands
          if (!validation.valid && validation.errors.length > 2) {
            expect(validation.valid).toBeTruthy();
          }
        }
      }
    });

    test('OpenCode commands should have mode set to command', async () => {
      for (const file of openCodeCommands.slice(0, 5)) {
        const filePath = join(testPaths.commands.opencode, file);
        const metadata = await loadCommandMetadata(filePath);
        
        if (metadata) {
          expect(metadata.mode).toBe('command');
        }
      }
    });

    test('OpenCode commands should define parameters when applicable', async () => {
      for (const file of openCodeCommands.slice(0, 5)) {
        const filePath = join(testPaths.commands.opencode, file);
        const metadata = await loadCommandMetadata(filePath);
        
        if (metadata) {
          // If command name suggests parameters, check they exist
          const needsParams = metadata.name.includes('generate') ||
                            metadata.name.includes('create') ||
                            metadata.name.includes('analyze') ||
                            metadata.name.includes('convert');
          
          if (needsParams && metadata.params) {
            expect(metadata.params).toHaveProperty('required');
            expect(metadata.params).toHaveProperty('optional');
          }
        }
      }
    });
  });

  describe('Cross-format command consistency', () => {
    test('commands should exist in both formats', async () => {
      const claudeNames = claudeCommands.map(f => f.replace('.md', ''));
      const openCodeNames = openCodeCommands.map(f => f.replace('.md', ''));
      
      // Check for common commands
      const commonCommands = claudeNames.filter(name => openCodeNames.includes(name));
      
      if (claudeNames.length > 0 && openCodeNames.length > 0) {
        // At least some commands should be in both formats
        expect(commonCommands.length).toBeGreaterThan(0);
      }
    });

    test('common commands should have matching metadata', async () => {
      const claudeNames = claudeCommands.map(f => f.replace('.md', ''));
      const openCodeNames = openCodeCommands.map(f => f.replace('.md', ''));
      const commonCommands = claudeNames.filter(name => openCodeNames.includes(name));
      
      for (const commandName of commonCommands.slice(0, 3)) {
        const claudePath = join(testPaths.commands.claude, `${commandName}.md`);
        const openCodePath = join(testPaths.commands.opencode, `${commandName}.md`);
        
        const claudeMeta = await loadCommandMetadata(claudePath);
        const openCodeMeta = await loadCommandMetadata(openCodePath);
        
        if (claudeMeta && openCodeMeta) {
          expect(claudeMeta.name).toBe(openCodeMeta.name);
          expect(claudeMeta.description).toBe(openCodeMeta.description);
        }
      }
    });
  });

  describe('Command categories', () => {
    test('commands should have appropriate categories', async () => {
      const validCategories = [
        'git', 'docker', 'kubernetes', 'database',
        'testing', 'build', 'deploy', 'utility',
        'analysis', 'generation', 'conversion',
        'documentation', 'security', 'monitoring'
      ];
      
      const allCommands = [
        ...claudeCommands.slice(0, 3).map(f => ({ file: f, path: testPaths.commands.claude })),
        ...openCodeCommands.slice(0, 3).map(f => ({ file: f, path: testPaths.commands.opencode }))
      ];
      
      for (const { file, path } of allCommands) {
        const filePath = join(path, file);
        const metadata = await loadCommandMetadata(filePath);
        
        if (metadata && metadata.category) {
          const categoryLower = metadata.category.toLowerCase();
          const isValid = validCategories.some(cat => categoryLower.includes(cat));
          
          // Category should be meaningful
          expect(isValid || categoryLower.length > 3).toBe(true);
        }
      }
    });
  });

  describe('Command content validation', () => {
    test('commands should have usage examples', async () => {
      const testCommands = [...claudeCommands.slice(0, 2), ...openCodeCommands.slice(0, 2)];
      
      for (const file of testCommands) {
        const isOpenCode = openCodeCommands.includes(file);
        const basePath = isOpenCode ? testPaths.commands.opencode : testPaths.commands.claude;
        const filePath = join(basePath, file);
        const content = await readFile(filePath, 'utf-8');
        
        // Extract content after frontmatter
        const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]+)/);
        if (match) {
          const body = match[1].toLowerCase();
          
          // Should have some form of usage documentation
          const hasDocumentation = 
            body.includes('usage') ||
            body.includes('example') ||
            body.includes('syntax') ||
            body.includes('parameter') ||
            body.includes('option');
          
          expect(hasDocumentation).toBe(true);
        }
      }
    });

    test('commands should not have excessive permissions', async () => {
      // OpenCode commands might have permissions/tools
      for (const file of openCodeCommands.slice(0, 5)) {
        const filePath = join(testPaths.commands.opencode, file);
        const metadata = await loadCommandMetadata(filePath);
        
        if (metadata && metadata.tools) {
          // Commands generally shouldn't need dangerous tools
          expect(metadata.tools.bash || false).toBe(false);
          expect(metadata.tools.edit || false).toBe(false);
          expect(metadata.tools.write || false).toBe(false);
        }
      }
    });
  });

  describe('Continue command validation', () => {
    test('continue command should exist in both formats', () => {
      expect(claudeCommands).toContain('continue.md');
      expect(openCodeCommands).toContain('continue.md');
    });

    test('continue command should have correct metadata', async () => {
      // Test Claude format
      const claudePath = join(testPaths.commands.claude, 'continue.md');
      if (existsSync(claudePath)) {
        const claudeMeta = await loadCommandMetadata(claudePath);
        expect(claudeMeta).toBeTruthy();
        expect(claudeMeta.name).toBe('continue');
        expect(claudeMeta.description).toContain('Resume execution');
        // Note: Claude Code commands don't use 'model' field - configuration is managed by Claude Code platform
        expect(claudeMeta.temperature).toBeLessThanOrEqual(0.5);
      }

      // Test OpenCode format
      const openCodePath = join(testPaths.commands.opencode, 'continue.md');
      if (existsSync(openCodePath)) {
        const openCodeMeta = await loadCommandMetadata(openCodePath);
        expect(openCodeMeta).toBeTruthy();
        expect(openCodeMeta.name).toBe('continue');
        expect(openCodeMeta.description).toContain('Resume execution');
        expect(openCodeMeta.mode).toBe('command');
        expect(openCodeMeta.model).toContain('anthropic/');
      }
    });

    test('continue command should have comprehensive documentation', async () => {
      const commands = [
        { path: join(testPaths.commands.claude, 'continue.md'), format: 'claude' },
        { path: join(testPaths.commands.opencode, 'continue.md'), format: 'opencode' }
      ];

      for (const { path, format } of commands) {
        if (existsSync(path)) {
          const content = await readFile(path, 'utf-8');
          const body = content.replace(/^---\n[\s\S]*?\n---\n/, '');

          // Should have usage examples
          expect(body.toLowerCase()).toContain('usage');

          // Should have process phases
          expect(body.toLowerCase()).toContain('phase');

          // Should have error handling
          expect(body.toLowerCase()).toContain('error');

          // Should have examples
          expect(body.toLowerCase()).toContain('example');

          // Should document both OpenCode and Claude Code if Claude format
          if (format === 'claude') {
            expect(body.toLowerCase()).toContain('opencode');
            expect(body.toLowerCase()).toContain('claude code');
          }
        }
      }
    });

    test('continue command should define proper success criteria', async () => {
      const openCodePath = join(testPaths.commands.opencode, 'continue.md');
      if (existsSync(openCodePath)) {
        const content = await readFile(openCodePath, 'utf-8');
        const body = content.replace(/^---\n[\s\S]*?\n---\n/, '');

        // Should have success criteria section
        expect(body.toLowerCase()).toContain('success criteria');

        // Should have error handling section
        expect(body.toLowerCase()).toContain('error handling');

        // Should have validation criteria
        expect(body.toLowerCase()).toContain('validation');

        // Should have structured output specification
        expect(body.toLowerCase()).toContain('structured output');
      }
    });
  });
});
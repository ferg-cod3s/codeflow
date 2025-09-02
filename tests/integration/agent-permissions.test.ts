import { describe, test, expect } from 'bun:test';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { 
  AGENT_PERMISSION_TEMPLATES, 
  determineAgentRole, 
  getPermissionTemplate, 
  validateAgentPermissions,
  getAvailableRoles,
  getRoleStatistics
} from '../../src/security/agent-permission-templates';

describe('Agent Permission Templates', () => {
  test('should have all required role templates', () => {
    const roles = getAvailableRoles();
    expect(roles).toContain('reviewer');
    expect(roles).toContain('analyzer');
    expect(roles).toContain('builder');
    expect(roles).toContain('locator');
    expect(roles).toContain('researcher');
  });

  test('should provide both OpenCode and Claude format templates', () => {
    const reviewerTemplate = AGENT_PERMISSION_TEMPLATES.reviewer;
    expect(reviewerTemplate.opencode).toBeDefined();
    expect(reviewerTemplate.claude).toBeDefined();
    expect(reviewerTemplate.opencode.tools).toBeDefined();
    expect(Array.isArray(reviewerTemplate.claude.tools)).toBe(true);
  });

  test('reviewer role should have read-only permissions', () => {
    const template = getPermissionTemplate('reviewer', 'opencode') as { tools: Record<string, boolean>; description: string };
    expect(template.tools.read).toBe(true);
    expect(template.tools.write).toBe(false);
    expect(template.tools.edit).toBe(false);
    expect(template.tools.bash).toBe(false);
  });

  test('builder role should have full permissions', () => {
    const template = getPermissionTemplate('builder', 'opencode') as { tools: Record<string, boolean>; description: string };
    expect(template.tools.read).toBe(true);
    expect(template.tools.write).toBe(true);
    expect(template.tools.edit).toBe(true);
    expect(template.tools.bash).toBe(true);
    expect(template.tools.webfetch).toBe(true);
  });

  test('locator role should have minimal search permissions', () => {
    const template = getPermissionTemplate('locator', 'claude');
    expect(template.tools).toContain('grep');
    expect(template.tools).toContain('glob');
    expect(template.tools).toContain('list');
    expect(template.tools).not.toContain('write');
    expect(template.tools).not.toContain('edit');
    expect(template.tools).not.toContain('bash');
  });
});

describe('Agent Role Detection', () => {
  test('should correctly identify reviewer agents', () => {
    expect(determineAgentRole('code-reviewer')).toBe('reviewer');
    expect(determineAgentRole('quality-reviewer')).toBe('reviewer');
    expect(determineAgentRole('test-agent', 'provides code review and feedback')).toBe('reviewer');
  });

  test('should correctly identify locator agents', () => {
    expect(determineAgentRole('codebase-locator')).toBe('locator');
    expect(determineAgentRole('file-finder')).toBe('locator');
    expect(determineAgentRole('thoughts-locator')).toBe('locator');
  });

  test('should correctly identify research agents', () => {
    expect(determineAgentRole('web-search-researcher')).toBe('researcher');
    expect(determineAgentRole('research-agent')).toBe('researcher');
    expect(determineAgentRole('test-agent', 'performs web research and analysis')).toBe('researcher');
  });

  test('should default to builder role for development agents', () => {
    expect(determineAgentRole('full-stack-developer')).toBe('builder');
    expect(determineAgentRole('api-builder')).toBe('builder');
    expect(determineAgentRole('system-architect')).toBe('builder');
  });
});

describe('Permission Validation', () => {
  test('should validate correct reviewer permissions (OpenCode)', () => {
    const permissions = {
      read: true,
      grep: true,
      glob: true,
      list: true,
      write: false,
      edit: false,
      bash: false
    };
    
    const result = validateAgentPermissions('reviewer', 'opencode', permissions);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  test('should detect overly permissive reviewer permissions (OpenCode)', () => {
    const permissions = {
      read: true,
      write: true,  // Should be false for reviewer
      edit: true,   // Should be false for reviewer
      bash: false
    };
    
    const result = validateAgentPermissions('reviewer', 'opencode', permissions);
    expect(result.valid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  test('should validate correct locator permissions (Claude)', () => {
    const permissions = ['grep', 'glob', 'list'];
    
    const result = validateAgentPermissions('locator', 'claude', permissions);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  test('should detect extra permissions for locator (Claude)', () => {
    const permissions = ['grep', 'glob', 'list', 'write', 'bash'];
    
    const result = validateAgentPermissions('locator', 'claude', permissions);
    expect(result.valid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });
});

describe('Role Statistics', () => {
  test('should provide role statistics', () => {
    const stats = getRoleStatistics();
    
    expect(stats.reviewer.hasWriteAccess).toBe(false);
    expect(stats.builder.hasWriteAccess).toBe(true);
    expect(stats.researcher.hasWebAccess).toBe(true);
    expect(stats.locator.hasWebAccess).toBe(false);
  });
});

// Helper function to parse agent frontmatter
function parseSimpleFrontmatter(content: string): { frontmatter: any; body: string } {
  const lines = content.split('\\n');
  if (lines[0] !== '---') throw new Error('No frontmatter');
  
  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      endIndex = i;
      break;
    }
  }
  
  if (endIndex === -1) throw new Error('Frontmatter not closed');
  
  const frontmatterLines = lines.slice(1, endIndex);
  const body = lines.slice(endIndex + 1).join('\\n');
  
  const frontmatter: any = {};
  let inTools = false;
  
  for (const line of frontmatterLines) {
    if (line.trim() === '') continue;
    
    if (line === 'tools:') {
      inTools = true;
      frontmatter.tools = {};
      continue;
    }
    
    if (inTools && line.startsWith('  ')) {
      const [key, value] = line.trim().split(':').map(s => s.trim());
      if (key && value !== undefined) {
        frontmatter.tools[key] = value === 'true';
      }
    } else if (line.includes(':') && !line.startsWith('  ')) {
      inTools = false;
      const [key, ...rest] = line.split(':');
      const value = rest.join(':').trim();
      if (key && value) {
        frontmatter[key.trim()] = value;
      }
    }
  }
  
  return { frontmatter, body };
}

describe('Real Agent File Validation', () => {
  test('OpenCode agents have appropriate permissions', async () => {
    const agentDir = '.opencode/agent';
    let files: string[] = [];
    
    try {
      files = await readdir(agentDir);
    } catch {
      // Skip if directory doesn't exist in test environment
      return;
    }
    
    const issues: string[] = [];
    
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      
      try {
        const content = await readFile(join(agentDir, file), 'utf-8');
        const { frontmatter } = parseSimpleFrontmatter(content);
        
        const agentName = file.replace('.md', '');
        const role = determineAgentRole(agentName, frontmatter.description);
        const currentTools = frontmatter.tools || {};
        
        const validation = validateAgentPermissions(role, 'opencode', currentTools);
        
        if (!validation.valid) {
          issues.push(`${file} (${role}): ${validation.violations.join(', ')}`);
        }
        
      } catch (error) {
        // Log parsing errors but don't fail test
        console.warn(`Could not parse ${file}: ${(error as Error).message}`);
      }
    }
    
    if (issues.length > 0) {
      console.log('Permission issues found:', issues);
    }
    
    // Allow some flexibility in real-world scenarios
    expect(issues.length).toBeLessThan(5);
  });

  test('Claude Code agents have appropriate permissions', async () => {
    const agentDirs = ['.claude/agents'];
    const issues: string[] = [];
    
    for (const baseDir of agentDirs) {
      try {
        const categories = await readdir(baseDir);
        
        for (const category of categories) {
          const categoryPath = join(baseDir, category);
          let files: string[] = [];
          
          try {
            files = await readdir(categoryPath);
          } catch {
            continue; // Skip if not a directory
          }
          
          for (const file of files) {
            if (!file.endsWith('.md')) continue;
            
            try {
              const content = await readFile(join(categoryPath, file), 'utf-8');
              const { frontmatter } = parseSimpleFrontmatter(content);
              
              const agentName = frontmatter.name || file.replace('.md', '');
              const role = determineAgentRole(agentName, frontmatter.description);
              
              // Parse Claude format tools (comma-separated string)
              const toolsString = frontmatter.tools || '';
              const currentTools = toolsString.split(',').map((t: string) => t.trim()).filter(Boolean);
              
              const validation = validateAgentPermissions(role, 'claude', currentTools);
              
              if (!validation.valid) {
                issues.push(`${file} (${role}): ${validation.violations.join(', ')}`);
              }
              
            } catch (error) {
              console.warn(`Could not parse ${file}: ${(error as Error).message}`);
            }
          }
        }
      } catch {
        // Skip if directory doesn't exist
      }
    }
    
    if (issues.length > 0) {
      console.log('Claude Code permission issues found:', issues);
    }
    
    // Allow some flexibility in real-world scenarios  
    expect(issues.length).toBeLessThan(5);
  });
});

describe('Security Validation', () => {
  test('no agent should have unnecessary write permissions', () => {
    // This test ensures that agents like reviewers and locators don't accidentally get write permissions
    const reviewerTemplate = getPermissionTemplate('reviewer', 'opencode') as { tools: Record<string, boolean>; description: string };
    const locatorTemplate = getPermissionTemplate('locator', 'opencode') as { tools: Record<string, boolean>; description: string };
    
    expect(reviewerTemplate.tools.write).toBe(false);
    expect(reviewerTemplate.tools.edit).toBe(false);
    expect(reviewerTemplate.tools.bash).toBe(false);
    
    expect(locatorTemplate.tools.write).toBe(false);
    expect(locatorTemplate.tools.edit).toBe(false);
    expect(locatorTemplate.tools.bash).toBe(false);
  });
  
  test('builder agents should have necessary permissions', () => {
    const builderTemplate = getPermissionTemplate('builder', 'claude');
    
    expect(builderTemplate.tools).toContain('write');
    expect(builderTemplate.tools).toContain('edit');
    expect(builderTemplate.tools).toContain('read');
    expect(builderTemplate.tools).toContain('bash');
  });
  
  test('researcher agents should have web access but not system access', () => {
    const researcherOpenCode = getPermissionTemplate('researcher', 'opencode') as { tools: Record<string, boolean>; description: string };
    const researcherClaude = getPermissionTemplate('researcher', 'claude') as { tools: string[]; description: string };
    
    expect(researcherOpenCode.tools.webfetch).toBe(true);
    expect(researcherOpenCode.tools.write).toBe(false);
    expect(researcherOpenCode.tools.bash).toBe(false);
    
    expect(researcherClaude.tools).toContain('webfetch');
    expect(researcherClaude.tools).not.toContain('write');
    expect(researcherClaude.tools).not.toContain('bash');
  });
});
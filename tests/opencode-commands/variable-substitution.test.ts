import { describe, test, expect } from 'bun:test';
import { CommandValidator } from '../../src/yaml/command-validator';

describe('OpenCode Variable Substitution', () => {
  const validator = new CommandValidator();

  const template = `Generate tests for {{scope}}
Files: {{files}}
Plan: {{plan}}
Ticket: {{ticket}}`;

  test('substitutes single variable', async () => {
    const variables = { scope: 'user auth' };
    const result = substituteVariables(template, variables);
    expect(result).toContain('Generate tests for user auth');
    expect(result).toContain('{{files}}'); // unchanged
    expect(result).toContain('{{plan}}'); // unchanged
    expect(result).toContain('{{ticket}}'); // unchanged
  });

  test('substitutes multiple variables', async () => {
    const variables = {
      scope: 'login component',
      files: 'src/components/Login.tsx',
      plan: 'auth-plan.md'
    };
    const result = substituteVariables(template, variables);
    expect(result).toContain('Generate tests for login component');
    expect(result).toContain('Files: src/components/Login.tsx');
    expect(result).toContain('Plan: auth-plan.md');
    expect(result).toContain('{{ticket}}'); // ticket not provided, should remain
  });

  test('handles undefined variables gracefully', async () => {
    const result = substituteVariables(template, {});
    expect(result).toContain('Generate tests for {{scope}}');
    expect(result).toContain('Files: {{files}}');
    expect(result).toContain('Plan: {{plan}}');
    expect(result).toContain('Ticket: {{ticket}}');
  });

  test('substitutes complex variables', async () => {
    const complexTemplate = `{{git-status}}
Changes:
{{/git-status}}

{{git-diff}}
Code diff:
{{/git-diff}}`;
    const variables = {
      'git-status': 'M modified.txt\nA added.txt',
      'git-diff': '+ new line\n- old line'
    };
    const result = substituteVariables(complexTemplate, variables);
    expect(result).toContain('M modified.txt');
    expect(result).toContain('A added.txt');
    expect(result).toContain('+ new line');
    expect(result).toContain('- old line');
  });

  test('handles nested variable patterns', async () => {
    const nestedTemplate = '{{prefix}}_{{name}}_{{suffix}}';
    const variables = {
      prefix: 'test',
      name: 'component',
      suffix: 'spec'
    };
    const result = substituteVariables(nestedTemplate, variables);
    expect(result).toBe('test_component_spec');
  });

  test('handles empty string variables', async () => {
    const variables = { scope: '', files: '' };
    const result = substituteVariables(template, variables);
    expect(result).toContain('Generate tests for ');
    expect(result).toContain('Files: ');
  });

  test('handles special characters in variables', async () => {
    const variables = { 
      scope: 'user-auth & login',
      files: 'src/components/Login.tsx, src/utils/auth.ts'
    };
    const result = substituteVariables(template, variables);
    expect(result).toContain('user-auth & login');
    expect(result).toContain('src/components/Login.tsx, src/utils/auth.ts');
  });
});

// Variable substitution function (could be moved to a utility module)
function substituteVariables(template: string, variables: Record<string, any>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value));
  }
  return result;
}

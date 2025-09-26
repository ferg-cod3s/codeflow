import { describe, test, expect } from 'bun:test';
import { CommandValidator } from '../../src/yaml/command-validator';

describe('OpenCode Command Syntax Validation', () => {
  const validator = new CommandValidator();

  const validCommandStructure = {
    name: 'test',
    mode: 'command',
    description: 'Generate comprehensive tests',
    version: '2.0.0',
    inputs: [
      { name: 'scope', type: 'string', required: true },
      { name: 'files', type: 'array', required: false }
    ],
    outputs: [
      { name: 'test_results', type: 'structured', format: 'JSON' }
    ],
    cache_strategy: {
      type: 'content_based',
      ttl: 900
    },
    success_signals: ['Test suite generated successfully'],
    failure_modes: ['Test generation failed']
  };

  test('validates required fields', async () => {
    const result = await validator.validateFile('/dev/null'); // We'll test with actual file later
    // For now, test the schema validation directly
    const schemaResult = (validator as any).validateSchema(validCommandStructure);
    expect(schemaResult.valid).toBe(true);
    expect(schemaResult.errors).toHaveLength(0);
  });

  test('rejects missing name field', async () => {
    const invalid = { ...validCommandStructure };
    delete invalid.name;
    const schemaResult = (validator as any).validateSchema(invalid);
    expect(schemaResult.valid).toBe(false);
    expect(schemaResult.errors.some(e => e.code === 'MISSING_NAME')).toBe(true);
  });

  test('validates mode must be command', async () => {
    const invalid = { ...validCommandStructure, mode: 'agent' };
    const schemaResult = (validator as any).validateSchema(invalid);
    expect(schemaResult.valid).toBe(false);
    expect(schemaResult.errors.some(e => e.code === 'INVALID_MODE')).toBe(true);
  });

  test('validates input structure', async () => {
    const invalid = {
      ...validCommandStructure,
      inputs: [{ name: 'test' }] // missing type and required
    };
    const schemaResult = (validator as any).validateSchema(invalid);
    expect(schemaResult.valid).toBe(false);
    expect(schemaResult.errors.some(e => e.code === 'INVALID_INPUT_SCHEMA')).toBe(true);
  });

  test('validates cache strategy format', async () => {
    const invalid = {
      ...validCommandStructure,
      cache_strategy: { type: 'invalid_type' }
    };
    const schemaResult = (validator as any).validateSchema(invalid);
    expect(schemaResult.valid).toBe(false);
    expect(schemaResult.errors.some(e => e.code === 'INVALID_CACHE_TYPE')).toBe(true);
  });

  test('validates variable references', async () => {
    const content = `Generate tests for {{scope}}
Files: {{files}}
Plan: {{plan}}
Ticket: {{ticket}}`;
    
    const frontmatter = {
      ...validCommandStructure,
      inputs: [
        { name: 'scope', type: 'string', required: true },
        { name: 'files', type: 'array', required: true }
      ]
    };

    const variableResult = (validator as any).validateVariableReferences(content, frontmatter);
    expect(variableResult.errors.some(e => e.code === 'UNDEFINED_VARIABLE')).toBe(true); // 'plan' and 'ticket' not defined
    expect(variableResult.warnings.some(w => w.message.includes('unused'))).toBe(false); // All inputs are used
  });

  test('warns about unused inputs', async () => {
    const content = `Generate tests for {{scope}}`;
    
    const frontmatter = {
      ...validCommandStructure,
      inputs: [
        { name: 'scope', type: 'string', required: true },
        { name: 'files', type: 'array', required: false }, // This input is not used
        { name: 'plan', type: 'string', required: false }   // This input is not used
      ]
    };

    const variableResult = (validator as any).validateVariableReferences(content, frontmatter);
    expect(variableResult.warnings.some(w => w.message.includes('files'))).toBe(true);
    expect(variableResult.warnings.some(w => w.message.includes('plan'))).toBe(true);
  });
});

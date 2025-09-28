import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { CommandValidator } from '../../src/yaml/command-validator';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('OpenCode Command Integration', () => {
  const validator = new CommandValidator();
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), 'opencode-test-' + Date.now());
    await mkdir(tempDir, { recursive: true });
  });

  test('validates complete command file', async () => {
    const commandContent = `---
name: test-generator
mode: command
description: Generate comprehensive tests for code
version: 1.0.0
inputs:
  - name: scope
    type: string
    required: true
    description: The scope of testing (e.g., "user authentication", "payment flow")
  - name: files
    type: array
    required: false
    description: Specific files to test
  - name: framework
    type: string
    required: false
    default: jest
    description: Testing framework to use
outputs:
  - name: test_files
    type: array
    description: Generated test files
  - name: test_results
    type: structured
    format: JSON
    description: Test execution results
cache_strategy:
  type: content_based
  ttl: 3600
success_signals:
  - "Test suite generated successfully"
  - "All tests passing"
failure_modes:
  - "Test generation failed"
  - "Invalid scope provided"
---

# Test Generator Command

Generate comprehensive tests for {{scope}}.

{% if files %}
Files to test: {{files}}
{% endif %}

Using {{framework}} framework.

## Implementation Steps

1. Analyze the {{scope}} requirements
2. Generate appropriate test cases
3. Create test files with proper structure
4. Validate test syntax and coverage
5. Return test execution results

## Output Format

The command will generate:
- Unit test files for each component
- Integration test files for workflows
- Mock data files for testing
- Test configuration files
- Test execution report in JSON format
`;

    const commandPath = join(tempDir, 'test-generator.md');
    await writeFile(commandPath, commandContent);

    const result = await validator.validateFile(commandPath);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  test('detects validation errors in command files', async () => {
    const invalidCommandContent = `---
name: invalid-command
mode: command
description: This command has validation errors
inputs:
  - name: scope
    type: string
    required: true
  - name: unused_input
    type: string
    required: false
---

# Invalid Command

This command references {{scope}} and {{nonexistent_var}}.

The unused_input is defined but never used.
`;

    const commandPath = join(tempDir, 'invalid-command.md');
    await writeFile(commandPath, invalidCommandContent);

    const result = await validator.validateFile(commandPath);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.code === 'UNDEFINED_VARIABLE')).toBe(true);
    expect(result.warnings.some(w => w.message.includes('unused_input'))).toBe(true);
  });

  test('validates command directory structure', async () => {
    // Create a directory with multiple command files
    const commandDir = join(tempDir, 'commands');
    await mkdir(commandDir, { recursive: true });

    // Valid command
    const validCommand = `---
name: valid-command
mode: command
description: A valid command
inputs:
  - name: scope
    type: string
    required: true
---

Valid command content with {{scope}}.
`;

    // Invalid command
    const invalidCommand = `---
name: invalid-command
mode: command
description: An invalid command
inputs:
  - name: scope
    type: string
    required: true
---

Invalid command with {{undefined_variable}}.
`;

    await writeFile(join(commandDir, 'valid.md'), validCommand);
    await writeFile(join(commandDir, 'invalid.md'), invalidCommand);

    const result = await validator.validateDirectory(commandDir);

    expect(result.metadata?.totalCommands).toBe(2);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.warnings.length).toBeGreaterThanOrEqual(0);
  });

  test('handles cache strategy validation', async () => {
    const commandWithCache = `---
name: cached-command
mode: command
description: Command with cache strategy
inputs:
  - name: scope
    type: string
    required: true
cache_strategy:
  type: content_based
  ttl: 3600
---

Command with {{scope}} and caching.
`;

    const commandWithoutCache = `---
name: no-cache-command
mode: command
description: Command without cache strategy
inputs:
  - name: scope
    type: string
    required: true
---

Command with {{scope}}, no caching.
`;

    const cacheCommandPath = join(tempDir, 'cached.md');
    const noCacheCommandPath = join(tempDir, 'no-cache.md');

    await writeFile(cacheCommandPath, commandWithCache);
    await writeFile(noCacheCommandPath, commandWithoutCache);

    const cacheResult = await validator.validateFile(cacheCommandPath);
    const noCacheResult = await validator.validateFile(noCacheCommandPath);

    expect(cacheResult.valid).toBe(true);
    expect(noCacheResult.valid).toBe(true);
  });

  test('validates YAML frontmatter syntax', async () => {
    const malformedYaml = `---
name: malformed-command
mode: command
description: Command with malformed YAML
inputs:
  - name: scope
    type: string
    required: true
  - name: invalid: structure: with: colons
    type: string
    required: false
---

Command with {{scope}}.
`;

    const commandPath = join(tempDir, 'malformed.md');
    await writeFile(commandPath, malformedYaml);

    const result = await validator.validateFile(commandPath);

    // Should detect YAML syntax issues
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

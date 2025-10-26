/**
 * Command Variable Conversion Integration Tests
 * Tests command variable conversion in full sync workflows
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import { mkdir, writeFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { CommandConverter } from '../../src/conversion/command-converter';
import { setupTests, cleanupTests, TEST_DIR } from '../setup';

describe('Command Variable Conversion Integration', () => {
  let testProjectRoot: string;
  let converter: CommandConverter;

  beforeAll(async () => {
    await setupTests();
  });

  afterAll(async () => {
    await cleanupTests();
  });

  beforeEach(async () => {
    testProjectRoot = join(TEST_DIR, `command-variable-integration-${Date.now()}`);
    await mkdir(testProjectRoot, { recursive: true });
    converter = new CommandConverter();
  });

  afterEach(async () => {
    if (existsSync(testProjectRoot)) {
      await rm(testProjectRoot, { recursive: true, force: true });
    }
  });

  describe('Sync Workflow Integration', () => {
    test('should convert variables during sync workflow', async () => {
      // Create source command with Claude Code syntax
      const sourceCommand = `---
name: research
description: Research command
mode: command
inputs:
  - name: query
    type: string
    required: true
  - name: scope
    type: string
    required: false
---

Research {{query}} with {{scope}}`;

      const sourceFile = join(testProjectRoot, 'source-command.md');
      await writeFile(sourceFile, sourceCommand);

      // Convert to OpenCode format
      const openCodeResult = converter.convertToOpenCode(sourceCommand, 'research.md');
      expect(openCodeResult).toContain('$ARGUMENTS');
      expect(openCodeResult).toContain('<!-- Note: OpenCode only supports $ARGUMENTS placeholder');

      // Convert back to Claude Code format
      const claudeResult = converter.convertToClaudeCode(openCodeResult, 'research.md');
      expect(claudeResult).toContain('{{query}}');
      expect(claudeResult).not.toContain('$ARGUMENTS');
    });

    test('should maintain semantic meaning through sync cycle', async () => {
      const originalCommand = `---
name: ticket
description: Create ticket
mode: command
inputs:
  - name: user_request
    type: string
    required: true
---

Create ticket for $ARGUMENTS`;

      // Simulate sync workflow: OpenCode -> Claude -> OpenCode
      const step1 = converter.convertToClaudeCode(originalCommand, 'ticket.md');
      const step2 = converter.convertToOpenCode(step1, 'ticket.md');
      const step3 = converter.convertToClaudeCode(step2, 'ticket.md');

      // Final result should maintain semantic meaning
      expect(step3).toContain('{{user_request}}');
      expect(step3).not.toContain('$ARGUMENTS');
    });

    test('should handle mixed variable syntax in source files', async () => {
      const mixedCommand = `---
name: mixed
description: Mixed syntax command
mode: command
inputs:
  - name: query
    type: string
    required: true
---

Process {{query}} with $ARGUMENTS`;

      // Convert to OpenCode (should normalize to $ARGUMENTS)
      const openCodeResult = converter.convertToOpenCode(mixedCommand, 'mixed.md');
      expect(openCodeResult).toContain('$ARGUMENTS');
      expect(openCodeResult).not.toContain('{{query}}');

      // Convert to Claude Code (should normalize to {{query}})
      const claudeResult = converter.convertToClaudeCode(mixedCommand, 'mixed.md');
      expect(claudeResult).toContain('{{query}}');
      expect(claudeResult).not.toContain('$ARGUMENTS');
    });
  });

  describe('Multi-Parameter Command Handling', () => {
    test('should handle complex multi-parameter commands', async () => {
      const complexCommand = `---
name: complex-research
description: Complex research command
mode: command
inputs:
  - name: topic
    type: string
    required: true
  - name: depth
    type: string
    required: false
  - name: sources
    type: string
    required: false
  - name: format
    type: string
    required: false
---

Research {{topic}} with depth {{depth}} using {{sources}} in {{format}} format`;

      // Convert to OpenCode - should get warning
      const openCodeResult = converter.convertToOpenCode(complexCommand, 'complex-research.md');
      expect(openCodeResult).toContain('$ARGUMENTS');
      expect(openCodeResult).toContain('<!-- Note: OpenCode only supports $ARGUMENTS placeholder');
      expect(openCodeResult).not.toContain('{{topic}}');
      expect(openCodeResult).not.toContain('{{depth}}');

      // Convert back to Claude Code - should use primary parameter
      const claudeResult = converter.convertToClaudeCode(openCodeResult, 'complex-research.md');
      expect(claudeResult).toContain('{{topic}}');
      expect(claudeResult).not.toContain('$ARGUMENTS');
    });

    test('should prioritize required parameters in conversion', async () => {
      const prioritizedCommand = `---
name: prioritized
description: Prioritized parameters
mode: command
inputs:
  - name: optional_param
    type: string
    required: false
  - name: required_param
    type: string
    required: true
  - name: another_optional
    type: string
    required: false
---

Process {{required_param}} with {{optional_param}}`;

      // Convert to Claude Code - should use required parameter
      const claudeResult = converter.convertToClaudeCode(prioritizedCommand, 'prioritized.md');
      expect(claudeResult).toContain('{{required_param}}');
      expect(claudeResult).not.toContain('$ARGUMENTS');
    });
  });

  describe('Edge Cases in Sync Workflow', () => {
    test('should handle commands with no inputs', async () => {
      const noInputsCommand = `---
name: no-inputs
description: No inputs command
mode: command
---

Execute without parameters`;

      // Convert to OpenCode
      const openCodeResult = converter.convertToOpenCode(noInputsCommand, 'no-inputs.md');
      expect(openCodeResult).not.toContain('$ARGUMENTS');
      expect(openCodeResult).not.toContain('<!-- Note:');

      // Convert to Claude Code
      const claudeResult = converter.convertToClaudeCode(noInputsCommand, 'no-inputs.md');
      expect(claudeResult).not.toContain('{{');
      expect(claudeResult).not.toContain('$ARGUMENTS');
    });

    test('should handle commands with only optional inputs', async () => {
      const optionalOnlyCommand = `---
name: optional-only
description: Optional inputs only
mode: command
inputs:
  - name: optional1
    type: string
    required: false
  - name: optional2
    type: string
    required: false
---

Process {{optional1}} and {{optional2}}`;

      // Convert to Claude Code - should use first optional
      const claudeResult = converter.convertToClaudeCode(optionalOnlyCommand, 'optional-only.md');
      expect(claudeResult).toContain('{{optional1}}');
      expect(claudeResult).not.toContain('{{optional2}}');
    });

    test('should handle malformed input definitions', async () => {
      const malformedCommand = `---
name: malformed
description: Malformed inputs
mode: command
inputs:
  - name: param1
    type: string
    # missing required field
  - name: param2
    # missing type field
    required: true
---

Process {{param1}} and {{param2}}`;

      // Should handle gracefully
      const openCodeResult = converter.convertToOpenCode(malformedCommand, 'malformed.md');
      expect(openCodeResult).toContain('$ARGUMENTS');
    });
  });

  describe('Template Section Variable Handling', () => {
    test('should handle variables in template sections', async () => {
      const templateCommand = `---
name: template-test
description: Template with variables
mode: command
inputs:
  - name: current_date
    type: string
    required: false
  - name: user_query
    type: string
    required: true
---

## Template

\`\`\`markdown
Date: {{current_date}}
Query: {{user_query}}
\`\`\`

Process {{user_query}}`;

      // Convert to OpenCode
      const openCodeResult = converter.convertToOpenCode(templateCommand, 'template-test.md');
      expect(openCodeResult).toContain('$ARGUMENTS');
      expect(openCodeResult).toContain('<!-- Note: OpenCode only supports $ARGUMENTS placeholder');
      expect(openCodeResult).not.toContain('{{current_date}}');
      expect(openCodeResult).not.toContain('{{user_query}}');

      // Convert back to Claude Code
      const claudeResult = converter.convertToClaudeCode(openCodeResult, 'template-test.md');
      expect(claudeResult).toContain('{{user_query}}');
      expect(claudeResult).not.toContain('$ARGUMENTS');
    });

    test('should handle nested template variables', async () => {
      const nestedTemplateCommand = `---
name: nested-template
description: Nested template variables
mode: command
inputs:
  - name: base_url
    type: string
    required: true
  - name: endpoint
    type: string
    required: true
---

## API Template

\`\`\`json
{
  "url": "{{base_url}}/{{endpoint}}",
  "method": "GET"
}
\`\`\`

Call {{base_url}}/{{endpoint}}`;

      // Convert to OpenCode
      const openCodeResult = converter.convertToOpenCode(
        nestedTemplateCommand,
        'nested-template.md'
      );
      expect(openCodeResult).toContain('$ARGUMENTS');
      expect(openCodeResult).toContain('<!-- Note: OpenCode only supports $ARGUMENTS placeholder');
    });
  });

  describe('Round-Trip Conversion Integrity', () => {
    test('should maintain data integrity through multiple conversions', async () => {
      const originalCommand = `---
name: integrity-test
description: Data integrity test
mode: command
inputs:
  - name: primary
    type: string
    required: true
  - name: secondary
    type: string
    required: false
---

Primary: {{primary}}, Secondary: {{secondary}}`;

      // Multiple conversion cycles
      let current = originalCommand;

      for (let i = 0; i < 3; i++) {
        // Claude -> OpenCode -> Claude
        current = converter.convertToOpenCode(current, 'integrity-test.md');
        current = converter.convertToClaudeCode(current, 'integrity-test.md');
      }

      // Should still have the primary parameter
      expect(current).toContain('{{primary}}');
      expect(current).not.toContain('$ARGUMENTS');
    });

    test('should preserve non-variable content', async () => {
      const contentCommand = `---
name: content-test
description: Content preservation test
mode: command
inputs:
  - name: query
    type: string
    required: true
---

## Instructions

1. First step: {{query}}
2. Second step: Process the results
3. Third step: Generate report

**Important**: Always validate {{query}} before processing.`;

      // Convert to OpenCode and back
      const openCodeResult = converter.convertToOpenCode(contentCommand, 'content-test.md');
      const claudeResult = converter.convertToClaudeCode(openCodeResult, 'content-test.md');

      // Non-variable content should be preserved
      expect(claudeResult).toContain('## Instructions');
      expect(claudeResult).toContain('1. First step:');
      expect(claudeResult).toContain('2. Second step: Process the results');
      expect(claudeResult).toContain('**Important**:');
      expect(claudeResult).toContain('{{query}}');
    });
  });

  describe('Performance in Sync Workflow', () => {
    test('should handle large command files efficiently', async () => {
      const largeContent = '# Large Command\n' + 'x'.repeat(10000);
      const largeCommand = `---
name: large-command
description: Large command file
mode: command
inputs:
  - name: data
    type: string
    required: true
---

${largeContent}

Process {{important_data}}`;

      const startTime = Date.now();

      // Convert to OpenCode and back
      const openCodeResult = converter.convertToOpenCode(largeCommand, 'large-command.md');
      const claudeResult = converter.convertToClaudeCode(openCodeResult, 'large-command.md');

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(claudeResult).toContain(largeContent);
    });

    test('should handle many conversions efficiently', async () => {
      const testCommand = `---
name: performance-test
description: Performance test
mode: command
inputs:
  - name: param
    type: string
    required: true
---

Test {{param}}`;

      const startTime = Date.now();

      // Perform many conversions
      for (let i = 0; i < 100; i++) {
        const openCodeResult = converter.convertToOpenCode(testCommand, `test-${i}.md`);
        const claudeResult = converter.convertToClaudeCode(openCodeResult, `test-${i}.md`);
        expect(claudeResult).toContain('{{param}}');
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Error Recovery in Sync Workflow', () => {
    test('should recover from conversion errors', async () => {
      const errorCommand = `---
name: error-test
description: Error recovery test
mode: command
inputs:
  - name: param
    type: string
    required: true
---

Test {{param}} with {{malformed`;

      // Should handle malformed variables gracefully
      const openCodeResult = converter.convertToOpenCode(errorCommand, 'error-test.md');
      expect(openCodeResult).toContain('$ARGUMENTS');
    });

    test('should handle missing frontmatter gracefully', async () => {
      const noFrontmatterCommand = `# No Frontmatter

Test {{param}} without frontmatter`;

      // Should handle gracefully
      const openCodeResult = converter.convertToOpenCode(noFrontmatterCommand, 'no-frontmatter.md');
      expect(openCodeResult).toBeDefined();
    });
  });
});

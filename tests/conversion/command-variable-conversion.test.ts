import { describe, test, expect } from 'bun:test';
import { CommandConverter } from '../../src/conversion/command-converter.js';

describe('Command Variable Syntax Conversion', () => {
  const converter = new CommandConverter();

  describe('OpenCode Conversion ({{variable}} -> $ARGUMENTS)', () => {
    test('converts single variable to $ARGUMENTS', async () => {
      const input = `---
name: test
description: Test command
mode: command
inputs:
  - name: query
    type: string
    required: true
---

Process the {{query}}`;

      const result = converter.convertToOpenCode(input, 'test.md');
      expect(result).toContain('$ARGUMENTS');
      expect(result).not.toContain('{{query}}');
    });

    test('converts multiple variables to $ARGUMENTS with warning', async () => {
      const input = `---
name: test
description: Test command
mode: command
inputs:
  - name: query
    type: string
    required: true
  - name: scope
    type: string
    required: false
---

Process {{query}} with {{scope}}`;

      const result = converter.convertToOpenCode(input, 'test.md');
      expect(result).toContain('$ARGUMENTS');
      expect(result).toContain('<!-- Note: OpenCode only supports $ARGUMENTS placeholder');
      expect(result).not.toContain('{{query}}');
      expect(result).not.toContain('{{scope}}');
    });

    test('preserves $ARGUMENTS if already present', async () => {
      const input = `---
name: test
description: Test command
mode: command
inputs:
  - name: user_request
    type: string
    required: true
---

Process $ARGUMENTS`;

      const result = converter.convertToOpenCode(input, 'test.md');
      expect(result).toContain('$ARGUMENTS');
      // Should not add warning for single variable
      expect(result).not.toContain('<!-- Note:');
    });

    test('handles variable in template section', async () => {
      const input = `---
name: research
description: Research command
mode: command
inputs:
  - name: current_date
    type: string
    required: false
  - name: ticket
    type: string
    required: false
---

## Template

\`\`\`markdown
date: {{current_date}}
\`\`\`

{{ticket}}`;

      const result = converter.convertToOpenCode(input, 'research.md');
      expect(result).toContain('$ARGUMENTS');
      expect(result).toContain('<!-- Note: OpenCode only supports $ARGUMENTS placeholder');
      expect(result).not.toContain('{{current_date}}');
      expect(result).not.toContain('{{ticket}}');
    });
  });

  describe('Claude Code Conversion ($ARGUMENTS -> {{variable}})', () => {
    test('converts $ARGUMENTS to first required input parameter', async () => {
      const input = `---
name: test
description: Test command
mode: command
inputs:
  - name: user_request
    type: string
    required: true
    description: User input
  - name: optional_param
    type: string
    required: false
---

Process $ARGUMENTS`;

      const result = converter.convertToClaudeCode(input, 'test.md');
      expect(result).toContain('{{user_request}}');
      expect(result).not.toContain('$ARGUMENTS');
    });

    test('converts $ARGUMENTS to first input if no required ones', async () => {
      const input = `---
name: test
description: Test command
mode: command
inputs:
  - name: query
    type: string
    required: false
---

Process $ARGUMENTS`;

      const result = converter.convertToClaudeCode(input, 'test.md');
      expect(result).toContain('{{query}}');
      expect(result).not.toContain('$ARGUMENTS');
    });

    test('uses fallback "arguments" if no inputs defined', async () => {
      const input = `---
name: test
description: Test command
---

Process $ARGUMENTS`;

      const result = converter.convertToClaudeCode(input, 'test.md');
      expect(result).toContain('{{arguments}}');
      expect(result).not.toContain('$ARGUMENTS');
    });

    test('preserves {{variable}} if already present', async () => {
      const input = `---
name: test
description: Test command
inputs:
  - name: query
    type: string
    required: true
---

Process {{query}}`;

      const result = converter.convertToClaudeCode(input, 'test.md');
      expect(result).toContain('{{query}}');
    });
  });

  describe('Round-trip Conversion', () => {
    test('maintains semantic meaning through conversion cycle', async () => {
      const original = `---
name: ticket
description: Create ticket
mode: command
inputs:
  - name: user_request
    type: string
    required: true
---

Create ticket for $ARGUMENTS`;

      // Convert to Claude
      const claudeResult = converter.convertToClaudeCode(original, 'ticket.md');
      expect(claudeResult).toContain('{{user_request}}');

      // Convert back to OpenCode
      const openCodeResult = converter.convertToOpenCode(claudeResult, 'ticket.md');
      expect(openCodeResult).toContain('$ARGUMENTS');
      expect(openCodeResult).not.toContain('{{user_request}}');
    });

    test('handles multi-parameter commands correctly', async () => {
      const original = `---
name: research
description: Research command
mode: command
inputs:
  - name: query
    type: string
    required: false
  - name: ticket
    type: string
    required: false
  - name: scope
    type: string
    required: false
---

Research {{query}} from {{ticket}} with {{scope}}`;

      // Convert to OpenCode
      const openCodeResult = converter.convertToOpenCode(original, 'research.md');
      expect(openCodeResult).toContain('$ARGUMENTS');
      expect(openCodeResult).toContain('<!-- Note: OpenCode only supports $ARGUMENTS placeholder');

      // Convert back to Claude
      const claudeResult = converter.convertToClaudeCode(openCodeResult, 'research.md');
      // Should use first optional parameter since no required ones
      expect(claudeResult).toContain('{{query}}');
      expect(claudeResult).not.toContain('$ARGUMENTS');
    });
  });
});


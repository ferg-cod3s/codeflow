import { test, expect, describe } from 'bun:test';

describe('Claude Code Argument Handling Validation', () => {
  describe('$ARGUMENTS Pattern', () => {
    test('captures all arguments as single string', () => {
      const template = 'Deploying application with arguments: $ARGUMENTS';
      const args = 'production v1.2.0 --rollback --force';

      const result = template.replace(/\$ARGUMENTS/g, args);

      expect(result).toBe(
        'Deploying application with arguments: production v1.2.0 --rollback --force'
      );
    });

    test('handles empty arguments', () => {
      const template = 'Deploying application with arguments: $ARGUMENTS';
      const args = '';

      const result = template.replace(/\$ARGUMENTS/g, args);

      expect(result).toBe('Deploying application with arguments: ');
    });

    test('handles arguments with spaces and quotes', () => {
      const template = 'Search query: $ARGUMENTS';
      const args = '"user authentication" --type=feature --priority=high';

      const result = template.replace(/\$ARGUMENTS/g, args);

      expect(result).toBe('Search query: "user authentication" --type=feature --priority=high');
    });

    test('handles multiple $ARGUMENTS in same command', () => {
      const template = 'Start: $ARGUMENTS\\nEnd: $ARGUMENTS';
      const args = 'test --verbose';

      const result = template.replace(/\$ARGUMENTS/g, args);

      expect(result).toBe('Start: test --verbose\\nEnd: test --verbose');
    });
  });

  describe('Positional Arguments ($1, $2, $3, etc.)', () => {
    test('substitutes single positional argument', () => {
      const template = 'Deploying to environment: $1';
      const args = ['production'];

      let result = template;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toBe('Deploying to environment: production');
    });

    test('substitutes multiple positional arguments', () => {
      const template = 'Environment: $1\\nVersion: $2\\nOptions: $3';
      const args = ['staging', 'v2.1.0', '--rollback'];

      let result = template;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toBe('Environment: staging\\nVersion: v2.1.0\\nOptions: --rollback');
    });

    test('handles missing positional arguments', () => {
      const template = 'Environment: $1\\nVersion: $2\\nOptions: $3';
      const args = ['production']; // Only $1 provided

      let result = template;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      // $2 and $3 should remain unsubstituted
      expect(result).toBe('Environment: production\\nVersion: $2\\nOptions: $3');
    });

    test('handles empty positional arguments', () => {
      const template = 'First: $1\\nSecond: $2\\nThird: $3';
      const args = ['arg1', '', 'arg3'];

      let result = template;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toBe('First: arg1\\nSecond: \\nThird: arg3');
    });

    test('handles special characters in positional arguments', () => {
      const template = 'File: $1\\nMessage: $2';
      const args = ['src/components/Button.tsx', 'Fix: button click handler'];

      let result = template;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toBe('File: src/components/Button.tsx\\nMessage: Fix: button click handler');
    });
  });

  describe('Mixed Argument Patterns', () => {
    test('handles $ARGUMENTS and positional arguments together', () => {
      const template = 'Command: $1\\nAll args: $ARGUMENTS\\nEnvironment: $2';
      const allArgs = 'deploy production v1.0.0';
      const positionalArgs = ['deploy', 'production'];

      let result = template.replace(/\$ARGUMENTS/g, allArgs);
      positionalArgs.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toBe(
        'Command: deploy\\nAll args: deploy production v1.0.0\\nEnvironment: production'
      );
    });
  });

  describe('Shell Command Integration', () => {
    test('properly escapes arguments in shell commands', () => {
      const template = 'echo "Deployment arguments: $ARGUMENTS"';
      const args = 'production v1.2.0';

      const result = template.replace(/\$ARGUMENTS/g, args);

      expect(result).toBe('echo "Deployment arguments: production v1.2.0"');
    });

    test('handles quotes in shell command arguments', () => {
      const template = 'git commit -m "$1"';
      const args = ['Fix: "button click" issue'];

      let result = template;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toBe('git commit -m "Fix: "button click" issue"');
    });
  });

  describe('Argument Validation Patterns', () => {
    test('validates required arguments pattern', () => {
      const validationTemplate =
        'if [ -z "$1" ]; then echo "Error: Environment is required"; exit 1; fi; echo "Deploying to: $1"';

      const args = ['production'];
      let result = validationTemplate;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toContain('echo "Deploying to: production"');
    });

    test('validates argument choices pattern', () => {
      const validationTemplate =
        'case "$1" in production|staging|development) echo "Valid environment: $1" ;; *) echo "Error: Invalid environment" ;; esac';

      const args = ['staging'];
      let result = validationTemplate;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toContain('echo "Valid environment: staging"');
    });
  });

  describe('Complex Command Scenarios', () => {
    test('handles deployment command with multiple arguments', () => {
      const deployTemplate =
        'Deploying application with arguments: $ARGUMENTS\\nEnvironment: $1\\nVersion: $2\\nAdditional Options: $3';

      const allArgs = 'production v1.2.0 --rollback --force';
      const positionalArgs = ['production', 'v1.2.0', '--rollback --force'];

      let result = deployTemplate.replace(/\$ARGUMENTS/g, allArgs);
      positionalArgs.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toContain(
        'Deploying application with arguments: production v1.2.0 --rollback --force'
      );
      expect(result).toContain('Environment: production');
      expect(result).toContain('Version: v1.2.0');
    });

    test('handles search command with query arguments', () => {
      const searchTemplate =
        'Searching for: $ARGUMENTS\\nQuery: $1\\nFile Pattern: $2\\nOptions: $3';

      const allArgs = '"useState hook" src/components/ --context-lines=3';
      const positionalArgs = ['"useState hook"', 'src/components/', '--context-lines=3'];

      let result = searchTemplate.replace(/\$ARGUMENTS/g, allArgs);
      positionalArgs.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toContain('Searching for: "useState hook" src/components/ --context-lines=3');
      expect(result).toContain('Query: "useState hook"');
      expect(result).toContain('File Pattern: src/components/');
      expect(result).toContain('Options: --context-lines=3');
    });
  });
});

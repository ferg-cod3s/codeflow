import { test, expect, describe } from 'bun:test';

describe('Cursor Argument Handling Validation', () => {
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
      const template = 'Environment: $1\\nVersion: $2\\nRollback: $3';
      const args = ['staging', 'v2.1.0', 'true'];

      let result = template;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toBe('Environment: staging\\nVersion: v2.1.0\\nRollback: true');
    });

    test('handles missing positional arguments', () => {
      const template = 'Environment: $1\\nVersion: $2\\nRollback: $3';
      const args = ['production']; // Only $1 provided

      let result = template;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      // $2 and $3 should remain unsubstituted
      expect(result).toBe('Environment: production\\nVersion: $2\\nRollback: $3');
    });

    test('handles empty positional arguments', () => {
      const template = 'File: $1\\nMessage: $2\\nAuthor: $3';
      const args = ['src/App.tsx', '', 'john'];

      let result = template;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toBe('File: src/App.tsx\\nMessage: \\nAuthor: john');
    });

    test('handles special characters in positional arguments', () => {
      const template = 'Component: $1\\nProps: $2\\nStory: $3';
      const args = ['Button', '{ onClick: handleClick }', 'user clicks button'];

      let result = template;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toBe(
        'Component: Button\\nProps: { onClick: handleClick }\\nStory: user clicks button'
      );
    });
  });

  describe('File References (@ syntax)', () => {
    test('handles file reference patterns', () => {
      const template = 'Reviewing file: @src/components/Button.tsx\\nFocus on: $1';
      const args = ['accessibility'];

      let result = template;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toBe('Reviewing file: @src/components/Button.tsx\\nFocus on: accessibility');
    });

    test('handles directory reference patterns', () => {
      const template = 'Analyzing directory: @src/utils/\\nPattern: $1';
      const args = ['error handling'];

      let result = template;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toBe('Analyzing directory: @src/utils/\\nPattern: error handling');
    });
  });

  describe('Shell Command Integration', () => {
    test('properly escapes arguments in shell commands', () => {
      const template = 'echo "Testing component: $1"';
      const args = ['Button'];

      let result = template;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toBe('echo "Testing component: Button"');
    });

    test('handles quotes in shell command arguments', () => {
      const template = 'npm test -- --testNamePattern="$1"';
      const args = ['Button component'];

      let result = template;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toBe('npm test -- --testNamePattern="Button component"');
    });

    test('handles multiple shell commands', () => {
      const template = 'echo "Building: $1" && npm run build:$1 && echo "Built: $1"';
      const args = ['production'];

      let result = template;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toBe(
        'echo "Building: production" && npm run build:production && echo "Built: production"'
      );
    });
  });

  describe('Cursor Rules Integration', () => {
    test('handles rules-based command patterns', () => {
      const rulesTemplate =
        'You are working on $1.\\nFocus on $2.\\nFollow the coding standards for $3.';
      const args = ['user authentication', 'security', 'TypeScript'];

      let result = rulesTemplate;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toBe(
        'You are working on user authentication.\\nFocus on security.\\nFollow the coding standards for TypeScript.'
      );
    });

    test('handles file context in rules', () => {
      const contextTemplate =
        'Review @src/components/$1 for $2 issues.\\nEnsure it follows $3 patterns.';
      const args = ['LoginForm.tsx', 'accessibility', 'atomic design'];

      let result = contextTemplate;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toBe(
        'Review @src/components/LoginForm.tsx for accessibility issues.\\nEnsure it follows atomic design patterns.'
      );
    });
  });

  describe('Complex Command Scenarios', () => {
    test('handles component generation command', () => {
      const componentTemplate =
        'Generate component: $1\\nType: $2\\nLocation: @src/components/$1\\nProps: $3\\nTests: $4';

      const args = [
        'UserProfile',
        'functional component',
        '{ user: User, onUpdate: Function }',
        'true',
      ];

      let result = componentTemplate;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toBe(
        'Generate component: UserProfile\\nType: functional component\\nLocation: @src/components/UserProfile\\nProps: { user: User, onUpdate: Function }\\nTests: true'
      );
    });

    test('handles testing command with file patterns', () => {
      const testTemplate =
        'Run tests for: $1\\nPattern: $2\\nCoverage: $3\\nFiles: @src/$1/**/*.test.tsx';

      const args = ['components', '**/*.tsx', '80'];

      let result = testTemplate;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toBe(
        'Run tests for: components\\nPattern: **/*.tsx\\nCoverage: 80\\nFiles: @src/components/**/*.test.tsx'
      );
    });

    test('handles deployment command with validation', () => {
      const deployTemplate =
        'Deploy to: $1\\nVersion: $2\\nRollback enabled: $3\\nConfig: @config/$1.json';

      const args = ['staging', 'v0.16.3', 'false'];

      let result = deployTemplate;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toBe(
        'Deploy to: staging\\nVersion: v0.16.3\\nRollback enabled: false\\nConfig: @config/staging.json'
      );
    });
  });

  describe('Error Handling Patterns', () => {
    test('validates required arguments', () => {
      const validationTemplate =
        "if [ -z '$1' ]; then echo 'Error: Component name required'; exit 1; fi; echo 'Creating component: $1'";

      const args = ['Button'];
      let result = validationTemplate;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toContain("echo 'Creating component: Button'");
    });

    test('validates argument choices', () => {
      const choiceTemplate =
        "case '$1' in component|hook|utility) echo 'Valid type: $1' ;; *) echo 'Error: Invalid type' ;; esac";

      const args = ['component'];
      let result = choiceTemplate;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toContain("echo 'Valid type: component'");
    });
  });

  describe('Integration with Cursor IDE Features', () => {
    test('handles AI context with file references', () => {
      const contextTemplate =
        'Analyze @src/components/$1 and @src/utils/$2\\nFocus on: $3\\nGenerate: $4';

      const args = ['Button.tsx', 'helpers.ts', 'performance', 'optimization suggestions'];

      let result = contextTemplate;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toBe(
        'Analyze @src/components/Button.tsx and @src/utils/helpers.ts\\nFocus on: performance\\nGenerate: optimization suggestions'
      );
    });

    test('handles multi-file analysis', () => {
      const multiFileTemplate =
        'Review files: @src/components/$1, @src/hooks/$2, @src/services/$3\\nCommon pattern: $4';

      const args = ['Button.tsx', 'useAuth.ts', 'api.ts', 'user authentication'];

      let result = multiFileTemplate;
      args.forEach((arg, index) => {
        const regex = new RegExp(`\\$${index + 1}`, 'g');
        result = result.replace(regex, arg);
      });

      expect(result).toBe(
        'Review files: @src/components/Button.tsx, @src/hooks/useAuth.ts, @src/services/api.ts\\nCommon pattern: user authentication'
      );
    });
  });
});

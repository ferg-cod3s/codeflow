/**
 * CLI Error Handler Tests
 * Tests for error handling utilities to ensure good user experience
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Console } from 'console';
import {
  CLIErrorHandler,
  type ErrorContext,
  type ValidationResult,
} from '../../../src/cli/error-handler';

// Mock console to capture output
let outputLogs: string[];
let errorLogs: string[];
let warnLogs: string[];

describe('CLI Error Handler', () => {
  beforeEach(() => {
    outputLogs = [];
    errorLogs = [];
    warnLogs = [];

    // Mock console methods to capture output
    const originalConsole = global.console;
    global.console = {
      ...originalConsole,
      log: (message: string) => outputLogs.push(message),
      error: (message: string) => errorLogs.push(message),
      warn: (message: string) => warnLogs.push(message),
    } as any;
  });

  afterEach(() => {
    // Restore original console
    global.console = console;
  });

  describe('displayError', () => {
    test('should display basic error context', () => {
      const context: ErrorContext = {
        command: 'test-command',
        phase: 'validation',
        errorType: 'invalid_input',
        expected: 'valid file path',
        found: 'invalid path',
        mitigation: 'provide correct path',
        requiresUserInput: false,
      };

      CLIErrorHandler.displayError(context);

      const errorOutput = errorLogs.join('');
      expect(errorOutput).toContain('❌ test-command Error');
      expect(errorOutput).toContain('├─ Type: invalid_input');
      expect(errorOutput).toContain('├─ Expected: valid file path');
      expect(errorOutput).toContain('├─ Found: invalid path');
      expect(errorOutput).toContain('└─ Action: provide correct path');
    });

    test('should display error with suggestions', () => {
      const context: ErrorContext = {
        command: 'test-command',
        phase: 'execution',
        errorType: 'runtime_error',
        expected: 'successful execution',
        found: 'error occurred',
        mitigation: 'fix the issue',
        requiresUserInput: false,
        suggestions: ['Check syntax', 'Verify inputs', 'Try again'],
      };

      CLIErrorHandler.displayError(context);

      const errorOutput = errorLogs.join('');
      expect(errorOutput).toContain('💡 Suggestions:');
      expect(errorOutput).toContain('1. Check syntax');
      expect(errorOutput).toContain('2. Verify inputs');
      expect(errorOutput).toContain('3. Try again');
    });

    test('should display user input requirement', () => {
      const context: ErrorContext = {
        command: 'test-command',
        phase: 'setup',
        errorType: 'missing_config',
        expected: 'configuration file',
        found: 'no config',
        mitigation: 'create config file',
        requiresUserInput: true,
      };

      CLIErrorHandler.displayError(context);

      const errorOutput = errorLogs.join('');
      expect(errorOutput).toContain('⚠️  This error requires user input to resolve.');
    });
  });

  describe('displayValidationResult', () => {
    test('should display successful validation', () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        suggestions: [],
      };

      CLIErrorHandler.displayValidationResult(result, 'Test');

      const output = outputLogs.join('');
      expect(output).toContain('✅ Test validation passed');
    });

    test('should display validation errors', () => {
      const result: ValidationResult = {
        valid: false,
        errors: ['Error 1', 'Error 2'],
        warnings: [],
        suggestions: [],
      };

      CLIErrorHandler.displayValidationResult(result, 'Test');

      const errorOutput = errorLogs.join('');
      expect(errorOutput).toContain('❌ Test Validation Errors:');
      expect(errorOutput).toContain('1. Error 1');
      expect(errorOutput).toContain('2. Error 2');
    });

    test('should display validation warnings', () => {
      const result: ValidationResult = {
        valid: false, // Warnings only show when invalid
        errors: [],
        warnings: ['Warning 1', 'Warning 2'],
        suggestions: [],
      };

      CLIErrorHandler.displayValidationResult(result, 'Test');

      const errorOutput = errorLogs.join('');
      expect(errorOutput).toContain('⚠️  Test Warnings:');
      expect(errorOutput).toContain('1. Warning 1');
      expect(errorOutput).toContain('2. Warning 2');
    });

    test('should display validation suggestions', () => {
      const result: ValidationResult = {
        valid: false,
        errors: ['Some error'],
        warnings: [],
        suggestions: ['Suggestion 1', 'Suggestion 2'],
      };

      CLIErrorHandler.displayValidationResult(result, 'Test');

      const errorOutput = errorLogs.join('');
      expect(errorOutput).toContain('💡 Suggestions:');
      expect(errorOutput).toContain('1. Suggestion 1');
      expect(errorOutput).toContain('2. Suggestion 2');
    });

    test('should display mixed validation results', () => {
      const result: ValidationResult = {
        valid: false,
        errors: ['Critical error'],
        warnings: ['Minor warning'],
        suggestions: ['Fix suggestion'],
      };

      CLIErrorHandler.displayValidationResult(result, 'Test');

      const errorOutput = errorLogs.join('');
      expect(errorOutput).toContain('❌ Test Validation Errors:');
      expect(errorOutput).toContain('⚠️  Test Warnings:');
      expect(errorOutput).toContain('💡 Suggestions:');
    });
  });

  describe('createErrorContext', () => {
    test('should create basic error context', () => {
      const context = CLIErrorHandler.createErrorContext(
        'test-command',
        'validation',
        'invalid_input',
        'valid input',
        'invalid input',
        'fix input'
      );

      expect(context.command).toBe('test-command');
      expect(context.phase).toBe('validation');
      expect(context.errorType).toBe('invalid_input');
      expect(context.expected).toBe('valid input');
      expect(context.found).toBe('invalid input');
      expect(context.mitigation).toBe('fix input');
      expect(context.requiresUserInput).toBe(false);
      expect(context.suggestions).toBeUndefined();
    });

    test('should create error context with options', () => {
      const context = CLIErrorHandler.createErrorContext(
        'test-command',
        'execution',
        'runtime_error',
        'success',
        'failure',
        'retry',
        {
          requiresUserInput: true,
          suggestions: ['Try again', 'Check logs'],
        }
      );

      expect(context.requiresUserInput).toBe(true);
      expect(context.suggestions).toEqual(['Try again', 'Check logs']);
    });

    test('should use default values for options', () => {
      const context = CLIErrorHandler.createErrorContext(
        'test-command',
        'setup',
        'missing_file',
        'file exists',
        'file missing',
        'create file',
        {}
      );

      expect(context.requiresUserInput).toBe(false);
      expect(context.suggestions).toBeUndefined();
    });
  });

  describe('validatePath', () => {
    test('should validate existing file', () => {
      // Use a file that should exist
      const result = CLIErrorHandler.validatePath(process.cwd(), 'directory');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle non-existent file', () => {
      const result = CLIErrorHandler.validatePath('/non/existent/path', 'file');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('file does not exist: /non/existent/path');
      expect(result.suggestions).toEqual(
        expect.arrayContaining(['Create the file or check the path'])
      );
    });

    test('should handle non-existent directory', () => {
      const result = CLIErrorHandler.validatePath('/non/existent/dir', 'directory');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('directory does not exist: /non/existent/dir');
      expect(result.suggestions).toEqual(
        expect.arrayContaining(['Create directory or check path'])
      );
    });

    test('should handle non-existent directory', () => {
      const result = CLIErrorHandler.validatePath('/non/existent/dir', 'directory');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('directory does not exist: /non/existent/dir');
      expect(result.suggestions).toEqual(
        expect.arrayContaining(['Create directory or check path'])
      );
    });

    test('should handle non-existent directory', () => {
      const result = CLIErrorHandler.validatePath('/non/existent/dir', 'directory');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('directory does not exist: /non/existent/dir');
      expect(result.suggestions).toEqual(
        expect.arrayContaining(['Create the directory or check the path'])
      );
    });
  });

  describe('validateArguments', () => {
    test('should validate sufficient arguments', () => {
      const result = CLIErrorHandler.validateArguments(['arg1', 'arg2'], 2, 'test');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle insufficient arguments', () => {
      const result = CLIErrorHandler.validateArguments(['arg1'], 2, 'test');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Insufficient arguments for test');
      expect(result.errors).toContain('Expected 2 arguments, got 1');
      expect(result.suggestions).toContain("Use 'codeflow test --help' for usage information");
    });

    test('should handle zero required arguments', () => {
      const result = CLIErrorHandler.validateArguments([], 0, 'test');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle extra arguments', () => {
      const result = CLIErrorHandler.validateArguments(['arg1', 'arg2', 'arg3'], 2, 'test');

      expect(result.valid).toBe(true); // Extra arguments are allowed
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('handleCommonError', () => {
    test('should handle ENOENT errors', () => {
      const error = new Error('File not found') as any;
      error.code = 'ENOENT';
      error.message = 'ENOENT: no such file or directory';

      CLIErrorHandler.handleCommonError(error, 'test-command');

      const errorOutput = errorLogs.join('');
      expect(errorOutput).toContain('❌ test-command Error');
      expect(errorOutput).toContain('file_not_found');
      expect(errorOutput).toContain(
        'Check that the file or directory exists and the path is correct'
      );
      expect(errorOutput).toContain('⚠️  This error requires user input to resolve.');
      expect(errorOutput).toContain('Verify path is spelled correctly');
      expect(errorOutput).toContain('Check file/directory permissions');
    });

    test('should handle EACCES errors', () => {
      const error = new Error('Permission denied') as any;
      error.code = 'EACCES';
      error.message = 'EACCES: permission denied';

      CLIErrorHandler.handleCommonError(error, 'test-command');

      const errorOutput = errorLogs.join('');
      expect(errorOutput).toContain('❌ test-command Error');
      expect(errorOutput).toContain('access_denied');
      expect(errorOutput).toContain('Check file and directory permissions');
      expect(errorOutput).toContain('⚠️  This error requires user input to resolve.');
      expect(errorOutput).toContain('Run with appropriate permissions (sudo if needed)');
    });

    test('should handle unknown option errors', () => {
      const error = new Error('Unknown option') as any;
      error.code = 'ERR_PARSE_ARGS_UNKNOWN_OPTION';
      error.message = 'Unknown option --invalid';

      CLIErrorHandler.handleCommonError(error, 'test-command');

      const errorOutput = errorLogs.join('');
      expect(errorOutput).toContain('❌ test-command Error');
      expect(errorOutput).toContain('unknown_option');
      expect(errorOutput).toContain('Check option name and try again');
      expect(errorOutput).toContain("Run 'codeflow test-command --help' for available options");
    });

    test('should handle generic errors', () => {
      const error = new Error('Generic error') as any;
      error.code = 'UNKNOWN_ERROR';
      error.message = 'Something went wrong';

      CLIErrorHandler.handleCommonError(error, 'test-command');

      const errorOutput = errorLogs.join('');
      expect(errorOutput).toContain('❌ test-command Error');
      expect(errorOutput).toContain('unexpected_error');
      expect(errorOutput).toContain('Check the error details and try again');
      expect(errorOutput).toContain('Check command syntax');
      expect(errorOutput).toContain('Verify all required arguments are provided');
    });

    test('should handle errors without message', () => {
      const error = new Error() as any;
      error.code = 'CUSTOM_ERROR';
      delete error.message;

      CLIErrorHandler.handleCommonError(error, 'test-command');

      const errorOutput = errorLogs.join('');
      expect(errorOutput).toContain('❌ test-command Error');
      expect(errorOutput).toContain('unexpected_error');
    });
  });

  describe('displaySuccess', () => {
    test('should display basic success message', () => {
      CLIErrorHandler.displaySuccess('Operation completed successfully');

      const output = outputLogs.join('');
      expect(output).toContain('✅ Operation completed successfully');
    });

    test('should display success with next steps', () => {
      CLIErrorHandler.displaySuccess('Setup complete', [
        'Run the application',
        'Check the logs',
        'Verify configuration',
      ]);

      const output = outputLogs.join('');
      expect(output).toContain('✅ Setup complete');
      expect(output).toContain('📋 Next Steps:');
      expect(output).toContain('1. Run the application');
      expect(output).toContain('2. Check the logs');
      expect(output).toContain('3. Verify configuration');
    });
  });

  describe('displayProgress', () => {
    test('should display basic progress', () => {
      CLIErrorHandler.displayProgress('Processing files');

      const output = outputLogs.join('');
      expect(output).toContain('⏳ Processing files');
    });

    test('should display progress with counts', () => {
      CLIErrorHandler.displayProgress('Processing files', 5, 10);

      const output = outputLogs.join('');
      expect(output).toContain('⏳ Processing files (5/10)');
    });

    test('should handle zero total', () => {
      CLIErrorHandler.displayProgress('Starting', 0, 0);

      const output = outputLogs.join('');
      expect(output).toContain('⏳ Starting');
    });
  });

  describe('displayWarning', () => {
    test('should display basic warning', () => {
      CLIErrorHandler.displayWarning('This is a warning');

      const output = warnLogs.join('');
      expect(output).toContain('⚠️  This is a warning');
    });

    test('should display warning with suggestions', () => {
      CLIErrorHandler.displayWarning('Deprecated feature', [
        'Use new feature instead',
        'Check documentation',
      ]);

      const output = warnLogs.join('');
      expect(output).toContain('⚠️  Deprecated feature');
      expect(output).toContain('💡 Suggestions:');
      expect(output).toContain('1. Use new feature instead');
      expect(output).toContain('2. Check documentation');
    });
  });

  describe('edge cases', () => {
    test('should handle empty error context', () => {
      const context: ErrorContext = {
        command: '',
        phase: '',
        errorType: '',
        expected: '',
        found: '',
        mitigation: '',
        requiresUserInput: false,
      };

      expect(() => CLIErrorHandler.displayError(context)).not.toThrow();
    });

    test('should handle empty validation result', () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        suggestions: [],
      };

      expect(() => CLIErrorHandler.displayValidationResult(result, 'Test')).not.toThrow();
    });

    test('should handle null error object', () => {
      expect(() => CLIErrorHandler.handleCommonError(null, 'test')).toThrow();
      expect(() => CLIErrorHandler.handleCommonError(undefined, 'test')).toThrow();
    });

    test('should handle error without code', () => {
      const error = new Error('Error without code');

      expect(() => CLIErrorHandler.handleCommonError(error, 'test')).not.toThrow();

      const errorOutput = errorLogs.join('');
      expect(errorOutput).toContain('unexpected_error');
    });
  });
});

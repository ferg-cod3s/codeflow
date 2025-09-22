import { existsSync } from "fs";
import { existsSync } from "fs";
/**
 * Enhanced error handling utilities for CLI commands
 */

export interface ErrorContext {
  command: string;
  phase: string;
  errorType: string;
  expected: string;
  found: string;
  mitigation: string;
  requiresUserInput: boolean;
  suggestions?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class CLIErrorHandler {
  /**
   * Display a structured error with context and suggestions
   */
  static displayError(context: ErrorContext): void {
    console.error(`\n❌ ${context.command} Error`);
    console.error(`┌─ ${context.phase}`);
    console.error(`├─ Type: ${context.errorType}`);
    console.error(`├─ Expected: ${context.expected}`);
    console.error(`├─ Found: ${context.found}`);
    console.error(`└─ Action: ${context.mitigation}`);
    
    if (context.suggestions && context.suggestions.length > 0) {
      console.error('\n💡 Suggestions:');
      context.suggestions.forEach((suggestion, index) => {
        console.error(`   ${index + 1}. ${suggestion}`);
      });
    }
    
    if (context.requiresUserInput) {
      console.error('\n⚠️  This error requires user input to resolve.');
    }
    
    console.error('');
  }

  /**
   * Display a validation result with errors, warnings, and suggestions
   */
  static displayValidationResult(result: ValidationResult, context: string): void {
    if (result.valid) {
      console.log(`✅ ${context} validation passed`);
      return;
    }

    if (result.errors.length > 0) {
      console.error(`\n❌ ${context} Validation Errors:`);
      result.errors.forEach((error, index) => {
        console.error(`   ${index + 1}. ${error}`);
      });
    }

    if (result.warnings.length > 0) {
      console.error(`\n⚠️  ${context} Warnings:`);
      result.warnings.forEach((warning, index) => {
        console.error(`   ${index + 1}. ${warning}`);
      });
    }

    if (result.suggestions.length > 0) {
      console.error(`\n💡 Suggestions:`);
      result.suggestions.forEach((suggestion, index) => {
        console.error(`   ${index + 1}. ${suggestion}`);
      });
    }
  }

  /**
   * Create a standardized error context for common scenarios
   */
  static createErrorContext(
    command: string,
    phase: string,
    errorType: string,
    expected: string,
    found: string,
    mitigation: string,
    options: {
      requiresUserInput?: boolean;
      suggestions?: string[];
    } = {}
  ): ErrorContext {
    return {
      command,
      phase,
      errorType,
      expected,
      found,
      mitigation,
      requiresUserInput: options.requiresUserInput ?? false,
      suggestions: options.suggestions
    };
  }

  /**
   * Validate file/directory existence
   */
  static validatePath(path: string, pathType: 'file' | 'directory'): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!existsSync(path)) {
      result.valid = false;
      result.errors.push(`${pathType} does not exist: ${path}`);
      result.suggestions.push(`Create the ${pathType} or check the path`);
      result.suggestions.push('Use --help for usage information');
      return result;
    }

    return result;
  }

  /**
   * Validate command arguments
   */
  static validateArguments(args: string[], requiredCount: number, commandName: string): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (args.length < requiredCount) {
      result.valid = false;
      result.errors.push(`Insufficient arguments for ${commandName}`);
      result.errors.push(`Expected ${requiredCount} arguments, got ${args.length}`);
      result.suggestions.push(`Use 'codeflow ${commandName} --help' for usage information`);
      return result;
    }

    return result;
  }

  /**
   * Handle common CLI errors with user-friendly messages
   */
  static handleCommonError(error: any, command: string): void {
    const errorMessage = error.message || error.toString();

    // Handle specific error types
    if (error.code === 'ENOENT') {
      const context = this.createErrorContext(
        command,
        'file_system',
        'file_not_found',
        'Valid file or directory path',
        errorMessage,
        'Check that the file or directory exists and the path is correct',
        {
          requiresUserInput: true,
          suggestions: [
            'Verify the path is spelled correctly',
            'Check file/directory permissions',
            'Use absolute paths if relative paths fail'
          ]
        }
      );
      this.displayError(context);
      return;
    }

    if (error.code === 'EACCES') {
      const context = this.createErrorContext(
        command,
        'permissions',
        'access_denied',
        'Read/write access to target path',
        errorMessage,
        'Check file and directory permissions',
        {
          requiresUserInput: true,
          suggestions: [
            'Run with appropriate permissions (sudo if needed)',
            'Check if the file is locked by another process',
            'Verify user has write access to the directory'
          ]
        }
      );
      this.displayError(context);
      return;
    }

    if (error.code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION') {
      const context = this.createErrorContext(
        command,
        'argument_parsing',
        'unknown_option',
        'Valid command line options',
        errorMessage,
        'Check the option name and try again',
        {
          requiresUserInput: true,
          suggestions: [
            `Run 'codeflow ${command} --help' for available options`,
            'Check for typos in option names',
            'Use --force or -f to override safety checks'
          ]
        }
      );
      this.displayError(context);
      return;
    }

    // Generic error handling
    const context = this.createErrorContext(
      command,
      'execution',
      'unexpected_error',
      'Successful command execution',
      errorMessage,
      'Check the error details and try again',
      {
        requiresUserInput: false,
        suggestions: [
          'Check the command syntax',
          'Verify all required arguments are provided',
          'Try running with --verbose for more details'
        ]
      }
    );
    this.displayError(context);
  }

  /**
   * Display success message with optional next steps
   */
  static displaySuccess(message: string, nextSteps?: string[]): void {
    console.log(`\n✅ ${message}`);
    
    if (nextSteps && nextSteps.length > 0) {
      console.log('\n📋 Next Steps:');
      nextSteps.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
      });
    }
  }

  /**
   * Display progress information
   */
  static displayProgress(message: string, current?: number, total?: number): void {
    const progress = total ? ` (${current}/${total})` : '';
    console.log(`⏳ ${message}${progress}`);
  }

  /**
   * Display warning with suggestions
   */
  static displayWarning(message: string, suggestions?: string[]): void {
    console.warn(`⚠️  ${message}`);
    
    if (suggestions && suggestions.length > 0) {
      console.warn('💡 Suggestions:');
      suggestions.forEach((suggestion, index) => {
        console.warn(`   ${index + 1}. ${suggestion}`);
      });
    }
  }
}

export default CLIErrorHandler;

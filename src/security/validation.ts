import { resolve, normalize, isAbsolute, join } from 'node:path';
import { access, stat } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';

/**
 * Security validation utilities for the codeflow system
 * Ensures all file operations are secure and input is properly validated
 */

interface SecurityValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedPath?: string;
}

interface PermissionCheckResult {
  readable: boolean;
  writable: boolean;
  executable: boolean;
  exists: boolean;
}

/**
 * Path traversal attack patterns to detect and prevent
 */
const DANGEROUS_PATH_PATTERNS = [
  /\.\.[/\\]/, // Parent directory traversal
  /^[/\\](?:etc|root|sys|proc|dev|boot|usr\/bin|usr\/sbin)[/\\]/, // System directories
  /[/\\]\.{2,}[/\\]/, // Multiple dots (more than ..)
  /^[a-zA-Z]:[/\\](?:Windows|System|Program)/i, // Windows system dirs
  /\$\([^)]*\)/, // Command substitution
  /`[^`]*`/, // Command substitution (backticks)
  /[;&|`><]/, // Shell metacharacters
  /\0/, // Null byte injection
];

/**
 * Allowed file extensions for agent and command files
 */
const ALLOWED_EXTENSIONS = ['.md'];

/**
 * Allowed directory names for codeflow operations
 */
const ALLOWED_DIRECTORIES = [
  'agent',
  'command',
  'claude-agents',
  'opencode-agents',
  '.codeflow',
  '.claude',
  '.opencode',
  'commands',
  'agents',
];

/**
 * Maximum file size (10MB) to prevent resource exhaustion
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Maximum path length to prevent buffer overflow attacks
 */
const MAX_PATH_LENGTH = 1000;

/**
 * Validate and sanitize a file path for security
 */
export async function validatePath(inputPath: string): Promise<SecurityValidationResult> {
  try {
    // Basic validation
    if (!inputPath || typeof inputPath !== 'string') {
      return {
        isValid: false,
        error: 'Path must be a non-empty string',
      };
    }

    // Check path length
    if (inputPath.length > MAX_PATH_LENGTH) {
      return {
        isValid: false,
        error: `Path too long (max ${MAX_PATH_LENGTH} characters)`,
      };
    }

    // Check for dangerous patterns
    for (const pattern of DANGEROUS_PATH_PATTERNS) {
      if (pattern.test(inputPath)) {
        return {
          isValid: false,
          error: 'Path contains potentially dangerous patterns',
        };
      }
    }

    // Normalize and resolve the path
    let sanitizedPath: string;
    try {
      // First normalize to handle . and .. safely
      sanitizedPath = normalize(inputPath);

      // Then resolve to get absolute path if it's not already
      if (!isAbsolute(sanitizedPath)) {
        sanitizedPath = resolve(process.cwd(), sanitizedPath);
      } else {
        sanitizedPath = resolve(sanitizedPath);
      }
    } catch {
      return {
        isValid: false,
        error: 'Failed to normalize path',
      };
    }

    // Verify the path doesn't escape intended boundaries
    const cwd = process.cwd();
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';

    // Allow paths under current working directory or home directory
    const isUnderCwd = sanitizedPath.startsWith(cwd);
    const isUnderHome = homeDir && sanitizedPath.startsWith(homeDir);

    if (!isUnderCwd && !isUnderHome) {
      // Also allow system temp directories for temporary operations
      const tempDir = process.env.TMPDIR || process.env.TEMP || '/tmp';
      const isUnderTemp = sanitizedPath.startsWith(normalize(tempDir));

      if (!isUnderTemp) {
        return {
          isValid: false,
          error: 'Path is outside allowed directories',
        };
      }
    }

    return {
      isValid: true,
      sanitizedPath,
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Path validation failed: ${error}`,
    };
  }
}

/**
 * Validate that a file extension is allowed
 */
export function validateFileExtension(filePath: string): SecurityValidationResult {
  const extension = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `File extension '${extension}' not allowed. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate directory name for codeflow operations
 */
export function validateDirectoryName(dirName: string): SecurityValidationResult {
  // Check if it's a basic allowed directory name
  if (ALLOWED_DIRECTORIES.includes(dirName)) {
    return { isValid: true };
  }

  // Check if it's a project directory (should be safe user-defined names)
  // Allow alphanumeric, hyphens, underscores, and dots
  if (/^[a-zA-Z0-9._-]+$/.test(dirName) && dirName.length <= 100) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: `Directory name '${dirName}' contains invalid characters or is too long`,
  };
}

/**
 * Check file permissions
 */
export async function checkPermissions(filePath: string): Promise<PermissionCheckResult> {
  const result: PermissionCheckResult = {
    readable: false,
    writable: false,
    executable: false,
    exists: false,
  };

  try {
    await access(filePath);
    result.exists = true;

    // Check individual permissions
    try {
      await access(filePath, fsConstants.R_OK);
      result.readable = true;
    } catch {
      // File not readable
    }

    try {
      await access(filePath, fsConstants.W_OK);
      result.writable = true;
    } catch {
      // File not writable
    }

    try {
      await access(filePath, fsConstants.X_OK);
      result.executable = true;
    } catch {
      // File not executable
    }
  } catch {
    // General file access error
  }

  return result;
}

/**
 * Validate file size to prevent resource exhaustion
 */
export async function validateFileSize(filePath: string): Promise<SecurityValidationResult> {
  try {
    const stats = await stat(filePath);

    if (stats.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File too large (${stats.size} bytes, max ${MAX_FILE_SIZE} bytes)`,
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Failed to check file size: ${error}`,
    };
  }
}

/**
 * Sanitize input strings to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/[&]/g, '&amp;') // Escape ampersands
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[`$]/g, '') // Remove backticks and dollar signs
    .replace(/[\r\n]/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim()
    .substring(0, 1000); // Limit length
}

/**
 * Validate agent/command content for security issues
 */
export function validateContent(content: string): SecurityValidationResult {
  if (typeof content !== 'string') {
    return {
      isValid: false,
      error: 'Content must be a string',
    };
  }

  // Check for potentially dangerous content
  const dangerousPatterns = [
    /eval\s*\(/i, // JavaScript eval
    /exec\s*\(/i, // Code execution functions
    /system\s*\(/i, // System command execution
    /\$\([^)]*\)/, // Command substitution
    /`[^`]*`/, // Backtick command substitution
    /<script[^>]*>/i, // Script tags
    /javascript:/i, // JavaScript URLs
    /data:.*base64/i, // Base64 data URLs
    /vbscript:/i, // VBScript URLs
    /<iframe[^>]*>/i, // Iframe tags
    /<object[^>]*>/i, // Object tags
    /<embed[^>]*>/i, // Embed tags
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      return {
        isValid: false,
        error: 'Content contains potentially dangerous code patterns',
      };
    }
  }

  // Check content length
  if (content.length > 1024 * 1024) {
    // 1MB limit
    return {
      isValid: false,
      error: 'Content too large (max 1MB)',
    };
  }

  return { isValid: true };
}

/**
 * Comprehensive security validation for file operations
 */
export async function validateFileOperation(
  filePath: string,
  operation: 'read' | 'write' | 'delete',
  content?: string
): Promise<SecurityValidationResult> {
  // Validate the path
  const pathValidation = await validatePath(filePath);
  if (!pathValidation.isValid) {
    return pathValidation;
  }

  const sanitizedPath = pathValidation.sanitizedPath!;

  // Validate file extension
  const extValidation = validateFileExtension(sanitizedPath);
  if (!extValidation.isValid) {
    return extValidation;
  }

  // Check permissions for the operation
  const permissions = await checkPermissions(sanitizedPath);

  switch (operation) {
    case 'read':
      if (permissions.exists && !permissions.readable) {
        return {
          isValid: false,
          error: 'No read permission for file',
        };
      }
      break;

    case 'write':
      if (permissions.exists && !permissions.writable) {
        return {
          isValid: false,
          error: 'No write permission for file',
        };
      }
      break;

    case 'delete':
      if (permissions.exists && !permissions.writable) {
        return {
          isValid: false,
          error: 'No delete permission for file',
        };
      }
      break;
  }

  // Validate file size for existing files
  if (permissions.exists) {
    const sizeValidation = await validateFileSize(sanitizedPath);
    if (!sizeValidation.isValid) {
      return sizeValidation;
    }
  }

  // Validate content if provided
  if (content !== undefined) {
    const contentValidation = validateContent(content);
    if (!contentValidation.isValid) {
      return contentValidation;
    }
  }

  return {
    isValid: true,
    sanitizedPath,
  };
}

/**
 * Security audit log entry
 */
interface SecurityAuditEntry {
  timestamp: string;
  operation: string;
  filePath: string;
  result: 'success' | 'failure';
  error?: string;
  userAgent?: string;
}

/**
 * Simple security audit logger (in production, this should go to a proper logging system)
 */
class SecurityAuditLogger {
  private logs: SecurityAuditEntry[] = [];
  private maxLogs = 1000;

  log(entry: Omit<SecurityAuditEntry, 'timestamp'>) {
    const auditEntry: SecurityAuditEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    this.logs.unshift(auditEntry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.splice(this.maxLogs);
    }
  }

  getRecentLogs(limit: number = 100): SecurityAuditEntry[] {
    return this.logs.slice(0, limit);
  }

  getFailures(limit: number = 50): SecurityAuditEntry[] {
    return this.logs.filter((log) => log.result === 'failure').slice(0, limit);
  }

  clear(): void {
    this.logs = [];
  }
}

/**
 * Global security audit logger
 */
export const securityAuditLogger = new SecurityAuditLogger();

/**
 * Set permissions on a file
 */
export async function setFilePermissions(filePath: string, mode: number): Promise<void> {
  const { chmod } = await import('node:fs/promises');
  await chmod(filePath, mode);
}

/**
 * Set permissions on a directory
 */
export async function setDirectoryPermissions(dirPath: string, mode: number): Promise<void> {
  const { chmod } = await import('node:fs/promises');
  await chmod(dirPath, mode);
}

/**
 * Apply permission inheritance for primary/subagent relationship
 */
export async function applyPermissionInheritance(
  basePath: string,
  agentType: 'primary' | 'subagent',
  config: { directories: number; agentFiles: number; commandFiles: number }
): Promise<void> {
  const { readdir, stat } = await import('node:fs/promises');

  // Set directory permissions
  await setDirectoryPermissions(basePath, config.directories);

  // Set permissions for all files in directory
  const entries = await readdir(basePath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(basePath, entry.name);
    const stats = await stat(fullPath);

    if (stats.isDirectory()) {
      await setDirectoryPermissions(fullPath, config.directories);
    } else if (entry.name.endsWith('.md')) {
      // Determine if it's an agent or command file
      const isCommand = entry.name.includes('command') || fullPath.includes('/command/');
      const fileMode = isCommand ? config.commandFiles : config.agentFiles;
      await setFilePermissions(fullPath, fileMode);
    }
  }
}

/**
 * Secure wrapper for file operations that includes validation and logging
 */
export async function secureFileOperation<T>(
  operation: string,
  filePath: string,
  operationType: 'read' | 'write' | 'delete',
  callback: (sanitizedPath: string) => Promise<T>,
  content?: string
): Promise<T> {
  const validation = await validateFileOperation(filePath, operationType, content);

  if (!validation.isValid) {
    securityAuditLogger.log({
      operation,
      filePath,
      result: 'failure',
      error: validation.error,
    });

    throw new Error(`Security validation failed: ${validation.error}`);
  }

  try {
    const result = await callback(validation.sanitizedPath!);

    securityAuditLogger.log({
      operation,
      filePath: validation.sanitizedPath!,
      result: 'success',
    });

    return result;
  } catch (error) {
    securityAuditLogger.log({
      operation,
      filePath: validation.sanitizedPath!,
      result: 'failure',
      error: String(error),
    });

    throw error;
  }
}

export type { SecurityValidationResult, PermissionCheckResult, SecurityAuditEntry };

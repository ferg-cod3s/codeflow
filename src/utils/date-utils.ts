/**
 * Date formatting utilities for Codeflow
 * Ensures consistent date formatting across all platforms and commands
 */





export interface DateFormatOptions {
  /** Include time component */
  includeTime?: boolean;
  /** Use UTC timezone */
  utc?: boolean;
  /** ISO format (default: true) */
  iso?: boolean;
  /** Simple date format (YYYY-MM-DD) */
  simple?: boolean;
}

/**
 * Get current date in proper format for research docs
 * Uses current date/time to avoid placeholder issues
 */
export function getCurrentDateForResearch(options: DateFormatOptions = {}): string {
  const { includeTime = true, utc = false, iso = true, simple = false } = options;
  
  const now = utc ? new Date() : new Date();
  
  if (simple) {
    return now.toISOString().slice(0, 10); // YYYY-MM-DD
  }
  
  if (iso) {
    return includeTime ? now.toISOString() : now.toISOString().slice(0, 10);
  }
  
  // Fallback to ISO format
  return now.toISOString();
}

/**
 * Format date for research document frontmatter
 * Ensures proper ISO format with timezone
 */
export function formatResearchDate(date?: Date): string {
  const targetDate = date || new Date();
  return targetDate.toISOString();
}

/**
 * Get date string for file naming (YYYY-MM-DD format)
 */
export function getDateForFilename(date?: Date): string {
  const targetDate = date || new Date();
  return targetDate.toISOString().slice(0, 10);
}

/**
 * Validate date string format
 */
export function isValidDateString(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && dateStr.match(/^\d{4}-\d{2}-\d{2}/) !== null;
}

/**
 * Parse date from various formats used in the system
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  // Handle YYYY-MM-DD format
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(dateStr + 'T00:00:00Z');
  }
  
  // Handle ISO format
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    return new Date(dateStr);
  }
  
  // Try general parsing
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

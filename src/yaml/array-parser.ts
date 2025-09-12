/**
 * ArrayParser - Proper CSV-style array parsing for YAML frontmatter
 *
 * Handles inline arrays like [tag1, tag2] and YAML list syntax with proper quote support.
 * Fixes the critical bug where commas inside quoted strings were incorrectly split.
 */

export interface ArrayParseResult {
  success: boolean;
  items: string[];
  errors: string[];
}

export class ArrayParser {
  /**
   * Parse inline array syntax: [item1, "item, with, comma", item3]
   * Properly handles quoted strings containing commas
   */
  parseInlineArray(arrayString: string): ArrayParseResult {
    const result: ArrayParseResult = {
      success: true,
      items: [],
      errors: [],
    };

    if (!arrayString || typeof arrayString !== 'string') {
      result.errors.push('Invalid array string provided');
      result.success = false;
      return result;
    }

    // Remove brackets and trim
    const content = arrayString.trim();
    if (!content.startsWith('[') || !content.endsWith(']')) {
      result.errors.push('Array must be enclosed in brackets [ ]');
      result.success = false;
      return result;
    }

    const innerContent = content.slice(1, -1).trim();
    if (innerContent === '') {
      // Empty array
      return result;
    }

    try {
      const parsedItems = this.parseCsvLine(innerContent);
      result.items = parsedItems;
    } catch (error) {
      result.errors.push(`Failed to parse array: ${error}`);
      result.success = false;
    }

    return result;
  }

  /**
   * Parse YAML list syntax:
   * - item1
   * - "item with spaces"
   * - item3
   */
  parseYamlList(lines: string[]): ArrayParseResult {
    const result: ArrayParseResult = {
      success: true,
      items: [],
      errors: [],
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) continue;

      // Check for list item syntax
      let item: string;
      if (line.startsWith('- ')) {
        item = line.slice(2);
      } else if (line.startsWith('-')) {
        // Handle items without space after dash
        item = line.slice(1).trim();
      } else {
        result.errors.push(`Line ${i + 1}: Invalid YAML list syntax. Expected '- item'`);
        result.success = false;
        continue;
      }

      // Remove quotes from quoted items
      if (
        (item.startsWith('"') && item.endsWith('"')) ||
        (item.startsWith("'") && item.endsWith("'"))
      ) {
        item = item.slice(1, -1);
        // Handle escaped quotes inside the quoted string
        item = item.replace(/\\"/g, '"').replace(/\\'/g, "'");
      }

      result.items.push(item);
    }

    return result;
  }

  /**
   * Serialize array to inline format with proper quoting
   */
  serializeInlineArray(items: string[]): string {
    if (!items || items.length === 0) {
      return '[]';
    }

    const serializedItems = items.map((item) => {
      // Quote items that contain commas, spaces, or special characters
      if (item.includes(',') || item.includes(' ') || this.needsQuoting(item)) {
        // Escape backslashes first, then quotes, and wrap in double quotes
        const escaped = item.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return `"${escaped}"`;
      }
      return item;
    });

    return `[${serializedItems.join(', ')}]`;
  }

  /**
   * Serialize array to YAML list format
   */
  serializeYamlList(items: string[]): string {
    if (!items || items.length === 0) {
      return '';
    }

    return (
      items
        .map((item) => {
          // Always quote items with spaces for consistency
          if (this.needsQuoting(item) || item.includes(' ')) {
            const escaped = item.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            return `- "${escaped}"`;
          } else {
            return `- ${item}`;
          }
        })
        .join('\n') + '\n'
    );
  }

  /**
   * Parse a single CSV line with proper quote handling
   * This is the core algorithm that fixes the comma-splitting bug
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (!inQuotes) {
        // Not in quotes
        if (char === '"' || char === "'") {
          // Start of quoted string
          inQuotes = true;
          quoteChar = char;
        } else if (char === ',') {
          // Field separator
          result.push(current.trim());
          current = '';
        } else {
          // Regular character
          current += char;
        }
      } else {
        // Inside quotes
        if (char === '\\' && nextChar === quoteChar) {
          // Backslash-escaped quote
          current += quoteChar;
          i++; // Skip the backslash
        } else if (char === quoteChar) {
          // Check if this quote is escaped or ends the quoted string
          if (nextChar === quoteChar) {
            // Escaped quote (double quote)
            current += char;
            i++; // Skip next quote
          } else {
            // End of quoted string
            inQuotes = false;
            quoteChar = '';
          }
        } else {
          // Regular character inside quotes
          current += char;
        }
      }

      i++;
    }

    // Add the last field if any
    if (current.trim()) {
      result.push(current.trim());
    }

    // Handle unclosed quotes
    if (inQuotes) {
      throw new Error('Unclosed quote in array');
    }

    return result;
  }

  /**
   * Check if a string needs quoting in YAML
   */
  private needsQuoting(str: string): boolean {
    // Quote if contains special characters or YAML keywords
    return (
      str.includes(':') ||
      str.includes('{') ||
      str.includes('}') ||
      str.includes('[') ||
      str.includes(']') ||
      str.includes(',') ||
      str.includes('&') ||
      str.includes('*') ||
      str.includes('#') ||
      str.includes('?') ||
      str.includes('|') ||
      str.includes('-') ||
      str.includes('<') ||
      str.includes('>') ||
      str.includes('=') ||
      str.includes('!') ||
      str.includes('%') ||
      str.includes('@') ||
      str.includes('`') ||
      str.includes('\\') ||
      str.includes('\n') ||
      str.includes('\t') ||
      str.startsWith(' ') ||
      str.endsWith(' ') ||
      str === '' ||
      /^\d/.test(str) || // Starts with digit
      str.toLowerCase() === 'yes' ||
      str.toLowerCase() === 'no' ||
      str.toLowerCase() === 'true' ||
      str.toLowerCase() === 'false' ||
      str.toLowerCase() === 'null' ||
      str.toLowerCase() === 'undefined'
    );
  }
}

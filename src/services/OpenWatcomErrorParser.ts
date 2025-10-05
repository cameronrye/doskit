/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Open Watcom Error Parser
 * Parses compiler output from Open Watcom C/C++ compiler
 */

/**
 * Parsed error or warning from Open Watcom compiler
 */
export interface ParsedMessage {
  /** Message type */
  type: 'error' | 'warning';
  /** Source file name */
  file: string;
  /** Line number (1-based) */
  line: number;
  /** Error/warning code (e.g., 'E1011', 'W201') */
  code: string;
  /** Error/warning message */
  message: string;
  /** Original raw line from compiler output */
  raw: string;
}

/**
 * Result of parsing compiler output
 */
export interface ParseResult {
  /** Parsed error messages */
  errors: ParsedMessage[];
  /** Parsed warning messages */
  warnings: ParsedMessage[];
  /** Unparsed lines (informational messages, etc.) */
  otherLines: string[];
}

/**
 * Service for parsing Open Watcom compiler error and warning messages
 * 
 * Open Watcom error format:
 * - Errors: `FILENAME(LINE): Error! ECODE: MESSAGE`
 * - Warnings: `FILENAME(LINE): Warning! WCODE: MESSAGE`
 * 
 * Examples:
 * - `SOURCE.C(5): Error! E1011: Symbol 'printf' has not been declared`
 * - `SOURCE.C(8): Warning! W201: Unreachable code`
 */
export class OpenWatcomErrorParser {
  /**
   * Regex pattern for Open Watcom error messages
   * Format: FILENAME(LINE): Error! ECODE: MESSAGE
   */
  private static readonly ERROR_PATTERN = /^(.+?)\((\d+)\):\s*Error!\s*([EF]\d+):\s*(.+)$/i;

  /**
   * Regex pattern for Open Watcom warning messages
   * Format: FILENAME(LINE): Warning! WCODE: MESSAGE
   */
  private static readonly WARNING_PATTERN = /^(.+?)\((\d+)\):\s*Warning!\s*([W]\d+):\s*(.+)$/i;

  /**
   * Alternative error pattern without exclamation mark
   * Some versions of Open Watcom may omit the exclamation mark
   */
  private static readonly ERROR_PATTERN_ALT = /^(.+?)\((\d+)\):\s*Error\s+([EF]\d+):\s*(.+)$/i;

  /**
   * Alternative warning pattern without exclamation mark
   */
  private static readonly WARNING_PATTERN_ALT = /^(.+?)\((\d+)\):\s*Warning\s+([W]\d+):\s*(.+)$/i;

  /**
   * Parse Open Watcom compiler output
   *
   * Parses raw compiler output and extracts errors, warnings, and other messages.
   * Supports both standard and alternative Open Watcom error formats.
   *
   * Error format: `FILENAME(LINE): Error! ECODE: MESSAGE`
   * Warning format: `FILENAME(LINE): Warning! WCODE: MESSAGE`
   *
   * @param output - Raw compiler output (stdout/stderr)
   * @returns Parsed errors, warnings, and other lines
   *
   * @example
   * ```typescript
   * const output = `
   *   SOURCE.C(5): Error! E1011: Symbol 'printf' has not been declared
   *   SOURCE.C(8): Warning! W201: Unreachable code
   * `;
   * const result = OpenWatcomErrorParser.parse(output);
   * console.log('Errors:', result.errors.length);
   * console.log('Warnings:', result.warnings.length);
   * ```
   */
  static parse(output: string): ParseResult {
    const errors: ParsedMessage[] = [];
    const warnings: ParsedMessage[] = [];
    const otherLines: string[] = [];

    const lines = output.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        continue;
      }

      // Try to parse as error
      const errorMessage = this.parseError(trimmedLine);
      if (errorMessage) {
        errors.push(errorMessage);
        continue;
      }

      // Try to parse as warning
      const warningMessage = this.parseWarning(trimmedLine);
      if (warningMessage) {
        warnings.push(warningMessage);
        continue;
      }

      // Not an error or warning, save as other line
      otherLines.push(trimmedLine);
    }

    return { errors, warnings, otherLines };
  }

  /**
   * Parse a single line as an error message
   * 
   * @param line - Line to parse
   * @returns Parsed error message or null if not an error
   */
  private static parseError(line: string): ParsedMessage | null {
    // Try primary pattern first
    let match = line.match(this.ERROR_PATTERN);
    
    // Try alternative pattern if primary fails
    if (!match) {
      match = line.match(this.ERROR_PATTERN_ALT);
    }

    if (!match) {
      return null;
    }

    const [, file, lineStr, code, message] = match;
    const lineNumber = parseInt(lineStr, 10);

    // Validate line number
    if (isNaN(lineNumber) || lineNumber < 1) {
      return null;
    }

    return {
      type: 'error',
      file: file.trim(),
      line: lineNumber,
      code: code.trim(),
      message: message.trim(),
      raw: line,
    };
  }

  /**
   * Parse a single line as a warning message
   * 
   * @param line - Line to parse
   * @returns Parsed warning message or null if not a warning
   */
  private static parseWarning(line: string): ParsedMessage | null {
    // Try primary pattern first
    let match = line.match(this.WARNING_PATTERN);
    
    // Try alternative pattern if primary fails
    if (!match) {
      match = line.match(this.WARNING_PATTERN_ALT);
    }

    if (!match) {
      return null;
    }

    const [, file, lineStr, code, message] = match;
    const lineNumber = parseInt(lineStr, 10);

    // Validate line number
    if (isNaN(lineNumber) || lineNumber < 1) {
      return null;
    }

    return {
      type: 'warning',
      file: file.trim(),
      line: lineNumber,
      code: code.trim(),
      message: message.trim(),
      raw: line,
    };
  }

  /**
   * Format parsed messages as human-readable strings
   * 
   * @param messages - Parsed messages to format
   * @returns Array of formatted strings
   */
  static formatMessages(messages: ParsedMessage[]): string[] {
    return messages.map(msg => {
      const typeLabel = msg.type === 'error' ? 'Error' : 'Warning';
      return `${msg.file}(${msg.line}): ${typeLabel} ${msg.code}: ${msg.message}`;
    });
  }

  /**
   * Format parsed messages for display in build panel
   *
   * Formats error/warning messages in a user-friendly format suitable for UI display.
   * Includes line number, message text, and error code.
   *
   * Format: `Line {line}: {message} ({code})`
   *
   * @param messages - Parsed messages to format
   * @returns Array of formatted strings suitable for UI display
   *
   * @example
   * ```typescript
   * const parseResult = OpenWatcomErrorParser.parse(compilerOutput);
   * const errors = OpenWatcomErrorParser.formatForUI(parseResult.errors);
   * errors.forEach(error => console.error(error));
   * // Output: "Line 5: Symbol 'printf' has not been declared (E1011)"
   * ```
   */
  static formatForUI(messages: ParsedMessage[]): string[] {
    return messages.map(msg => {
      return `Line ${msg.line}: ${msg.message} (${msg.code})`;
    });
  }

  /**
   * Check if compiler output contains any errors
   * 
   * @param output - Raw compiler output
   * @returns True if output contains errors
   */
  static hasErrors(output: string): boolean {
    const result = this.parse(output);
    return result.errors.length > 0;
  }

  /**
   * Check if compiler output contains any warnings
   * 
   * @param output - Raw compiler output
   * @returns True if output contains warnings
   */
  static hasWarnings(output: string): boolean {
    const result = this.parse(output);
    return result.warnings.length > 0;
  }

  /**
   * Extract all error messages from compiler output
   * 
   * @param output - Raw compiler output
   * @returns Array of error message strings
   */
  static getErrors(output: string): string[] {
    const result = this.parse(output);
    return this.formatForUI(result.errors);
  }

  /**
   * Extract all warning messages from compiler output
   * 
   * @param output - Raw compiler output
   * @returns Array of warning message strings
   */
  static getWarnings(output: string): string[] {
    const result = this.parse(output);
    return this.formatForUI(result.warnings);
  }
}


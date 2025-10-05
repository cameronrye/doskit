/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Unit tests for OpenWatcomErrorParser
 */

import { describe, it, expect } from 'vitest';
import { OpenWatcomErrorParser } from './OpenWatcomErrorParser';

describe('OpenWatcomErrorParser', () => {
  describe('parse()', () => {
    it('should parse a single error message', () => {
      const output = "SOURCE.C(5): Error! E1011: Symbol 'printf' has not been declared";
      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toHaveLength(0);
      expect(result.errors[0]).toEqual({
        type: 'error',
        file: 'SOURCE.C',
        line: 5,
        code: 'E1011',
        message: "Symbol 'printf' has not been declared",
        raw: output,
      });
    });

    it('should parse a single warning message', () => {
      const output = 'SOURCE.C(8): Warning! W201: Unreachable code';
      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toEqual({
        type: 'warning',
        file: 'SOURCE.C',
        line: 8,
        code: 'W201',
        message: 'Unreachable code',
        raw: output,
      });
    });

    it('should parse multiple errors and warnings', () => {
      const output = `SOURCE.C(5): Error! E1011: Symbol 'printf' has not been declared
SOURCE.C(8): Warning! W201: Unreachable code
SOURCE.C(12): Error! E1000: Unexpected end of file
SOURCE.C(15): Warning! W202: Variable 'x' is not used`;

      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(2);
      expect(result.warnings).toHaveLength(2);
      expect(result.errors[0].line).toBe(5);
      expect(result.errors[1].line).toBe(12);
      expect(result.warnings[0].line).toBe(8);
      expect(result.warnings[1].line).toBe(15);
    });

    it('should handle errors without exclamation mark', () => {
      const output = 'SOURCE.C(5): Error E1011: Symbol not declared';
      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('E1011');
    });

    it('should handle warnings without exclamation mark', () => {
      const output = 'SOURCE.C(8): Warning W201: Unreachable code';
      const result = OpenWatcomErrorParser.parse(output);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('W201');
    });

    it('should handle different file names', () => {
      const output = `MAIN.C(10): Error! E1011: Syntax error
HELPER.C(20): Warning! W201: Unused variable
C:\\TEMP\\TEST.C(30): Error! E1000: Missing semicolon`;

      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(2);
      expect(result.warnings).toHaveLength(1);
      expect(result.errors[0].file).toBe('MAIN.C');
      expect(result.warnings[0].file).toBe('HELPER.C');
      expect(result.errors[1].file).toBe('C:\\TEMP\\TEST.C');
    });

    it('should handle fatal errors (F-codes)', () => {
      const output = 'SOURCE.C(1): Error! F1001: Fatal error - out of memory';
      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('F1001');
      expect(result.errors[0].type).toBe('error');
    });

    it('should skip empty lines', () => {
      const output = `
SOURCE.C(5): Error! E1011: Syntax error

SOURCE.C(8): Warning! W201: Unreachable code

`;

      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
    });

    it('should collect non-error/warning lines as otherLines', () => {
      const output = `Open Watcom C Compiler Version 1.9
Compiling SOURCE.C...
SOURCE.C(5): Error! E1011: Syntax error
Compilation failed
1 error(s), 0 warning(s)`;

      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(1);
      expect(result.otherLines).toHaveLength(4);
      expect(result.otherLines).toContain('Open Watcom C Compiler Version 1.9');
      expect(result.otherLines).toContain('Compilation failed');
    });

    it('should handle malformed lines gracefully', () => {
      const output = `SOURCE.C(5): Error! E1011: Syntax error
This is not a valid error line
SOURCE.C: Missing line number
(10): Error! E1000: Missing filename
SOURCE.C(abc): Error! E1000: Invalid line number
SOURCE.C(8): Warning! W201: Valid warning`;

      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.otherLines.length).toBeGreaterThan(0);
    });

    it('should handle case-insensitive error/warning keywords', () => {
      const output = `SOURCE.C(5): error! E1011: Syntax error
SOURCE.C(8): WARNING! W201: Unreachable code`;

      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
    });

    it('should handle messages with special characters', () => {
      const output = `SOURCE.C(5): Error! E1011: Expected ';' after statement
SOURCE.C(8): Warning! W201: Variable 'x_123' is not used`;

      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.errors[0].message).toContain("';'");
      expect(result.warnings[0].message).toContain('x_123');
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(500);
      const output = `SOURCE.C(5): Error! E1011: ${longMessage}`;
      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe(longMessage);
    });

    it('should handle line numbers at boundaries', () => {
      const output = `SOURCE.C(1): Error! E1011: Error on first line
SOURCE.C(99999): Warning! W201: Warning on large line number`;

      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.errors[0].line).toBe(1);
      expect(result.warnings[0].line).toBe(99999);
    });
  });

  describe('formatMessages()', () => {
    it('should format error messages', () => {
      const output = "SOURCE.C(5): Error! E1011: Symbol 'printf' has not been declared";
      const result = OpenWatcomErrorParser.parse(output);
      const formatted = OpenWatcomErrorParser.formatMessages(result.errors);

      expect(formatted).toHaveLength(1);
      expect(formatted[0]).toBe("SOURCE.C(5): Error E1011: Symbol 'printf' has not been declared");
    });

    it('should format warning messages', () => {
      const output = 'SOURCE.C(8): Warning! W201: Unreachable code';
      const result = OpenWatcomErrorParser.parse(output);
      const formatted = OpenWatcomErrorParser.formatMessages(result.warnings);

      expect(formatted).toHaveLength(1);
      expect(formatted[0]).toBe('SOURCE.C(8): Warning W201: Unreachable code');
    });
  });

  describe('formatForUI()', () => {
    it('should format messages for UI display', () => {
      const output = "SOURCE.C(5): Error! E1011: Symbol 'printf' has not been declared";
      const result = OpenWatcomErrorParser.parse(output);
      const formatted = OpenWatcomErrorParser.formatForUI(result.errors);

      expect(formatted).toHaveLength(1);
      expect(formatted[0]).toBe("Line 5: Symbol 'printf' has not been declared (E1011)");
    });
  });

  describe('hasErrors()', () => {
    it('should return true when output contains errors', () => {
      const output = 'SOURCE.C(5): Error! E1011: Syntax error';
      expect(OpenWatcomErrorParser.hasErrors(output)).toBe(true);
    });

    it('should return false when output contains no errors', () => {
      const output = 'SOURCE.C(8): Warning! W201: Unreachable code';
      expect(OpenWatcomErrorParser.hasErrors(output)).toBe(false);
    });

    it('should return false for empty output', () => {
      expect(OpenWatcomErrorParser.hasErrors('')).toBe(false);
    });
  });

  describe('hasWarnings()', () => {
    it('should return true when output contains warnings', () => {
      const output = 'SOURCE.C(8): Warning! W201: Unreachable code';
      expect(OpenWatcomErrorParser.hasWarnings(output)).toBe(true);
    });

    it('should return false when output contains no warnings', () => {
      const output = 'SOURCE.C(5): Error! E1011: Syntax error';
      expect(OpenWatcomErrorParser.hasWarnings(output)).toBe(false);
    });

    it('should return false for empty output', () => {
      expect(OpenWatcomErrorParser.hasWarnings('')).toBe(false);
    });
  });

  describe('getErrors()', () => {
    it('should extract and format error messages', () => {
      const output = `SOURCE.C(5): Error! E1011: Syntax error
SOURCE.C(8): Warning! W201: Unreachable code
SOURCE.C(12): Error! E1000: Missing semicolon`;

      const errors = OpenWatcomErrorParser.getErrors(output);

      expect(errors).toHaveLength(2);
      expect(errors[0]).toBe('Line 5: Syntax error (E1011)');
      expect(errors[1]).toBe('Line 12: Missing semicolon (E1000)');
    });

    it('should return empty array when no errors', () => {
      const output = 'SOURCE.C(8): Warning! W201: Unreachable code';
      const errors = OpenWatcomErrorParser.getErrors(output);

      expect(errors).toHaveLength(0);
    });
  });

  describe('getWarnings()', () => {
    it('should extract and format warning messages', () => {
      const output = `SOURCE.C(5): Error! E1011: Syntax error
SOURCE.C(8): Warning! W201: Unreachable code
SOURCE.C(15): Warning! W202: Variable not used`;

      const warnings = OpenWatcomErrorParser.getWarnings(output);

      expect(warnings).toHaveLength(2);
      expect(warnings[0]).toBe('Line 8: Unreachable code (W201)');
      expect(warnings[1]).toBe('Line 15: Variable not used (W202)');
    });

    it('should return empty array when no warnings', () => {
      const output = 'SOURCE.C(5): Error! E1011: Syntax error';
      const warnings = OpenWatcomErrorParser.getWarnings(output);

      expect(warnings).toHaveLength(0);
    });
  });

  describe('Edge Cases - Additional Coverage', () => {
    it('should handle errors with multiple colons in message', () => {
      const output = `SOURCE.C(5): Error! E1011: Expected ':' after '?' in ternary operator`;
      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe("Expected ':' after '?' in ternary operator");
    });

    it('should handle file paths with spaces', () => {
      const output = `C:\\My Documents\\source file.c(10): Error! E1011: Syntax error`;
      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].file).toBe('C:\\My Documents\\source file.c');
    });

    it('should handle deeply nested file paths', () => {
      const deepPath = 'C:\\very\\long\\path\\to\\nested\\directories\\source.c';
      const output = `${deepPath}(42): Error! E1011: Syntax error`;
      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].file).toBe(deepPath);
      expect(result.errors[0].line).toBe(42);
    });

    it('should handle mixed line endings (CRLF and LF)', () => {
      const output = `SOURCE.C(5): Error! E1011: Error 1\r\nSOURCE.C(8): Warning! W201: Warning 1\nSOURCE.C(10): Error! E1000: Error 2`;
      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(2);
      expect(result.warnings).toHaveLength(1);
    });

    it('should handle errors with leading/trailing whitespace', () => {
      const output = `  SOURCE.C(5): Error! E1011: Syntax error  \n\t\tSOURCE.C(8): Warning! W201: Unreachable code\t`;
      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
    });

    it('should handle very large output with many errors', () => {
      let output = '';
      const numErrors = 1000;

      for (let i = 1; i <= numErrors; i++) {
        output += `SOURCE.C(${i}): Error! E1011: Error ${i}\n`;
      }

      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(numErrors);
      expect(result.errors[0].line).toBe(1);
      expect(result.errors[numErrors - 1].line).toBe(numErrors);
    });

    it('should handle errors with numeric-only messages', () => {
      const output = `SOURCE.C(5): Error! E1011: 12345`;
      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('12345');
    });

    it('should handle errors with empty messages', () => {
      const output = `SOURCE.C(5): Error! E1011: `;
      const result = OpenWatcomErrorParser.parse(output);

      // Should not parse as valid error due to empty message
      expect(result.errors).toHaveLength(0);
    });

    it('should handle linker errors (different format)', () => {
      // Linker errors might have different format
      const output = `WLINK: Error! L1001: Undefined symbol 'main'`;
      const result = OpenWatcomErrorParser.parse(output);

      // This format doesn't match our pattern, should go to otherLines
      expect(result.errors).toHaveLength(0);
      expect(result.otherLines).toContain(`WLINK: Error! L1001: Undefined symbol 'main'`);
    });

    it('should handle preprocessor errors', () => {
      const output = `SOURCE.C(5): Error! E1011: Preprocessor directive expected`;
      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Preprocessor');
    });

    it('should handle errors with backslashes in messages', () => {
      const output = `SOURCE.C(5): Error! E1011: Cannot open include file 'C:\\WATCOM\\H\\stdio.h'`;
      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('C:\\WATCOM\\H\\stdio.h');
    });

    it('should handle errors with forward slashes in paths', () => {
      const output = `C:/projects/source.c(10): Error! E1011: Syntax error`;
      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].file).toBe('C:/projects/source.c');
    });

    it('should handle errors with relative paths', () => {
      const output = `./src/main.c(15): Error! E1011: Syntax error
../lib/helper.c(20): Warning! W201: Unreachable code`;
      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.errors[0].file).toBe('./src/main.c');
      expect(result.warnings[0].file).toBe('../lib/helper.c');
    });

    it('should handle errors with DOS 8.3 filenames', () => {
      const output = `PROGRA~1.C(5): Error! E1011: Syntax error`;
      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].file).toBe('PROGRA~1.C');
    });

    it('should handle multiple consecutive errors on different lines', () => {
      const output = `SOURCE.C(5): Error! E1011: Error 1
SOURCE.C(6): Error! E1012: Error 2
SOURCE.C(7): Error! E1013: Error 3
SOURCE.C(8): Error! E1014: Error 4
SOURCE.C(9): Error! E1015: Error 5`;

      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(5);
      for (let i = 0; i < 5; i++) {
        expect(result.errors[i].line).toBe(5 + i);
      }
    });

    it('should preserve original raw line in parsed messages', () => {
      const rawLine = `SOURCE.C(5): Error! E1011: Symbol 'printf' has not been declared`;
      const result = OpenWatcomErrorParser.parse(rawLine);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].raw).toBe(rawLine);
    });

    it('should handle errors with parentheses in messages', () => {
      const output = `SOURCE.C(5): Error! E1011: Expected ')' after '(' in function call`;
      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe("Expected ')' after '(' in function call");
    });

    it('should handle errors with brackets in messages', () => {
      const output = `SOURCE.C(5): Error! E1011: Expected ']' after '[' in array subscript`;
      const result = OpenWatcomErrorParser.parse(output);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe("Expected ']' after '[' in array subscript");
    });
  });
});


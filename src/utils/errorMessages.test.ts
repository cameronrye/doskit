/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Error Message Enhancement Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  enhanceErrorMessage,
  formatEnhancedError,
  extractErrorLocation,
  groupErrorsByLocation,
  getErrorSummary,
  isCriticalError,
} from './errorMessages';

describe('Error Message Utilities', () => {
  describe('enhanceErrorMessage', () => {
    it('should enhance main function not found error', () => {
      const error = "test.c:1: error: 'main' function not found";
      const enhanced = enhanceErrorMessage(error);

      expect(enhanced.original).toBe(error);
      expect(enhanced.severity).toBe('error');
      expect(enhanced.explanation).toContain('main() function');
      expect(enhanced.suggestion).toContain('int main()');
    });

    it('should enhance implicit declaration error', () => {
      const error = "test.c:5: warning: implicit declaration of function 'printf'";
      const enhanced = enhanceErrorMessage(error);

      expect(enhanced.original).toBe(error);
      expect(enhanced.severity).toBe('warning');
      expect(enhanced.explanation).toContain('declared');
      expect(enhanced.suggestion).toContain('#include');
    });

    it('should enhance missing semicolon error', () => {
      const error = "test.c:10: error: expected ';'";
      const enhanced = enhanceErrorMessage(error);

      expect(enhanced.original).toBe(error);
      expect(enhanced.severity).toBe('error');
      expect(enhanced.explanation).toContain('semicolon');
      expect(enhanced.suggestion).toContain(';');
    });

    it('should handle unknown error patterns', () => {
      const error = 'test.c:1: error: some unknown error';
      const enhanced = enhanceErrorMessage(error);

      expect(enhanced.original).toBe(error);
      expect(enhanced.severity).toBe('error');
      expect(enhanced.explanation).toBeUndefined();
      expect(enhanced.suggestion).toBeUndefined();
    });

    it('should detect warning severity', () => {
      const warning = 'test.c:1: warning: unused variable';
      const enhanced = enhanceErrorMessage(warning);

      expect(enhanced.severity).toBe('warning');
    });

    it('should detect info severity', () => {
      const info = 'Compilation started...';
      const enhanced = enhanceErrorMessage(info);

      expect(enhanced.severity).toBe('info');
    });
  });

  describe('formatEnhancedError', () => {
    it('should format error with all fields', () => {
      const enhanced = {
        original: 'test.c:1: error: test error',
        explanation: 'This is an explanation',
        suggestion: 'This is a suggestion',
        docLink: 'https://example.com',
        severity: 'error' as const,
      };

      const formatted = formatEnhancedError(enhanced);

      expect(formatted).toContain('test.c:1: error: test error');
      expect(formatted).toContain('💡 This is an explanation');
      expect(formatted).toContain('✨ Suggestion: This is a suggestion');
      expect(formatted).toContain('📚 Learn more: https://example.com');
    });

    it('should format error with only original message', () => {
      const enhanced = {
        original: 'test.c:1: error: test error',
        severity: 'error' as const,
      };

      const formatted = formatEnhancedError(enhanced);

      expect(formatted).toBe('test.c:1: error: test error');
    });
  });

  describe('extractErrorLocation', () => {
    it('should extract GCC-style location with column', () => {
      const error = 'test.c:10:5: error: test error';
      const location = extractErrorLocation(error);

      expect(location.file).toBe('test.c');
      expect(location.line).toBe(10);
      expect(location.column).toBe(5);
    });

    it('should extract simple location without column', () => {
      const error = 'test.c:10: error: test error';
      const location = extractErrorLocation(error);

      expect(location.file).toBe('test.c');
      expect(location.line).toBe(10);
      expect(location.column).toBeUndefined();
    });

    it('should handle errors without location', () => {
      const error = 'error: general compilation error';
      const location = extractErrorLocation(error);

      expect(location.file).toBeUndefined();
      expect(location.line).toBeUndefined();
      expect(location.column).toBeUndefined();
    });
  });

  describe('groupErrorsByLocation', () => {
    it('should group errors by file and line', () => {
      const errors = [
        'test.c:10: error: first error',
        'test.c:10: error: second error',
        'test.c:20: error: third error',
        'other.c:5: error: fourth error',
      ];

      const grouped = groupErrorsByLocation(errors);

      expect(grouped.get('test.c:10')).toHaveLength(2);
      expect(grouped.get('test.c:20')).toHaveLength(1);
      expect(grouped.get('other.c:5')).toHaveLength(1);
    });

    it('should group errors without location as general', () => {
      const errors = [
        'error: general error 1',
        'error: general error 2',
        'test.c:10: error: specific error',
      ];

      const grouped = groupErrorsByLocation(errors);

      expect(grouped.get('general')).toHaveLength(2);
      expect(grouped.get('test.c:10')).toHaveLength(1);
    });
  });

  describe('getErrorSummary', () => {
    it('should summarize errors and warnings', () => {
      const errors = ['error 1', 'error 2'];
      const warnings = ['warning 1', 'warning 2', 'warning 3'];

      const summary = getErrorSummary(errors, warnings);

      expect(summary).toBe('2 errors, 3 warnings');
    });

    it('should handle only errors', () => {
      const errors = ['error 1'];
      const warnings: string[] = [];

      const summary = getErrorSummary(errors, warnings);

      expect(summary).toBe('1 error');
    });

    it('should handle only warnings', () => {
      const errors: string[] = [];
      const warnings = ['warning 1', 'warning 2'];

      const summary = getErrorSummary(errors, warnings);

      expect(summary).toBe('2 warnings');
    });

    it('should handle no errors or warnings', () => {
      const errors: string[] = [];
      const warnings: string[] = [];

      const summary = getErrorSummary(errors, warnings);

      expect(summary).toBe('✅ No errors or warnings');
    });

    it('should use singular form for single error', () => {
      const errors = ['error 1'];
      const warnings = ['warning 1'];

      const summary = getErrorSummary(errors, warnings);

      expect(summary).toBe('1 error, 1 warning');
    });
  });

  describe('isCriticalError', () => {
    it('should identify main function not found as critical', () => {
      const error = "test.c:1: error: 'main' function not found";
      expect(isCriticalError(error)).toBe(true);
    });

    it('should identify missing semicolon as critical', () => {
      const error = "test.c:10: error: expected ';'";
      expect(isCriticalError(error)).toBe(true);
    });

    it('should identify missing brace as critical', () => {
      const error = "test.c:20: error: expected '}'";
      expect(isCriticalError(error)).toBe(true);
    });

    it('should identify mismatched braces as critical', () => {
      const error = 'test.c:1: error: mismatched braces';
      expect(isCriticalError(error)).toBe(true);
    });

    it('should identify undeclared identifier as critical', () => {
      const error = "test.c:5: error: undeclared identifier 'foo'";
      expect(isCriticalError(error)).toBe(true);
    });

    it('should not identify warnings as critical', () => {
      const warning = "test.c:5: warning: implicit declaration of function 'printf'";
      expect(isCriticalError(warning)).toBe(false);
    });

    it('should not identify non-critical errors as critical', () => {
      const error = 'test.c:1: error: some other error';
      expect(isCriticalError(error)).toBe(false);
    });
  });
});


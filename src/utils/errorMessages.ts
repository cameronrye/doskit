/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Error Message Enhancement Utilities
 * Provides helpful explanations and suggestions for common compiler errors
 */

export interface EnhancedError {
  /** Original error message */
  original: string;
  /** Enhanced explanation */
  explanation?: string;
  /** Suggested fix */
  suggestion?: string;
  /** Documentation link */
  docLink?: string;
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
}

/**
 * Common C compiler error patterns and their explanations
 */
const errorPatterns: Array<{
  pattern: RegExp;
  explanation: string;
  suggestion: string;
  docLink?: string;
}> = [
  {
    pattern: /'main' function not found/i,
    explanation: 'Every C program must have a main() function as the entry point.',
    suggestion: 'Add "int main() { ... }" to your program.',
    docLink: 'https://en.cppreference.com/w/c/language/main_function',
  },
  {
    pattern: /implicit declaration of function '(\w+)'/i,
    explanation: 'The function is being used without being declared first.',
    suggestion: 'Add the appropriate #include directive at the top of your file (e.g., #include <stdio.h> for printf).',
    docLink: 'https://en.cppreference.com/w/c/header',
  },
  {
    pattern: /expected ';'/i,
    explanation: 'A semicolon is missing at the end of a statement.',
    suggestion: 'Add a semicolon (;) at the end of the previous line.',
  },
  {
    pattern: /expected '}'/i,
    explanation: 'A closing brace is missing.',
    suggestion: 'Check that every opening brace { has a matching closing brace }.',
  },
  {
    pattern: /mismatched braces/i,
    explanation: 'The number of opening and closing braces does not match.',
    suggestion: 'Count your braces - every { needs a matching }.',
  },
  {
    pattern: /mismatched parentheses/i,
    explanation: 'The number of opening and closing parentheses does not match.',
    suggestion: 'Count your parentheses - every ( needs a matching ).',
  },
  {
    pattern: /undeclared identifier '(\w+)'/i,
    explanation: 'A variable or function is being used without being declared.',
    suggestion: 'Declare the variable before using it, or check for typos in the name.',
  },
  {
    pattern: /incompatible types/i,
    explanation: 'You are trying to assign or compare values of incompatible types.',
    suggestion: 'Check that variable types match, or use type casting if appropriate.',
  },
  {
    pattern: /too (few|many) arguments/i,
    explanation: 'A function is being called with the wrong number of arguments.',
    suggestion: 'Check the function declaration and provide the correct number of arguments.',
  },
  {
    pattern: /statement may be missing semicolon/i,
    explanation: 'A statement might be missing a semicolon.',
    suggestion: 'Add a semicolon (;) at the end of the statement.',
  },
];

/**
 * Enhance an error message with helpful explanation and suggestions
 */
export function enhanceErrorMessage(errorMessage: string): EnhancedError {
  const severity = determineErrorSeverity(errorMessage);
  
  // Try to match against known error patterns
  for (const pattern of errorPatterns) {
    if (pattern.pattern.test(errorMessage)) {
      return {
        original: errorMessage,
        explanation: pattern.explanation,
        suggestion: pattern.suggestion,
        docLink: pattern.docLink,
        severity,
      };
    }
  }

  // No specific pattern matched, return original message
  return {
    original: errorMessage,
    severity,
  };
}

/**
 * Determine error severity from message
 */
function determineErrorSeverity(message: string): 'error' | 'warning' | 'info' {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('error:')) {
    return 'error';
  }
  if (lowerMessage.includes('warning:')) {
    return 'warning';
  }
  return 'info';
}

/**
 * Format an enhanced error for display
 */
export function formatEnhancedError(enhanced: EnhancedError): string {
  let formatted = enhanced.original;
  
  if (enhanced.explanation) {
    formatted += `\n💡 ${enhanced.explanation}`;
  }
  
  if (enhanced.suggestion) {
    formatted += `\n✨ Suggestion: ${enhanced.suggestion}`;
  }
  
  if (enhanced.docLink) {
    formatted += `\n📚 Learn more: ${enhanced.docLink}`;
  }
  
  return formatted;
}

/**
 * Extract file location from error message
 */
export function extractErrorLocation(errorMessage: string): {
  file?: string;
  line?: number;
  column?: number;
} {
  // Try to match GCC-style error format: file:line:column: error: message
  const gccMatch = errorMessage.match(/^(.+?):(\d+):(\d+):/);
  if (gccMatch) {
    return {
      file: gccMatch[1],
      line: parseInt(gccMatch[2]),
      column: parseInt(gccMatch[3]),
    };
  }

  // Try to match simpler format: file:line: error: message
  const simpleMatch = errorMessage.match(/^(.+?):(\d+):/);
  if (simpleMatch) {
    return {
      file: simpleMatch[1],
      line: parseInt(simpleMatch[2]),
    };
  }

  return {};
}

/**
 * Group errors by file and line
 */
export function groupErrorsByLocation(errors: string[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  
  for (const error of errors) {
    const location = extractErrorLocation(error);
    const key = location.file && location.line 
      ? `${location.file}:${location.line}`
      : 'general';
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(error);
  }
  
  return grouped;
}

/**
 * Get a user-friendly error summary
 */
export function getErrorSummary(errors: string[], warnings: string[]): string {
  const errorCount = errors.length;
  const warningCount = warnings.length;
  
  if (errorCount === 0 && warningCount === 0) {
    return '✅ No errors or warnings';
  }
  
  const parts: string[] = [];
  
  if (errorCount > 0) {
    parts.push(`${errorCount} error${errorCount !== 1 ? 's' : ''}`);
  }
  
  if (warningCount > 0) {
    parts.push(`${warningCount} warning${warningCount !== 1 ? 's' : ''}`);
  }
  
  return parts.join(', ');
}

/**
 * Check if an error is critical (prevents compilation)
 */
export function isCriticalError(errorMessage: string): boolean {
  const criticalPatterns = [
    /'main' function not found/i,
    /expected ';'/i,
    /expected '}'/i,
    /mismatched braces/i,
    /undeclared identifier/i,
  ];
  
  return criticalPatterns.some(pattern => pattern.test(errorMessage));
}


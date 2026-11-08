/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Centralized Logger Utility
 * Provides consistent logging across the application with environment-aware behavior
 */

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

/**
 * Configuration of the Logger
 */
interface LoggerConfig {
  level: LogLevel;
  enableTimestamps: boolean;
}

/**
 * Logger class for centralized logging with environment-aware behavior: every level,
 * with timestamps, in development; warnings and errors in production
 *
 * Code logs through the {@link logger} instance. The class is exported so that the API
 * documentation (`npm run docs`) can describe the logger's methods.
 *
 * @public
 */
export class Logger {
  private readonly config: LoggerConfig = {
    level: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN,
    enableTimestamps: import.meta.env.DEV,
  };

  /**
   * Format log message with optional timestamp
   * @param level - The log level string (DEBUG, INFO, WARN, ERROR)
   * @param context - The context/module name
   * @param message - The log message
   * @returns Formatted log message string
   * @private
   */
  private formatMessage(level: string, context: string, message: string): string {
    const parts: string[] = [];

    if (this.config.enableTimestamps) {
      const timestamp = new Date().toISOString();
      parts.push(`[${timestamp}]`);
    }

    parts.push(`[${level}]`);
    parts.push(`[${context}]`);
    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Log debug message (only in development)
   * @param context - The context/module name
   * @param message - The log message
   * @param args - Additional arguments to log
   */
  debug(context: string, message: string, ...args: unknown[]): void {
    if (this.config.level <= LogLevel.DEBUG) {
      const formatted = this.formatMessage('DEBUG', context, message);
      console.debug(formatted, ...args);
    }
  }

  /**
   * Log info message
   * @param context - The context/module name
   * @param message - The log message
   * @param args - Additional arguments to log
   */
  info(context: string, message: string, ...args: unknown[]): void {
    if (this.config.level <= LogLevel.INFO) {
      const formatted = this.formatMessage('INFO', context, message);
      console.info(formatted, ...args);
    }
  }

  /**
   * Log warning message
   * @param context - The context/module name
   * @param message - The log message
   * @param args - Additional arguments to log
   */
  warn(context: string, message: string, ...args: unknown[]): void {
    if (this.config.level <= LogLevel.WARN) {
      const formatted = this.formatMessage('WARN', context, message);
      console.warn(formatted, ...args);
    }
  }

  /**
   * Log error message
   * @param context - The context/module name
   * @param message - The log message
   * @param args - Additional arguments to log
   */
  error(context: string, message: string, ...args: unknown[]): void {
    if (this.config.level <= LogLevel.ERROR) {
      const formatted = this.formatMessage('ERROR', context, message);
      console.error(formatted, ...args);
    }
  }
}

/**
 * Singleton logger instance
 * Use this for general logging throughout the application
 */
export const logger = new Logger();

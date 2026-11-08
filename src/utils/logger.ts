/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Centralized Logger Utility
 * Provides consistent logging across the application with environment-aware behavior
 */

export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

/**
 * Configuration options for the Logger
 */
export interface LoggerConfig {
  level: LogLevel;
  enableTimestamps: boolean;
  enableColors: boolean;
  prefix?: string;
}

/**
 * Logger class for centralized logging with environment-aware behavior
 */
export class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN,
      enableTimestamps: import.meta.env.DEV,
      enableColors: true,
      ...config,
    };
  }

  /**
   * Update logger configuration
   * @param config - Partial configuration object to merge with current config
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current log level
   * @returns The current log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Set log level
   * @param level - The log level to set (DEBUG, INFO, WARN, ERROR, NONE)
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Format log message with optional timestamp and prefix
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

    if (this.config.prefix) {
      parts.push(`[${this.config.prefix}]`);
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

// Export default logger
export default logger;

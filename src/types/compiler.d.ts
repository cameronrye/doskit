/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * TypeScript type definitions for DOS compiler functionality
 */

/**
 * Result of a compilation operation
 */
export interface CompileResult {
  /** Whether compilation was successful */
  success: boolean;
  /** Compiler error messages */
  errors: string[];
  /** Compiler warning messages */
  warnings: string[];
  /** Path to the output file */
  outputFile: string;
  /** Compiled executable binary (if successful) */
  executable?: Uint8Array;
  /** Raw compiler output */
  rawOutput: string;
  /** Compilation time in milliseconds */
  compilationTime?: number;
}

/**
 * Compiler options for customizing compilation
 */
export interface CompilerOptions {
  /** Optimization level */
  optimization: 'O0' | 'O1' | 'O2' | 'O3' | 'Os';
  /** Enable all warnings */
  warnings: boolean;
  /** Include debug information */
  debug: boolean;
  /** Additional custom compiler flags */
  customFlags?: string[];
  /** Output format (exe, com) */
  outputFormat?: 'exe' | 'com';
}

/**
 * Project file entry
 */
export interface ProjectFile {
  /** File name */
  name: string;
  /** File content */
  content: string;
  /** File type/language */
  language: 'c' | 'cpp' | 'asm' | 'h';
}

/**
 * DOS development project
 */
export interface Project {
  /** Project name */
  name: string;
  /** Project description */
  description?: string;
  /** Project files */
  files: ProjectFile[];
  /** Main source file to compile */
  mainFile: string;
  /** Build command template */
  buildCommand: string;
  /** Compiler options */
  compilerOptions?: CompilerOptions;
  /** Created timestamp */
  createdAt?: Date;
  /** Last modified timestamp */
  modifiedAt?: Date;
}

/**
 * Project template for creating new projects
 */
export interface ProjectTemplate {
  /** Template ID */
  id: string;
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Template category */
  category: 'beginner' | 'intermediate' | 'advanced' | 'game' | 'utility';
  /** Files to create */
  files: ProjectFile[];
  /** Main file name */
  mainFile: string;
  /** Build command */
  buildCommand: string;
  /** Compiler options */
  compilerOptions?: CompilerOptions;
}

/**
 * Build status
 */
export type BuildStatus = 'idle' | 'building' | 'success' | 'error' | 'running';

/**
 * Compiler configuration
 */
export interface CompilerConfig {
  /** Compiler name */
  name: string;
  /** Base path in DOS filesystem */
  basePath: string;
  /** Binary path */
  binPath: string;
  /** Include path */
  includePath: string;
  /** Library path */
  libPath: string;
  /** Compiler executable name */
  compiler: string;
  /** Default compiler flags */
  defaultFlags: string[];
}

/**
 * Build output message
 */
export interface BuildMessage {
  /** Message type */
  type: 'info' | 'warning' | 'error' | 'success';
  /** Message text */
  message: string;
  /** File name (if applicable) */
  file?: string;
  /** Line number (if applicable) */
  line?: number;
  /** Column number (if applicable) */
  column?: number;
  /** Timestamp */
  timestamp: Date;
}


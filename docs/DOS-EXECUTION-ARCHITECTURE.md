# DOS Command Execution Architecture

**Date**: 2025-10-05
**Status**: ✅ **IMPLEMENTED** - Architecture fully implemented and tested
**Version**: 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Components](#architecture-components)
3. [Interface Definitions](#interface-definitions)
4. [Batch File Generation](#batch-file-generation)
5. [Sequence Diagrams](#sequence-diagrams)
6. [Error Handling Strategy](#error-handling-strategy)
7. [Implementation Guidelines](#implementation-guidelines)

---

## Overview

This document defines the architecture for executing DOS commands within the js-dos emulator to enable real Open Watcom C/C++ compilation in DosKit.

### Design Goals

1. **Reliability**: Robust command execution with proper error handling
2. **Observability**: Capture all output for debugging and error reporting
3. **Flexibility**: Support various compilation scenarios (single file, multi-file, etc.)
4. **Maintainability**: Clean separation of concerns with well-defined interfaces
5. **Performance**: Efficient execution with appropriate timeouts

### Key Challenges

- No direct `exec()` method in js-dos CommandInterface
- Output parsing complexity (stdout/stderr mixed)
- Timing and synchronization issues
- Error detection without exit codes

### Solution Approach

**Batch File Generation + Keystroke Simulation**

1. Generate DOS batch files for compilation workflows
2. Write batch files to DOS filesystem
3. Execute batch files via keystroke simulation
4. Capture output via `onStdout` event handler
5. Parse output for success/failure indicators

---

## Architecture Components

### Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│         OpenWatcomCompilerService                       │
│  • Orchestrates compilation workflow                    │
│  • Manages progress tracking                            │
│  • Handles cancellation                                 │
└────────────┬──────────────────┬─────────────────────────┘
             │                  │
             ▼                  ▼
┌────────────────────┐  ┌──────────────────────────────┐
│ DosCommandExecutor │  │   BatchFileGenerator         │
│  • Execute commands│  │   • Generate compile batch   │
│  • Capture output  │  │   • Generate link batch      │
│  • Handle timeouts │  │   • Environment setup        │
│  • Detect errors   │  │   • Error handling           │
└────────────┬───────┘  └──────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│              js-dos CommandInterface                     │
│  • simulateKeyPress() - Type commands                    │
│  • events().onStdout() - Capture output                  │
└─────────────────────────────────────────────────────────┘
```

### 1. DosCommandExecutor

**Purpose**: Execute DOS commands via keystroke simulation and capture output.

**Responsibilities**:
- Type commands character-by-character
- Press Enter to execute
- Capture stdout output
- Detect command completion
- Handle timeouts
- Detect errors in output

**Location**: `src/services/DosCommandExecutor.ts`

### 2. BatchFileGenerator

**Purpose**: Generate DOS batch files for compilation workflows.

**Responsibilities**:
- Generate compile batch files (wcc.exe)
- Generate link batch files (wlink.exe)
- Set up environment variables (WATCOM, PATH, INCLUDE, LIB)
- Handle DOS path formatting
- Add error detection and reporting
- Include success/failure markers

**Location**: `src/services/BatchFileGenerator.ts`

### 3. OpenWatcomCompilerService (Enhanced)

**Purpose**: Orchestrate compilation using DosCommandExecutor and BatchFileGenerator.

**Enhancements**:
- Use DosCommandExecutor for command execution
- Use BatchFileGenerator for batch file creation
- Parse output using OpenWatcomErrorParser
- Track progress through compilation stages
- Handle cancellation via AbortController

**Location**: `src/services/OpenWatcomCompilerService.ts` (existing, to be enhanced)

---

## Interface Definitions

### DosCommandExecutor Interface

```typescript
/**
 * Options for DOS command execution
 */
export interface DosCommandOptions {
  /** Timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
  
  /** Completion markers to look for in output */
  completionMarkers?: string[];
  
  /** Error markers to look for in output */
  errorMarkers?: string[];
  
  /** Whether to clear output buffer before execution */
  clearBuffer?: boolean;
}

/**
 * Result of DOS command execution
 */
export interface DosCommandResult {
  /** Whether command completed successfully */
  success: boolean;
  
  /** Captured output from command */
  output: string;
  
  /** Error message if command failed */
  error?: string;
  
  /** Execution time in milliseconds */
  executionTime: number;
}

/**
 * DOS Command Executor
 * Executes DOS commands via keystroke simulation
 */
export class DosCommandExecutor {
  constructor(ci: CommandInterface);
  
  /**
   * Execute a DOS command
   * @param command - Command to execute (e.g., "DIR", "C:\\COMPILE.BAT")
   * @param options - Execution options
   * @returns Promise resolving to command result
   */
  executeDosCommand(
    command: string,
    options?: DosCommandOptions
  ): Promise<DosCommandResult>;
  
  /**
   * Execute a batch file
   * @param batchFilePath - Path to batch file in DOS filesystem
   * @param options - Execution options
   * @returns Promise resolving to command result
   */
  executeBatchFile(
    batchFilePath: string,
    options?: DosCommandOptions
  ): Promise<DosCommandResult>;
  
  /**
   * Get current output buffer
   */
  getOutputBuffer(): string;
  
  /**
   * Clear output buffer
   */
  clearOutputBuffer(): void;
  
  /**
   * Check if a command is currently executing
   */
  isExecuting(): boolean;
}
```

### BatchFileGenerator Interface

```typescript
/**
 * Batch file generation options
 */
export interface BatchFileOptions {
  /** Working directory for batch file */
  workingDir?: string;
  
  /** Whether to echo commands (default: false) */
  echoCommands?: boolean;
  
  /** Additional environment variables */
  envVars?: Record<string, string>;
}

/**
 * Compile batch file parameters
 */
export interface CompileBatchParams {
  /** Source file path (e.g., "C:\\TEMP\\SOURCE.C") */
  sourcePath: string;
  
  /** Object file path (e.g., "C:\\TEMP\\SOURCE.OBJ") */
  objPath: string;
  
  /** Compiler flags (e.g., "-ms -w4 -ox") */
  compilerFlags: string;
  
  /** Path to wcc.exe */
  compilerBin: string;
  
  /** Include path */
  includePath: string;
}

/**
 * Link batch file parameters
 */
export interface LinkBatchParams {
  /** Object file paths */
  objPaths: string[];
  
  /** Executable path (e.g., "C:\\OUTPUT\\PROGRAM.EXE") */
  exePath: string;
  
  /** Linker flags (e.g., "SYSTEM DOS") */
  linkerFlags: string;
  
  /** Path to wlink.exe */
  linkerBin: string;
  
  /** Library path */
  libPath: string;
}

/**
 * Batch File Generator
 * Generates DOS batch files for compilation
 */
export class BatchFileGenerator {
  /**
   * Generate batch file for compilation
   * @param params - Compilation parameters
   * @param options - Batch file options
   * @returns Batch file content
   */
  static generateCompileBatch(
    params: CompileBatchParams,
    options?: BatchFileOptions
  ): string;
  
  /**
   * Generate batch file for linking
   * @param params - Linking parameters
   * @param options - Batch file options
   * @returns Batch file content
   */
  static generateLinkBatch(
    params: LinkBatchParams,
    options?: BatchFileOptions
  ): string;
  
  /**
   * Generate environment setup commands
   * @param watcomPath - Path to WATCOM installation
   * @returns Environment setup commands
   */
  static generateEnvSetup(watcomPath: string): string;
}
```

---

## Batch File Generation

### Compile Batch File Template

```batch
@echo off
REM Open Watcom Compilation Batch File
REM Generated by DosKit

REM Set environment variables
SET WATCOM=C:\WATCOM
SET PATH=%WATCOM%\BINW;%PATH%
SET INCLUDE=%WATCOM%\H
SET LIB=%WATCOM%\LIB286\DOS

REM Change to working directory
CD C:\TEMP

REM Compile source file
ECHO Compiling source file...
C:\WATCOM\BINW\WCC.EXE SOURCE.C -FO=SOURCE.OBJ -ms -w4 -ox

REM Check for errors
IF ERRORLEVEL 1 GOTO ERROR

REM Success marker
ECHO <<<COMPILE_SUCCESS>>>
GOTO END

:ERROR
ECHO <<<COMPILE_ERROR>>>
GOTO END

:END
```

### Link Batch File Template

```batch
@echo off
REM Open Watcom Linking Batch File
REM Generated by DosKit

REM Set environment variables
SET WATCOM=C:\WATCOM
SET PATH=%WATCOM%\BINW;%PATH%
SET LIB=%WATCOM%\LIB286\DOS

REM Change to working directory
CD C:\TEMP

REM Link object files
ECHO Linking object files...
C:\WATCOM\BINW\WLINK.EXE FILE SOURCE.OBJ NAME C:\OUTPUT\PROGRAM.EXE SYSTEM DOS

REM Check for errors
IF ERRORLEVEL 1 GOTO ERROR

REM Success marker
ECHO <<<LINK_SUCCESS>>>
GOTO END

:ERROR
ECHO <<<LINK_ERROR>>>
GOTO END

:END
```

### Success/Error Markers

The batch files use special markers to indicate success or failure:

- `<<<COMPILE_SUCCESS>>>` - Compilation succeeded
- `<<<COMPILE_ERROR>>>` - Compilation failed
- `<<<LINK_SUCCESS>>>` - Linking succeeded
- `<<<LINK_ERROR>>>` - Linking failed

These markers are parsed by DosCommandExecutor to determine command result.

---

## Sequence Diagrams

### Single File Compilation Sequence

```
User                CompilerService    OpenWatcomCompiler    BatchFileGenerator    DosCommandExecutor    js-dos
 │                         │                    │                     │                      │              │
 │  compile()              │                    │                     │                      │              │
 ├────────────────────────>│                    │                     │                      │              │
 │                         │  compile()         │                     │                      │              │
 │                         ├───────────────────>│                     │                      │              │
 │                         │                    │  generateCompileBatch()                    │              │
 │                         │                    ├────────────────────>│                      │              │
 │                         │                    │  batch content      │                      │              │
 │                         │                    │<────────────────────┤                      │              │
 │                         │                    │                     │                      │              │
 │                         │                    │  writeTextFile("COMPILE.BAT", content)     │              │
 │                         │                    ├────────────────────────────────────────────┼─────────────>│
 │                         │                    │                     │                      │              │
 │                         │                    │  executeBatchFile("C:\\COMPILE.BAT")       │              │
 │                         │                    ├───────────────────────────────────────────>│              │
 │                         │                    │                     │  simulateKeyPress()  │              │
 │                         │                    │                     │                      ├─────────────>│
 │                         │                    │                     │  onStdout(output)    │              │
 │                         │                    │                     │                      │<─────────────┤
 │                         │                    │  result             │                      │              │
 │                         │                    │<───────────────────────────────────────────┤              │
 │                         │                    │                     │                      │              │
 │                         │                    │  generateLinkBatch()│                      │              │
 │                         │                    ├────────────────────>│                      │              │
 │                         │                    │  batch content      │                      │              │
 │                         │                    │<────────────────────┤                      │              │
 │                         │                    │                     │                      │              │
 │                         │                    │  executeBatchFile("C:\\LINK.BAT")          │              │
 │                         │                    ├───────────────────────────────────────────>│              │
 │                         │                    │  result             │                      │              │
 │                         │                    │<───────────────────────────────────────────┤              │
 │                         │                    │                     │                      │              │
 │                         │  CompileResult     │                     │                      │              │
 │                         │<───────────────────┤                     │                      │              │
 │  CompileResult          │                    │                     │                      │              │
 │<────────────────────────┤                    │                     │                      │              │
```

---

## Error Handling Strategy

### Error Detection Levels

1. **Batch File Execution Errors**
   - Timeout detection
   - Missing batch file
   - Filesystem errors

2. **Compilation Errors**
   - Syntax errors
   - Missing includes
   - Type errors
   - Detected via error markers and output parsing

3. **Linking Errors**
   - Undefined symbols
   - Missing libraries
   - Invalid object files
   - Detected via error markers and output parsing

### Error Handling Flow

```
Execute Command
     │
     ▼
  Timeout? ──Yes──> Return timeout error
     │
     No
     │
     ▼
Check Error Markers
     │
     ▼
  Found? ──Yes──> Parse errors, return failure
     │
     No
     │
     ▼
Check Success Markers
     │
     ▼
  Found? ──Yes──> Return success
     │
     No
     │
     ▼
Return ambiguous result error
```

### Timeout Handling

- Default timeout: 30 seconds
- Configurable per command
- Graceful cancellation support
- Cleanup on timeout

### Retry Strategy

- No automatic retries (user-initiated only)
- Clear error messages for retry guidance
- Preserve all output for debugging

---

## Implementation Guidelines

### Implementation Status ✅

All components have been successfully implemented:

1. **✅ DosCommandExecutor** (`src/services/DosCommandExecutor.ts`)
   - ✅ Keystroke simulation implemented
   - ✅ Output capture implemented
   - ✅ Timeout handling implemented
   - ✅ Unit tests complete (15 tests, 100% passing)

2. **✅ BatchFileGenerator** (`src/services/BatchFileGenerator.ts`)
   - ✅ Compile batch generation implemented
   - ✅ Link batch generation implemented
   - ✅ Environment setup implemented
   - ✅ Unit tests complete (14 tests, 100% passing)

3. **✅ OpenWatcomCompilerService Enhanced**
   - ✅ Real `compileToObject()` implementation complete
   - ✅ Real `linkToExecutable()` implementation complete
   - ✅ DosCommandExecutor integrated
   - ✅ BatchFileGenerator integrated
   - ✅ Tests updated (22 unit tests + integration tests)

### Testing Strategy

1. **Unit Tests**
   - Test DosCommandExecutor with mocked CommandInterface
   - Test BatchFileGenerator output format
   - Test error detection logic

2. **Integration Tests**
   - Test with real js-dos instance
   - Test actual compilation workflow
   - Test error scenarios

3. **Performance Tests**
   - Measure compilation times
   - Test timeout handling
   - Test under load

### Code Quality Standards

- TypeScript strict mode
- 85%+ code coverage
- Comprehensive JSDoc comments
- Error handling for all edge cases
- Logging for debugging

---

## Design Decisions

### Why Batch Files?

**Pros**:
- Handles complex command sequences
- Environment variable setup
- Error handling with ERRORLEVEL
- Familiar DOS scripting

**Cons**:
- Additional filesystem operations
- Slightly more complex

**Decision**: Use batch files for reliability and maintainability.

### Why Keystroke Simulation?

**Pros**:
- Only available method in js-dos
- Works with any DOS command
- Flexible and dynamic

**Cons**:
- Timing complexity
- No direct exit codes

**Decision**: Use keystroke simulation as it's the only viable option.

### Why Success/Error Markers?

**Pros**:
- Reliable completion detection
- Clear success/failure indication
- Easy to parse

**Cons**:
- Requires batch file modification
- Could conflict with program output

**Decision**: Use unique markers (e.g., `<<<COMPILE_SUCCESS>>>`) to avoid conflicts.

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-05  
**Author**: DosKit Development Team


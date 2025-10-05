/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Batch File Generator Tests
 */

import { describe, it, expect } from 'vitest';
import { BatchFileGenerator, type CompileBatchParams, type LinkBatchParams } from './BatchFileGenerator';

describe('BatchFileGenerator', () => {
  describe('generateCompileBatch()', () => {
    it('should generate valid compile batch file', () => {
      const params: CompileBatchParams = {
        sourcePath: 'C:\\TEMP\\HELLO.C',
        objPath: 'C:\\TEMP\\HELLO.OBJ',
        compilerFlags: '-ms -w4 -ox',
        compilerBin: 'C:\\WATCOM\\BINW\\WCC.EXE',
        includePath: 'C:\\WATCOM\\H',
        watcomPath: 'C:\\WATCOM',
      };

      const batch = BatchFileGenerator.generateCompileBatch(params);

      // Check for essential components
      expect(batch).toContain('@echo off');
      expect(batch).toContain('SET WATCOM=C:\\WATCOM');
      expect(batch).toContain('SET PATH=%WATCOM%\\BINW;%PATH%');
      expect(batch).toContain('SET INCLUDE=%WATCOM%\\H');
      expect(batch).toContain('SET LIB=%WATCOM%\\LIB286\\DOS');
      expect(batch).toContain('C:\\WATCOM\\BINW\\WCC.EXE C:\\TEMP\\HELLO.C -FO=C:\\TEMP\\HELLO.OBJ -ms -w4 -ox');
      expect(batch).toContain('<<<COMPILE_SUCCESS>>>');
      expect(batch).toContain('<<<COMPILE_ERROR>>>');
      expect(batch).toContain('IF ERRORLEVEL 1 GOTO ERROR');
    });

    it('should include custom environment variables', () => {
      const params: CompileBatchParams = {
        sourcePath: 'C:\\TEMP\\TEST.C',
        objPath: 'C:\\TEMP\\TEST.OBJ',
        compilerFlags: '-ms',
        compilerBin: 'C:\\WATCOM\\BINW\\WCC.EXE',
        includePath: 'C:\\WATCOM\\H',
        watcomPath: 'C:\\WATCOM',
      };

      const batch = BatchFileGenerator.generateCompileBatch(params, {
        envVars: {
          'CUSTOM_VAR': 'VALUE',
          'ANOTHER_VAR': 'TEST',
        },
      });

      expect(batch).toContain('SET CUSTOM_VAR=VALUE');
      expect(batch).toContain('SET ANOTHER_VAR=TEST');
    });

    it('should include working directory change when specified', () => {
      const params: CompileBatchParams = {
        sourcePath: 'C:\\TEMP\\TEST.C',
        objPath: 'C:\\TEMP\\TEST.OBJ',
        compilerFlags: '-ms',
        compilerBin: 'C:\\WATCOM\\BINW\\WCC.EXE',
        includePath: 'C:\\WATCOM\\H',
        watcomPath: 'C:\\WATCOM',
      };

      const batch = BatchFileGenerator.generateCompileBatch(params, {
        workingDir: 'C:\\PROJECT',
      });

      expect(batch).toContain('CD C:\\PROJECT');
    });

    it('should enable echo when echoCommands is true', () => {
      const params: CompileBatchParams = {
        sourcePath: 'C:\\TEMP\\TEST.C',
        objPath: 'C:\\TEMP\\TEST.OBJ',
        compilerFlags: '-ms',
        compilerBin: 'C:\\WATCOM\\BINW\\WCC.EXE',
        includePath: 'C:\\WATCOM\\H',
        watcomPath: 'C:\\WATCOM',
      };

      const batch = BatchFileGenerator.generateCompileBatch(params, {
        echoCommands: true,
      });

      expect(batch).not.toContain('@echo off');
    });

    it('should use DOS line endings (CRLF)', () => {
      const params: CompileBatchParams = {
        sourcePath: 'C:\\TEMP\\TEST.C',
        objPath: 'C:\\TEMP\\TEST.OBJ',
        compilerFlags: '-ms',
        compilerBin: 'C:\\WATCOM\\BINW\\WCC.EXE',
        includePath: 'C:\\WATCOM\\H',
        watcomPath: 'C:\\WATCOM',
      };

      const batch = BatchFileGenerator.generateCompileBatch(params);

      // Should use \r\n (CRLF) line endings
      expect(batch).toContain('\r\n');
    });
  });

  describe('generateLinkBatch()', () => {
    it('should generate valid link batch file for single object', () => {
      const params: LinkBatchParams = {
        objPaths: ['C:\\TEMP\\HELLO.OBJ'],
        exePath: 'C:\\OUTPUT\\HELLO.EXE',
        linkerFlags: 'SYSTEM DOS',
        linkerBin: 'C:\\WATCOM\\BINW\\WLINK.EXE',
        libPath: 'C:\\WATCOM\\LIB286\\DOS',
        watcomPath: 'C:\\WATCOM',
      };

      const batch = BatchFileGenerator.generateLinkBatch(params);

      expect(batch).toContain('@echo off');
      expect(batch).toContain('SET WATCOM=C:\\WATCOM');
      expect(batch).toContain('SET PATH=%WATCOM%\\BINW;%PATH%');
      expect(batch).toContain('SET LIB=%WATCOM%\\LIB286\\DOS');
      expect(batch).toContain('C:\\WATCOM\\BINW\\WLINK.EXE FILE C:\\TEMP\\HELLO.OBJ NAME C:\\OUTPUT\\HELLO.EXE SYSTEM DOS');
      expect(batch).toContain('<<<LINK_SUCCESS>>>');
      expect(batch).toContain('<<<LINK_ERROR>>>');
      expect(batch).toContain('IF ERRORLEVEL 1 GOTO ERROR');
    });

    it('should generate valid link batch file for multiple objects', () => {
      const params: LinkBatchParams = {
        objPaths: [
          'C:\\TEMP\\MAIN.OBJ',
          'C:\\TEMP\\HELPER.OBJ',
          'C:\\TEMP\\UTILS.OBJ',
        ],
        exePath: 'C:\\OUTPUT\\PROGRAM.EXE',
        linkerFlags: 'SYSTEM DOS',
        linkerBin: 'C:\\WATCOM\\BINW\\WLINK.EXE',
        libPath: 'C:\\WATCOM\\LIB286\\DOS',
        watcomPath: 'C:\\WATCOM',
      };

      const batch = BatchFileGenerator.generateLinkBatch(params);

      expect(batch).toContain('FILE C:\\TEMP\\MAIN.OBJ FILE C:\\TEMP\\HELPER.OBJ FILE C:\\TEMP\\UTILS.OBJ');
      expect(batch).toContain('NAME C:\\OUTPUT\\PROGRAM.EXE');
    });

    it('should include custom environment variables', () => {
      const params: LinkBatchParams = {
        objPaths: ['C:\\TEMP\\TEST.OBJ'],
        exePath: 'C:\\OUTPUT\\TEST.EXE',
        linkerFlags: 'SYSTEM DOS',
        linkerBin: 'C:\\WATCOM\\BINW\\WLINK.EXE',
        libPath: 'C:\\WATCOM\\LIB286\\DOS',
        watcomPath: 'C:\\WATCOM',
      };

      const batch = BatchFileGenerator.generateLinkBatch(params, {
        envVars: {
          'LINK_VAR': 'VALUE',
        },
      });

      expect(batch).toContain('SET LINK_VAR=VALUE');
    });

    it('should include working directory change when specified', () => {
      const params: LinkBatchParams = {
        objPaths: ['C:\\TEMP\\TEST.OBJ'],
        exePath: 'C:\\OUTPUT\\TEST.EXE',
        linkerFlags: 'SYSTEM DOS',
        linkerBin: 'C:\\WATCOM\\BINW\\WLINK.EXE',
        libPath: 'C:\\WATCOM\\LIB286\\DOS',
        watcomPath: 'C:\\WATCOM',
      };

      const batch = BatchFileGenerator.generateLinkBatch(params, {
        workingDir: 'C:\\BUILD',
      });

      expect(batch).toContain('CD C:\\BUILD');
    });
  });

  describe('generateEnvSetup()', () => {
    it('should generate environment setup commands', () => {
      const envSetup = BatchFileGenerator.generateEnvSetup('C:\\WATCOM');

      expect(envSetup).toContain('SET WATCOM=C:\\WATCOM');
      expect(envSetup).toContain('SET PATH=%WATCOM%\\BINW;%PATH%');
      expect(envSetup).toContain('SET INCLUDE=%WATCOM%\\H');
      expect(envSetup).toContain('SET LIB=%WATCOM%\\LIB286\\DOS');
    });

    it('should use DOS line endings', () => {
      const envSetup = BatchFileGenerator.generateEnvSetup('C:\\WATCOM');

      expect(envSetup).toContain('\r\n');
    });
  });

  describe('Batch File Structure', () => {
    it('should have proper error handling structure', () => {
      const params: CompileBatchParams = {
        sourcePath: 'C:\\TEMP\\TEST.C',
        objPath: 'C:\\TEMP\\TEST.OBJ',
        compilerFlags: '-ms',
        compilerBin: 'C:\\WATCOM\\BINW\\WCC.EXE',
        includePath: 'C:\\WATCOM\\H',
        watcomPath: 'C:\\WATCOM',
      };

      const batch = BatchFileGenerator.generateCompileBatch(params);

      // Check for proper label structure
      expect(batch).toContain(':ERROR');
      expect(batch).toContain(':END');
      expect(batch).toContain('GOTO END');
      expect(batch).toContain('GOTO ERROR');
    });

    it('should have comments for readability', () => {
      const params: CompileBatchParams = {
        sourcePath: 'C:\\TEMP\\TEST.C',
        objPath: 'C:\\TEMP\\TEST.OBJ',
        compilerFlags: '-ms',
        compilerBin: 'C:\\WATCOM\\BINW\\WCC.EXE',
        includePath: 'C:\\WATCOM\\H',
        watcomPath: 'C:\\WATCOM',
      };

      const batch = BatchFileGenerator.generateCompileBatch(params);

      expect(batch).toContain('REM Open Watcom Compilation Batch File');
      expect(batch).toContain('REM Generated by DosKit');
      expect(batch).toContain('REM Set environment variables');
      expect(batch).toContain('REM Compile source file');
      expect(batch).toContain('REM Check for errors');
    });
  });

  describe('Path Handling', () => {
    it('should handle paths with backslashes correctly', () => {
      const params: CompileBatchParams = {
        sourcePath: 'C:\\PROJECT\\SRC\\MAIN.C',
        objPath: 'C:\\PROJECT\\OBJ\\MAIN.OBJ',
        compilerFlags: '-ms',
        compilerBin: 'C:\\WATCOM\\BINW\\WCC.EXE',
        includePath: 'C:\\WATCOM\\H',
        watcomPath: 'C:\\WATCOM',
      };

      const batch = BatchFileGenerator.generateCompileBatch(params);

      expect(batch).toContain('C:\\PROJECT\\SRC\\MAIN.C');
      expect(batch).toContain('C:\\PROJECT\\OBJ\\MAIN.OBJ');
    });
  });
});


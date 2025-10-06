/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Test Application Configuration
 * A simple test to verify the disk mounting system works
 */

import type { InitFileEntry } from '../types/js-dos';

/**
 * Simple test application - creates a HELLO.BAT file
 * This demonstrates that file creation and execution works
 */
export const testAppFiles: InitFileEntry[] = [
  {
    path: '/HELLO.BAT',
    contents: new TextEncoder().encode(
      '@ECHO OFF\r\n' +
      'CLS\r\n' +
      'ECHO.\r\n' +
      'ECHO ========================================\r\n' +
      'ECHO   DISK MOUNTING TEST - SUCCESS!\r\n' +
      'ECHO ========================================\r\n' +
      'ECHO.\r\n' +
      'ECHO This file was loaded from GitHub!\r\n' +
      'ECHO The disk mounting system is working!\r\n' +
      'ECHO.\r\n' +
      'ECHO Try these commands:\r\n' +
      'ECHO   DIR     - List files\r\n' +
      'ECHO   TYPE HELLO.BAT - View this file\r\n' +
      'ECHO   TYPE README.TXT - View readme\r\n' +
      'ECHO.\r\n' +
      'PAUSE\r\n'
    ),
  },
  {
    path: '/README.TXT',
    contents: new TextEncoder().encode(
      '========================================\r\n' +
      '  DOSKIT DISK MOUNTING TEST\r\n' +
      '========================================\r\n' +
      '\r\n' +
      'This is a test application to verify that\r\n' +
      'the disk mounting feature works correctly.\r\n' +
      '\r\n' +
      'Files in this demo:\r\n' +
      '  - HELLO.BAT   : Test batch file\r\n' +
      '  - README.TXT  : This file\r\n' +
      '  - TEST.TXT    : Another test file\r\n' +
      '\r\n' +
      'If you can read this, the disk mounting\r\n' +
      'system is working perfectly!\r\n' +
      '\r\n' +
      'Created by: DosKit Disk Mounting System\r\n' +
      'Date: 2025-10-06\r\n' +
      '========================================\r\n'
    ),
  },
  {
    path: '/TEST.TXT',
    contents: new TextEncoder().encode(
      'This is a test file.\r\n' +
      '\r\n' +
      'If you can see this, it means:\r\n' +
      '1. Files loaded from configuration\r\n' +
      '2. Files mounted to virtual C: drive\r\n' +
      '3. DOS can access the files\r\n' +
      '4. The disk mounting system works!\r\n' +
      '\r\n' +
      'Success!\r\n'
    ),
  },
];

/**
 * DOSBox configuration for test application
 */
export const testAppDosboxConf = `
[autoexec]
@echo off
cls
echo.
echo ========================================
echo   DosKit Disk Mounting Test
echo ========================================
echo.
echo Mounting C: drive...
mount c .
c:
echo.
echo Files loaded successfully!
echo.
echo Running HELLO.BAT...
echo.
hello.bat
`;

/**
 * Metadata for test application
 */
export const testAppMetadata = {
  name: 'Disk Mounting Test',
  description: 'Simple test to verify disk mounting works',
  author: 'DosKit',
  year: 2025,
  license: 'MIT',
  size: '< 1 KB',
  requirements: 'None',
};


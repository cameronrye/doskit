# Filesystem-Based Compilation

## Overview

DosKit now uses a filesystem-based compilation approach instead of keyboard simulation. This is more reliable when the DOS window is not visible or focused.

## Why This Approach?

After extensive debugging, we discovered that **js-dos keyboard simulation (`simulateKeyPress` and `sendKeyEvent`) does not work when the DOS canvas is not visible and focused in the viewport**. This is a fundamental limitation of how the emulator handles input events.

### What We Tried (That Didn't Work)

1. ✅ Fixed stdout handler conflicts
2. ✅ Added proper DOS ready detection  
3. ✅ Tried both `simulateKeyPress` and `sendKeyEvent`
4. ✅ Ensured emulator is resumed
5. ✅ Rendered canvas off-screen with full dimensions
6. ❌ **None of these worked** - still 0 chars captured after typing

## How It Works

### 1. Preparation Phase

When the user clicks "Build":

1. Source file is written to `C:\TEMP\<filename>.c`
2. A compilation batch file is generated with:
   - Compiler command (WCC.EXE)
   - Linker command (WLINK.EXE)
   - Status markers (SUCCESS, COMPILE_ERROR, LINK_ERROR)
3. Batch file is written to `C:\TEMP\COMPILE.BAT`
4. Instructions are displayed to the user

### 2. Manual Execution Phase

The user must:

1. Switch to Terminal mode (click the Terminal tab)
2. Type the command: `C:\TEMP\COMPILE.BAT`
3. Press Enter
4. Wait for compilation to complete
5. Switch back to Code mode

### 3. Result Retrieval Phase

When the user clicks "Check Result":

1. Read `C:\TEMP\STATUS.TXT` to check compilation status
2. If successful, read `C:\OUTPUT\<filename>.exe`
3. Display results and make executable available for running

## Batch File Structure

```batch
@echo off
SET WATCOM=C:\WATCOM
SET PATH=%WATCOM%\BINW;%PATH%
SET INCLUDE=%WATCOM%\H
SET LIB=%WATCOM%\LIB286\DOS

echo.
echo ========================================
echo   DosKit - Open Watcom Compiler
echo ========================================
echo.
echo Compiling: hello.c
echo Output: hello.exe
echo.

REM Compile source to object file
echo [1/2] Compiling...
C:\WATCOM\BINW\WCC.EXE C:\TEMP\hello.c -FO=C:\TEMP\hello.OBJ -ms -w4
if errorlevel 1 goto compile_error

REM Link object file to executable
echo [2/2] Linking...
C:\WATCOM\BINW\WLINK.EXE FILE C:\TEMP\hello.OBJ NAME C:\OUTPUT\hello.exe SYSTEM DOS
if errorlevel 1 goto link_error

REM Success
echo.
echo SUCCESS > C:\TEMP\STATUS.TXT
echo ========================================
echo   Compilation Successful!
echo ========================================
echo.
echo Executable: C:\OUTPUT\hello.exe
echo.
goto end

:compile_error
echo COMPILE_ERROR > C:\TEMP\STATUS.TXT
echo.
echo ========================================
echo   Compilation Failed!
echo ========================================
echo.
echo Check the error messages above.
echo.
goto end

:link_error
echo LINK_ERROR > C:\TEMP\STATUS.TXT
echo.
echo ========================================
echo   Linking Failed!
echo ========================================
echo.
echo Check the error messages above.
echo.
goto end

:end
```

## Implementation Details

### Modified Files

1. **src/services/OpenWatcomCompilerService.ts**
   - `compile()` now uses `compileViaFilesystem()`
   - `compileViaFilesystem()` generates batch file and returns instructions
   - `checkCompilationResult()` reads status and executable from filesystem

2. **src/services/CompilerService.ts**
   - Added `checkCompilationResult()` method
   - Delegates to OpenWatcomCompilerService

3. **src/hooks/useDosCompiler.ts**
   - Added `checkResult()` method
   - Exposes checkCompilationResult to components

4. **src/components/dev/BuildPanel.tsx**
   - Added "Check Result" button
   - Shows button only for Open Watcom compiler

5. **src/components/dev/DeveloperMode.tsx**
   - Added `handleCheckResult()` callback
   - Wires up the Check Result button

## User Experience

### Build Flow

1. User writes code in Code mode
2. User clicks "Build"
3. System displays instructions:
   ```
   📋 MANUAL COMPILATION REQUIRED
   
   Keyboard simulation is not available when the DOS window is hidden.
   Please follow these steps:
   
   1. Switch to Terminal mode (click the Terminal tab)
   2. Type the following command and press Enter:
      C:\TEMP\COMPILE.BAT
   3. Wait for compilation to complete
   4. Switch back to Code mode
   5. Click "Check Result" to retrieve the executable
   ```

4. User switches to Terminal mode
5. User types and runs the batch file
6. User sees compilation output in DOS terminal
7. User switches back to Code mode
8. User clicks "Check Result"
9. System reads the executable and displays success/error

### Advantages

- ✅ **Reliable**: No dependency on keyboard simulation
- ✅ **Transparent**: User sees exactly what's happening
- ✅ **Debuggable**: User can see compiler output directly
- ✅ **Educational**: User learns DOS commands

### Disadvantages

- ❌ **Manual**: Requires user interaction
- ❌ **Multi-step**: More steps than automatic compilation
- ❌ **Mode switching**: User must switch between Code and Terminal modes

## Future Improvements

### Option 1: Automatic Mode Switching

Automatically switch to Terminal mode during compilation:
- Show DOS window during build
- Auto-type the command
- Switch back when done

### Option 2: Emulator Restart with Autoexec

Restart the emulator with compilation command in autoexec:
- More complex but fully automatic
- No keyboard simulation needed
- Requires emulator restart

### Option 3: WASM Compiler

Use a WebAssembly-based C compiler:
- Compile directly in browser
- No DOS emulation needed for compilation
- Fast and reliable

## Status Markers

The batch file writes status to `C:\TEMP\STATUS.TXT`:

- `SUCCESS` - Compilation and linking successful
- `COMPILE_ERROR` - Compilation failed
- `LINK_ERROR` - Linking failed

## File Locations

- Source files: `C:\TEMP\<filename>.c`
- Object files: `C:\TEMP\<filename>.OBJ`
- Executables: `C:\OUTPUT\<filename>.exe`
- Batch file: `C:\TEMP\COMPILE.BAT`
- Status file: `C:\TEMP\STATUS.TXT`

## Testing

To test the filesystem-based compilation:

1. Start the application
2. Write a simple C program
3. Click "Build"
4. Follow the instructions to run the batch file
5. Click "Check Result"
6. Verify the executable is created and can be run

## Conclusion

While this approach requires manual steps, it's more reliable than keyboard simulation and provides a transparent view of the compilation process. Future improvements can make it more automatic while maintaining reliability.


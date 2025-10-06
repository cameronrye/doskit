# Turbo C Integration Plan

## Why Turbo C?

Turbo C 2.01 is the ideal compiler for DosKit because:

- ✅ **16-bit real-mode** - Runs natively in DOSBox without DOS extenders
- ✅ **Small footprint** - Essential files are only ~500KB total
- ✅ **Fast compilation** - Much faster than protected mode compilers
- ✅ **Well-documented** - Extensive documentation available
- ✅ **Freely available** - Borland released it as freeware in 2000
- ✅ **Authentic DOS experience** - What many developers actually used in the 90s

## Required Files

### Compiler Binaries (~200KB)
- `BIN/TCC.EXE` - Turbo C Compiler (command-line)
- `BIN/TLINK.EXE` - Turbo Linker
- `BIN/C0S.OBJ` - Startup code for small model

### Header Files (~100KB)
- `INCLUDE/stdio.h`
- `INCLUDE/stdlib.h`
- `INCLUDE/string.h`
- `INCLUDE/conio.h`
- `INCLUDE/dos.h`
- `INCLUDE/alloc.h`
- `INCLUDE/mem.h`
- `INCLUDE/process.h`

### Library Files (~200KB)
- `LIB/CS.LIB` - Small model C library

## Directory Structure

```
public/turboc/
├── BIN/
│   ├── tcc.exe      # Compiler
│   ├── tlink.exe    # Linker
│   └── c0s.obj      # Startup code
├── INCLUDE/
│   ├── stdio.h
│   ├── stdlib.h
│   ├── string.h
│   ├── conio.h
│   └── dos.h
└── LIB/
    └── cs.lib       # Small model library
```

## Sourcing Turbo C Files

### Option 1: Internet Archive (Recommended)
Download from: https://archive.org/details/msdos_borland_turbo_c_2.01

### Option 2: WinWorld
Download from: https://winworldpc.com/product/turbo-c/2x

### Option 3: Manual Extraction
If you have Turbo C installed elsewhere, copy the essential files listed above.

## Implementation Steps

### 1. Create TurboCLoaderService

Similar to `WatcomLoaderService.ts`, create a service that loads Turbo C files:

```typescript
// src/services/TurboCLoaderService.ts
export class TurboCLoaderService {
  private static readonly ESSENTIAL_FILES: TurboCFile[] = [
    // Compiler binaries
    { dosPath: '/TURBOC/BIN/TCC.EXE', url: '/turboc/BIN/tcc.exe' },
    { dosPath: '/TURBOC/BIN/TLINK.EXE', url: '/turboc/BIN/tlink.exe' },
    { dosPath: '/TURBOC/BIN/C0S.OBJ', url: '/turboc/BIN/c0s.obj' },
    
    // Essential headers
    { dosPath: '/TURBOC/INCLUDE/stdio.h', url: '/turboc/INCLUDE/stdio.h' },
    { dosPath: '/TURBOC/INCLUDE/stdlib.h', url: '/turboc/INCLUDE/stdlib.h' },
    { dosPath: '/TURBOC/INCLUDE/string.h', url: '/turboc/INCLUDE/string.h' },
    { dosPath: '/TURBOC/INCLUDE/conio.h', url: '/turboc/INCLUDE/conio.h' },
    { dosPath: '/TURBOC/INCLUDE/dos.h', url: '/turboc/INCLUDE/dos.h' },
    
    // Library
    { dosPath: '/TURBOC/LIB/CS.LIB', url: '/turboc/LIB/cs.lib' },
  ];
}
```

### 2. Create TurboCCompilerService

```typescript
// src/services/TurboCCompilerService.ts
export class TurboCCompilerService implements CompilerInterface {
  private config = {
    compilerBin: 'C:\\TURBOC\\BIN\\TCC.EXE',
    linkerBin: 'C:\\TURBOC\\BIN\\TLINK.EXE',
    includePath: 'C:\\TURBOC\\INCLUDE',
    libPath: 'C:\\TURBOC\\LIB',
    tempPath: 'C:\\TEMP',
    outputPath: 'C:\\OUTPUT',
  };

  async compile(sourceCode: string, sourceFile: string, outputFile: string): Promise<CompileResult> {
    // Generate batch file with Turbo C commands
    const batchContent = this.generateBatchFile(sourceFile, outputFile);
    await this.fs.writeTextFile(`${this.config.tempPath}\\COMPILE.BAT`, batchContent);
    
    return {
      success: false,
      errors: ['Manual compilation required - see instructions above'],
      warnings: [],
      outputFile,
      rawOutput: 'Batch file created: C:\\TEMP\\COMPILE.BAT\n\nPlease run it manually in the DOS terminal.',
    };
  }

  private generateBatchFile(sourceFile: string, outputFile: string): string {
    const sourcePath = `${this.config.tempPath}\\${sourceFile}`;
    const objFile = sourceFile.replace(/\.(c|cpp)$/, '.obj');
    
    return `@echo off
echo ========================================
echo   DosKit - Turbo C Compiler
echo ========================================
echo.
echo Compiling: ${sourceFile}
echo Output: ${outputFile}
echo.

REM Set environment
SET TURBOC=C:\\TURBOC
SET PATH=%TURBOC%\\BIN;%PATH%
SET INCLUDE=%TURBOC%\\INCLUDE
SET LIB=%TURBOC%\\LIB

REM Compile and link in one step
echo [1/1] Compiling and linking...
TCC -I%INCLUDE% -L%LIB% -e${this.config.outputPath}\\${outputFile} ${sourcePath}
if errorlevel 1 goto compile_error

echo SUCCESS > ${this.config.tempPath}\\STATUS.TXT
echo.
echo ========================================
echo   Compilation Successful!
echo ========================================
echo.
echo Executable: ${this.config.outputPath}\\${outputFile}
goto end

:compile_error
echo COMPILE_ERROR > ${this.config.tempPath}\\STATUS.TXT
echo.
echo ========================================
echo   Compilation Failed!
echo ========================================
echo.
echo Check the error messages above.
goto end

:end
`;
  }
}
```

### 3. Update App.tsx

```typescript
// Load Turbo C files instead of WATCOM
const { TurboCLoaderService } = await import('./services/TurboCLoaderService');
const turbocLoader = new TurboCLoaderService(commandInterface);
await turbocLoader.loadTurboCFiles();
```

### 4. Update CompilerService

Switch from OpenWatcomCompilerService to TurboCCompilerService.

## Compilation Command

Turbo C uses a simpler command structure:

```batch
TCC -I<include_path> -L<lib_path> -e<output.exe> source.c
```

Flags:
- `-I` - Include path
- `-L` - Library path
- `-e` - Output executable name
- `-ms` - Small memory model (default)
- `-w` - Enable warnings

## Advantages Over WATCOM

1. **No DOS extender needed** - Pure 16-bit real-mode
2. **Faster startup** - No DOS/4GW loading overhead
3. **Simpler command line** - Single command for compile+link
4. **Smaller binaries** - TCC.EXE is ~100KB vs WCC.EXE at ~900KB
5. **Better DOSBox compatibility** - Designed for real-mode DOS

## Testing

Once files are in place:

1. Refresh the application
2. Click "Build" - batch file should be created
3. Switch to Terminal mode
4. Run `C:\TEMP\COMPILE.BAT`
5. Compilation should complete in <1 second
6. Switch back to Code mode
7. Click "Check Result"
8. Click "Run" to execute the program

## Next Steps

1. **Source Turbo C files** - Download from Internet Archive or WinWorld
2. **Extract essential files** - Only need ~500KB of files
3. **Place in public/turboc/** - Follow the directory structure above
4. **Implement TurboCLoaderService** - Copy pattern from WatcomLoaderService
5. **Implement TurboCCompilerService** - Simpler than OpenWatcomCompilerService
6. **Test compilation** - Should work immediately without hanging

## File Sizes Reference

- TCC.EXE: ~100KB
- TLINK.EXE: ~60KB
- C0S.OBJ: ~2KB
- Headers (total): ~100KB
- CS.LIB: ~200KB
- **Total: ~462KB**

Much smaller than WATCOM's 2MB+ footprint!


# Compiler Limitation: DOS/4GW Incompatibility

## Issue

The Open Watcom C/C++ compilers (WCC.EXE, WLINK.EXE) are 32-bit protected mode executables that require the DOS/4GW DOS extender to run. Unfortunately, **js-dos (DOSBox) does not properly support DOS/4GW**, causing the compiler to hang indefinitely when executed.

## Evidence

- DOS4GW.EXE loads successfully into the filesystem (293,390 bytes verified)
- When executed directly (`C:\WATCOM\BINW\DOS4GW.EXE`), it locks up the emulator
- When WCC.EXE tries to run, it hangs at the compilation stage waiting for DOS/4GW

## Attempted Solutions

1. ✅ **Filesystem-based compilation** - Successfully implemented batch file approach
2. ✅ **Loading WATCOM files** - All compiler files load correctly via WatcomLoaderService
3. ✅ **DOS4GW.EXE inclusion** - DOS extender is present and accessible
4. ✅ **DOSBox configuration** - Added DPMI support, increased memory
5. ❌ **Explicit DOS4GW invocation** - Doesn't work in batch files
6. ❌ **Waiting for completion** - Tested up to 10 minutes, no progress

## Alternative Solutions

### Option 1: Turbo C (16-bit Real-Mode) ⭐ RECOMMENDED
- **Pros**: Native 16-bit, no DOS extender needed, fast, well-documented
- **Cons**: Need to source and integrate Turbo C files
- **Status**: Turbo C 2.01 is freely available but download sources are unreliable

### Option 2: DOSBox-X Backend
- **Pros**: Better DOS/4GW support
- **Cons**: js-dos may not support DOSBox-X, significant refactoring needed
- **Status**: Not investigated

### Option 3: Server-Side Compilation
- **Pros**: Can use any modern compiler
- **Cons**: Requires backend infrastructure, network dependency
- **Status**: User reported previous attempts unsuccessful

### Option 4: WebAssembly Compiler
- **Pros**: Runs entirely in browser, no DOS emulation needed
- **Cons**: Complex integration, may not provide authentic DOS experience
- **Status**: User reported previous attempts unsuccessful

## Current State

The filesystem-based compilation system is **fully implemented and working** up to the point of compiler execution:

✅ Source files are written to `/TEMP/`
✅ Batch files are generated correctly  
✅ WATCOM compiler files are loaded (895KB WCC.EXE, 436KB WLINK.EXE)
✅ DOS4GW.EXE is present (293KB)
✅ User can manually execute batch files in DOS terminal
❌ Compilation hangs when WCC.EXE tries to run

## Recommendation

For MVP, we should:
1. **Document this limitation** clearly in the UI
2. **Integrate Turbo C 2.01** as the primary compiler (16-bit real-mode)
3. **Keep the WATCOM infrastructure** for potential future use if js-dos adds DOS/4GW support

## Technical Details

- **js-dos version**: 8.3.20
- **DOSBox version**: Embedded in js-dos
- **WATCOM version**: Open Watcom 2.0 (32-bit protected mode)
- **DOS4GW version**: Included with Open Watcom


# Compiler Status - DosKit MVP

## Current Situation

### ❌ Open Watcom C/C++ - NOT WORKING

**Problem**: DOS/4GW Incompatibility

- Open Watcom compilers (WCC.EXE, WLINK.EXE) are 32-bit protected mode executables
- They require DOS/4GW DOS extender to run
- **js-dos/DOSBox does not support DOS/4GW** - it locks up the emulator
- Confirmed by testing: Running `C:\WATCOM\BINW\DOS4GW.EXE` freezes the VM

**What Works**:
- ✅ All WATCOM files load successfully (12 files, ~2.4MB total)
- ✅ Files are accessible in DOS at `C:\WATCOM\`
- ✅ Filesystem-based compilation system is fully implemented
- ✅ Batch files are generated correctly
- ✅ User can manually execute batch files in DOS terminal

**What Doesn't Work**:
- ❌ Compilation hangs at "[1/2] Compiling..." when WCC.EXE tries to run
- ❌ DOS4GW.EXE locks up the emulator when executed
- ❌ No progress even after waiting 10+ minutes

**Attempted Solutions**:
1. ✅ Filesystem-based compilation (instead of keyboard simulation)
2. ✅ Loading DOS4GW.EXE into filesystem
3. ✅ DOSBox configuration (DPMI support, increased memory)
4. ✅ Explicit DOS4GW invocation
5. ❌ All attempts failed - fundamental incompatibility

**Conclusion**: Cannot use Open Watcom with js-dos.

---

## ✅ Turbo C 2.01 - RECOMMENDED SOLUTION

**Why Turbo C**:
- ✅ 16-bit real-mode (no DOS extender needed)
- ✅ Native DOSBox support
- ✅ Fast compilation (<1 second)
- ✅ Small footprint (462KB vs WATCOM's 2.4MB)
- ✅ Authentic DOS development experience
- ✅ Freely available (Borland released as freeware)

**Status**: Ready to implement, pending file acquisition

**Required Files** (~462KB total):
```
public/turboc/
├── BIN/
│   ├── tcc.exe      (~100KB)
│   ├── tlink.exe    (~60KB)
│   └── c0s.obj      (~2KB)
├── INCLUDE/
│   ├── stdio.h
│   ├── stdlib.h
│   ├── string.h
│   ├── conio.h
│   ├── dos.h
│   └── (5 more headers)
└── LIB/
    └── cs.lib       (~200KB)
```

**Download Sources**:
1. Internet Archive: https://archive.org/details/msdos_borland_turbo_c_2.01
2. WinWorld: https://winworldpc.com/product/turbo-c/2x

**Implementation Plan**:
1. Download and extract Turbo C 2.01
2. Place essential files in `public/turboc/`
3. Create `TurboCLoaderService.ts` (similar to WatcomLoaderService)
4. Create `TurboCCompilerService.ts` (simpler than OpenWatcomCompilerService)
5. Update `App.tsx` to load Turbo C files
6. Test compilation

**Compilation Command**:
```batch
TCC -IC:\TURBOC\INCLUDE -LC:\TURBOC\LIB -eC:\OUTPUT\hello.exe C:\TEMP\hello.c
```

Much simpler than WATCOM's two-step compile+link process!

---

## Implementation Status

### Completed ✅
- [x] Filesystem-based compilation system
- [x] FileSystemService with path normalization
- [x] DosCommandExecutor for batch file execution
- [x] Build/Check Result UI workflow
- [x] WatcomLoaderService (can be adapted for Turbo C)
- [x] OpenWatcomCompilerService (can be adapted for Turbo C)
- [x] Documentation of DOS/4GW limitation
- [x] Turbo C integration plan

### Pending ⏳
- [ ] Acquire Turbo C 2.01 files
- [ ] Place files in `public/turboc/`
- [ ] Create TurboCLoaderService
- [ ] Create TurboCCompilerService
- [ ] Update App.tsx to use Turbo C
- [ ] Test compilation workflow
- [ ] Verify executable runs correctly

---

## Technical Details

### Why DOS/4GW Doesn't Work

DOS/4GW is a DOS extender that allows 32-bit protected mode programs to run under DOS. It works by:
1. Switching the CPU from real mode to protected mode
2. Managing memory above 1MB
3. Providing DPMI (DOS Protected Mode Interface) services

**js-dos/DOSBox limitations**:
- DOSBox emulates a 16-bit real-mode DOS environment
- Protected mode support is limited and incomplete
- DOS/4GW requires specific CPU features that aren't fully emulated
- When DOS/4GW tries to switch to protected mode, the emulator hangs

### Why Turbo C Will Work

Turbo C is a pure 16-bit real-mode compiler that:
- Runs entirely in real mode (no mode switching)
- Uses conventional memory only (<640KB)
- Doesn't require any DOS extenders
- Was designed for the exact DOS environment that DOSBox emulates

---

## Next Steps

1. **Download Turbo C** - See `docs/TURBO-C-SETUP-INSTRUCTIONS.md`
2. **Extract files** - Only need ~462KB of essential files
3. **Organize in public/turboc/** - Follow the directory structure
4. **Notify me** - I'll implement the Turbo C services
5. **Test** - Compilation should work immediately!

---

## Alternative Solutions (Not Pursued)

### Option 2: DOSBox-X Backend
- **Pros**: Better DOS/4GW support
- **Cons**: js-dos may not support DOSBox-X, major refactoring
- **Status**: Not investigated

### Option 3: Server-Side Compilation
- **Pros**: Can use any modern compiler
- **Cons**: Requires backend, network dependency
- **Status**: User reported previous attempts unsuccessful

### Option 4: WebAssembly Compiler
- **Pros**: Runs in browser, no DOS needed
- **Cons**: Complex integration, not authentic DOS experience
- **Status**: User reported previous attempts unsuccessful

---

## References

- [DOS/4GW Wikipedia](https://en.wikipedia.org/wiki/DOS/4G)
- [Turbo C Wikipedia](https://en.wikipedia.org/wiki/Turbo_C)
- [DOSBox Wiki](https://www.dosbox.com/wiki/)
- [Cosmore Project](https://github.com/smitelli/cosmore) - Uses Turbo C 2.0 successfully

---

## Summary

**Current State**: Open Watcom doesn't work due to DOS/4GW incompatibility.

**Solution**: Switch to Turbo C 2.01 (16-bit real-mode compiler).

**Action Required**: Download and place Turbo C files in `public/turboc/`.

**Expected Outcome**: Compilation will work without hanging, completing in <1 second.


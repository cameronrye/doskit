# Turbo C Setup Instructions

## Problem Summary

Open Watcom C/C++ compilers require DOS/4GW (a DOS extender for 32-bit protected mode programs), which **does not work in js-dos/DOSBox**. When DOS4GW.EXE is executed, it locks up the emulator indefinitely.

**Solution**: Use Turbo C 2.01, a 16-bit real-mode compiler that runs natively in DOSBox without any DOS extender.

## Step 1: Download Turbo C 2.01

### Option A: Internet Archive (Recommended)
1. Visit: https://archive.org/details/msdos_borland_turbo_c_2.01
2. Download the ZIP file
3. Extract it to get the Turbo C files

### Option B: WinWorld
1. Visit: https://winworldpc.com/product/turbo-c/2x
2. Download Turbo C 2.01
3. Extract the files

### Option C: Direct Download (if available)
If you find a direct download link, use:
```bash
cd /Users/cameron/Developer/doskit/public
mkdir -p turboc
cd turboc
curl -L -o tc201.zip "<URL>"
unzip tc201.zip
```

## Step 2: Extract Essential Files

You only need these files from the Turbo C installation:

### Binaries (from TC/BIN or similar):
- `TCC.EXE` - Turbo C Compiler (~100KB)
- `TLINK.EXE` - Turbo Linker (~60KB)
- `C0S.OBJ` - Startup code for small model (~2KB)

### Headers (from TC/INCLUDE or similar):
- `stdio.h`
- `stdlib.h`
- `string.h`
- `conio.h`
- `dos.h`
- `alloc.h`
- `mem.h`
- `process.h`
- `stdarg.h`
- `stddef.h`

### Libraries (from TC/LIB or similar):
- `CS.LIB` - Small model C library (~200KB)

## Step 3: Organize Files

Create this directory structure in `public/turboc/`:

```
public/turboc/
├── BIN/
│   ├── tcc.exe
│   ├── tlink.exe
│   └── c0s.obj
├── INCLUDE/
│   ├── stdio.h
│   ├── stdlib.h
│   ├── string.h
│   ├── conio.h
│   ├── dos.h
│   ├── alloc.h
│   ├── mem.h
│   ├── process.h
│   ├── stdarg.h
│   └── stddef.h
└── LIB/
    └── cs.lib
```

**Important**: All filenames should be lowercase for consistency with web URLs.

## Step 4: Verify Files

Run this command to verify the files are in place:

```bash
cd /Users/cameron/Developer/doskit
find public/turboc -type f | sort
```

You should see all the files listed above.

## Step 5: Implement Turbo C Services

Once the files are in place, I'll create:

1. **TurboCLoaderService.ts** - Loads Turbo C files into js-dos filesystem
2. **TurboCCompilerService.ts** - Handles compilation with Turbo C
3. Update **App.tsx** - Load Turbo C instead of WATCOM
4. Update **CompilerService.ts** - Use Turbo C compiler

## Expected File Sizes

- `TCC.EXE`: ~100KB
- `TLINK.EXE`: ~60KB
- `C0S.OBJ`: ~2KB
- Headers (total): ~100KB
- `CS.LIB`: ~200KB
- **Total: ~462KB**

## Why This Will Work

✅ **16-bit real-mode** - No DOS extender needed
✅ **Native DOSBox support** - Runs perfectly in js-dos
✅ **Fast compilation** - Compiles in <1 second
✅ **Small footprint** - Only 462KB vs WATCOM's 2MB+
✅ **Authentic** - What many DOS developers actually used

## Compilation Command

Turbo C uses a much simpler command than WATCOM:

```batch
TCC -I<include_path> -L<lib_path> -e<output.exe> source.c
```

Example:
```batch
TCC -IC:\TURBOC\INCLUDE -LC:\TURBOC\LIB -eC:\OUTPUT\hello.exe C:\TEMP\hello.c
```

## Next Steps

1. **Download Turbo C** using one of the options above
2. **Extract the essential files** listed in Step 2
3. **Organize them** in `public/turboc/` as shown in Step 3
4. **Let me know** when the files are ready
5. **I'll implement** the Turbo C services and integration

## Alternative: Manual File Placement

If you have trouble downloading, you can:

1. Install Turbo C in DOSBox or a DOS VM
2. Copy the essential files to your host system
3. Place them in `public/turboc/` following the structure above

## Questions?

If you encounter any issues:
- Check that filenames are lowercase
- Verify file sizes match approximately
- Ensure directory structure is correct
- Make sure files are in `public/turboc/` not `public/watcom/`

Once the files are in place, compilation should work immediately without any hanging!


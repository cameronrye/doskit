# Critical Filesystem Issue

## Problem

**Files written with `fsWriteFile` are NOT visible to DOS programs!**

## Evidence

1. `FileSystemService.writeTextFile()` successfully writes files using `ci.fsWriteFile()`
2. Console logs show files are written and verified (e.g., "Successfully wrote: /TEMP/hello.c")
3. However, DOS commands cannot see these files:
   - `DIR C:\TEMP` only shows `STATUS.TXT` (not `hello.c`)
   - `DIR C:\PROJECT` shows "File not found"
   - `DIR /S C:\` shows only the `JSDOS~1` directory
4. The compiler fails with "File C:\TEMP\hello.c not found"

## Root Cause

js-dos has **TWO separate filesystem layers**:

1. **Emulated DOS Filesystem**: What DOS programs and commands see
   - Accessed by DOS commands (`DIR`, `TYPE`, etc.)
   - Accessed by DOS programs (WCC.EXE, WLINK.EXE, etc.)
   - Mounted via `mount c .` in dosbox.conf

2. **js-dos API Filesystem**: Internal Emscripten filesystem
   - Accessed by `fsWriteFile`, `fsReadFile`, etc.
   - NOT visible to DOS programs
   - Separate from the emulated DOS filesystem

**These two filesystems are NOT synchronized!**

## Impact

- ❌ Cannot write source files that the compiler can read
- ❌ Cannot write batch files that DOS can execute  
- ❌ Cannot create any files that DOS programs can access
- ✅ Can read files that DOS programs create (like STATUS.TXT)

## Current Workaround Attempts

### Attempt 1: fsSync()
```typescript
await this.ci.fsWriteFile(normalizedPath, data);
await this.ci.fsSync(); // Doesn't exist or doesn't help
```
**Result**: Failed - `fsSync` either doesn't exist or doesn't sync between the two filesystems.

### Attempt 2: DOS Commands via sendKeys
```typescript
await this.ci.sendKeys(`ECHO content > file.txt\r`);
```
**Result**: Won't work - `sendKeys` requires canvas focus, which we don't have.

### Attempt 3: exec() with DOS commands
```typescript
await this.ci.exec(`ECHO content > file.txt`);
```
**Result**: Not yet tested - this might be the solution!

## Potential Solutions

### Solution 1: Use `exec()` to run DOS commands
Instead of `fsWriteFile`, use `exec()` to run DOS commands that create files:

```typescript
// Create directory
await this.ci.exec('MD C:\\TEMP');

// Write file line by line
await this.ci.exec('ECHO line1 > C:\\TEMP\\file.txt');
await this.ci.exec('ECHO line2 >> C:\\TEMP\\file.txt');
```

**Pros**:
- Files will be visible to DOS programs
- Uses native DOS file creation

**Cons**:
- Need to escape special characters
- Slow (one command per line)
- Limited by DOS command line length (127 chars)

### Solution 2: Use js-dos bundles/extract
js-dos has a bundle system for pre-packaging files. We could:
1. Create a bundle with the source files
2. Extract the bundle into the DOS filesystem

**Pros**:
- Proper way to add files to DOS filesystem
- Fast

**Cons**:
- Complex setup
- Need to understand bundle format
- Might not work for dynamic content

### Solution 3: Mount a shared directory
Configure js-dos to mount a directory that both layers can access.

**Pros**:
- Clean solution
- Both layers can access files

**Cons**:
- Requires understanding js-dos mounting
- Might not be possible in browser environment

### Solution 4: Use WATCOM's stdin
Pipe source code directly to the compiler via stdin:

```bash
TYPE source.c | WCC.EXE -
```

**Pros**:
- Bypasses filesystem entirely

**Cons**:
- Not all compilers support stdin
- Still need to write output files

## Recommended Solution

**Use `exec()` with DOS commands** (Solution 1)

This is the most straightforward approach that will definitely work:

1. Create directories with `MD`
2. Write files line-by-line with `ECHO`
3. Handle special characters by escaping or using batch files

## Implementation Plan

1. Modify `FileSystemService.writeTextFile()` to use `exec()` instead of `fsWriteFile()`
2. Implement proper escaping for DOS ECHO command
3. Handle multi-line files by writing line-by-line
4. Add error handling for DOS command failures
5. Test with actual source files

## Testing

To verify the fix works:

1. Write a file using the new method
2. Run `DIR` in DOS terminal - file should be visible
3. Run `TYPE filename` - content should be correct
4. Compiler should be able to read the file

## Status

**BLOCKED**: Cannot proceed with compilation until this is fixed.

The entire compilation workflow depends on being able to write files that DOS programs can read.


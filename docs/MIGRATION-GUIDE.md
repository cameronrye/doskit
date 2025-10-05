# Migration Guide: WASM/Mock Compiler to Open Watcom

**Version**: 1.0
**Date**: 2025-10-05
**Target Audience**: Developers and users upgrading from WASM or mock compiler to Open Watcom

---

## Table of Contents

1. [Overview](#overview)
2. [What's Changing](#whats-changing)
3. [Breaking Changes](#breaking-changes)
4. [Feature Flag Changes](#feature-flag-changes)
5. [Code Updates](#code-updates)
6. [Testing Strategy](#testing-strategy)
7. [Migration Steps](#migration-steps)
8. [Rollback Plan](#rollback-plan)
9. [FAQ](#faq)

---

## Overview

This guide helps you migrate from DosKit's **WASM compiler** or **mock compiler** to the **Open Watcom C/C++ compiler** integration. The Open Watcom compiler provides real DOS compilation with authentic toolchain support.

### Why Migrate?

**Benefits of Open Watcom**:
- ✅ **Real DOS Compiler**: Authentic Open Watcom running in js-dos emulator
- ✅ **Full C Support**: Complete C89/C99 language support
- ✅ **Authentic Executables**: Real DOS MZ format executables
- ✅ **Better Error Messages**: Detailed compiler diagnostics with error codes
- ✅ **Optimization**: Multiple optimization levels (none, size, speed, balanced, aggressive)
- ✅ **Memory Models**: Support for all 6 DOS memory models
- ✅ **Multi-file Projects**: Compile and link multiple source files
- ✅ **Industry Standard**: Same compiler used for commercial DOS software

**Trade-offs**:
- ⚠️ **Slower Compilation**: Real compilation takes longer (500-1000ms vs 50-100ms for mock/WASM)
- ⚠️ **Larger Executables**: Real executables are 1-5 KB vs 200-500 bytes for mock
- ⚠️ **More Complex**: Real compiler toolchain vs simple code generation

### Migration Timeline

- **Phase 1-6**: Open Watcom implementation (Complete)
- **Phase 7**: Documentation and migration (Current)
- **Phase 8**: Deprecation of mock compiler (Future)
- **Phase 9**: Removal of mock compiler (Future)

---

## What's Changing

### Compiler Architecture

**Before (Mock Compiler)**:
```
Source Code → Basic Validation → Mock Executable → DOS
```

**After (Open Watcom)**:
```
Source Code → Open Watcom Compiler → Object File → Linker → Real DOS Executable → DOS
```

### Compilation Process Comparison

| Aspect | Mock Compiler | WASM Compiler | Open Watcom |
|--------|---------------|---------------|-------------|
| **Compilation Time** | 50-100ms | 100-200ms | 500-1000ms |
| **Executable Format** | Mock MZ format | Generated MZ format | Real MZ format |
| **Error Messages** | Basic validation | Validation errors | Full compiler diagnostics |
| **Language Support** | Limited C subset | Limited C subset | Full C89/C99 |
| **Optimization** | None | Basic | Multiple levels |
| **Multi-file** | No | No | Yes |
| **Memory Models** | No | No | Yes (6 models) |
| **Authenticity** | Simulated | Generated | Real DOS compiler |
| **Executable Size** | 200-500 bytes | 500-1000 bytes | 1-5 KB |
| **Standard Library** | Limited | Limited | Full C library |

### Error Message Format

**Before (Mock Compiler)**:
```
hello.c:5: error: 'main' function not found
hello.c:1: warning: implicit declaration of function 'printf'
```

**After (Open Watcom)**:
```
HELLO.C(5): Error! E1011: Symbol 'printf' has not been declared
HELLO.C(8): Warning! W201: Unreachable code
```

---

## Breaking Changes

### 1. Error Message Format

**Impact**: High  
**Affected**: Error parsing, UI display

**Before**:
```typescript
// Mock compiler error format
"hello.c:5: error: 'main' function not found"
```

**After**:
```typescript
// Open Watcom error format
"HELLO.C(5): Error! E1011: Symbol 'main' has not been declared"
```

**Migration**: Use `OpenWatcomErrorParser` to parse new format.

### 2. Compilation Time

**Impact**: Medium  
**Affected**: User experience, timeouts

**Before**: 50-100ms compilation time  
**After**: 500-1000ms compilation time

**Migration**: 
- Update timeout values
- Add progress indicators
- Set user expectations

### 3. Compiler Options

**Impact**: Medium  
**Affected**: Build configuration

**Before**:
```typescript
interface CompilerOptions {
  optimization: 'O0' | 'O1' | 'O2' | 'O3' | 'Os';
  warnings: boolean;
  debug: boolean;
}
```

**After**:
```typescript
interface OpenWatcomOptions extends CompilerOptions {
  memoryModel?: MemoryModel;           // NEW
  watcomOptimizations?: string[];      // NEW
  warningLevel?: number;               // NEW
  warningsAsErrors?: boolean;          // NEW
}
```

**Migration**: Update compiler option interfaces and UI.

### 4. File Paths

**Impact**: Low  
**Affected**: Filesystem operations

**Before**: Unix-style paths (`/C/PROJECT/hello.c`)  
**After**: DOS-style paths (`C:\TEMP\HELLO.C`)

**Migration**: `FileSystemService` handles path conversion automatically.

### 5. Executable Size

**Impact**: Low  
**Affected**: Build statistics

**Before**: Mock executables ~200-500 bytes  
**After**: Real executables ~1-5 KB

**Migration**: Update size expectations in UI and tests.

---

## Feature Flag Changes

### Configuration File

**File**: `src/config/compiler.config.ts`

**Before**:
```typescript
export const compilerFeatureFlags = {
  enableWasmCompiler: true,
  enableMockCompiler: true,
  preferWasmCompiler: true,
};
```

**After**:
```typescript
export const compilerFeatureFlags = {
  enableOpenWatcomCompiler: true,      // NEW
  preferOpenWatcomCompiler: true,      // NEW
  enableWasmCompiler: true,
  enableMockCompiler: true,            // Fallback only
  preferWasmCompiler: false,           // Deprecated
};
```

### Compiler Selection Priority

**Before**:
1. WASM Compiler (if enabled and preferred)
2. Mock Compiler (fallback)

**After**:
1. Open Watcom Compiler (if enabled and preferred)
2. WASM Compiler (if enabled)
3. Mock Compiler (fallback only)

### Migration Steps

1. **Enable Open Watcom**:
```typescript
enableOpenWatcomCompiler: true
```

2. **Set as Preferred**:
```typescript
preferOpenWatcomCompiler: true
```

3. **Keep Mock as Fallback**:
```typescript
enableMockCompiler: true  // For backward compatibility
```

---

## Code Updates

### 1. Update CompilerService

**Before**:
```typescript
async compile(sourceFile: string, outputFile: string, options?: CompilerOptions) {
  if (compilerFeatureFlags.enableWasmCompiler) {
    return await this.wasmCompile(sourceFile, outputFile, options);
  }
  return await this.mockCompile(sourceFile, outputFile, options);
}
```

**After**:
```typescript
async compile(sourceFile: string, outputFile: string, options?: CompilerOptions) {
  // Priority: Open Watcom > WASM > Mock
  if (compilerFeatureFlags.enableOpenWatcomCompiler && 
      compilerFeatureFlags.preferOpenWatcomCompiler) {
    return await this.openWatcomCompile(sourceFile, outputFile, options);
  }
  if (compilerFeatureFlags.enableWasmCompiler) {
    return await this.wasmCompile(sourceFile, outputFile, options);
  }
  return await this.mockCompile(sourceFile, outputFile, options);
}
```

### 2. Update Error Parsing

**Before**:
```typescript
// Parse mock compiler errors
const errorMatch = line.match(/^(.+?):(\d+): error: (.+)$/);
```

**After**:
```typescript
// Use OpenWatcomErrorParser
const parseResult = OpenWatcomErrorParser.parse(compilerOutput);
const errors = OpenWatcomErrorParser.formatForUI(parseResult.errors);
```

### 3. Update Build Panel

**Before**:
```typescript
<div className="build-message error">
  {message}
</div>
```

**After**:
```typescript
<div className="build-message error">
  <span className="error-code">{errorCode}</span>
  <span className="error-message">{message}</span>
  <span className="error-location">Line {line}</span>
</div>
```

### 4. Add Progress Tracking

**New Feature**:
```typescript
compiler.setProgressCallback((progress) => {
  console.log(`${progress.step}: ${progress.progress}%`);
  updateUI(progress);
});
```

---

## Migration Steps

### Step 1: Backup Current Configuration

```bash
# Backup your current configuration
cp src/config/compiler.config.ts src/config/compiler.config.ts.backup
```

### Step 2: Update Feature Flags

**File**: `src/config/compiler.config.ts`

```typescript
export const compilerFeatureFlags = {
  enableOpenWatcomCompiler: true,      // Enable Open Watcom
  preferOpenWatcomCompiler: true,      // Set as preferred
  enableWasmCompiler: true,            // Keep WASM as fallback
  enableMockCompiler: true,            // Keep mock as last resort
  preferWasmCompiler: false,           // Deprecated
};
```

### Step 3: Test Compilation

1. **Start development server**:
```bash
npm run dev
```

2. **Open Code Mode** and try compiling a simple program:
```c
#include <stdio.h>

int main(void) {
    printf("Testing Open Watcom!\n");
    return 0;
}
```

3. **Verify**:
   - Build completes successfully
   - Executable runs in DOS
   - Error messages are properly formatted

### Step 4: Update Tests

Run the test suite to ensure everything works:

```bash
# Run all tests
npm test

# Run specific compiler tests
npm test CompilerService.test.ts
npm test OpenWatcomCompilerService.test.ts
npm test OpenWatcomErrorParser.test.ts
```

### Step 5: Update Documentation

Update any project-specific documentation that references the compiler:
- Build instructions
- Error message formats
- Compilation times
- Supported features

### Step 6: Deploy

Once testing is complete, deploy the updated configuration:

```bash
# Build for production
npm run build

# Deploy
npm run deploy
```

---

## Rollback Plan

If you encounter issues, you can rollback to the mock compiler:

### Quick Rollback

**File**: `src/config/compiler.config.ts`

```typescript
export const compilerFeatureFlags = {
  enableOpenWatcomCompiler: false,     // Disable Open Watcom
  preferOpenWatcomCompiler: false,     // Don't prefer
  enableWasmCompiler: true,            // Use WASM
  enableMockCompiler: true,            // Or use mock
  preferWasmCompiler: true,            // Prefer WASM
};
```

### Full Rollback

```bash
# Restore backup configuration
cp src/config/compiler.config.ts.backup src/config/compiler.config.ts

# Rebuild
npm run build

# Redeploy
npm run deploy
```

### Gradual Migration

You can enable both compilers and let users choose:

```typescript
export const compilerFeatureFlags = {
  enableOpenWatcomCompiler: true,      // Enable both
  preferOpenWatcomCompiler: false,     // Don't prefer yet
  enableMockCompiler: true,            // Keep mock available
};
```

Then add a UI toggle to let users switch between compilers.

---

## FAQ

### Q: Will my existing code still work?

**A**: Yes! Open Watcom is fully backward compatible with the mock compiler. Your existing C code will compile and run without changes.

### Q: Why is compilation slower?

**A**: Open Watcom is a real compiler running in a DOS emulator, which takes more time than the mock compiler's simple validation. However, you get real compilation with full language support.

### Q: Can I use both compilers?

**A**: Yes! You can enable both and switch between them using feature flags. This is useful for testing and gradual migration.

### Q: What if Open Watcom fails?

**A**: The system automatically falls back to WASM or mock compiler if Open Watcom is unavailable or fails. You can also manually disable Open Watcom in the configuration.

### Q: Do I need to change my C code?

**A**: No! Your existing C code should work without changes. However, Open Watcom may catch errors that the mock compiler missed, so you might need to fix some issues.

### Q: How do I know which compiler is being used?

**A**: Check the build panel header. It shows the active compiler:
- "🔧 Open Watcom C/C++" - Open Watcom compiler
- "🔧 WebAssembly GCC" - WASM compiler
- "🔧 Mock Compiler" - Mock compiler

### Q: Can I customize Open Watcom options?

**A**: Yes! You can customize memory models, optimization levels, warning levels, and more. See the [Open Watcom Integration Documentation](OPEN-WATCOM-INTEGRATION.md) for details.

### Q: What about multi-file projects?

**A**: Open Watcom supports multi-file compilation! You can compile multiple `.c` files and link them together. The mock compiler did not support this.

### Q: Will executables be larger?

**A**: Yes, real DOS executables are typically 1-5 KB compared to mock executables of 200-500 bytes. This is normal for real compiled programs.

### Q: How do I report issues?

**A**: Open an issue on [GitHub](https://github.com/cameronrye/doskit/issues) with:
- Compiler being used
- Source code that fails
- Error messages
- Browser and OS information

---

## Before/After Examples

### Example 1: Simple Hello World

**Before (Mock Compiler)**:
```c
#include <stdio.h>

int main(void) {
    printf("Hello, DOS!\n");
    return 0;
}
```

**Compilation Output**:
```
ℹ️ Starting compilation of hello.c...
ℹ️ Using mock compiler (Phase 2)
ℹ️ Compiling hello.c...
✅ Compilation successful: hello.exe
ℹ️ Build completed in 87ms
```

**After (Open Watcom)**:
```c
#include <stdio.h>

int main(void) {
    printf("Hello, DOS!\n");
    return 0;
}
```

**Compilation Output**:
```
ℹ️ Starting compilation of hello.c...
ℹ️ Using Open Watcom compiler (Real DOS Compiler)
ℹ️ Creating directories...
ℹ️ Source file written: C:\TEMP\HELLO.C
ℹ️ Compiling source to object file...
ℹ️ Linking object file to executable...
✅ Compilation successful: hello.exe
ℹ️ Executable size: 1234 bytes
ℹ️ Build completed in 756ms
```

### Example 2: Error Handling

**Before (Mock Compiler)**:
```c
int main(void) {
    printf("Missing include\n");
    return 0;
}
```

**Error Output**:
```
⚠️ hello.c:1: warning: implicit declaration of function 'printf'
✅ Compilation successful: hello.exe
```

**After (Open Watcom)**:
```c
int main(void) {
    printf("Missing include\n");
    return 0;
}
```

**Error Output**:
```
❌ HELLO.C(2): Error! E1011: Symbol 'printf' has not been declared
❌ Compilation failed.
```

### Example 3: Multi-file Project

**Before (Mock Compiler)**:
Not supported - only single file compilation

**After (Open Watcom)**:

**main.c**:
```c
#include <stdio.h>
#include "helper.h"

int main(void) {
    greet("DosKit");
    return 0;
}
```

**helper.h**:
```c
void greet(const char* name);
```

**helper.c**:
```c
#include <stdio.h>
#include "helper.h"

void greet(const char* name) {
    printf("Hello, %s!\n", name);
}
```

**Compilation**:
```typescript
await compiler.compileMultiple([
  { name: 'main.c', content: mainSource },
  { name: 'helper.c', content: helperSource },
  { name: 'helper.h', content: helperHeader }
], 'program.exe');
```

---

## Summary

### Key Takeaways

1. ✅ **Open Watcom provides real DOS compilation** with full C language support
2. ✅ **Migration is straightforward** - mostly configuration changes
3. ✅ **Backward compatible** - existing code works without changes
4. ✅ **Fallback available** - can rollback to mock compiler if needed
5. ✅ **Better error messages** - more detailed compiler diagnostics
6. ✅ **New features** - multi-file projects, memory models, optimization

### Next Steps

1. Review the [Open Watcom Integration Documentation](OPEN-WATCOM-INTEGRATION.md)
2. Update your configuration following this guide
3. Test compilation with your existing code
4. Report any issues on GitHub
5. Enjoy real DOS development in the browser!

---

**Document Version**: 1.0
**Last Updated**: 2025-10-05
**Maintained By**: DosKit Development Team

---

## Testing Strategy

### 1. Unit Tests

**Update Existing Tests**:
```typescript
// Before
describe('CompilerService', () => {
  it('should compile with mock compiler', async () => {
    const result = await compiler.compile('hello.c', 'hello.exe');
    expect(result.success).toBe(true);
  });
});

// After
describe('CompilerService', () => {
  it('should compile with Open Watcom compiler', async () => {
    const result = await compiler.compile('hello.c', 'hello.exe');
    expect(result.success).toBe(true);
    expect(result.compilationTime).toBeGreaterThan(500); // Slower than mock
  });
});
```

### 2. Integration Tests

**Add New Tests**:
```typescript
describe('Open Watcom Integration', () => {
  it('should compile real C program', async () => {
    const source = `
      #include <stdio.h>
      int main(void) {
        printf("Hello, DOS!\\n");
        return 0;
      }
    `;
    const result = await compiler.compile('test.c', 'test.exe');
    expect(result.success).toBe(true);
    expect(result.executable).toBeDefined();
  });

  it('should parse Open Watcom errors', async () => {
    const source = `
      int main(void) {
        printf("Missing include\\n");
        return 0;
      }
    `;
    const result = await compiler.compile('test.c', 'test.exe');
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
```

### 3. Performance Tests

**Add Benchmarks**:
```typescript
describe('Performance', () => {
  it('should compile within timeout', async () => {
    const start = Date.now();
    await compiler.compile('hello.c', 'hello.exe');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000); // 5 second timeout
  });
});
```

### 4. Regression Tests

**Ensure Backward Compatibility**:
```typescript
describe('Backward Compatibility', () => {
  it('should fall back to mock compiler if Open Watcom fails', async () => {
    // Disable Open Watcom
    compilerFeatureFlags.enableOpenWatcomCompiler = false;
    
    const result = await compiler.compile('hello.c', 'hello.exe');
    expect(result.success).toBe(true);
  });
});
```



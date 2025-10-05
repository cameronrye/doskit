# Open Watcom C/C++ Compiler User Guide

**Version**: 1.0  
**Date**: 2025-10-05  
**Status**: ✅ Complete

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Compiler Options](#compiler-options)
4. [Memory Models](#memory-models)
5. [Optimization Levels](#optimization-levels)
6. [Common Scenarios](#common-scenarios)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)
9. [Resources](#resources)

---

## Introduction

The Open Watcom C/C++ compiler is a professional-grade DOS compiler that runs directly in your browser through the js-dos emulator. It provides authentic DOS compilation with full C language support, generating real DOS MZ executables that run on DOSBox, js-dos, and real DOS systems.

### What You Can Do

- **Write C Programs**: Full C89/C99 language support with standard library
- **Compile to DOS**: Generate authentic DOS MZ format executables
- **Multi-file Projects**: Compile and link multiple source files together
- **Optimize Code**: Choose from multiple optimization levels
- **Control Memory**: Select appropriate memory models for your programs
- **Debug Programs**: Generate debug symbols for DOS debuggers

### What's Included

- **Open Watcom C Compiler** (wcc.exe): Compiles C source to object files
- **Open Watcom Linker** (wlink.exe): Links object files to executables
- **Standard C Library**: Full DOS C library with stdio, stdlib, string, etc.
- **Header Files**: Complete set of standard C headers
- **Documentation**: Comprehensive compiler and library documentation

---

## Getting Started

### Your First Program

1. **Switch to Code Mode**: Click the "💻 Code" button in the header
2. **Select Template**: Choose "Hello World" from the templates
3. **Edit Code**: Modify the code in the Monaco editor
4. **Build**: Click "Build" button or press Ctrl+B
5. **Run**: Your program executes automatically in the DOS emulator

### Basic Hello World

```c
#include <stdio.h>

int main(void) {
    printf("Hello, DOS!\n");
    printf("Welcome to Open Watcom!\n");
    return 0;
}
```

### Build Process

When you click "Build", DosKit:
1. Writes your source code to the DOS filesystem
2. Generates a batch file to compile with wcc.exe
3. Executes the compiler in the js-dos emulator
4. Parses compiler output for errors and warnings
5. Generates a batch file to link with wlink.exe
6. Executes the linker to create the executable
7. Reads the executable and displays build statistics
8. Runs your program in the DOS emulator

---

## Compiler Options

### Memory Models

Memory models determine how your program uses memory. Choose based on your program's needs:

| Model | Code Size | Data Size | Best For |
|-------|-----------|-----------|----------|
| **Tiny** | 64KB | 64KB (shared) | Very small programs, .COM files |
| **Small** | 64KB | 64KB | Most programs (default) |
| **Compact** | 64KB | 1MB | Programs with large data, small code |
| **Medium** | 1MB | 64KB | Programs with large code, small data |
| **Large** | 1MB | 1MB | Large programs with lots of code and data |
| **Huge** | 1MB | 1MB+ | Very large programs with huge arrays |

**How to Select**:
- Open the "Compiler Options" panel
- Choose from the "Memory Model" dropdown
- Click "Build" to compile with the selected model

**Default**: Small model (recommended for most programs)

### Optimization Levels

Optimization levels control how the compiler optimizes your code:

| Level | Description | Compile Time | Executable Size | Speed |
|-------|-------------|--------------|-----------------|-------|
| **None** | No optimization | Fastest | Largest | Slowest |
| **Size** | Optimize for size | Fast | Smallest | Medium |
| **Speed** | Optimize for speed | Medium | Medium | Fastest |
| **Balanced** | Balance size and speed | Medium | Medium | Fast |
| **Aggressive** | Maximum optimization | Slowest | Small | Fastest |

**How to Select**:
- Open the "Compiler Options" panel
- Choose from the "Optimization" dropdown
- Click "Build" to compile with the selected optimization

**Recommendation**: Use "None" during development, "Balanced" or "Aggressive" for release

### Warning Levels

Control how many warnings the compiler reports:

- **Level 0**: No warnings
- **Level 1**: Severe warnings only
- **Level 2**: Moderate warnings
- **Level 3**: Production quality (recommended)
- **Level 4**: All warnings (strictest)

**How to Set**:
- Open the "Compiler Options" panel
- Adjust the "Warning Level" slider
- Enable "Warnings as Errors" to treat warnings as errors

**Recommendation**: Use Level 3 or 4 during development

### Debug Information

Enable debug symbols for use with DOS debuggers:

- **Disabled**: No debug info (smaller executables)
- **Enabled**: Full debug symbols (larger executables)

**How to Enable**:
- Open the "Compiler Options" panel
- Check the "Debug Info" checkbox
- Click "Build" to compile with debug symbols

---

## Memory Models

### When to Use Each Model

#### Tiny Model (`-mt`)

**Use When**:
- Program is very small (<64KB total)
- Creating .COM files
- Maximum compatibility needed

**Example**:
```c
// Simple utility program
#include <stdio.h>

int main(void) {
    printf("Tiny program\n");
    return 0;
}
```

#### Small Model (`-ms`) - Default

**Use When**:
- Program code is <64KB
- Program data is <64KB
- Most typical DOS programs

**Example**:
```c
// Standard DOS program
#include <stdio.h>

int main(void) {
    char buffer[1024];
    printf("Enter text: ");
    fgets(buffer, sizeof(buffer), stdin);
    printf("You entered: %s", buffer);
    return 0;
}
```

#### Compact Model (`-mc`)

**Use When**:
- Program has large data (>64KB)
- Program code is small (<64KB)
- Working with large arrays or data structures

**Example**:
```c
// Program with large data array
#include <stdio.h>

char large_buffer[100000];  // >64KB data

int main(void) {
    printf("Processing large data...\n");
    // Process large_buffer
    return 0;
}
```

#### Medium Model (`-mm`)

**Use When**:
- Program has large code (>64KB)
- Program data is small (<64KB)
- Many functions or large functions

**Example**:
```c
// Program with many functions
#include <stdio.h>

void function1(void) { /* ... */ }
void function2(void) { /* ... */ }
// ... many more functions
void function100(void) { /* ... */ }

int main(void) {
    function1();
    function2();
    // ... call many functions
    return 0;
}
```

#### Large Model (`-ml`)

**Use When**:
- Program has large code (>64KB)
- Program has large data (>64KB)
- Complex programs with lots of code and data

**Example**:
```c
// Large program with code and data
#include <stdio.h>

char data_array[100000];  // Large data

void process1(void) { /* ... */ }
void process2(void) { /* ... */ }
// ... many functions

int main(void) {
    printf("Large program\n");
    process1();
    process2();
    return 0;
}
```

#### Huge Model (`-mh`)

**Use When**:
- Program needs huge arrays (>64KB per array)
- Maximum memory access needed
- Very large data structures

**Example**:
```c
// Program with huge arrays
#include <stdio.h>

char huge_array1[200000];  // >64KB
char huge_array2[200000];  // >64KB

int main(void) {
    printf("Processing huge arrays...\n");
    // Process huge arrays
    return 0;
}
```

---

## Optimization Levels

### None (`-Od`)

**When to Use**:
- During development and debugging
- When compile time is critical
- When you need predictable code behavior

**Characteristics**:
- Fastest compilation
- Largest executables
- Slowest execution
- Easiest to debug

**Example Use Case**: Rapid development and testing

### Size (`-Os`)

**When to Use**:
- When executable size is critical
- Distributing on floppy disks
- Memory-constrained systems

**Characteristics**:
- Smallest executables
- Medium compilation time
- Medium execution speed
- Good for distribution

**Example Use Case**: Utilities for distribution

### Speed (`-Ot`)

**When to Use**:
- When execution speed is critical
- Games and real-time applications
- Performance-critical code

**Characteristics**:
- Fastest execution
- Medium executable size
- Medium compilation time
- Best performance

**Example Use Case**: Games, simulations

### Balanced (`-O2`)

**When to Use**:
- General-purpose programs
- Good balance of size and speed
- Production builds

**Characteristics**:
- Good execution speed
- Reasonable executable size
- Medium compilation time
- Recommended for most programs

**Example Use Case**: Most production software

### Aggressive (`-Ox`)

**When to Use**:
- Maximum performance needed
- Final release builds
- Benchmarking

**Characteristics**:
- Maximum optimization
- Slowest compilation
- Smallest size with best speed
- May be harder to debug

**Example Use Case**: Final release builds

---

## Common Scenarios

### Scenario 1: Simple Utility Program

**Goal**: Create a small utility that displays system information

**Recommended Settings**:
- Memory Model: Small
- Optimization: Size
- Warning Level: 3
- Debug Info: Disabled

**Example**:
```c
#include <stdio.h>
#include <dos.h>

int main(void) {
    printf("DOS Utility v1.0\n");
    printf("System Information\n");
    printf("------------------\n");
    // Display system info
    return 0;
}
```

### Scenario 2: Text Processing Program

**Goal**: Process large text files

**Recommended Settings**:
- Memory Model: Compact (for large buffers)
- Optimization: Balanced
- Warning Level: 3
- Debug Info: Disabled

**Example**:
```c
#include <stdio.h>
#include <string.h>

char buffer[65000];  // Large buffer for text

int main(void) {
    FILE *fp = fopen("input.txt", "r");
    if (fp) {
        fread(buffer, 1, sizeof(buffer), fp);
        // Process text
        fclose(fp);
    }
    return 0;
}
```

### Scenario 3: Game or Graphics Program

**Goal**: Create a fast-running game

**Recommended Settings**:
- Memory Model: Medium or Large
- Optimization: Speed or Aggressive
- Warning Level: 3
- Debug Info: Disabled (for release)

**Example**:
```c
#include <stdio.h>
#include <conio.h>

void draw_screen(void) {
    // Fast graphics code
}

void game_loop(void) {
    while (!kbhit()) {
        draw_screen();
        // Game logic
    }
}

int main(void) {
    printf("Starting game...\n");
    game_loop();
    return 0;
}
```

### Scenario 4: Multi-file Project

**Goal**: Organize code into multiple files

**Recommended Settings**:
- Memory Model: Small or Medium
- Optimization: Balanced
- Warning Level: 4
- Debug Info: Enabled (during development)

**Example**:

**main.c**:
```c
#include <stdio.h>
#include "utils.h"

int main(void) {
    printf("Multi-file project\n");
    print_message("Hello from utils!");
    return 0;
}
```

**utils.h**:
```c
#ifndef UTILS_H
#define UTILS_H

void print_message(const char *msg);

#endif
```

**utils.c**:
```c
#include <stdio.h>
#include "utils.h"

void print_message(const char *msg) {
    printf("Message: %s\n", msg);
}
```

**How to Build**:
1. Add all .c files to your project
2. DosKit will automatically compile and link them
3. Click "Build" to compile the entire project

---

## Troubleshooting

### Common Errors

#### "Symbol 'printf' has not been declared"

**Cause**: Missing header file

**Solution**: Add `#include <stdio.h>` at the top of your file

```c
#include <stdio.h>  // Add this

int main(void) {
    printf("Hello!\n");
    return 0;
}
```

#### "Undefined symbol: _main"

**Cause**: No main() function

**Solution**: Add a main() function

```c
int main(void) {
    // Your code here
    return 0;
}
```

#### "Out of memory" or "Stack overflow"

**Cause**: Memory model too small for your program

**Solution**: Use a larger memory model

1. Open Compiler Options
2. Change Memory Model from "Small" to "Large"
3. Rebuild your program

#### "Compilation timeout after 30000ms"

**Cause**: Program too complex or infinite loop

**Solutions**:
1. Simplify your code
2. Check for infinite loops
3. Split into multiple files
4. Contact support if issue persists

#### "Cannot open file: CLIBS.LIB"

**Cause**: Linker cannot find standard library

**Solution**: This is a system error. Try:
1. Refresh the page
2. Clear browser cache
3. Report the issue if it persists

### Build Warnings

#### "Unreachable code"

**Cause**: Code after return statement

**Solution**: Remove unreachable code

```c
// Before (warning)
int main(void) {
    return 0;
    printf("Never executed\n");  // Unreachable
}

// After (no warning)
int main(void) {
    printf("Executed\n");
    return 0;
}
```

#### "Variable 'x' is not used"

**Cause**: Declared variable never used

**Solution**: Remove unused variable or use it

```c
// Before (warning)
int main(void) {
    int unused;  // Warning
    return 0;
}

// After (no warning)
int main(void) {
    int used = 42;
    printf("Value: %d\n", used);
    return 0;
}
```

#### "Conversion may lose significant digits"

**Cause**: Implicit type conversion

**Solution**: Use explicit cast

```c
// Before (warning)
int main(void) {
    int i = 3.14;  // Warning: double to int
    return 0;
}

// After (no warning)
int main(void) {
    int i = (int)3.14;  // Explicit cast
    return 0;
}
```

---

## FAQ

### General Questions

**Q: Is this a real DOS compiler?**

A: Yes! Open Watcom is an authentic DOS C/C++ compiler running in the js-dos emulator. It generates real DOS MZ executables that run on DOSBox, js-dos, and real DOS systems.

**Q: Can I use this offline?**

A: Yes! DosKit is a Progressive Web App (PWA) that works completely offline after the first visit.

**Q: What C standard is supported?**

A: Open Watcom supports C89/C90 and most of C99. It includes the full standard C library.

**Q: Can I compile C++ programs?**

A: Currently only C compilation is supported. C++ support is planned for a future release.

**Q: How fast is compilation?**

A: Compilation times vary by program size:
- Small programs (<50 lines): ~1-2 seconds
- Medium programs (50-200 lines): ~2-4 seconds
- Large programs (200-500 lines): ~4-6 seconds

**Q: What's the maximum program size?**

A: There's no hard limit, but very large programs (>1000 lines) may take longer to compile. Consider splitting into multiple files for better organization.

### Compiler Options

**Q: Which memory model should I use?**

A: For most programs, use the **Small** model (default). Use larger models only if you get "out of memory" errors or need large arrays.

**Q: Which optimization level is best?**

A: Use **None** during development for faster compilation. Use **Balanced** or **Aggressive** for release builds.

**Q: Should I enable debug info?**

A: Enable debug info during development if you plan to use a DOS debugger. Disable for release builds to reduce executable size.

**Q: What do warning levels mean?**

A: Higher warning levels report more potential issues:
- Level 0: No warnings
- Level 3: Recommended for most development
- Level 4: Strictest, catches all potential issues

### Multi-file Projects

**Q: How do I compile multiple files?**

A: Simply add all your .c files to the project. DosKit will automatically compile each file to an object file and link them together.

**Q: How do I use header files?**

A: Create .h files with declarations and use `#include "myheader.h"` in your .c files. Use header guards to prevent multiple inclusion:

```c
#ifndef MYHEADER_H
#define MYHEADER_H

// Your declarations here

#endif
```

**Q: Can I use external libraries?**

A: Currently only the standard C library is supported. Support for external libraries is planned for a future release.

### Errors and Debugging

**Q: Why does my program crash?**

A: Common causes:
- Buffer overflow (writing past array bounds)
- Null pointer dereference
- Stack overflow (too much recursion)
- Wrong memory model for program size

Enable debug info and check for these issues.

**Q: How do I debug my program?**

A: Currently there's no integrated debugger. Use printf() statements to trace execution and check variable values.

**Q: Why is my executable so large?**

A: Executables include the C library code they use. To reduce size:
- Use optimization level "Size"
- Remove unused code
- Use smaller memory model if possible

**Q: Can I see the compiler output?**

A: Yes! The Build Panel shows all compiler and linker output, including errors, warnings, and informational messages.

### Performance

**Q: Why is compilation slow?**

A: Compilation runs in a DOS emulator in your browser, which adds overhead. This is expected and normal.

**Q: Can I speed up compilation?**

A: Yes:
- Use optimization level "None" during development
- Split large files into smaller modules
- Use a faster computer or browser
- Close other browser tabs

**Q: Why is my program slow?**

A: Try these optimizations:
- Use optimization level "Speed" or "Aggressive"
- Choose appropriate memory model
- Optimize your algorithms
- Reduce unnecessary function calls

---

## Resources

### Documentation

- **[Open Watcom Integration Guide](OPEN-WATCOM-INTEGRATION.md)** - Technical documentation
- **[Quick Start Guide](QUICK-START-DEVELOPER-MODE.md)** - Get started in 5 minutes
- **[Migration Guide](MIGRATION-GUIDE.md)** - Migrating from other compilers
- **[Developer Guide](../CONTRIBUTING.md)** - Contributing to DosKit

### External Resources

- **[Open Watcom Documentation](http://www.openwatcom.org/doc.php)** - Official documentation
- **[Open Watcom C/C++ User's Guide](http://www.openwatcom.org/ftp/manuals/current/cguide.pdf)** - Comprehensive guide (PDF)
- **[Open Watcom Linker Guide](http://www.openwatcom.org/ftp/manuals/current/lguide.pdf)** - Linker documentation (PDF)
- **[C Programming Tutorial](https://www.learn-c.org/)** - Learn C programming
- **[DOS Programming Reference](https://www.cs.cmu.edu/~ralf/files.html)** - DOS API reference

### Community

- **[DosKit Issues](https://github.com/cameronrye/doskit/issues)** - Report bugs or request features
- **[Open Watcom Forums](http://www.openwatcom.org/index.php/forums)** - Open Watcom community
- **[DosKit Discussions](https://github.com/cameronrye/doskit/discussions)** - Ask questions and share projects

### Example Programs

Check out the built-in templates in Code Mode:
- **Hello World** - Basic program structure
- **User Input** - Reading user input
- **File I/O** - Reading and writing files
- **Graphics** - Simple graphics programming
- **Multi-file** - Multi-file project example

---

**Document Version**: 1.0
**Last Updated**: 2025-10-05
**Maintained By**: DosKit Development Team

For questions or feedback, please visit the [DosKit repository](https://github.com/cameronrye/doskit).



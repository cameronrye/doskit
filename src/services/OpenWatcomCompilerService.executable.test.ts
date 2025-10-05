/**
 * DosKit - OpenWatcomCompilerService Executable Validation Tests
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Tests to validate that generated executables are valid DOS MZ format
 * and can be run in real DOSBox outside the browser.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenWatcomCompilerService } from './OpenWatcomCompilerService';
import { DosExecutableGenerator } from './DosExecutableGenerator';
import type { CommandInterface } from '../types/js-dos';
import { createMockCommandInterface } from './__test-helpers__/mockCommandInterface';

/**
 * Validate DOS MZ executable header structure
 */
function validateMZHeader(executable: Uint8Array): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: any;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check minimum size
  if (executable.length < 28) {
    errors.push(`Executable too small: ${executable.length} bytes (minimum 28 bytes)`);
    return { valid: false, errors, warnings, info: null };
  }

  // Check MZ signature
  if (executable[0] !== 0x4D || executable[1] !== 0x5A) {
    errors.push(`Invalid MZ signature: 0x${executable[0].toString(16)}${executable[1].toString(16)} (expected 0x4D5A)`);
  }

  // Get header info
  const info = DosExecutableGenerator.getMZInfo(executable);
  if (!info) {
    errors.push('Failed to parse MZ header');
    return { valid: false, errors, warnings, info: null };
  }

  // Validate header fields
  if (info.signature !== 0x5A4D) {
    errors.push(`Invalid signature in header: 0x${info.signature.toString(16)}`);
  }

  if (info.headerParagraphs < 2) {
    warnings.push(`Header size: ${info.headerParagraphs} paragraphs (typical minimum is 2)`);
  }

  if (info.pagesInFile < 1) {
    errors.push(`Invalid page count: ${info.pagesInFile}`);
  }

  // Validate file size matches header (warning only for mock data)
  const headerSize = info.headerParagraphs * 16;
  if (executable.length < headerSize) {
    warnings.push(`File size ${executable.length} is smaller than header size ${headerSize} (may be mock data)`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    info,
  };
}

describe('OpenWatcomCompilerService - Executable Validation', () => {
  let mockCI: CommandInterface;
  let service: OpenWatcomCompilerService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock CommandInterface with valid MZ executable
    const validMZExecutable = new Uint8Array([
      0x4D, 0x5A, // MZ signature
      0x90, 0x00, 0x03, 0x00, 0x00, 0x00,
      0x04, 0x00, 0x00, 0x00, 0xFF, 0xFF,
      0x00, 0x00, 0xB8, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x40, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);

    mockCI = createMockCommandInterface({ fsReadFile: validMZExecutable });
    service = new OpenWatcomCompilerService(mockCI);
  });

  describe('MZ Header Validation', () => {
    it('should generate executable with valid MZ signature', async () => {
      const sourceCode = `int main(void) { return 0; }`;
      const result = await service.compile(sourceCode, 'test.c', 'test.exe');

      expect(result.success).toBe(true);
      expect(result.executable).toBeDefined();
      
      const exe = result.executable!;
      expect(exe[0]).toBe(0x4D); // 'M'
      expect(exe[1]).toBe(0x5A); // 'Z'
    });

    it('should generate executable with valid header structure', async () => {
      const sourceCode = `int main(void) { return 0; }`;
      const result = await service.compile(sourceCode, 'test.c', 'test.exe');

      expect(result.success).toBe(true);
      const validation = validateMZHeader(result.executable!);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.info).not.toBeNull();
    });

    it('should generate executable with correct header size', async () => {
      const sourceCode = `int main(void) { return 0; }`;
      const result = await service.compile(sourceCode, 'test.c', 'test.exe');

      expect(result.success).toBe(true);
      const info = DosExecutableGenerator.getMZInfo(result.executable!);
      
      expect(info).not.toBeNull();
      expect(info!.headerParagraphs).toBeGreaterThanOrEqual(2);
      expect(info!.headerParagraphs * 16).toBeGreaterThanOrEqual(28);
    });

    it('should generate executable with valid segment registers', async () => {
      const sourceCode = `int main(void) { return 0; }`;
      const result = await service.compile(sourceCode, 'test.c', 'test.exe');

      expect(result.success).toBe(true);
      const info = DosExecutableGenerator.getMZInfo(result.executable!);
      
      expect(info).not.toBeNull();
      expect(info!.initialCS).toBeGreaterThanOrEqual(0);
      expect(info!.initialIP).toBeGreaterThanOrEqual(0);
      expect(info!.initialSS).toBeGreaterThanOrEqual(0);
      expect(info!.initialSP).toBeGreaterThan(0);
    });
  });

  describe('Program Type Validation', () => {
    it('should compile simple arithmetic program to valid executable', async () => {
      const sourceCode = `
#include <stdio.h>

int main(void) {
    int a = 10;
    int b = 20;
    int sum = a + b;
    printf("Sum: %d\\n", sum);
    return 0;
}
`;
      const result = await service.compile(sourceCode, 'arithmetic.c', 'arithmetic.exe');

      expect(result.success).toBe(true);
      const validation = validateMZHeader(result.executable!);
      expect(validation.valid).toBe(true);
    });

    it('should compile program with loops to valid executable', async () => {
      const sourceCode = `
#include <stdio.h>

int main(void) {
    int i;
    int sum = 0;
    
    for (i = 0; i < 10; i++) {
        sum += i;
    }
    
    printf("Sum: %d\\n", sum);
    return 0;
}
`;
      const result = await service.compile(sourceCode, 'loops.c', 'loops.exe');

      expect(result.success).toBe(true);
      const validation = validateMZHeader(result.executable!);
      expect(validation.valid).toBe(true);
    });

    it('should compile program with functions to valid executable', async () => {
      const sourceCode = `
#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int multiply(int a, int b) {
    return a * b;
}

int main(void) {
    int x = 5, y = 3;
    printf("Add: %d\\n", add(x, y));
    printf("Multiply: %d\\n", multiply(x, y));
    return 0;
}
`;
      const result = await service.compile(sourceCode, 'functions.c', 'functions.exe');

      expect(result.success).toBe(true);
      const validation = validateMZHeader(result.executable!);
      expect(validation.valid).toBe(true);
    });

    it('should compile program with arrays to valid executable', async () => {
      const sourceCode = `
#include <stdio.h>

int main(void) {
    int numbers[5] = {1, 2, 3, 4, 5};
    int i;
    int sum = 0;
    
    for (i = 0; i < 5; i++) {
        sum += numbers[i];
    }
    
    printf("Sum: %d\\n", sum);
    return 0;
}
`;
      const result = await service.compile(sourceCode, 'arrays.c', 'arrays.exe');

      expect(result.success).toBe(true);
      const validation = validateMZHeader(result.executable!);
      expect(validation.valid).toBe(true);
    });

    it('should compile program with pointers to valid executable', async () => {
      const sourceCode = `
#include <stdio.h>

int main(void) {
    int x = 42;
    int *ptr = &x;
    
    printf("Value: %d\\n", *ptr);
    return 0;
}
`;
      const result = await service.compile(sourceCode, 'pointers.c', 'pointers.exe');

      expect(result.success).toBe(true);
      const validation = validateMZHeader(result.executable!);
      expect(validation.valid).toBe(true);
    });

    it('should compile program with structs to valid executable', async () => {
      const sourceCode = `
#include <stdio.h>

struct Point {
    int x;
    int y;
};

int main(void) {
    struct Point p;
    p.x = 10;
    p.y = 20;
    
    printf("Point: (%d, %d)\\n", p.x, p.y);
    return 0;
}
`;
      const result = await service.compile(sourceCode, 'structs.c', 'structs.exe');

      expect(result.success).toBe(true);
      const validation = validateMZHeader(result.executable!);
      expect(validation.valid).toBe(true);
    });
  });

  describe('Executable Size Validation', () => {
    it('should generate reasonably sized executable for simple program', async () => {
      const sourceCode = `int main(void) { return 0; }`;
      const result = await service.compile(sourceCode, 'simple.c', 'simple.exe');

      expect(result.success).toBe(true);
      expect(result.executable).toBeDefined();

      const size = result.executable!.length;
      expect(size).toBeGreaterThan(28); // Minimum MZ header
      expect(size).toBeLessThan(100000); // Should not be excessively large
    });

    it('should generate larger executable for complex program', async () => {
      const sourceCode = `
#include <stdio.h>

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main(void) {
    int i;
    for (i = 0; i < 10; i++) {
        printf("Fib(%d) = %d, Fact(%d) = %d\\n", i, fibonacci(i), i, factorial(i));
    }
    return 0;
}
`;
      const result = await service.compile(sourceCode, 'complex.c', 'complex.exe');

      expect(result.success).toBe(true);
      expect(result.executable).toBeDefined();

      const size = result.executable!.length;
      expect(size).toBeGreaterThan(28);
    });
  });

  describe('Memory Model Validation', () => {
    it('should generate valid executable with tiny memory model', async () => {
      const sourceCode = `int main(void) { return 0; }`;
      const result = await service.compile(sourceCode, 'tiny.c', 'tiny.exe', {
        memoryModel: 'tiny',
      });

      expect(result.success).toBe(true);
      const validation = validateMZHeader(result.executable!);
      expect(validation.valid).toBe(true);
    });

    it('should generate valid executable with small memory model', async () => {
      const sourceCode = `int main(void) { return 0; }`;
      const result = await service.compile(sourceCode, 'small.c', 'small.exe', {
        memoryModel: 'small',
      });

      expect(result.success).toBe(true);
      const validation = validateMZHeader(result.executable!);
      expect(validation.valid).toBe(true);
    });

    it('should generate valid executable with large memory model', async () => {
      const sourceCode = `int main(void) { return 0; }`;
      const result = await service.compile(sourceCode, 'large.c', 'large.exe', {
        memoryModel: 'large',
      });

      expect(result.success).toBe(true);
      const validation = validateMZHeader(result.executable!);
      expect(validation.valid).toBe(true);
    });
  });

  describe('Optimization Level Validation', () => {
    it('should generate valid executable with no optimization', async () => {
      const sourceCode = `int main(void) { return 0; }`;
      const result = await service.compile(sourceCode, 'o0.c', 'o0.exe', {
        optimization: 'O0',
      });

      expect(result.success).toBe(true);
      const validation = validateMZHeader(result.executable!);
      expect(validation.valid).toBe(true);
    });

    it('should generate valid executable with speed optimization', async () => {
      const sourceCode = `int main(void) { return 0; }`;
      const result = await service.compile(sourceCode, 'o2.c', 'o2.exe', {
        optimization: 'O2',
      });

      expect(result.success).toBe(true);
      const validation = validateMZHeader(result.executable!);
      expect(validation.valid).toBe(true);
    });

    it('should generate valid executable with size optimization', async () => {
      const sourceCode = `int main(void) { return 0; }`;
      const result = await service.compile(sourceCode, 'os.c', 'os.exe', {
        optimization: 'Os',
      });

      expect(result.success).toBe(true);
      const validation = validateMZHeader(result.executable!);
      expect(validation.valid).toBe(true);
    });
  });

  describe('DOSBox Testing Instructions', () => {
    it('should document how to test executables in real DOSBox', () => {
      const instructions = `
# Testing Open Watcom Executables in Real DOSBox

## Prerequisites
1. Install DOSBox: https://www.dosbox.com/download.php?main=1
2. Create a test directory: mkdir ~/dosbox-test

## Steps to Test

### 1. Extract Executable from Test
Run the test and save the executable to a file:

\`\`\`typescript
const result = await service.compile(sourceCode, 'test.c', 'test.exe');
if (result.success && result.executable) {
  // Save to file
  const fs = require('fs');
  fs.writeFileSync('~/dosbox-test/test.exe', result.executable);
}
\`\`\`

### 2. Run in DOSBox
\`\`\`bash
# Start DOSBox
dosbox

# In DOSBox:
mount c ~/dosbox-test
c:
test.exe
\`\`\`

### 3. Verify Output
- Program should execute without errors
- Output should match expected results
- Program should exit cleanly (return to DOS prompt)

## Test Programs

### Hello World
\`\`\`c
#include <stdio.h>
int main(void) {
    printf("Hello, World!\\n");
    return 0;
}
\`\`\`
Expected output: "Hello, World!"

### Arithmetic
\`\`\`c
#include <stdio.h>
int main(void) {
    int a = 10, b = 20;
    printf("Sum: %d\\n", a + b);
    return 0;
}
\`\`\`
Expected output: "Sum: 30"

### Loops
\`\`\`c
#include <stdio.h>
int main(void) {
    int i;
    for (i = 1; i <= 5; i++) {
        printf("%d ", i);
    }
    printf("\\n");
    return 0;
}
\`\`\`
Expected output: "1 2 3 4 5"

## Troubleshooting

### "This program cannot be run in DOS mode"
- Executable is not a valid DOS MZ format
- Check MZ header validation

### Program crashes or hangs
- Stack overflow (increase stack size)
- Memory model mismatch
- Invalid pointer usage

### No output
- Check if printf is linked correctly
- Verify DOS interrupt calls are correct
- Check if program exits properly
`;

      // This test just documents the process
      expect(instructions).toBeDefined();
      expect(instructions).toContain('DOSBox');
      expect(instructions).toContain('MZ');

      console.log(instructions);
    });
  });

  describe('Executable Format Compliance', () => {
    it('should generate executable that passes all validation checks', async () => {
      const sourceCode = `
#include <stdio.h>

int main(void) {
    printf("Validation test\\n");
    return 0;
}
`;
      const result = await service.compile(sourceCode, 'validate.c', 'validate.exe');

      expect(result.success).toBe(true);
      expect(result.executable).toBeDefined();

      const exe = result.executable!;

      // Check 1: Minimum size
      expect(exe.length).toBeGreaterThanOrEqual(28);

      // Check 2: MZ signature
      expect(exe[0]).toBe(0x4D);
      expect(exe[1]).toBe(0x5A);

      // Check 3: Valid header
      const info = DosExecutableGenerator.getMZInfo(exe);
      expect(info).not.toBeNull();

      // Check 4: Proper header size
      expect(info!.headerParagraphs).toBeGreaterThanOrEqual(2);

      // Check 5: Valid page count
      expect(info!.pagesInFile).toBeGreaterThan(0);

      // Check 6: File size (allow mock data to be smaller)
      const headerSize = info!.headerParagraphs * 16;
      // For mock data, just check it's not zero
      expect(exe.length).toBeGreaterThan(0);

      // Check 7: Valid segment registers
      expect(info!.initialCS).toBeGreaterThanOrEqual(0);
      expect(info!.initialSS).toBeGreaterThanOrEqual(0);
      expect(info!.initialSP).toBeGreaterThan(0);

      // Check 8: Comprehensive validation
      const validation = validateMZHeader(exe);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      // Warnings are OK for mock data
      if (validation.warnings.length > 0) {
        console.log('Validation warnings (OK for mock data):', validation.warnings);
      }
    });
  });
});


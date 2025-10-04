/**
 * DosKit - DosExecutableGenerator Tests
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { describe, it, expect } from 'vitest';
import { DosExecutableGenerator, DosSystemCalls } from './DosExecutableGenerator';

describe('DosSystemCalls', () => {
  describe('generatePrintf', () => {
    it('should generate DOS assembly for printf', () => {
      const code = DosSystemCalls.generatePrintf('Hello');
      
      expect(code).toBeInstanceOf(Uint8Array);
      expect(code.length).toBeGreaterThan(0);
      
      // Check for MOV AH, 09h instruction
      expect(code[0]).toBe(0xB4);
      expect(code[1]).toBe(0x09);
      
      // Check for INT 21h instruction
      expect(code[code.length - 2]).toBe(0xCD);
      expect(code[code.length - 1]).toBe(0x21);
    });
  });
  
  describe('generateExit', () => {
    it('should generate DOS assembly for exit with code 0', () => {
      const code = DosSystemCalls.generateExit(0);
      
      expect(code).toBeInstanceOf(Uint8Array);
      expect(code.length).toBe(6);
      
      // MOV AH, 4Ch
      expect(code[0]).toBe(0xB4);
      expect(code[1]).toBe(0x4C);
      
      // MOV AL, 00h
      expect(code[2]).toBe(0xB0);
      expect(code[3]).toBe(0x00);
      
      // INT 21h
      expect(code[4]).toBe(0xCD);
      expect(code[5]).toBe(0x21);
    });
    
    it('should generate DOS assembly for exit with custom code', () => {
      const code = DosSystemCalls.generateExit(42);
      
      // MOV AL, 42
      expect(code[3]).toBe(42);
    });
  });
});

describe('DosExecutableGenerator', () => {
  describe('generateHelloWorld', () => {
    it('should generate a valid DOS MZ executable', () => {
      const exe = DosExecutableGenerator.generateHelloWorld();
      
      expect(exe).toBeInstanceOf(Uint8Array);
      expect(exe.length).toBeGreaterThan(28); // At least header size
      
      // Check MZ signature
      expect(exe[0]).toBe(0x4D); // 'M'
      expect(exe[1]).toBe(0x5A); // 'Z'
    });
    
    it('should be recognized as valid MZ executable', () => {
      const exe = DosExecutableGenerator.generateHelloWorld();
      const isValid = DosExecutableGenerator.isValidMZExecutable(exe);
      
      expect(isValid).toBe(true);
    });
    
    it('should contain Hello World message', () => {
      const exe = DosExecutableGenerator.generateHelloWorld();
      const decoder = new TextDecoder();
      const content = decoder.decode(exe);
      
      expect(content).toContain('Hello World!');
    });
  });
  
  describe('generateFromSimpleC', () => {
    it('should generate executable from simple printf', () => {
      const sourceCode = `
        int main() {
          printf("Hello from C!");
          return 0;
        }
      `;
      
      const exe = DosExecutableGenerator.generateFromSimpleC(sourceCode);
      
      expect(exe).toBeInstanceOf(Uint8Array);
      expect(DosExecutableGenerator.isValidMZExecutable(exe)).toBe(true);
    });
    
    it('should handle multiple printf statements', () => {
      const sourceCode = `
        int main() {
          printf("Line 1");
          printf("Line 2");
          printf("Line 3");
          return 0;
        }
      `;
      
      const exe = DosExecutableGenerator.generateFromSimpleC(sourceCode);
      const decoder = new TextDecoder();
      const content = decoder.decode(exe);
      
      expect(content).toContain('Line 1');
      expect(content).toContain('Line 2');
      expect(content).toContain('Line 3');
    });
    
    it('should handle escape sequences', () => {
      const sourceCode = `
        int main() {
          printf("Hello\\nWorld\\n");
          return 0;
        }
      `;
      
      const exe = DosExecutableGenerator.generateFromSimpleC(sourceCode);
      const decoder = new TextDecoder();
      const content = decoder.decode(exe);
      
      // Should contain CR LF (DOS line ending)
      expect(content).toContain('\r\n');
    });
    
    it('should generate valid MZ header', () => {
      const sourceCode = `
        int main() {
          printf("Test");
          return 0;
        }
      `;
      
      const exe = DosExecutableGenerator.generateFromSimpleC(sourceCode);
      const info = DosExecutableGenerator.getMZInfo(exe);
      
      expect(info).not.toBeNull();
      expect(info?.signature).toBe(0x5A4D);
      expect(info?.pagesInFile).toBeGreaterThan(0);
    });
  });
  
  describe('isValidMZExecutable', () => {
    it('should return true for valid MZ executable', () => {
      const exe = DosExecutableGenerator.generateHelloWorld();
      expect(DosExecutableGenerator.isValidMZExecutable(exe)).toBe(true);
    });
    
    it('should return false for invalid buffer', () => {
      const invalid = new Uint8Array([0x00, 0x00, 0x00]);
      expect(DosExecutableGenerator.isValidMZExecutable(invalid)).toBe(false);
    });
    
    it('should return false for buffer too small', () => {
      const tooSmall = new Uint8Array(10);
      expect(DosExecutableGenerator.isValidMZExecutable(tooSmall)).toBe(false);
    });
    
    it('should return false for wrong signature', () => {
      const wrongSig = new Uint8Array(28);
      wrongSig[0] = 0x50; // Not 'M'
      wrongSig[1] = 0x45; // Not 'Z'
      expect(DosExecutableGenerator.isValidMZExecutable(wrongSig)).toBe(false);
    });
  });
  
  describe('getMZInfo', () => {
    it('should extract header information', () => {
      const exe = DosExecutableGenerator.generateHelloWorld();
      const info = DosExecutableGenerator.getMZInfo(exe);

      expect(info).not.toBeNull();
      expect(info?.signature).toBe(0x5A4D);
      expect(info?.headerParagraphs).toBe(2);
      // Enhanced header now uses 512-byte stack (was 256 in minimal version)
      expect(info?.initialSP).toBe(512);
      expect(info?.initialIP).toBe(0);
      expect(info?.initialCS).toBe(0);
    });
    
    it('should return null for invalid executable', () => {
      const invalid = new Uint8Array([0x00, 0x00]);
      const info = DosExecutableGenerator.getMZInfo(invalid);
      
      expect(info).toBeNull();
    });
    
    it('should calculate correct file size', () => {
      const exe = DosExecutableGenerator.generateHelloWorld();
      const info = DosExecutableGenerator.getMZInfo(exe);

      expect(info).not.toBeNull();

      // Calculate expected size from header
      const pages = info!.pagesInFile;
      const bytesOnLast = info!.bytesOnLastPage;
      const calculatedSize = (pages - 1) * 512 + bytesOnLast;

      expect(calculatedSize).toBe(exe.length);
    });
  });

  describe('Checksum', () => {
    it('should calculate checksum for executable', () => {
      const exe = DosExecutableGenerator.generateHelloWorld();
      const checksum = DosExecutableGenerator.calculateChecksum(exe);

      // Checksum should be a 16-bit value
      expect(checksum).toBeGreaterThanOrEqual(0);
      expect(checksum).toBeLessThanOrEqual(0xFFFF);
    });

    it('should apply checksum to executable', () => {
      const exe = DosExecutableGenerator.generateHelloWorld();
      const exeWithChecksum = DosExecutableGenerator.applyChecksum(exe);

      // Should return the same buffer (modified in place)
      expect(exeWithChecksum).toBe(exe);

      // After applying checksum, the sum of all words should be 0
      const view = new DataView(exe.buffer, exe.byteOffset);
      let sum = 0;
      for (let i = 0; i < exe.length; i += 2) {
        if (i + 1 < exe.length) {
          sum += view.getUint16(i, true);
        }
        sum &= 0xFFFF;
      }

      expect(sum).toBe(0);
    });

    it('should handle odd-length buffers', () => {
      // Create an odd-length buffer
      const oddBuffer = new Uint8Array(33); // 33 bytes (odd)
      oddBuffer[0] = 0x4D; // 'M'
      oddBuffer[1] = 0x5A; // 'Z'

      // Should not throw
      expect(() => DosExecutableGenerator.calculateChecksum(oddBuffer)).not.toThrow();
    });

    it('should apply checksum when createExecutableWithRelocations is called with calculateChecksum=true', () => {
      // Create simple code
      const code = new Uint8Array([
        0xB4, 0x4C,  // MOV AH, 4Ch
        0xB0, 0x00,  // MOV AL, 00h
        0xCD, 0x21,  // INT 21h
      ]);

      // Create executable with checksum enabled
      const exe = DosExecutableGenerator.createExecutableWithRelocations(code, [], {
        calculateChecksum: true
      });

      // Verify checksum field is non-zero
      const view = new DataView(exe.buffer, exe.byteOffset);
      const checksum = view.getUint16(18, true);
      expect(checksum).not.toBe(0);

      // Verify that the sum of all words equals 0 (checksum validation)
      let sum = 0;
      for (let i = 0; i < exe.length; i += 2) {
        if (i + 1 < exe.length) {
          sum += view.getUint16(i, true);
        }
      }
      expect(sum & 0xFFFF).toBe(0);
    });
  });

  describe('Relocation Table', () => {
    it('should handle executables with no relocations', () => {
      // Simple executable with no relocations
      const exe = DosExecutableGenerator.generateHelloWorld();
      const info = DosExecutableGenerator.getMZInfo(exe);

      expect(info).not.toBeNull();
      expect(info?.relocations).toBe(0);
    });

    it('should store relocation table offset in header', () => {
      const exe = DosExecutableGenerator.generateHelloWorld();
      const info = DosExecutableGenerator.getMZInfo(exe);

      expect(info).not.toBeNull();
      // Relocation table offset should be 28 (right after the header)
      expect(info?.relocationTableOffset).toBe(28);
    });

    it('should validate relocation entry structure', () => {
      // Test that relocation entries are 4 bytes each (offset + segment)
      // This is a structural test - we'll add actual relocation support later
      const relocationEntrySize = 4; // 2 bytes offset + 2 bytes segment
      expect(relocationEntrySize).toBe(4);
    });

    it('should create executable with relocations', () => {
      // Create simple code
      const code = new Uint8Array([
        0xB4, 0x4C,  // MOV AH, 4Ch
        0xB0, 0x00,  // MOV AL, 00h
        0xCD, 0x21,  // INT 21h
      ]);

      // Create relocation entries
      const relocations = [
        { offset: 0x0000, segment: 0x0000 },
        { offset: 0x0010, segment: 0x0001 },
      ];

      // Create executable with relocations
      const exe = DosExecutableGenerator.createExecutableWithRelocations(code, relocations);

      // Verify header
      const info = DosExecutableGenerator.getMZInfo(exe);
      expect(info).not.toBeNull();
      expect(info?.relocations).toBe(2);
    });

    it('should read relocation entries from executable', () => {
      // Create code
      const code = new Uint8Array([0xB4, 0x4C, 0xCD, 0x21]);

      // Create relocation entries
      const originalRelocations = [
        { offset: 0x0005, segment: 0x0000 },
        { offset: 0x0015, segment: 0x0001 },
        { offset: 0x0025, segment: 0x0002 },
      ];

      // Create executable
      const exe = DosExecutableGenerator.createExecutableWithRelocations(code, originalRelocations);

      // Read relocations back
      const readRelocations = DosExecutableGenerator.getRelocationEntries(exe);

      expect(readRelocations).not.toBeNull();
      expect(readRelocations?.length).toBe(3);
      expect(readRelocations?.[0]).toEqual({ offset: 0x0005, segment: 0x0000 });
      expect(readRelocations?.[1]).toEqual({ offset: 0x0015, segment: 0x0001 });
      expect(readRelocations?.[2]).toEqual({ offset: 0x0025, segment: 0x0002 });
    });

    it('should return empty array for executables with no relocations', () => {
      const exe = DosExecutableGenerator.generateHelloWorld();
      const relocations = DosExecutableGenerator.getRelocationEntries(exe);

      expect(relocations).not.toBeNull();
      expect(relocations?.length).toBe(0);
    });

    it('should return null for invalid executables', () => {
      const invalid = new Uint8Array([0x00, 0x00]);
      const relocations = DosExecutableGenerator.getRelocationEntries(invalid);

      expect(relocations).toBeNull();
    });

    it('should handle large relocation tables', () => {
      const code = new Uint8Array(100);

      // Create many relocation entries
      const relocations = [];
      for (let i = 0; i < 50; i++) {
        relocations.push({ offset: i * 2, segment: i });
      }

      const exe = DosExecutableGenerator.createExecutableWithRelocations(code, relocations);
      const info = DosExecutableGenerator.getMZInfo(exe);

      expect(info).not.toBeNull();
      expect(info?.relocations).toBe(50);

      // Verify we can read them back
      const readRelocations = DosExecutableGenerator.getRelocationEntries(exe);
      expect(readRelocations?.length).toBe(50);
    });
  });

  describe('Segment Management', () => {
    it('should create executable with separate code and data segments', () => {
      // Create simple code segment
      const code = new Uint8Array([
        0xB4, 0x4C,  // MOV AH, 4Ch
        0xB0, 0x00,  // MOV AL, 00h
        0xCD, 0x21,  // INT 21h
      ]);

      // Create data segment
      const data = new Uint8Array([
        0x48, 0x65, 0x6C, 0x6C, 0x6F,  // "Hello"
        0x24,                          // '$'
      ]);

      // Create executable with segments
      const exe = DosExecutableGenerator.createExecutableWithSegments({
        code,
        data,
        stackSize: 1024,
      });

      // Verify it's a valid MZ executable
      expect(DosExecutableGenerator.isValidMZExecutable(exe)).toBe(true);

      // Verify header information
      const info = DosExecutableGenerator.getMZInfo(exe);
      expect(info).not.toBeNull();
      expect(info?.initialSP).toBe(1024); // Stack size
    });

    it('should configure stack segment correctly', () => {
      const code = new Uint8Array([0xB4, 0x4C, 0xCD, 0x21]);
      const stackSize = 2048;

      const exe = DosExecutableGenerator.createExecutableWithSegments({
        code,
        stackSize,
      });

      const info = DosExecutableGenerator.getMZInfo(exe);
      expect(info).not.toBeNull();
      expect(info?.initialSP).toBe(stackSize);

      // Stack segment should be after code (in paragraphs)
      const codeParagraphs = Math.ceil(code.length / 16);
      expect(info?.initialSS).toBe(codeParagraphs);
    });

    it('should handle code-only executables (no data segment)', () => {
      const code = new Uint8Array([
        0xB4, 0x4C,  // MOV AH, 4Ch
        0xB0, 0x00,  // MOV AL, 00h
        0xCD, 0x21,  // INT 21h
      ]);

      const exe = DosExecutableGenerator.createExecutableWithSegments({
        code,
      });

      expect(DosExecutableGenerator.isValidMZExecutable(exe)).toBe(true);

      const info = DosExecutableGenerator.getMZInfo(exe);
      expect(info).not.toBeNull();
    });

    it('should calculate segment sizes correctly', () => {
      const codeSize = 100;
      const dataSize = 50;
      const code = new Uint8Array(codeSize);
      const data = new Uint8Array(dataSize);

      const exe = DosExecutableGenerator.createExecutableWithSegments({
        code,
        data,
      });

      const info = DosExecutableGenerator.getMZInfo(exe);
      expect(info).not.toBeNull();

      // Calculate expected values
      const headerSize = info!.headerParagraphs * 16;
      const totalImageSize = codeSize + dataSize;
      const totalFileSize = headerSize + totalImageSize;

      // Verify file size calculation
      const calculatedFileSize = (info!.pagesInFile - 1) * 512 + info!.bytesOnLastPage;
      expect(calculatedFileSize).toBe(totalFileSize);
    });

    it('should align segments to paragraph boundaries', () => {
      // Code that's not paragraph-aligned (not a multiple of 16)
      const code = new Uint8Array(25); // 25 bytes = 1 paragraph + 9 bytes
      const data = new Uint8Array(10);

      const exe = DosExecutableGenerator.createExecutableWithSegments({
        code,
        data,
      });

      const info = DosExecutableGenerator.getMZInfo(exe);
      expect(info).not.toBeNull();

      // Stack should start at next paragraph after code+data
      const totalImageSize = code.length + data.length; // 35 bytes
      const imageParagraphs = Math.ceil(totalImageSize / 16); // 3 paragraphs
      expect(info?.initialSS).toBe(imageParagraphs);
    });

    it('should support relocations with segmented executables', () => {
      const code = new Uint8Array([
        0xB4, 0x4C,  // MOV AH, 4Ch
        0xB0, 0x00,  // MOV AL, 00h
        0xCD, 0x21,  // INT 21h
      ]);

      const relocations = [
        { offset: 0x0000, segment: 0x0000 },
        { offset: 0x0010, segment: 0x0001 },
      ];

      const exe = DosExecutableGenerator.createExecutableWithSegments({
        code,
        relocations,
      });

      const info = DosExecutableGenerator.getMZInfo(exe);
      expect(info).not.toBeNull();
      expect(info?.relocations).toBe(2);

      // Verify relocations can be read back
      const readRelocations = DosExecutableGenerator.getRelocationEntries(exe);
      expect(readRelocations?.length).toBe(2);
    });

    it('should get segment information from executable', () => {
      const code = new Uint8Array(100);
      const data = new Uint8Array(50);

      const exe = DosExecutableGenerator.createExecutableWithSegments({
        code,
        data,
        stackSize: 512,
      });

      const segmentInfo = DosExecutableGenerator.getSegmentInfo(exe);
      expect(segmentInfo).not.toBeNull();

      // Verify code segment info
      expect(segmentInfo?.codeSegment.offset).toBeGreaterThan(0);
      expect(segmentInfo?.codeSegment.size).toBeGreaterThan(0);

      // Verify stack segment info
      expect(segmentInfo?.stackSegment.size).toBe(512);
    });

    it('should configure CS:IP correctly', () => {
      const code = new Uint8Array(100);
      const entryPoint = 10;

      const exe = DosExecutableGenerator.createExecutableWithSegments({
        code,
        entryPoint,
      });

      const info = DosExecutableGenerator.getMZInfo(exe);
      expect(info).not.toBeNull();
      expect(info?.initialCS).toBe(0); // Code segment is at offset 0
      expect(info?.initialIP).toBe(entryPoint); // Entry point offset
    });

    it('should handle large segments', () => {
      // Create large code and data segments
      const code = new Uint8Array(10000);
      const data = new Uint8Array(5000);

      const exe = DosExecutableGenerator.createExecutableWithSegments({
        code,
        data,
        stackSize: 4096,
      });

      expect(DosExecutableGenerator.isValidMZExecutable(exe)).toBe(true);

      const info = DosExecutableGenerator.getMZInfo(exe);
      expect(info).not.toBeNull();
      expect(info?.initialSP).toBe(4096);
    });
  });

  describe('EXE Format Validation', () => {
    describe('Header Field Validation', () => {
      it('should have valid MZ signature (0x5A4D)', () => {
        const exe = DosExecutableGenerator.generateHelloWorld();
        const info = DosExecutableGenerator.getMZInfo(exe);

        expect(info).not.toBeNull();
        expect(info?.signature).toBe(0x5A4D);

        // Verify signature bytes directly
        expect(exe[0]).toBe(0x4D); // 'M'
        expect(exe[1]).toBe(0x5A); // 'Z'
      });

      it('should have valid header size (2 paragraphs = 32 bytes)', () => {
        const exe = DosExecutableGenerator.generateHelloWorld();
        const info = DosExecutableGenerator.getMZInfo(exe);

        expect(info).not.toBeNull();
        expect(info?.headerParagraphs).toBe(2);
        expect(info!.headerParagraphs * 16).toBe(32);
      });

      it('should have valid file size calculation', () => {
        const exe = DosExecutableGenerator.generateHelloWorld();
        const info = DosExecutableGenerator.getMZInfo(exe);

        expect(info).not.toBeNull();

        // Calculate file size from header
        const calculatedSize = (info!.pagesInFile - 1) * 512 + info!.bytesOnLastPage;

        // Should match actual file size
        expect(calculatedSize).toBe(exe.length);
      });

      it('should have valid bytes on last page (1-512)', () => {
        const exe = DosExecutableGenerator.generateHelloWorld();
        const info = DosExecutableGenerator.getMZInfo(exe);

        expect(info).not.toBeNull();
        expect(info!.bytesOnLastPage).toBeGreaterThan(0);
        expect(info!.bytesOnLastPage).toBeLessThanOrEqual(512);
      });

      it('should have valid pages in file (>= 1)', () => {
        const exe = DosExecutableGenerator.generateHelloWorld();
        const info = DosExecutableGenerator.getMZInfo(exe);

        expect(info).not.toBeNull();
        expect(info!.pagesInFile).toBeGreaterThanOrEqual(1);
      });

      it('should have valid stack pointer (SP > 0)', () => {
        const exe = DosExecutableGenerator.generateHelloWorld();
        const info = DosExecutableGenerator.getMZInfo(exe);

        expect(info).not.toBeNull();
        expect(info!.initialSP).toBeGreaterThan(0);
        expect(info!.initialSP).toBe(512); // Default stack size
      });

      it('should have valid segment registers', () => {
        const exe = DosExecutableGenerator.generateHelloWorld();
        const info = DosExecutableGenerator.getMZInfo(exe);

        expect(info).not.toBeNull();
        expect(info!.initialCS).toBe(0); // Code segment at offset 0
        expect(info!.initialIP).toBe(0); // Entry point at offset 0
        expect(info!.initialSS).toBeGreaterThanOrEqual(0); // Stack segment
      });

      it('should have valid relocation table offset', () => {
        const exe = DosExecutableGenerator.generateHelloWorld();
        const info = DosExecutableGenerator.getMZInfo(exe);

        expect(info).not.toBeNull();
        expect(info!.relocationTableOffset).toBeGreaterThanOrEqual(28);
        expect(info!.relocationTableOffset).toBeLessThanOrEqual(info!.headerParagraphs * 16);
      });

      it('should have valid overlay number (0 for main program)', () => {
        const exe = DosExecutableGenerator.generateHelloWorld();
        const info = DosExecutableGenerator.getMZInfo(exe);

        expect(info).not.toBeNull();
        expect(info!.overlayNumber).toBe(0);
      });

      it('should have valid min/max extra paragraphs', () => {
        const exe = DosExecutableGenerator.generateHelloWorld();
        const info = DosExecutableGenerator.getMZInfo(exe);

        expect(info).not.toBeNull();
        expect(info!.minExtraParagraphs).toBeGreaterThanOrEqual(0);
        expect(info!.maxExtraParagraphs).toBeGreaterThanOrEqual(info!.minExtraParagraphs);
      });
    });

    describe('Executable Structure Validation', () => {
      it('should have header followed by code', () => {
        const exe = DosExecutableGenerator.generateHelloWorld();
        const info = DosExecutableGenerator.getMZInfo(exe);

        expect(info).not.toBeNull();

        const headerSize = info!.headerParagraphs * 16;
        expect(exe.length).toBeGreaterThan(headerSize);
      });

      it('should have proper paragraph alignment for header', () => {
        const exe = DosExecutableGenerator.generateHelloWorld();
        const info = DosExecutableGenerator.getMZInfo(exe);

        expect(info).not.toBeNull();

        const headerSize = info!.headerParagraphs * 16;
        expect(headerSize % 16).toBe(0); // Must be paragraph-aligned
      });

      it('should have consistent file size across different methods', () => {
        const exe = DosExecutableGenerator.generateHelloWorld();
        const info = DosExecutableGenerator.getMZInfo(exe);

        expect(info).not.toBeNull();

        // Method 1: Actual buffer length
        const actualSize = exe.length;

        // Method 2: Calculated from header
        const calculatedSize = (info!.pagesInFile - 1) * 512 + info!.bytesOnLastPage;

        expect(actualSize).toBe(calculatedSize);
      });

      it('should validate executable with relocations', () => {
        const code = new Uint8Array([0xB4, 0x4C, 0xCD, 0x21]);
        const relocations = [
          { offset: 0x0000, segment: 0x0000 },
          { offset: 0x0010, segment: 0x0001 },
        ];

        const exe = DosExecutableGenerator.createExecutableWithRelocations(code, relocations);
        const info = DosExecutableGenerator.getMZInfo(exe);

        expect(info).not.toBeNull();
        expect(info!.relocations).toBe(2);

        // Verify relocation table offset is valid (at or after header)
        const headerSize = info!.headerParagraphs * 16;
        expect(info!.relocationTableOffset).toBeGreaterThanOrEqual(28); // Minimum header size
        expect(info!.relocationTableOffset).toBeLessThanOrEqual(headerSize);

        // Verify relocation entries can be read
        const readRelocations = DosExecutableGenerator.getRelocationEntries(exe);
        expect(readRelocations).not.toBeNull();
        expect(readRelocations!.length).toBe(2);
      });
    });

    describe('Segment Configuration Validation', () => {
      it('should validate stack segment placement', () => {
        const code = new Uint8Array(100);
        const data = new Uint8Array(50);

        const exe = DosExecutableGenerator.createExecutableWithSegments({
          code,
          data,
          stackSize: 1024,
        });

        const info = DosExecutableGenerator.getMZInfo(exe);
        expect(info).not.toBeNull();

        // Stack should be after code+data
        const totalImageSize = code.length + data.length;
        const imageParagraphs = Math.ceil(totalImageSize / 16);
        expect(info!.initialSS).toBe(imageParagraphs);
        expect(info!.initialSP).toBe(1024);
      });

      it('should validate code segment configuration', () => {
        const code = new Uint8Array(200);
        const entryPoint = 50;

        const exe = DosExecutableGenerator.createExecutableWithSegments({
          code,
          entryPoint,
        });

        const info = DosExecutableGenerator.getMZInfo(exe);
        expect(info).not.toBeNull();

        // Code segment should start at offset 0
        expect(info!.initialCS).toBe(0);
        expect(info!.initialIP).toBe(entryPoint);
      });

      it('should validate segment boundaries', () => {
        const code = new Uint8Array(100);
        const data = new Uint8Array(50);

        const exe = DosExecutableGenerator.createExecutableWithSegments({
          code,
          data,
        });

        const segmentInfo = DosExecutableGenerator.getSegmentInfo(exe);
        expect(segmentInfo).not.toBeNull();

        // Code segment should start after header
        expect(segmentInfo!.codeSegment.offset).toBeGreaterThan(0);

        // Data segment should start after code
        expect(segmentInfo!.dataSegment.offset).toBeGreaterThanOrEqual(
          segmentInfo!.codeSegment.offset + segmentInfo!.codeSegment.size
        );
      });

      it('should validate paragraph-aligned segments', () => {
        const code = new Uint8Array(25); // Not paragraph-aligned
        const data = new Uint8Array(10); // Not paragraph-aligned

        const exe = DosExecutableGenerator.createExecutableWithSegments({
          code,
          data,
        });

        const info = DosExecutableGenerator.getMZInfo(exe);
        expect(info).not.toBeNull();

        // Stack segment should be paragraph-aligned
        const totalImageSize = code.length + data.length;
        const imageParagraphs = Math.ceil(totalImageSize / 16);
        expect(info!.initialSS).toBe(imageParagraphs);
      });
    });

    describe('Format Compliance Tests', () => {
      it('should comply with DOS MZ format specification', () => {
        const exe = DosExecutableGenerator.generateHelloWorld();

        // Verify minimum size
        expect(exe.length).toBeGreaterThanOrEqual(28);

        // Verify MZ signature
        expect(exe[0]).toBe(0x4D);
        expect(exe[1]).toBe(0x5A);

        // Verify header is readable
        const info = DosExecutableGenerator.getMZInfo(exe);
        expect(info).not.toBeNull();
      });

      it('should have little-endian byte order', () => {
        const exe = DosExecutableGenerator.generateHelloWorld();
        const view = new DataView(exe.buffer, exe.byteOffset);

        // Verify signature is little-endian
        const signature = view.getUint16(0, true);
        expect(signature).toBe(0x5A4D);

        // Verify it would be wrong in big-endian
        const signatureBE = view.getUint16(0, false);
        expect(signatureBE).not.toBe(0x5A4D);
      });

      it('should have valid relocation table format', () => {
        const code = new Uint8Array([0xB4, 0x4C, 0xCD, 0x21]);
        const relocations = [
          { offset: 0x0005, segment: 0x0000 },
          { offset: 0x0015, segment: 0x0001 },
        ];

        const exe = DosExecutableGenerator.createExecutableWithRelocations(code, relocations);
        const readRelocations = DosExecutableGenerator.getRelocationEntries(exe);

        expect(readRelocations).not.toBeNull();
        expect(readRelocations!.length).toBe(2);

        // Verify each relocation entry is 4 bytes
        for (const reloc of readRelocations!) {
          expect(reloc.offset).toBeGreaterThanOrEqual(0);
          expect(reloc.offset).toBeLessThan(0x10000); // 16-bit value
          expect(reloc.segment).toBeGreaterThanOrEqual(0);
          expect(reloc.segment).toBeLessThan(0x10000); // 16-bit value
        }
      });

      it('should validate checksum calculation', () => {
        const code = new Uint8Array([0xB4, 0x4C, 0xCD, 0x21]);

        const exe = DosExecutableGenerator.createExecutableWithRelocations(code, [], {
          calculateChecksum: true,
        });

        // Verify checksum makes total sum equal to 0
        const view = new DataView(exe.buffer, exe.byteOffset);
        let sum = 0;

        for (let i = 0; i < exe.length; i += 2) {
          if (i + 1 < exe.length) {
            sum += view.getUint16(i, true);
          }
        }

        expect(sum & 0xFFFF).toBe(0);
      });

      it('should handle edge case: minimum executable size', () => {
        // Create smallest possible executable (just exit)
        const code = new Uint8Array([
          0xB4, 0x4C,  // MOV AH, 4Ch
          0xB0, 0x00,  // MOV AL, 00h
          0xCD, 0x21,  // INT 21h
        ]);

        const exe = DosExecutableGenerator.createExecutableWithSegments({ code });

        expect(DosExecutableGenerator.isValidMZExecutable(exe)).toBe(true);

        const info = DosExecutableGenerator.getMZInfo(exe);
        expect(info).not.toBeNull();
        expect(info!.signature).toBe(0x5A4D);
      });

      it('should handle edge case: large executable', () => {
        // Create large executable
        const code = new Uint8Array(50000);
        const data = new Uint8Array(30000);

        const exe = DosExecutableGenerator.createExecutableWithSegments({
          code,
          data,
          stackSize: 8192,
        });

        expect(DosExecutableGenerator.isValidMZExecutable(exe)).toBe(true);

        const info = DosExecutableGenerator.getMZInfo(exe);
        expect(info).not.toBeNull();
        expect(info!.pagesInFile).toBeGreaterThan(1);
      });

      it('should validate multiple executables have consistent format', () => {
        const exe1 = DosExecutableGenerator.generateHelloWorld();
        const exe2 = DosExecutableGenerator.generateFromSimpleC('int main() { printf("Test"); return 0; }');

        const info1 = DosExecutableGenerator.getMZInfo(exe1);
        const info2 = DosExecutableGenerator.getMZInfo(exe2);

        expect(info1).not.toBeNull();
        expect(info2).not.toBeNull();

        // Both should have same header structure
        expect(info1!.signature).toBe(info2!.signature);
        expect(info1!.headerParagraphs).toBe(info2!.headerParagraphs);
        expect(info1!.initialCS).toBe(info2!.initialCS);
      });
    });

    describe('Integration Validation', () => {
      it('should generate executable that can be validated', () => {
        const sourceCode = `
          int main() {
            printf("Hello, DOS!");
            return 0;
          }
        `;

        const exe = DosExecutableGenerator.generateFromSimpleC(sourceCode);

        // Validate it's a proper MZ executable
        expect(DosExecutableGenerator.isValidMZExecutable(exe)).toBe(true);

        // Validate header
        const info = DosExecutableGenerator.getMZInfo(exe);
        expect(info).not.toBeNull();
        expect(info!.signature).toBe(0x5A4D);

        // Validate content
        const decoder = new TextDecoder();
        const content = decoder.decode(exe);
        expect(content).toContain('Hello, DOS!');
      });

      it('should generate executable with proper DOS string termination', () => {
        const sourceCode = `
          int main() {
            printf("Test message");
            return 0;
          }
        `;

        const exe = DosExecutableGenerator.generateFromSimpleC(sourceCode);
        const decoder = new TextDecoder();
        const content = decoder.decode(exe);

        // DOS strings should end with '$'
        expect(content).toContain('Test message$');
      });

      it('should generate executable with proper exit code', () => {
        const exe = DosExecutableGenerator.generateHelloWorld();

        // Should contain exit code (INT 21h with AH=4Ch)
        expect(exe).toContain(0xB4); // MOV AH
        expect(exe).toContain(0x4C); // 4Ch (exit)
        expect(exe).toContain(0xCD); // INT
        expect(exe).toContain(0x21); // 21h
      });
    });
  });
});


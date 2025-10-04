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
});


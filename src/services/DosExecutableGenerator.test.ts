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
      expect(info?.initialSP).toBe(0x100);
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
});


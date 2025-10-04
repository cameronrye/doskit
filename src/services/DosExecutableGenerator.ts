/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DOS Executable Generator
 * Generates DOS MZ executable files from compiled code
 * 
 * This is a proof-of-concept implementation that creates minimal DOS executables
 * that can run in js-dos. Future versions will integrate with TCC/Emscripten.
 */

/**
 * DOS MZ Executable Header Structure
 * Reference: https://wiki.osdev.org/MZ
 */
interface MZHeader {
  /** MZ signature (0x5A4D) */
  signature: number;
  /** Bytes on last page of file */
  bytesOnLastPage: number;
  /** Pages in file (512 bytes each) */
  pagesInFile: number;
  /** Relocations */
  relocations: number;
  /** Size of header in paragraphs (16 bytes each) */
  headerParagraphs: number;
  /** Minimum extra paragraphs needed */
  minExtraParagraphs: number;
  /** Maximum extra paragraphs needed */
  maxExtraParagraphs: number;
  /** Initial SS value */
  initialSS: number;
  /** Initial SP value */
  initialSP: number;
  /** Checksum */
  checksum: number;
  /** Initial IP value */
  initialIP: number;
  /** Initial CS value */
  initialCS: number;
  /** File address of relocation table */
  relocationTableOffset: number;
  /** Overlay number */
  overlayNumber: number;
}

/**
 * DOS System Call Interface
 * Maps C standard library functions to DOS INT 21h calls
 */
export class DosSystemCalls {
  /**
   * Generate DOS assembly code for printf()
   * Uses INT 21h, AH=09h (Display String)
   */
  static generatePrintf(message: string): Uint8Array {
    // DOS string must end with '$'
    const dosString = message + '$';
    const encoder = new TextEncoder();
    const stringBytes = encoder.encode(dosString);
    
    // Assembly code:
    // MOV AH, 09h    ; Function 09h - Display String
    // MOV DX, offset ; Offset to string
    // INT 21h        ; Call DOS
    const code = new Uint8Array([
      0xB4, 0x09,           // MOV AH, 09h
      0xBA, 0x00, 0x00,     // MOV DX, offset (will be patched)
      0xCD, 0x21,           // INT 21h
    ]);
    
    return code;
  }
  
  /**
   * Generate DOS assembly code for exit()
   * Uses INT 21h, AH=4Ch (Terminate Program)
   */
  static generateExit(exitCode: number = 0): Uint8Array {
    // Assembly code:
    // MOV AH, 4Ch    ; Function 4Ch - Terminate Program
    // MOV AL, code   ; Exit code
    // INT 21h        ; Call DOS
    return new Uint8Array([
      0xB4, 0x4C,           // MOV AH, 4Ch
      0xB0, exitCode,       // MOV AL, exit_code
      0xCD, 0x21,           // INT 21h
    ]);
  }
}

/**
 * DOS Executable Generator
 * Creates DOS MZ executable files
 */
export class DosExecutableGenerator {
  /**
   * Create a minimal DOS MZ header
   */
  private static createMZHeader(codeSize: number): Uint8Array {
    const header = new Uint8Array(28); // Minimum MZ header size
    const view = new DataView(header.buffer);
    
    // MZ signature (0x5A4D = "MZ")
    view.setUint16(0, 0x5A4D, true); // Little-endian
    
    // Calculate file size in pages (512 bytes each)
    const totalSize = 28 + codeSize; // Header + code
    const pages = Math.ceil(totalSize / 512);
    const bytesOnLastPage = totalSize % 512 || 512;
    
    view.setUint16(2, bytesOnLastPage, true);  // Bytes on last page
    view.setUint16(4, pages, true);            // Pages in file
    view.setUint16(6, 0, true);                // Relocations (none)
    view.setUint16(8, 2, true);                // Header size in paragraphs (28 bytes = 2 paragraphs rounded up)
    view.setUint16(10, 0, true);               // Min extra paragraphs
    view.setUint16(12, 0xFFFF, true);          // Max extra paragraphs
    view.setUint16(14, 0, true);               // Initial SS
    view.setUint16(16, 0x100, true);           // Initial SP (256 bytes stack)
    view.setUint16(18, 0, true);               // Checksum (not used)
    view.setUint16(20, 0, true);               // Initial IP (start at 0)
    view.setUint16(22, 0, true);               // Initial CS (code segment)
    view.setUint16(24, 0x1C, true);            // Relocation table offset
    view.setUint16(26, 0, true);               // Overlay number
    
    return header;
  }
  
  /**
   * Generate a simple "Hello World" DOS executable
   * This is a proof-of-concept that demonstrates DOS executable generation
   */
  static generateHelloWorld(): Uint8Array {
    // DOS assembly code for "Hello World"
    // This is hand-crafted 16-bit x86 assembly
    const code = new Uint8Array([
      // Set up data segment
      0xB4, 0x09,                    // MOV AH, 09h (Display String)
      0xBA, 0x0E, 0x00,              // MOV DX, 000Eh (offset to message)
      0xCD, 0x21,                    // INT 21h (DOS call)
      
      // Exit program
      0xB4, 0x4C,                    // MOV AH, 4Ch (Terminate)
      0xB0, 0x00,                    // MOV AL, 00h (exit code 0)
      0xCD, 0x21,                    // INT 21h (DOS call)
      
      // Message data (must end with '$')
      0x48, 0x65, 0x6C, 0x6C, 0x6F,  // "Hello"
      0x20,                          // " "
      0x57, 0x6F, 0x72, 0x6C, 0x64,  // "World"
      0x21,                          // "!"
      0x0D, 0x0A,                    // CR LF
      0x24,                          // '$' (DOS string terminator)
    ]);
    
    // Create MZ header
    const header = this.createMZHeader(code.length);
    
    // Combine header and code
    const executable = new Uint8Array(header.length + code.length);
    executable.set(header, 0);
    executable.set(code, header.length);
    
    return executable;
  }
  
  /**
   * Generate a DOS executable from C-like pseudo-code
   * This is a simplified version for proof-of-concept
   *
   * @param sourceCode - Simple C-like code (very limited subset)
   * @returns DOS MZ executable
   */
  static generateFromSimpleC(sourceCode: string): Uint8Array {
    // For POC, we'll support a very limited subset:
    // - printf("message");
    // - return 0;
    // Generate an MZ executable (more compatible and testable than COM)

    const printfMatches = sourceCode.matchAll(/printf\s*\(\s*"([^"]*)"\s*\)/g);
    const messages: string[] = [];

    for (const match of printfMatches) {
      messages.push(match[1]);
    }

    // Convert messages to DOS format
    const dosMessages = messages.map(message =>
      message
        .replace(/\\n/g, '\r\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
    );

    // Calculate sizes first
    const printCodeSize = 7; // Each printf is 7 bytes (MOV AH, MOV DX, INT)
    const exitCodeSize = 6;  // Exit is 6 bytes (MOV AH, MOV AL, INT)
    const totalPrintCode = messages.length * printCodeSize;
    const totalCodeBeforeData = totalPrintCode + exitCodeSize;

    // Build code segments
    const codeSegments: Uint8Array[] = [];

    // Generate print code for each message
    let dataOffset = totalCodeBeforeData;
    for (const dosMessage of dosMessages) {
      const messageBytes = new TextEncoder().encode(dosMessage + '$');
      // For MZ executables, use relative offset from start of code segment (no PSP offset)
      const relativeOffset = dataOffset;

      const printCode = new Uint8Array([
        0xB4, 0x09,                           // MOV AH, 09h
        0xBA, relativeOffset & 0xFF,          // MOV DX, offset (low byte)
              (relativeOffset >> 8) & 0xFF,   // (high byte)
        0xCD, 0x21,                           // INT 21h
      ]);

      codeSegments.push(printCode);
      dataOffset += messageBytes.length;
    }

    // Add exit code
    const exitCode = DosSystemCalls.generateExit(0);
    codeSegments.push(exitCode);

    // Add message data
    for (const dosMessage of dosMessages) {
      const messageBytes = new TextEncoder().encode(dosMessage + '$');
      codeSegments.push(messageBytes);
    }

    // Calculate total code size
    const totalCodeSize = codeSegments.reduce((sum, seg) => sum + seg.length, 0);

    // Create MZ executable with header
    const code = new Uint8Array(totalCodeSize);
    let offset = 0;
    for (const segment of codeSegments) {
      code.set(segment, offset);
      offset += segment.length;
    }

    // Create MZ header
    const header = this.createMZHeader(code.length);

    // Combine header and code
    const executable = new Uint8Array(header.length + code.length);
    executable.set(header, 0);
    executable.set(code, header.length);

    return executable;
  }
  
  /**
   * Validate that a buffer is a valid DOS MZ executable
   */
  static isValidMZExecutable(buffer: Uint8Array): boolean {
    if (buffer.length < 28) return false;
    
    const view = new DataView(buffer.buffer);
    const signature = view.getUint16(0, true);
    
    return signature === 0x5A4D; // "MZ"
  }
  
  /**
   * Get information about a DOS MZ executable
   */
  static getMZInfo(buffer: Uint8Array): MZHeader | null {
    if (!this.isValidMZExecutable(buffer)) return null;
    
    const view = new DataView(buffer.buffer);
    
    return {
      signature: view.getUint16(0, true),
      bytesOnLastPage: view.getUint16(2, true),
      pagesInFile: view.getUint16(4, true),
      relocations: view.getUint16(6, true),
      headerParagraphs: view.getUint16(8, true),
      minExtraParagraphs: view.getUint16(10, true),
      maxExtraParagraphs: view.getUint16(12, true),
      initialSS: view.getUint16(14, true),
      initialSP: view.getUint16(16, true),
      checksum: view.getUint16(18, true),
      initialIP: view.getUint16(20, true),
      initialCS: view.getUint16(22, true),
      relocationTableOffset: view.getUint16(24, true),
      overlayNumber: view.getUint16(26, true),
    };
  }
}


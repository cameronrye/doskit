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
 *
 * The MZ header is 28 bytes minimum, but typically 32+ bytes to align to paragraph boundary.
 * All multi-byte values are stored in little-endian format.
 */
interface MZHeader {
  /** MZ signature (0x5A4D) - "MZ" in ASCII */
  signature: number;
  /** Bytes on last page of file (0 means 512) */
  bytesOnLastPage: number;
  /** Pages in file (512 bytes each) */
  pagesInFile: number;
  /** Number of relocation entries */
  relocations: number;
  /** Size of header in paragraphs (16 bytes each) */
  headerParagraphs: number;
  /** Minimum extra paragraphs needed beyond program image */
  minExtraParagraphs: number;
  /** Maximum extra paragraphs needed (0xFFFF = as much as possible) */
  maxExtraParagraphs: number;
  /** Initial SS value (relative to start of load segment) */
  initialSS: number;
  /** Initial SP value (stack pointer) */
  initialSP: number;
  /** Checksum (sum of all words in file should be 0) */
  checksum: number;
  /** Initial IP value (instruction pointer - entry point offset) */
  initialIP: number;
  /** Initial CS value (relative to start of load segment) */
  initialCS: number;
  /** File address of relocation table */
  relocationTableOffset: number;
  /** Overlay number (0 = main program) */
  overlayNumber: number;
}

/**
 * DOS Relocation Entry
 * Each entry is 4 bytes: 2 bytes offset, 2 bytes segment
 * Points to a location in the executable that needs to be adjusted when loaded
 */
interface RelocationEntry {
  /** Offset within the segment (2 bytes) */
  offset: number;
  /** Segment value (2 bytes) */
  segment: number;
}

/**
 * Configuration for MZ executable generation
 */
interface MZConfig {
  /** Size of code segment in bytes */
  codeSize: number;
  /** Size of data segment in bytes (0 if code and data are combined) */
  dataSize?: number;
  /** Size of stack in bytes (default: 512) */
  stackSize?: number;
  /** Relocation entries (default: []) */
  relocations?: RelocationEntry[];
  /** Entry point offset (default: 0) */
  entryPoint?: number;
  /** Calculate checksum (default: false, as DOS ignores it) */
  calculateChecksum?: boolean;
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
  static generatePrintf(_message: string): Uint8Array {
    // Assembly code:
    // MOV AH, 09h    ; Function 09h - Display String
    // Note: DOS string must end with '$' (handled by caller)
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
   * Create a minimal DOS MZ header (legacy method for backward compatibility)
   */
  private static createMZHeader(codeSize: number): Uint8Array {
    return this.createEnhancedMZHeader({ codeSize });
  }

  /**
   * Create an enhanced DOS MZ header with full field support
   *
   * This method generates a complete MZ header with proper:
   * - File size calculation (pages and bytes on last page)
   * - Relocation table offset
   * - Stack segment configuration (SS:SP)
   * - Memory allocation requirements (min/max paragraphs)
   * - Optional checksum calculation
   *
   * @param config - Configuration for the MZ executable
   * @returns Complete MZ header (32 bytes minimum)
   */
  private static createEnhancedMZHeader(config: MZConfig): Uint8Array {
    const {
      codeSize,
      dataSize = 0,
      stackSize = 512,
      relocations = [],
      entryPoint = 0,
      calculateChecksum = false,
    } = config;

    const relocationCount = relocations.length;

    // Header is 32 bytes (2 paragraphs) to align to paragraph boundary
    const headerSize = 32;
    const headerParagraphs = headerSize / 16;

    // Calculate total program image size (code + data, excluding stack)
    const imageSize = codeSize + dataSize;

    // Calculate total file size (header + image)
    const totalFileSize = headerSize + imageSize;

    // Calculate pages (512 bytes each) and bytes on last page
    const pages = Math.ceil(totalFileSize / 512);
    const bytesOnLastPage = totalFileSize % 512 || 512;

    // Calculate memory requirements in paragraphs
    // Minimum: just enough for the program image
    const minExtraParagraphs = 0; // We don't need extra memory beyond the image

    // Maximum: request as much as possible (standard practice)
    const maxExtraParagraphs = 0xFFFF;

    // Stack configuration
    // Place stack after code+data, in its own segment
    const imageParagraphs = Math.ceil(imageSize / 16);

    // SS is relative to load segment, points to stack segment
    // For simple executables, stack comes after the code+data
    const initialSS = imageParagraphs;

    // SP points to top of stack (stack grows downward)
    const initialSP = stackSize;

    // CS is relative to load segment (0 for simple executables)
    const initialCS = 0;

    // IP is the entry point offset within the code segment
    const initialIP = entryPoint;

    // Relocation table offset
    // If we have relocations, place table after the full header (32 bytes)
    // If no relocations, use standard offset of 28 (though it doesn't matter)
    const relocationTableOffset = relocationCount > 0 ? headerSize : 28;

    // Create header buffer
    const header = new Uint8Array(headerSize);
    const view = new DataView(header.buffer);

    // Write all header fields (little-endian)
    view.setUint16(0, 0x5A4D, true);                    // Signature: "MZ"
    view.setUint16(2, bytesOnLastPage, true);           // Bytes on last page
    view.setUint16(4, pages, true);                     // Pages in file
    view.setUint16(6, relocationCount, true);           // Relocation entries
    view.setUint16(8, headerParagraphs, true);          // Header size in paragraphs
    view.setUint16(10, minExtraParagraphs, true);       // Min extra paragraphs
    view.setUint16(12, maxExtraParagraphs, true);       // Max extra paragraphs
    view.setUint16(14, initialSS, true);                // Initial SS
    view.setUint16(16, initialSP, true);                // Initial SP
    view.setUint16(18, 0, true);                        // Checksum (will be calculated if requested)
    view.setUint16(20, initialIP, true);                // Initial IP
    view.setUint16(22, initialCS, true);                // Initial CS
    view.setUint16(24, relocationTableOffset, true);    // Relocation table offset
    view.setUint16(26, 0, true);                        // Overlay number (0 = main)
    // Bytes 28-31 are reserved/padding (already zero)

    // Calculate checksum if requested
    if (calculateChecksum) {
      // Note: DOS typically ignores the checksum, so this is optional
      // The checksum is calculated such that the sum of all words in the file equals 0
      // Checksum will be applied to the complete executable in createMZExecutable()
      // when all parts (header + relocation table + code) are assembled
    }

    return header;
  }

  /**
   * Generate relocation table from relocation entries
   * Each entry is 4 bytes: 2 bytes offset + 2 bytes segment (little-endian)
   *
   * @param relocations Array of relocation entries
   * @returns Uint8Array containing the relocation table
   */
  private static generateRelocationTable(relocations: RelocationEntry[]): Uint8Array {
    // Each relocation entry is 4 bytes
    const tableSize = relocations.length * 4;
    const table = new Uint8Array(tableSize);
    const view = new DataView(table.buffer);

    // Write each relocation entry
    for (let i = 0; i < relocations.length; i++) {
      const entry = relocations[i];
      const offset = i * 4;

      // Write offset (2 bytes, little-endian)
      view.setUint16(offset, entry.offset, true);

      // Write segment (2 bytes, little-endian)
      view.setUint16(offset + 2, entry.segment, true);
    }

    return table;
  }

  /**
   * Create a complete MZ executable with header, relocation table, and code
   *
   * @param config Configuration for the executable
   * @param code Code/data to include in the executable
   * @returns Complete MZ executable
   */
  private static createMZExecutable(config: MZConfig, code: Uint8Array): Uint8Array {
    const relocations = config.relocations || [];
    const calculateChecksum = config.calculateChecksum || false;

    // Generate header
    const header = this.createEnhancedMZHeader(config);

    // Generate relocation table (if any relocations exist)
    const relocationTable = relocations.length > 0
      ? this.generateRelocationTable(relocations)
      : new Uint8Array(0);

    // Calculate total size
    const totalSize = header.length + relocationTable.length + code.length;

    // Combine all parts
    const executable = new Uint8Array(totalSize);
    let offset = 0;

    // Copy header
    executable.set(header, offset);
    offset += header.length;

    // Copy relocation table (if present)
    if (relocationTable.length > 0) {
      executable.set(relocationTable, offset);
      offset += relocationTable.length;
    }

    // Copy code
    executable.set(code, offset);

    // Apply checksum if requested
    if (calculateChecksum) {
      this.applyChecksum(executable);
    }

    return executable;
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
    // DOS INT 21h AH=09h needs CR+LF for proper line breaks
    const dosMessages = messages.map(message =>
      message
        .replace(/\\n/g, '\r\n')  // Convert \n to CR+LF for DOS
        .replace(/\\t/g, '\t')     // Convert \t to tab
        .replace(/\\r/g, '\r')     // Convert \r to CR
    );

    // Calculate sizes first
    const dsSetupSize = 4;   // 4 bytes for DS setup (MOV AX,CS; MOV DS,AX)
    const printCodeSize = 7; // Each printf is 7 bytes (MOV AH, MOV DX, INT)
    const exitCodeSize = 6;  // Exit is 6 bytes (MOV AH, MOV AL, INT)
    const totalPrintCode = messages.length * printCodeSize;

    // Data starts AFTER: DS setup + all print code + exit code
    const totalCodeBeforeData = dsSetupSize + totalPrintCode + exitCodeSize;

    // Build code segments
    const codeSegments: Uint8Array[] = [];

    // CRITICAL: Set up DS register to point to code segment
    // When MZ executable starts, DS points to PSP, not our code segment
    // We need DS = CS for INT 21h AH=09h to find our strings
    const setupDS = new Uint8Array([
      0x8C, 0xC8,  // MOV AX, CS    ; Get code segment into AX
      0x8E, 0xD8,  // MOV DS, AX    ; Set DS = CS
    ]);
    codeSegments.push(setupDS);

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

  /**
   * Calculate DOS MZ executable checksum
   *
   * The checksum is calculated such that the sum of all 16-bit words
   * in the file (including the checksum field itself) equals 0.
   *
   * Note: DOS typically ignores this field, so it's rarely used in practice.
   *
   * @param executable - Complete executable buffer (header + code)
   * @returns Checksum value to store in header
   */
  static calculateChecksum(executable: Uint8Array): number {
    // Ensure buffer length is even (pad with 0 if needed)
    const buffer = executable.length % 2 === 0
      ? executable
      : new Uint8Array([...executable, 0]);

    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    // Sum all 16-bit words in the file
    let sum = 0;
    for (let i = 0; i < buffer.length; i += 2) {
      // Skip the checksum field itself (offset 18)
      if (i === 18) continue;

      sum += view.getUint16(i, true);
      // Keep sum in 16-bit range
      sum &= 0xFFFF;
    }

    // Calculate checksum: negate the sum so total equals 0
    const checksum = (-sum) & 0xFFFF;

    return checksum;
  }

  /**
   * Apply checksum to an executable buffer
   *
   * @param executable - Complete executable buffer (header + code)
   * @returns Modified executable with checksum applied
   */
  static applyChecksum(executable: Uint8Array): Uint8Array {
    const checksum = this.calculateChecksum(executable);
    const view = new DataView(executable.buffer, executable.byteOffset);
    view.setUint16(18, checksum, true);
    return executable;
  }

  /**
   * Read relocation entries from an executable
   *
   * @param executable - Complete executable buffer
   * @returns Array of relocation entries, or null if invalid
   */
  static getRelocationEntries(executable: Uint8Array): RelocationEntry[] | null {
    const info = this.getMZInfo(executable);
    if (!info) return null;

    const relocationCount = info.relocations;
    if (relocationCount === 0) return [];

    const relocationTableOffset = info.relocationTableOffset;
    const entries: RelocationEntry[] = [];

    const view = new DataView(executable.buffer, executable.byteOffset);

    // Read each relocation entry (4 bytes each)
    for (let i = 0; i < relocationCount; i++) {
      const entryOffset = relocationTableOffset + (i * 4);

      // Ensure we don't read past the buffer
      if (entryOffset + 4 > executable.length) {
        console.warn(`Relocation entry ${i} extends past buffer end`);
        break;
      }

      const offset = view.getUint16(entryOffset, true);
      const segment = view.getUint16(entryOffset + 2, true);

      entries.push({ offset, segment });
    }

    return entries;
  }

  /**
   * Create an executable with custom relocations
   * This is useful for testing and advanced executable generation
   *
   * @param code - Code/data bytes
   * @param relocations - Relocation entries
   * @param options - Additional configuration options
   * @returns Complete MZ executable with relocations
   */
  static createExecutableWithRelocations(
    code: Uint8Array,
    relocations: RelocationEntry[],
    options: Partial<MZConfig> = {}
  ): Uint8Array {
    const config: MZConfig = {
      codeSize: code.length,
      relocations,
      ...options,
    };

    return this.createMZExecutable(config, code);
  }
}


/**
 * DosKit - FileSystemService Tests
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileSystemService } from './FileSystemService';
import type { CommandInterface } from '../types/js-dos';

describe('FileSystemService', () => {
  let mockCI: CommandInterface;
  let fs: FileSystemService;

  beforeEach(() => {
    // Create mock CommandInterface
    mockCI = {
      fsWriteFile: vi.fn().mockResolvedValue(undefined),
      fsReadFile: vi.fn().mockResolvedValue(new Uint8Array([72, 101, 108, 108, 111])), // "Hello"
      fsDeleteFile: vi.fn().mockResolvedValue(undefined),
      fsTree: vi.fn().mockResolvedValue({
        nodes: {
          C: {
            nodes: {
              PROJECT: {
                nodes: {
                  'test.c': { size: 100 },
                  'main.c': { size: 200 },
                },
              },
            },
          },
        },
      }),
    } as unknown as CommandInterface;

    fs = new FileSystemService(mockCI);
  });

  describe('writeTextFile', () => {
    it('should write text file with correct encoding', async () => {
      const content = 'Hello, DOS!';
      await fs.writeTextFile('/C/test.txt', content);

      expect(mockCI.fsWriteFile).toHaveBeenCalled();

      // Verify the content was encoded correctly
      const call = (mockCI.fsWriteFile as any).mock.calls[0];
      expect(call[0]).toBe('/C/test.txt');
      const encodedData = call[1];
      // Check it's a Uint8Array-like object
      expect(encodedData).toBeDefined();
      expect(encodedData.length).toBeGreaterThan(0);
      const decoder = new TextDecoder();
      expect(decoder.decode(encodedData)).toBe(content);
    });

    it('should handle special characters', async () => {
      const content = 'Special: ñ, é, ü, 中文';
      await fs.writeTextFile('/C/special.txt', content);

      const call = (mockCI.fsWriteFile as any).mock.calls[0];
      const encodedData = call[1];
      const decoder = new TextDecoder();
      expect(decoder.decode(encodedData)).toBe(content);
    });
  });

  describe('readTextFile', () => {
    it('should read and decode text file', async () => {
      const content = await fs.readTextFile('/C/test.txt');
      expect(content).toBe('Hello');
      expect(mockCI.fsReadFile).toHaveBeenCalledWith('/C/test.txt');
    });

    it('should throw error when file not found', async () => {
      (mockCI.fsReadFile as any).mockRejectedValueOnce(new Error('File not found'));

      await expect(fs.readTextFile('/C/missing.txt')).rejects.toThrow(
        'Failed to read file: /C/missing.txt'
      );
    });
  });

  describe('writeBinaryFile', () => {
    it('should write binary data', async () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      await fs.writeBinaryFile('/C/binary.dat', data);

      expect(mockCI.fsWriteFile).toHaveBeenCalledWith('/C/binary.dat', data);
    });
  });

  describe('readBinaryFile', () => {
    it('should read binary data', async () => {
      const data = await fs.readBinaryFile('/C/test.bin');
      expect(data).toBeInstanceOf(Uint8Array);
      expect(mockCI.fsReadFile).toHaveBeenCalledWith('/C/test.bin');
    });

    it('should throw error when binary file not found', async () => {
      (mockCI.fsReadFile as any).mockRejectedValueOnce(new Error('File not found'));

      await expect(fs.readBinaryFile('/C/missing.bin')).rejects.toThrow(
        'Failed to read binary file: /C/missing.bin'
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete file', async () => {
      await fs.deleteFile('/C/test.txt');
      expect(mockCI.fsDeleteFile).toHaveBeenCalledWith('/C/test.txt');
    });

    it('should throw error when delete fails', async () => {
      (mockCI.fsDeleteFile as any).mockRejectedValueOnce(new Error('Delete failed'));

      await expect(fs.deleteFile('/C/test.txt')).rejects.toThrow(
        'Failed to delete file: /C/test.txt'
      );
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      const exists = await fs.fileExists('/C/test.txt');
      expect(exists).toBe(true);
    });

    it('should return false when file does not exist', async () => {
      (mockCI.fsReadFile as any).mockRejectedValueOnce(new Error('File not found'));

      const exists = await fs.fileExists('/C/missing.txt');
      expect(exists).toBe(false);
    });
  });

  describe('getFileTree', () => {
    it('should return filesystem tree', async () => {
      const tree = await fs.getFileTree();
      expect(tree).toBeDefined();
      expect(tree.nodes).toBeDefined();
      expect(tree.nodes.C).toBeDefined();
    });

    it('should throw error when tree retrieval fails', async () => {
      (mockCI.fsTree as any).mockRejectedValueOnce(new Error('Tree failed'));

      await expect(fs.getFileTree()).rejects.toThrow('Failed to get file tree');
    });
  });

  describe('ensureDirectory', () => {
    it('should create directory by writing placeholder', async () => {
      await fs.ensureDirectory('/C/NEWDIR');
      expect(mockCI.fsWriteFile).toHaveBeenCalled();
      const call = (mockCI.fsWriteFile as any).mock.calls[0];
      expect(call[0]).toBe('/C/NEWDIR/.keep');
      // Check that some data was written (even if empty)
      expect(call[1]).toBeDefined();
    });
  });

  describe('normalizePath', () => {
    it('should convert backslashes to forward slashes', () => {
      expect(fs.normalizePath('C:\\TEST\\FILE.TXT')).toBe('/C/TEST/FILE.TXT');
    });

    it('should ensure path starts with /', () => {
      expect(fs.normalizePath('C/TEST/FILE.TXT')).toBe('/C/TEST/FILE.TXT');
    });

    it('should remove duplicate slashes', () => {
      expect(fs.normalizePath('/C//TEST///FILE.TXT')).toBe('/C/TEST/FILE.TXT');
    });

    it('should handle already normalized paths', () => {
      expect(fs.normalizePath('/C/TEST/FILE.TXT')).toBe('/C/TEST/FILE.TXT');
    });
  });

  describe('getFileExtension', () => {
    it('should return file extension', () => {
      expect(fs.getFileExtension('test.c')).toBe('c');
      expect(fs.getFileExtension('program.exe')).toBe('exe');
      expect(fs.getFileExtension('archive.tar.gz')).toBe('gz');
    });

    it('should return empty string for files without extension', () => {
      expect(fs.getFileExtension('README')).toBe('');
    });

    it('should return lowercase extension', () => {
      expect(fs.getFileExtension('TEST.C')).toBe('c');
    });
  });

  describe('getFileNameWithoutExtension', () => {
    it('should return filename without extension', () => {
      expect(fs.getFileNameWithoutExtension('test.c')).toBe('test');
      expect(fs.getFileNameWithoutExtension('program.exe')).toBe('program');
    });

    it('should handle files with multiple dots', () => {
      expect(fs.getFileNameWithoutExtension('archive.tar.gz')).toBe('archive.tar');
    });

    it('should return full name for files without extension', () => {
      expect(fs.getFileNameWithoutExtension('README')).toBe('README');
    });
  });

  describe('joinPath', () => {
    it('should join path components', () => {
      expect(fs.joinPath('/C', 'PROJECT', 'test.c')).toBe('/C/PROJECT/test.c');
    });

    it('should normalize joined path', () => {
      expect(fs.joinPath('C', 'PROJECT', 'test.c')).toBe('/C/PROJECT/test.c');
    });

    it('should handle empty components', () => {
      expect(fs.joinPath('/C', '', 'test.c')).toBe('/C/test.c');
    });
  });

  describe('getDirName', () => {
    it('should return directory name', () => {
      expect(fs.getDirName('/C/PROJECT/test.c')).toBe('/C/PROJECT');
    });

    it('should return / for root level files', () => {
      expect(fs.getDirName('/test.c')).toBe('/');
    });

    it('should handle paths with backslashes', () => {
      expect(fs.getDirName('C:\\PROJECT\\test.c')).toBe('/C/PROJECT');
    });
  });

  describe('getBaseName', () => {
    it('should return base name', () => {
      expect(fs.getBaseName('/C/PROJECT/test.c')).toBe('test.c');
    });

    it('should handle root level files', () => {
      expect(fs.getBaseName('/test.c')).toBe('test.c');
    });

    it('should normalize path before extracting', () => {
      expect(fs.getBaseName('C:\\PROJECT\\test.c')).toBe('test.c');
    });
  });

  describe('listDirectory', () => {
    it('should list files in directory', async () => {
      const files = await fs.listDirectory('/C/PROJECT');
      expect(files).toContain('test.c');
      expect(files).toContain('main.c');
    });

    it('should return empty array for non-existent directory', async () => {
      const files = await fs.listDirectory('/C/MISSING');
      expect(files).toEqual([]);
    });

    it('should handle root directory', async () => {
      const files = await fs.listDirectory('/C');
      expect(files).toContain('PROJECT');
    });
  });

  describe('getFileSize', () => {
    it('should return file size', async () => {
      const size = await fs.getFileSize('/C/PROJECT/test.c');
      expect(size).toBe(100);
    });

    it('should return 0 for non-existent file', async () => {
      const size = await fs.getFileSize('/C/MISSING.txt');
      expect(size).toBe(0);
    });
  });
});


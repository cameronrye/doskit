/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * File System Service
 * Abstracts js-dos filesystem operations for easier use
 */

import type { CommandInterface, FsNode } from '../types/js-dos';

/**
 * Service for managing DOS filesystem operations
 */
export class FileSystemService {
  private ci: CommandInterface;

  constructor(commandInterface: CommandInterface) {
    this.ci = commandInterface;
  }

  /**
   * Write a text file to the DOS filesystem
   */
  async writeTextFile(path: string, content: string): Promise<void> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    await this.ci.fsWriteFile(path, data);
  }

  /**
   * Read a text file from the DOS filesystem
   */
  async readTextFile(path: string): Promise<string> {
    try {
      const data = await this.ci.fsReadFile(path);
      const decoder = new TextDecoder();
      return decoder.decode(data);
    } catch (error) {
      console.error(`Failed to read file ${path}:`, error);
      throw new Error(`Failed to read file: ${path}`);
    }
  }

  /**
   * Write a binary file to the DOS filesystem
   */
  async writeBinaryFile(path: string, data: Uint8Array): Promise<void> {
    await this.ci.fsWriteFile(path, data);
  }

  /**
   * Read a binary file from the DOS filesystem
   */
  async readBinaryFile(path: string): Promise<Uint8Array> {
    try {
      return await this.ci.fsReadFile(path);
    } catch (error) {
      console.error(`Failed to read binary file ${path}:`, error);
      throw new Error(`Failed to read binary file: ${path}`);
    }
  }

  /**
   * Delete a file from the DOS filesystem
   */
  async deleteFile(path: string): Promise<void> {
    try {
      await this.ci.fsDeleteFile(path);
    } catch (error) {
      console.error(`Failed to delete file ${path}:`, error);
      throw new Error(`Failed to delete file: ${path}`);
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      await this.ci.fsReadFile(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a directory
   * Note: js-dos doesn't have a direct mkdir command, so we create a dummy file
   * in the directory to ensure it exists
   */
  async createDirectory(path: string): Promise<void> {
    try {
      // Create a dummy file in the directory to ensure it exists
      const dummyFile = `${path}/.keep`;
      await this.writeTextFile(dummyFile, '');
    } catch (error) {
      console.error(`Failed to create directory ${path}:`, error);
      throw new Error(`Failed to create directory: ${path}`);
    }
  }

  /**
   * Get the filesystem tree
   */
  async getFileTree(): Promise<FsNode> {
    try {
      return await this.ci.fsTree();
    } catch (error) {
      console.error('Failed to get file tree:', error);
      throw new Error('Failed to get file tree');
    }
  }

  /**
   * Create a directory structure by writing a placeholder file
   * (DOS filesystem in js-dos creates directories as needed)
   */
  async ensureDirectory(path: string): Promise<void> {
    // js-dos automatically creates directories when writing files
    // We can write a placeholder file to ensure the directory exists
    const placeholderPath = `${path}/.keep`;
    await this.writeTextFile(placeholderPath, '');
  }

  /**
   * Normalize DOS path (ensure it starts with / and uses forward slashes)
   */
  normalizePath(path: string): string {
    // Convert backslashes to forward slashes
    let normalized = path.replace(/\\/g, '/');

    // Remove drive letter colons (C: -> C)
    normalized = normalized.replace(/^\/([A-Za-z]):/, '/$1');
    normalized = normalized.replace(/^([A-Za-z]):/, '$1');

    // Ensure path starts with /
    if (!normalized.startsWith('/')) {
      normalized = '/' + normalized;
    }

    // Remove duplicate slashes
    normalized = normalized.replace(/\/+/g, '/');

    return normalized;
  }

  /**
   * Get file extension
   */
  getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Get filename without extension
   */
  getFileNameWithoutExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length > 1) {
      parts.pop();
    }
    return parts.join('.');
  }

  /**
   * Join path components
   */
  joinPath(...parts: string[]): string {
    const joined = parts.join('/');
    return this.normalizePath(joined);
  }

  /**
   * Get directory name from path
   */
  getDirName(path: string): string {
    const normalized = this.normalizePath(path);
    const parts = normalized.split('/');
    parts.pop();
    return parts.join('/') || '/';
  }

  /**
   * Get base name from path
   */
  getBaseName(path: string): string {
    const normalized = this.normalizePath(path);
    const parts = normalized.split('/');
    return parts[parts.length - 1];
  }

  /**
   * List files in a directory (from filesystem tree)
   */
  async listDirectory(path: string): Promise<string[]> {
    const tree = await this.getFileTree();
    const normalized = this.normalizePath(path);
    
    // Navigate to the directory in the tree
    const parts = normalized.split('/').filter(p => p);
    let current = tree;
    
    for (const part of parts) {
      if (current.nodes && current.nodes[part]) {
        current = current.nodes[part];
      } else {
        return [];
      }
    }
    
    // Return list of files/directories
    if (current.nodes) {
      return Object.keys(current.nodes);
    }
    
    return [];
  }

  /**
   * Get file size (from filesystem tree)
   */
  async getFileSize(path: string): Promise<number> {
    const tree = await this.getFileTree();
    const normalized = this.normalizePath(path);
    
    // Navigate to the file in the tree
    const parts = normalized.split('/').filter(p => p);
    let current = tree;
    
    for (const part of parts) {
      if (current.nodes && current.nodes[part]) {
        current = current.nodes[part];
      } else {
        return 0;
      }
    }
    
    return current.size || 0;
  }
}


/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * TypeScript type definitions for project management
 */

import { Project, ProjectFile, ProjectTemplate } from './compiler';

/**
 * Project storage interface
 */
export interface ProjectStorage {
  /** Save project to storage */
  saveProject(project: Project): Promise<void>;
  /** Load project from storage */
  loadProject(name: string): Promise<Project | null>;
  /** List all projects */
  listProjects(): Promise<string[]>;
  /** Delete project */
  deleteProject(name: string): Promise<void>;
  /** Check if project exists */
  projectExists(name: string): Promise<boolean>;
}

/**
 * Project manager interface
 */
export interface ProjectManager {
  /** Current project */
  currentProject: Project | null;
  /** Create new project from template */
  createProject(name: string, template: ProjectTemplate): Promise<Project>;
  /** Open existing project */
  openProject(name: string): Promise<Project>;
  /** Save current project */
  saveProject(): Promise<void>;
  /** Close current project */
  closeProject(): Promise<void>;
  /** Add file to project */
  addFile(file: ProjectFile): Promise<void>;
  /** Remove file from project */
  removeFile(fileName: string): Promise<void>;
  /** Update file content */
  updateFile(fileName: string, content: string): Promise<void>;
  /** Get file from project */
  getFile(fileName: string): ProjectFile | null;
}

/**
 * File system node for project explorer
 */
export interface FileSystemNode {
  /** Node name */
  name: string;
  /** Node type */
  type: 'file' | 'directory';
  /** Full path */
  path: string;
  /** Children (for directories) */
  children?: FileSystemNode[];
  /** File size in bytes (for files) */
  size?: number;
  /** Last modified date */
  modified?: Date;
}


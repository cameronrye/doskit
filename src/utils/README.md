# Utility Functions

This directory is reserved for utility functions and helper modules that can be used across the application.

## Purpose

Utility functions are pure, reusable functions that perform specific tasks. Keep them here to maintain a clean separation of concerns.

## Examples

Potential utilities for this project:

- `dosFileSystem.ts` - Helper functions for DOS file system operations
- `keyboardMapper.ts` - Keyboard key mapping utilities
- `storageHelpers.ts` - LocalStorage/IndexedDB helpers for saving DOS state
- `validators.ts` - Input validation functions
- `formatters.ts` - Data formatting utilities

## Usage

```typescript
// Example: src/utils/dosFileSystem.ts
export function createDosPath(path: string): string {
  return path.replace(/\//g, '\\').toUpperCase();
}

export function parseDosFilename(filename: string): { name: string; ext: string } {
  const parts = filename.split('.');
  return {
    name: parts[0],
    ext: parts[1] || ''
  };
}
```

Then import in components or other modules:

```typescript
import { createDosPath, parseDosFilename } from '../utils/dosFileSystem';

const dosPath = createDosPath('games/doom');
const { name, ext } = parseDosFilename('DOOM.EXE');
```

## Guidelines

- Keep functions pure (no side effects)
- Write unit tests for all utilities
- Document complex functions with JSDoc comments
- Export individual functions, not default exports


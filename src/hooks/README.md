# Custom React Hooks

This directory is reserved for custom React hooks that can be shared across components.

## Purpose

Custom hooks allow you to extract component logic into reusable functions. Place any custom hooks here to keep them organized and easily discoverable.

## Examples

Potential hooks for this project:

- `useDosEmulator()` - Hook for managing DOS emulator state
- `useKeyboardInput()` - Hook for handling DOS keyboard input
- `useDosConfig()` - Hook for managing DOSBox configuration
- `useLocalStorage()` - Hook for persisting DOS state

## Usage

```typescript
// Example: src/hooks/useDosEmulator.ts
import { useState, useEffect } from 'react';

export function useDosEmulator() {
  const [isReady, setIsReady] = useState(false);
  
  // Hook logic here
  
  return { isReady };
}
```

Then import in components:

```typescript
import { useDosEmulator } from '../hooks/useDosEmulator';

function MyComponent() {
  const { isReady } = useDosEmulator();
  // ...
}
```


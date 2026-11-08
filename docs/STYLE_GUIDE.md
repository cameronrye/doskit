# DosKit Style Guide

This document defines the coding standards and naming conventions for the DosKit project.

## Table of Contents

- [General Principles](#general-principles)
- [Naming Conventions](#naming-conventions)
- [Code Formatting](#code-formatting)
- [TypeScript Guidelines](#typescript-guidelines)
- [React Guidelines](#react-guidelines)
- [File Organization](#file-organization)
- [Comments and Documentation](#comments-and-documentation)
- [Environment-Specific Code](#environment-specific-code)
- [Testing](#testing)
- [Linting and Formatting](#linting-and-formatting)

## General Principles

1. **Consistency**: Follow existing patterns in the codebase
2. **Clarity**: Write self-documenting code with descriptive names
3. **Simplicity**: Prefer simple, readable solutions over clever ones
4. **Type Safety**: Leverage TypeScript's type system fully
5. **Performance**: Consider performance implications, especially for emulator code

## Naming Conventions

### Components

- **React Components**: Use `PascalCase`

  ```typescript
  // Good
  export const DosPlayer: React.FC<DosPlayerProps> = () => { ... };
  export const DemoSelector: React.FC = () => { ... };

  // Bad
  export const dosPlayer = () => { ... };
  export const demo_selector = () => { ... };
  ```

- **Component Files**: Use `PascalCase` with `.tsx` extension

  ```
  Good: DosPlayer.tsx
  Good: DemoSelector.tsx
  Bad: dosPlayer.tsx
  Bad: demo-selector.tsx
  ```

- **Component Styles**: Match component name with `.css` extension
  ```
  Good: DosPlayer.css
  Good: DemoSelector.css
  ```

### Hooks

- **Custom Hooks**: Use `camelCase` with `use` prefix

  ```typescript
  // Good
  export const useDosEmulator = () => { ... };
  export const useKeyboardShortcuts = () => { ... };

  // Bad
  export const DosEmulator = () => { ... };
  export const use_keyboard_shortcuts = () => { ... };
  ```

- **Hook Files**: Use `camelCase` with `.ts` extension
  ```
  Good: useDosEmulator.ts
  Good: useKeyboardShortcuts.ts
  ```

### Functions and Variables

- **Functions**: Use `camelCase` with descriptive verb-noun pairs

  ```typescript
  // Good
  function normalizeAppId(urlId: string): string | null { ... }
  function updateDocumentTitle(appName?: string): void { ... }

  // Bad
  function NormalizeAppId(urlId: string) { ... }
  function update_document_title(appName?: string) { ... }
  ```

- **Variables**: Use `camelCase` with descriptive nouns

  ```typescript
  // Good
  const dosContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Bad
  const DosContainerRef = useRef<HTMLDivElement>(null);
  const [is_loading, set_is_loading] = useState(false);
  ```

- **Boolean Variables**: Prefix with `is`, `has`, `should`, or `can`
  ```typescript
  // Good
  const isLoading = true;
  const hasError = false;
  const shouldRetry = true;
  const canSubmit = false;
  ```

### Constants

- **Global Constants**: Use `UPPER_SNAKE_CASE`

  ```typescript
  // Good
  const STALL_TIMEOUT_MS = 20_000;
  const DEFAULT_RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

  // Bad
  const stallTimeoutMs = 20_000;
  const default_retryable_status_codes = [408, 429, 500, 502, 503, 504];
  ```

- **Exported Configuration Objects**: Use `camelCase` for the configurations of the apps, js-dos and DOSBox; fixed values grouped in an object, such as `PWA_CONFIG` in `src/constants/app.ts`, are constants
  ```typescript
  // Good
  export const defaultDosboxConfig = '...';
  export const availableApps = [...];
  ```

### Classes and Interfaces

- **Classes**: Use `PascalCase`

  ```typescript
  // Good
  export class DOSBoxConfigBuilder { ... }
  export class JsDosAdapter implements EmulatorAdapter { ... }

  // Bad
  export class dosboxConfigBuilder { ... }
  export class js_dos_adapter implements EmulatorAdapter { ... }
  ```

- **Interfaces**: Use `PascalCase`

  ```typescript
  // Good
  export interface DosPlayerProps { ... }
  export interface UseDosEmulatorOptions { ... }

  // Bad
  export interface dosPlayerProps { ... }
  export interface use_dos_emulator_options { ... }
  ```

- **Type Aliases**: Use `PascalCase`
  ```typescript
  // Good
  export type DosEvent = 'emu-ready' | 'ci-ready' | 'bnd-play' | 'open-key' | 'fullscreen-change';
  export type InitFsEntry = Uint8Array | InitFileEntry;
  ```

### Acronyms in Names

- **In Component/Class Names**: Capitalize first letter only for readability

  ```typescript
  // Good (preferred for readability)
  DosPlayer;
  DosPlayerUI;
  useDosEmulator;

  // Acceptable (for technical accuracy)
  DOSBoxConfigBuilder; // When referring to DOSBox specifically
  ```

- **Be Consistent**: Within a module, use the same style

  ```typescript
  // Good - consistent within module
  DosPlayer.tsx;
  DosPlayerUI.tsx;
  useDosEmulator.ts;

  // Bad - inconsistent
  DosPlayer.tsx;
  DOSPlayerUI.tsx;
  use_dos_emulator.ts;
  ```

### Files and Directories

- **Component Files**: `PascalCase.tsx`
- **Utility Files**: `camelCase.ts`
- **Type Definition Files**: `kebab-case.d.ts`
- **Config Files**: `kebab-case.config.ts` or `kebab-case.conf.ts`
- **Test Files**: Match source file name with `.test.ts` or `.test.tsx` suffix
- **Directories**: `kebab-case`

```
Good Structure:
src/
├── components/
│   ├── DosPlayer.tsx
│   ├── DosPlayer.css
│   └── DemoSelector.tsx
├── hooks/
│   └── useDosEmulator.ts
├── utils/
│   ├── diskLoader.ts
│   └── urlRouting.ts
├── types/
│   └── js-dos.d.ts
├── config/
│   ├── dosbox.conf.ts
│   └── jsdos.config.ts
└── dos-apps/
    └── second-reality.config.ts
```

## Code Formatting

### General Rules

Prettier applies these rules with the settings in `.prettierrc`, so run `npm run format` instead of formatting by hand.

- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Single quotes for strings (except JSX attributes)
- **Semicolons**: Always required
- **Line Length**: Maximum 100 characters (soft limit)
- **Trailing Commas**: Use in multi-line arrays and objects

<!-- prettier-ignore -->
```typescript
// Good
const config = {
  name: 'DosKit',
  version: '1.0.0',
  features: ['emulator', 'pwa'],
};

// Bad
const config = {
  name: "DosKit",
  version: "1.0.0",
  features: ["emulator", "pwa"]
};
```

### Imports

- **One block**: The imports come right after the file's header comment, with no blank lines between them
- **Order**: Packages first, then the project's own modules, in no fixed order among themselves; a package's stylesheet right after the package, and a component's own stylesheet last
- **Types**: A type comes from the module that declares it, next to that module's other imports: `import type { ... }` when only types come from it, an inline `type` beside values otherwise. With `verbatimModuleSyntax`, `import { type X }` alone would still load the module at run time, and ESLint (`@typescript-eslint/no-import-type-side-effects`) rejects it.
- **Stylesheet order**: CSS imports land in the built CSS in the order they run, so `main.tsx` imports `index.css`, the page's base styles, before `App`, whose stylesheets then come after it and win ties

Prettier and ESLint check neither order, so keep to what the files around yours do. From `src/components/DemoSelector.tsx`:

```typescript
import { useState, useCallback, useRef, useEffect, useId } from 'react';
import { FloppyDisk, LIGHT_FLOPPY_THEME, type FloppyLabel, type FloppyTheme } from 'retro-floppy';
import 'retro-floppy/dist/retro-floppy.css';
import type { DosApp } from '../types/dos-app';
import type { LoadProgress } from '../utils/diskLoader';
import { getUserFriendlyError, type FriendlyError } from '../utils/errorMessages';
import { availableApps } from '../config/apps.config';
import './DemoSelector.css';
```

### Spacing

- **Around Operators**: Always add spaces
- **After Commas**: Always add space
- **Before Braces**: Always add space
- **Empty Lines**: Use to separate logical blocks

<!-- prettier-ignore -->
```typescript
// Good
const sum = a + b;
const items = [1, 2, 3];
if (condition) {
  doSomething();
}

// Bad
const sum=a+b;
const items = [1,2,3];
if(condition){
  doSomething();
}
```

## TypeScript Guidelines

### Type Annotations

- **Function Parameters**: Always annotate
- **Function Returns**: Annotate for public APIs
- **Variables**: Let TypeScript infer when obvious

```typescript
// Good
function loadFile(url: string): Promise<Uint8Array> {
  const data = new Uint8Array(); // Type inferred
  return Promise.resolve(data);
}

// Bad
function loadFile(url) {
  const data: Uint8Array = new Uint8Array();
  return Promise.resolve(data);
}
```

### Interfaces vs Types

- **Interfaces**: For object shapes, especially when extending
- **Types**: For unions, intersections, and primitives

```typescript
// Good
interface DosPlayerProps {
  dosboxConf?: string;
  options?: Partial<DosOptions>;
}

type DosEvent = 'emu-ready' | 'ci-ready' | 'bnd-play' | 'open-key' | 'fullscreen-change';
type InitFs = InitFsEntry | InitFsEntry[];

// Acceptable but less preferred
type DosPlayerProps = {
  dosboxConf?: string;
  options?: Partial<DosOptions>;
};
```

### Null and Undefined

- **Prefer `null`** for intentional absence
- **Use `undefined`** for optional parameters
- **Avoid `any`**: Use `unknown` if type is truly unknown

```typescript
// Good
function findUser(id: string): User | null {
  return users.find((u) => u.id === id) ?? null;
}

function processData(data: unknown): void {
  if (typeof data === 'string') {
    // Type narrowed to string
  }
}

// Bad
function findUser(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

function processData(data: any): void {
  // Unsafe - no type checking
}
```

## React Guidelines

### Component Structure

- **Order**: Props interface → Component → Export
- **Destructure Props**: In function signature
- **Default Props**: Use default parameters

```typescript
// Good
interface DosPlayerProps {
  dosboxConf?: string;
  className?: string;
  onReady?: (ci: CommandInterface) => void;
}

export const DosPlayer: React.FC<DosPlayerProps> = ({
  dosboxConf = defaultDosboxConfig,
  className = '',
  onReady,
}) => {
  // Component logic
  return <div className={className}>...</div>;
};

// Bad
export const DosPlayer = (props: any) => {
  const dosboxConf = props.dosboxConf || defaultDosboxConfig;
  const className = props.className || '';
  return <div className={className}>...</div>;
};
```

### Hooks

- **Order**: Call hooks at the top level of a component or custom hook, never in a condition, a loop or a nested function, so that every render calls them in the same order ([the rules of hooks](https://react.dev/reference/rules/rules-of-hooks), which `npm run lint` checks). There is no fixed order beyond that: `useDosEmulator`, for one, keeps the refs that hold its callbacks next to the effect that updates them.
- **Dependencies**: Always specify complete dependency arrays. The effect in `useDosEmulator` that starts js-dos is the one exception: it runs once per mount, and DosPlayerWithApps remounts DosPlayer, by its key, for each session: each app it starts, the one already running included when it is picked again, and each return to the default DOS prompt.
- **Cleanup**: Return cleanup functions from useEffect
- **StrictMode**: `main.tsx` renders the app in `<StrictMode>`, so in development React runs each effect's setup, its cleanup and its setup again when a component mounts. Effects must cope with that, as `useDosEmulator` does: its cleanup aborts the start and stops the player, so a start still waiting for `emulators.js` is never made, and one that finishes after its mount is gone stops the player it got and passes on none of its events. Production builds run each effect once.

```typescript
// Good: DosPlayer leaves starting and stopping js-dos to useDosEmulator
export const DosPlayer: React.FC<DosPlayerProps> = ({
  dosboxConf = defaultDosboxConfig,
  options = {},
  onReady,
  onExit,
  onError,
}) => {
  const { dosContainerRef, isLoading, error } = useDosEmulator({
    dosboxConf,
    options,
    onReady,
    onExit,
    onError,
  });

  return <DosPlayerUI dosContainerRef={dosContainerRef} isLoading={isLoading} error={error} />;
};
```

### Event Handlers

- **Naming**: Prefix with `handle` for handlers, `on` for props
- **Arrow Functions**: Use for inline handlers only when necessary

```typescript
// Good
interface ButtonProps {
  onClick?: () => void;  // Prop
}

export const Button: React.FC<ButtonProps> = ({ onClick }) => {
  const handleClick = () => {  // Handler
    console.log('Clicked');
    onClick?.();
  };

  return <button onClick={handleClick}>Click</button>;
};

// Bad
export const Button = ({ onClick }) => {
  return <button onClick={() => {
    console.log('Clicked');
    onClick?.();
  }}>Click</button>;
};
```

### Conditional Rendering

- **Use Ternary**: For simple conditions
- **Use && Operator**: For single branch conditions
- **Extract to Variable**: For complex conditions

```typescript
// Good
return (
  <div>
    {isLoading ? <Spinner /> : <Content />}
    {error && <ErrorMessage error={error} />}
  </div>
);

// Bad
return (
  <div>
    {isLoading ? <Spinner /> : error ? <ErrorMessage /> : <Content />}
  </div>
);
```

## File Organization

### Directory Structure

```
src/
├── components/        # React components
│   ├── DosPlayer.tsx
│   ├── DosPlayer.css
│   └── DemoSelector.tsx
├── hooks/            # Custom React hooks
│   └── useDosEmulator.ts
├── utils/            # Utility functions
│   ├── diskLoader.ts
│   └── urlRouting.ts
├── types/            # TypeScript type definitions
│   └── js-dos.d.ts
├── config/           # Configuration files
│   ├── apps.config.ts
│   ├── dosbox.conf.ts
│   └── jsdos.config.ts
├── dos-apps/         # DOS application configs
│   └── second-reality.config.ts
├── adapters/         # Emulator adapter around js-dos
│   └── EmulatorAdapter.ts
├── constants/        # Shared constants
│   └── app.ts
├── integration/      # Integration tests
│   └── dosAppLoading.integration.test.tsx
├── test/             # Test setup
│   └── setup.ts
├── App.tsx           # Root component
└── main.tsx          # Entry point
```

Static assets, such as icons and the app archives in `demos/`, live in `public/`, outside `src/`.

### File Size

- **No line limit**: Several files run to a few hundred lines, `DemoSelector.tsx` and `dosboxConfigBuilder.ts` among them
- **Split by job**: Move a part that has a job of its own into a module of its own, as `DosPlayer` leaves running js-dos to the `useDosEmulator` hook and its markup to `DosPlayerUI`

## Comments and Documentation

### JSDoc Comments

- **Public APIs**: Always document
- **Complex Logic**: Add explanatory comments
- **Parameters**: Document with `@param`
- **Returns**: Document with `@returns`
- **Throws**: Document with `@throws`

````typescript
/**
 * Load a ZIP archive for js-dos
 *
 * @param zipUrl - The URL of the ZIP archive to load
 * @param onProgress - Optional callback for progress updates
 * @param signal - Optional AbortSignal that cancels the download
 * @returns A promise that resolves to the archive's bytes
 * @throws {Error} If the download fails or is aborted
 *
 * @example
 * ```typescript
 * const archive = await loadZipArchive('/demos/stars.zip');
 * ```
 */
export async function loadZipArchive(
  zipUrl: string,
  onProgress?: (progress: LoadProgress) => void,
  signal?: AbortSignal
): Promise<Uint8Array> {
  // Implementation
}
````

### Inline Comments

- **Why, Not What**: Explain reasoning, not obvious code
- **TODO Comments**: Use for temporary code
- **FIXME Comments**: Use for known issues

```typescript
// Good
// Vite's dev and preview servers answer a missing archive with 200 and index.html,
// which js-dos would start as an empty C: drive
if (!isZipArchive(zipData)) {
  throw new Error('Failed to load ZIP: not a ZIP archive');
}

// TODO: Add retry logic for network failures
// FIXME: Memory leak when component unmounts during loading

// Bad
// Set loading to true
setIsLoading(true);

// Loop through items
for (const item of items) {
  // Process item
  processItem(item);
}
```

### File Headers

- **Copyright**: At the top of each of the app's modules in `src/`; most tests, the scripts in `scripts/`, the config files at the repository's root and `public/sw.js` begin with their description alone
- **Description**: Brief file purpose

```typescript
/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DosPlayer Component
 * Main component that orchestrates the DOS emulator
 */
```

## Environment-Specific Code

### Development vs Production

- **Use `import.meta.env.DEV`**: For development-only code
- **Console Logs**: `console.log` only in development; `console.warn` and `console.error` may stay in production code. `public/sw.js`, which Vite copies rather than builds, has no `import.meta.env`, so its `console.log` calls run in production too.
- **Logger**: `logger.debug` and `logger.info` from `src/utils/logger.ts` print in development only, so they need no guard; `logger.warn` and `logger.error` print in every build. Code that only production builds run, such as the service worker's registration and the update prompt it shows, prints nothing through `logger.info`: `main.tsx` passes `register()` no callbacks that log for that reason.
- **Debug Features**: Guard with environment checks

```typescript
// Good
if (import.meta.env.DEV) {
  console.log('[DosPlayer] Initializing emulator');
}

// Good: the logger prints info and debug messages in development only
logger.info('GlobalErrorHandler', 'Initialized');

// Bad
console.log('[DosPlayer] Initializing emulator');
```

## Testing

### Test File Naming

- **Match Source**: `Component.test.tsx` for `Component.tsx`
- **Descriptive Names**: Use clear test descriptions

```typescript
// Good
describe('DosPlayer', () => {
  describe('Initialization', () => {
    it('should initialize js-dos on mount', () => {
      // Test implementation
    });

    it('should handle initialization errors gracefully', () => {
      // Test implementation
    });
  });
});

// Bad
describe('DosPlayer', () => {
  it('test1', () => {
    // Test implementation
  });
});
```

## Linting and Formatting

### Automated Tools

- **ESLint**: Run `npm run lint`, as CI does, to check the TypeScript, the config files, the scripts in `scripts/` and the service worker `public/sw.js`. The scripts are linted as ES modules, with Node's globals but not CommonJS's `require` or `__dirname`, and with Vitest's too in their tests; `public/sw.js` as a classic script with a service worker's globals, through ESLint's own parser, which rejects `import` and `export` there as the browser would. The rest of `public/`, the js-dos copy included, is not linted.
- **Prettier**: Run `npm run format` to format files; CI runs `npm run format:check` and fails on any file Prettier would change
- **Husky**: The pre-commit hook runs lint-staged on the staged files. JavaScript and TypeScript files go through `eslint --fix`, `prettier --write` and the tests that import them (`vitest related --run`), in that order. Every other file goes through `prettier --write --ignore-unknown`, which formats what `npm run format:check` checks and skips the rest. Files that tests read from disk rather than import therefore get no tests from the hook: the stylesheets, `index.html`, `public/manifest.json`, the icons, `robots.txt`, the licenses page, `eslint.config.js`, and the archives in `public/demos/` with their `README.md`. Run `npm test` after changing one; CI runs every test. `public/sw.js` is the exception: staging it runs the whole suite, since `vitest.config.ts` lists it among Vitest's force-rerun triggers.

### Before Committing

```bash
# Check linting and formatting
npm run lint
npm run format:check

# Run tests, measuring coverage as CI does
npm run test:coverage

# Check types, tests included (npm run build runs this first)
npx tsc -b
```

Coverage counts every `.ts` and `.tsx` file in `src/` but the tests, `src/test/` and the type declarations (`*.d.ts`), so a source file that no test loads counts as uncovered. The run fails when coverage drops below the thresholds in `vitest.config.ts`.

## Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

---

**Remember**: These are guidelines, not strict rules. Use your judgment, and when in doubt, follow existing patterns in the codebase. Consistency is more important than perfection.

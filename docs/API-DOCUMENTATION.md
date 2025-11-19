# DosKit API Documentation

This document provides an overview of the DosKit API documentation and how to use it.

## Generating Documentation

The API documentation is generated from JSDoc comments in the source code using [TypeDoc](https://typedoc.org/).

### Generate Documentation

```bash
npm run docs
```

This will generate HTML documentation in the `docs/api` directory.

### Watch Mode

To automatically regenerate documentation when source files change:

```bash
npm run docs:watch
```

## Viewing Documentation

After generating the documentation, open `docs/api/index.html` in your browser to view the API documentation.

Alternatively, you can serve the documentation locally:

```bash
# Using Python 3
cd docs/api
python3 -m http.server 8080

# Using Node.js http-server (install with: npm install -g http-server)
cd docs/api
http-server -p 8080
```

Then open http://localhost:8080 in your browser.

## Documentation Structure

The API documentation is organized into the following sections:

### Modules

- **adapters/** - Emulator abstraction layer
- **config/** - Configuration builders and defaults
- **constants/** - Application-wide constants
- **contexts/** - React Context providers for global state
- **hooks/** - Custom React hooks
- **utils/** - Utility functions and helpers

### Key Components

#### Utilities (`utils/`)

- **diskLoader** - Functions for loading DOS files, disk images, and ZIP archives
- **dosboxConfigBuilder** - Builder pattern for creating DOSBox configurations
- **errorMessages** - User-friendly error message mapping
- **errorTracking** - Error tracking service abstraction
- **fetchWithRetry** - Network request retry logic with exponential backoff
- **globalErrorHandler** - Global error handler for uncaught errors
- **logger** - Centralized logging utility
- **serviceWorkerRegistration** - Service worker lifecycle management
- **urlRouting** - URL routing and deep linking utilities

#### Hooks (`hooks/`)

- **useDosEmulator** - Custom hook for managing js-dos emulator lifecycle

#### Contexts (`contexts/`)

- **AppStateContext** - Global state for app selection and emulator status
- **NetworkContext** - Network connectivity state management
- **PWAContext** - PWA installation and update management

#### Adapters (`adapters/`)

- **EmulatorAdapter** - Abstraction layer for DOS emulator integration

#### Configuration (`config/`)

- **dosbox.conf** - Default DOSBox configuration
- **jsdos.config** - js-dos configuration with mobile optimizations

#### Constants (`constants/`)

- **app** - Application-wide constants (metadata, audio, cache, emulator, error, file loading, PWA, routing, UI)

## Writing Documentation

When adding new functions, classes, or interfaces, follow these guidelines:

### JSDoc Comments

All public APIs should have JSDoc comments with:

- **Description** - Brief description of what the function/class does
- **@param** - Description of each parameter
- **@returns** - Description of the return value
- **@throws** - Description of errors that may be thrown
- **@example** - Usage examples (optional but recommended)

### Example

````typescript
/**
 * Load files from URLs with progress tracking
 *
 * @param urls - Array of file URLs to load
 * @param onProgress - Optional callback for progress updates
 * @returns Promise that resolves to array of loaded files
 * @throws {Error} If any file fails to load
 *
 * @example
 * ```typescript
 * const files = await loadFilesFromUrls(
 *   ['https://example.com/file1.exe', 'https://example.com/file2.dat'],
 *   (progress) => console.log(`${progress.loaded}/${progress.total}`)
 * );
 * ```
 */
export async function loadFilesFromUrls(
  urls: string[],
  onProgress?: (progress: LoadProgress) => void,
): Promise<InitFileEntry[]> {
  // Implementation...
}
````

## Configuration

The TypeDoc configuration is in `typedoc.json`. Key settings:

- **entryPoints** - Source directories to document
- **out** - Output directory (`docs/api`)
- **exclude** - Files to exclude (tests, integration tests)
- **theme** - Documentation theme (default)
- **categorizeByGroup** - Group items by category

## Continuous Integration

The documentation can be automatically generated and deployed as part of your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Generate API Documentation
  run: npm run docs

- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./docs/api
```

## Additional Resources

- [TypeDoc Documentation](https://typedoc.org/)
- [JSDoc Reference](https://jsdoc.app/)
- [TSDoc Standard](https://tsdoc.org/)

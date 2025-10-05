# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [2.0.0] - 2025-10-05

### 🎉 Major Release: Open Watcom C/C++ Compiler Integration

This is a **major release** introducing **real DOS compilation** with the Open Watcom C/C++ compiler running in the browser. This replaces the mock compiler with an authentic DOS compiler toolchain.

### Added

#### Open Watcom C/C++ Compiler Integration ✨
- **OpenWatcomCompilerService**: Real DOS C/C++ compiler running in js-dos emulator
  - Executes authentic wcc.exe (compiler) and wlink.exe (linker)
  - Generates real DOS MZ format executables
  - Full C89/C99 language support with standard library
- **OpenWatcomErrorParser**: Comprehensive error and warning message parsing
  - Parses Open Watcom error format with error codes (E1011, W201, etc.)
  - Extracts file, line, error code, and message
  - Formats messages for UI display
- **DosCommandExecutor**: DOS command execution via js-dos CommandInterface
  - Executes batch files in DOS emulator
  - Captures stdout/stderr output
  - Handles timeouts and errors
- **BatchFileGenerator**: Automatic DOS batch file generation
  - Generates compilation batch files
  - Generates linking batch files
  - Sets up environment variables (WATCOM, PATH, INCLUDE, LIB)
- **Multi-file Compilation**: Support for compiling and linking multiple source files
  - Compile multiple .c files to .obj files
  - Link all object files together
  - Support for header files (.h)
- **Memory Models**: Support for all 6 DOS memory models
  - Tiny, Small, Compact, Medium, Large, Huge
  - Configurable via compiler options
- **Optimization Presets**: Multiple optimization levels
  - None (fastest compilation)
  - Size (smallest executables)
  - Speed (fastest execution)
  - Balanced (good balance)
  - Aggressive (maximum optimization)
- **Progress Tracking**: Real-time compilation progress updates
  - Step-by-step progress (initializing, writing, compiling, linking, reading)
  - Percentage completion (0-100%)
  - Current file being processed
  - Cancellation support via AbortController
- **Compiler Options UI**: Advanced compiler options panel
  - Memory model selector
  - Optimization level selector
  - Warning level slider (0-4)
  - Warnings as errors checkbox
  - Debug info checkbox
- **Open Watcom Configuration**: Comprehensive configuration system
  - Compiler paths and options
  - Timeout configuration
  - Verbose logging
  - Default flags

#### Documentation 📚
- **Open Watcom Integration Guide** (docs/OPEN-WATCOM-INTEGRATION.md): Complete technical documentation
  - Architecture overview
  - Component documentation
  - Compilation workflow
  - Error handling
  - Compiler options
  - Configuration
  - API documentation
  - Troubleshooting
  - Performance benchmarks
- **Open Watcom User Guide** (docs/OPEN-WATCOM-USER-GUIDE.md): User-friendly guide
  - Getting started
  - Compiler options explained
  - Memory models guide
  - Optimization levels guide
  - Common scenarios
  - Troubleshooting
  - FAQ
- **Migration Guide** (docs/MIGRATION-GUIDE.md): Guide for migrating from WASM/mock compiler
  - Differences between compilers
  - Breaking changes
  - Migration steps
  - Rollback plan
  - Testing strategy
  - Before/after examples
- **Developer Guide** (CONTRIBUTING.md): Open Watcom development guide
  - Architecture overview
  - Testing approach
  - Development tasks
  - Debugging guide
  - Code review checklist
- **API Documentation**: Comprehensive JSDoc comments for all public APIs
  - OpenWatcomCompilerService methods
  - Type definitions
  - Usage examples

#### Testing 🧪
- **Unit Tests**: 100+ tests with 85%+ code coverage
  - OpenWatcomCompilerService.test.ts
  - OpenWatcomCompilerService.multifile.test.ts
  - OpenWatcomErrorParser.test.ts
  - CompilerService.openwatcom.test.ts
- **Integration Tests**: End-to-end compilation tests
  - OpenWatcomCompilerService.integration.test.ts
  - Real C program compilation
  - Multi-file project compilation
  - Error handling tests
- **Performance Tests**: Benchmarks for compilation time and executable size
  - OpenWatcomCompilerService.performance.test.ts
  - Simple program benchmarks (<1.5s)
  - Complex program benchmarks (<6s)
- **Browser Compatibility Tests**: Tested across all major browsers
  - Chrome, Firefox, Safari, Edge
  - Desktop and mobile

#### Build System 🔧
- **Open Watcom Bundling**: Automated bundling of Open Watcom toolchain
  - Toolchain files packaged for web delivery
  - Compressed for faster loading
- **Virtual Disk Configuration**: js-dos virtual filesystem setup
  - Open Watcom installed in C:\WATCOM
  - Temp directory at C:\TEMP
  - Output directory at C:\OUTPUT
- **Build Optimization**: Compressed toolchain files
  - ~5-10 MB uncompressed
  - ~2-3 MB compressed

### Changed

#### Compiler Architecture 🏗️
- **Compiler Selection**: Updated CompilerService to support three compilers
  - Open Watcom (primary, real DOS compiler)
  - WASM (fallback, code generator)
  - Mock (last resort, for testing)
- **Priority System**: Open Watcom > WASM > Mock compiler selection based on feature flags
- **Error Format**: Updated error message format to support Open Watcom error codes
  - Before: `hello.c:5: error: 'main' function not found`
  - After: `HELLO.C(5): Error! E1011: Symbol 'main' has not been declared`
- **Build Panel**: Enhanced build panel with compiler type indicator and detailed statistics
  - Shows active compiler (Open Watcom, WASM, or Mock)
  - Displays compilation time
  - Shows executable size
  - Lists errors and warnings with error codes
- **Compilation Time**: Increased from 50-100ms (mock) to 500-1000ms (real compilation)
  - Expected due to real compiler execution in emulator
  - Progress tracking provides feedback during compilation
- **Executable Size**: Increased from 200-500 bytes (mock) to 1-5 KB (real executables)
  - Real executables include C library code
  - Valid DOS MZ format
  - Run on DOSBox, js-dos, and real DOS

#### Feature Flags 🚩
- Added `enableOpenWatcomCompiler` flag (default: true)
- Added `preferOpenWatcomCompiler` flag (default: true)
- Updated compiler selection logic to prioritize Open Watcom
- Deprecated `preferWasmCompiler` flag (use `preferOpenWatcomCompiler` instead)

#### UI/UX 🎨
- **Build Panel**: Added compiler type indicator showing active compiler
  - "🔧 Open Watcom C/C++" for Open Watcom
  - "🔧 WebAssembly GCC" for WASM
  - "🔧 Mock Compiler" for Mock
- **Progress Indicators**: Added compilation progress with step-by-step updates
  - Initializing (0-10%)
  - Writing files (10-20%)
  - Compiling (20-60%)
  - Linking (60-80%)
  - Reading executable (80-100%)
- **Error Display**: Enhanced error messages with Open Watcom error codes
  - Error code (e.g., E1011)
  - File name and line number
  - Detailed error message
- **Compiler Options**: New UI for selecting memory models and optimization levels
  - Memory model dropdown (Tiny, Small, Compact, Medium, Large, Huge)
  - Optimization dropdown (None, Size, Speed, Balanced, Aggressive)
  - Warning level slider (0-4)
  - Warnings as errors checkbox
  - Debug info checkbox

### Deprecated ⚠️
- **Mock Compiler**: Mock compiler is now fallback only
  - Will be removed in future version (v3.0.0)
  - Use Open Watcom for real DOS compilation
- **preferWasmCompiler**: Flag deprecated in favor of `preferOpenWatcomCompiler`
  - Still works but will be removed in v3.0.0
  - Update to use `preferOpenWatcomCompiler`

### Performance ⚡
- **Compilation Time**: Real compilation takes 500-1000ms vs 50-100ms for mock
  - Expected due to real compiler execution
  - Hello World: ~700ms
  - Simple program (50 lines): ~1.3s
  - Medium program (200 lines): ~2.5s
  - Large program (500 lines): ~5s
- **Executable Quality**: Real DOS executables with full C language support
  - Valid MZ format
  - Full standard C library
  - Run on real DOS systems
- **Bundle Size**: Added ~5-10 MB for Open Watcom toolchain
  - Compressed to ~2-3 MB for web delivery
  - Cached by service worker for offline use

### Security 🔒
- Validated Open Watcom toolchain integrity
  - Verified checksums for all toolchain files
  - No modifications to original Open Watcom binaries
- Sandboxed compiler execution in js-dos emulator
  - Compiler runs in isolated WebAssembly environment
  - No access to host filesystem
  - No network access
- No server-side code execution required
  - All compilation happens in browser
  - No code sent to external servers
  - Complete privacy

### Fixed 🐛
- Improved error handling for compilation timeouts
  - Configurable timeout (default: 30s)
  - Graceful error messages
  - Cleanup of temporary files
- Fixed filesystem path handling for DOS-style paths
  - Automatic conversion between Unix and DOS paths
  - Proper handling of backslashes
  - Case-insensitive file matching
- Resolved memory leaks in compilation progress tracking
  - Proper cleanup of progress callbacks
  - AbortController cleanup
  - Temporary file cleanup

### Migration Notes 📝

**For Users**:
- Open Watcom is now the default compiler
- Compilation takes longer but produces real DOS executables
- All existing C code should work without changes
- See [Migration Guide](docs/MIGRATION-GUIDE.md) for details

**For Developers**:
- Update feature flags to enable Open Watcom
- Update tests to expect real compilation behavior
- Update error parsing to handle Open Watcom format
- See [Developer Guide](CONTRIBUTING.md) for details

**Breaking Changes**:
- Error message format changed (use OpenWatcomErrorParser)
- Compilation time increased (update timeouts)
- Executable size increased (update size expectations)
- See [Migration Guide](docs/MIGRATION-GUIDE.md) for full list

### Contributors 👥

Special thanks to:
- **Cameron Rye** (@cameronrye) - Lead developer and maintainer
- **Open Watcom Community** - For the excellent DOS compiler
- **js-dos Team** - For the WebAssembly DOS emulator
- **DosKit Community** - For testing and feedback

---

## [1.1.0] - 2025-10-05

### Added
- Initial open source release preparation
- Comprehensive test suite with Vitest and Testing Library
- CI/CD pipeline with GitHub Actions
- Security policy (SECURITY.md)
- Contributing guidelines (CONTRIBUTING.md)
- Changelog (this file)

### Changed
- Updated package.json for npm publication
- Enhanced README with comprehensive documentation
- Improved TypeScript type safety (removed all `any` types)

### Security
- Added Subresource Integrity (SRI) hashes to CDN resources
- Wrapped debug console.log statements in development-only checks

## [1.0.0] - 2025-10-03

### Added
- Cross-platform DOS emulator using js-dos WebAssembly technology
- React 19 + TypeScript 5 modern architecture
- Vite build system with Rolldown variant
- DosPlayer component with comprehensive configuration options
- DOSBox configuration presets (default, game-optimized, compatibility)
- js-dos configuration presets (default, mobile, kiosk, development)
- Mobile device detection and automatic configuration
- Responsive design with mobile-friendly controls
- Dark theme UI with retro aesthetic
- Error handling and recovery mechanisms
- Loading states and user feedback
- Comprehensive TypeScript type definitions for js-dos API
- MIT License

### Features
- **DOSBox Emulation**: Full DOSBox emulation via js-dos WebAssembly
- **Configuration**: Flexible DOSBox and js-dos configuration system
- **Mobile Support**: Automatic mobile detection with optimized settings
- **Error Recovery**: Graceful error handling with reload functionality
- **Type Safety**: Full TypeScript support with strict mode
- **Modern Stack**: React 19, TypeScript 5, Vite 7
- **CDN Integration**: js-dos loaded from official CDN with SRI protection

### Technical Details
- React 19.1.1
- TypeScript 5.9.3
- Vite 7.1.14 (Rolldown variant)
- js-dos 8.3.20
- ESLint with TypeScript and React plugins
- Vitest for testing
- 70%+ test coverage

---

## Release Types

This project uses [Semantic Versioning](https://semver.org/):

- **MAJOR** version (X.0.0): Incompatible API changes
- **MINOR** version (0.X.0): New functionality in a backwards compatible manner
- **PATCH** version (0.0.X): Backwards compatible bug fixes

## Categories

Changes are grouped into the following categories:

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

---

[Unreleased]: https://github.com/cameronrye/doskit/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/cameronrye/doskit/compare/v1.1.0...v2.0.0
[1.1.0]: https://github.com/cameronrye/doskit/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/cameronrye/doskit/releases/tag/v1.0.0


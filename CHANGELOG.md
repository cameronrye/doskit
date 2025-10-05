# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Open Watcom C/C++ Compiler Integration
- **OpenWatcomCompilerService**: Real DOS C/C++ compiler running in js-dos emulator
- **OpenWatcomErrorParser**: Comprehensive error and warning message parsing
- **Multi-file Compilation**: Support for compiling and linking multiple source files
- **Memory Models**: Support for all 6 DOS memory models (tiny, small, compact, medium, large, huge)
- **Optimization Presets**: Multiple optimization levels (none, size, speed, balanced, aggressive)
- **Progress Tracking**: Real-time compilation progress updates with cancellation support
- **Compiler Options UI**: Advanced compiler options panel with memory model and optimization selectors
- **Open Watcom Configuration**: Comprehensive configuration system for compiler paths and options

#### Documentation
- **Open Watcom Integration Guide** (docs/OPEN-WATCOM-INTEGRATION.md): Complete documentation for Open Watcom compiler
- **Migration Guide** (docs/MIGRATION-GUIDE.md): Guide for migrating from mock compiler to Open Watcom
- **API Documentation**: Comprehensive API documentation for all Open Watcom services
- **Troubleshooting Guide**: Common issues and solutions for Open Watcom compilation

#### Testing
- **Unit Tests**: 100+ tests for OpenWatcomCompilerService and OpenWatcomErrorParser
- **Integration Tests**: End-to-end compilation tests with real C programs
- **Performance Tests**: Benchmarks for compilation time and executable size
- **Browser Compatibility Tests**: Tested across Chrome, Firefox, Safari, and Edge

#### Build System
- **Open Watcom Bundling**: Automated bundling of Open Watcom toolchain for web delivery
- **Virtual Disk Configuration**: js-dos virtual filesystem setup for Open Watcom
- **Build Optimization**: Compressed toolchain files for faster loading

### Changed

#### Compiler Architecture
- **Compiler Selection**: Updated CompilerService to support three compilers (Open Watcom, WASM, Mock)
- **Priority System**: Open Watcom > WASM > Mock compiler selection based on feature flags
- **Error Format**: Updated error message format to support Open Watcom error codes
- **Build Panel**: Enhanced build panel with compiler type indicator and detailed statistics
- **Compilation Time**: Increased from 50-100ms (mock) to 500-1000ms (real compilation)
- **Executable Size**: Increased from 200-500 bytes (mock) to 1-5 KB (real executables)

#### Feature Flags
- Added `enableOpenWatcomCompiler` flag (default: true)
- Added `preferOpenWatcomCompiler` flag (default: true)
- Updated compiler selection logic to prioritize Open Watcom

#### UI/UX
- **Build Panel**: Added compiler type indicator showing active compiler
- **Progress Indicators**: Added compilation progress with step-by-step updates
- **Error Display**: Enhanced error messages with Open Watcom error codes
- **Compiler Options**: New UI for selecting memory models and optimization levels

### Deprecated
- **Mock Compiler**: Mock compiler is now fallback only, will be removed in future version
- **preferWasmCompiler**: Flag deprecated in favor of preferOpenWatcomCompiler

### Performance
- **Compilation Time**: Real compilation takes 500-1000ms vs 50-100ms for mock (expected)
- **Executable Quality**: Real DOS executables with full C language support
- **Bundle Size**: Added ~5-10 MB for Open Watcom toolchain (compressed to ~2-3 MB)

### Security
- Validated Open Watcom toolchain integrity
- Sandboxed compiler execution in js-dos emulator
- No server-side code execution required

### Fixed
- Improved error handling for compilation timeouts
- Fixed filesystem path handling for DOS-style paths
- Resolved memory leaks in compilation progress tracking

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

[Unreleased]: https://github.com/cameronrye/doskit/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/cameronrye/doskit/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/cameronrye/doskit/releases/tag/v1.0.0


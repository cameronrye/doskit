# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/cameronrye/doskit/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/cameronrye/doskit/releases/tag/v1.0.0


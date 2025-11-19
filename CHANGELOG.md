# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0 (2025-11-19)


### Features

* add PWA support with offline functionality ([47bfcca](https://github.com/cameronrye/doskit/commit/47bfccac03457ed8f4caf0fbc86d1eb80309ae69))
* Add second reality ([ac4def1](https://github.com/cameronrye/doskit/commit/ac4def1778cdc9a99be116a0a2478e4edfd30aa6))
* Add second reality ([da1b821](https://github.com/cameronrye/doskit/commit/da1b8210afb22d37bc105ce97120f8d5e0af348d))
* complete pre-release audit fixes for open source publication ([f0f97f7](https://github.com/cameronrye/doskit/commit/f0f97f73d70860e156a95c7b73a192133a49619f))
* Complete pre-release audit fixes for open source publication ([9b74093](https://github.com/cameronrye/doskit/commit/9b7409326c506256d6f27a4df42fe5e03206de57))
* performance optimizations ([2b51755](https://github.com/cameronrye/doskit/commit/2b51755b2175703bc1bf30e0c9986e928dd622a3))
* release please ([319061e](https://github.com/cameronrye/doskit/commit/319061e72c4314cb30e3085c6c9de15c36633c1f))
* roadmap ([7c5d494](https://github.com/cameronrye/doskit/commit/7c5d494fb48f75568df96ecbda14887f9a570938))
* select app by url ([e972309](https://github.com/cameronrye/doskit/commit/e97230967dfd0c582659c778c5017d69fbb078cf))
* tests ([851eed0](https://github.com/cameronrye/doskit/commit/851eed0728b30960b62cc91276e558a76bf8683e))
* update dependencies to latest ([5275426](https://github.com/cameronrye/doskit/commit/52754261666731b483fef5228c8e66e6a2632b1c))


### Bug Fixes

* adjust coverage thresholds and add missing test dependency ([dc25b34](https://github.com/cameronrye/doskit/commit/dc25b348505fdfa935cf60e2cbd9faf0396adf91))
* Application change ([0427ad2](https://github.com/cameronrye/doskit/commit/0427ad23b2359bda21e367333070cd31207e9230))
* Audio ([81793cc](https://github.com/cameronrye/doskit/commit/81793ccf09c330e0560394ce0b7da95cc95efb3a))
* ci ([a1de180](https://github.com/cameronrye/doskit/commit/a1de1803ac1f5d3d00c8419c2d3d2f01450d4a8e))
* configure coverage to exclude third-party files and adjust thresholds ([b678eaa](https://github.com/cameronrye/doskit/commit/b678eaa78b86bdf2953ff41edf95dec358e69731))
* Dosbox window on mobile ([fa08908](https://github.com/cameronrye/doskit/commit/fa0890805d33cddf121ea058d06f07273fc837f9))
* Install updated flow ([ddf12d1](https://github.com/cameronrye/doskit/commit/ddf12d1f803be9d7fd34252e017dfb61cff709d6))
* Lint errors ([c979ce3](https://github.com/cameronrye/doskit/commit/c979ce39e16cd459cce4ce97dfc307773a541d26))
* menu toggle ([43fa42a](https://github.com/cameronrye/doskit/commit/43fa42a70ab6e4b16b2d62f90a62758630077fec))
* prevent unhandled promise rejections in DosPlayer tests ([6d9d568](https://github.com/cameronrye/doskit/commit/6d9d56811e5abc7ee2fd4a4c18fe0a93e4073301))
* PWA ([fd4da60](https://github.com/cameronrye/doskit/commit/fd4da603d6eb05dd56d7f5375bc90a3feec3dd7a))
* resolve CI/CD failures - fix ESLint errors and update tests ([439b0e9](https://github.com/cameronrye/doskit/commit/439b0e976219b96f7d2b2109cc583b8917d1c307))
* resolve workflow failures after PR merge ([2be8510](https://github.com/cameronrye/doskit/commit/2be8510d14709b9fc584c4a30bbe468fb701cb3f))
* submenu ([d7ef951](https://github.com/cameronrye/doskit/commit/d7ef9516fae6e944630fa7058b0c752a569d7fd0))
* Update Notification ([7a7b835](https://github.com/cameronrye/doskit/commit/7a7b8356f8da4e2da7099f1b49bd70f98062c1c0))
* vitest ([2a6f00c](https://github.com/cameronrye/doskit/commit/2a6f00ca9ef10979d61a7dfadb05be35137af390))

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

- React 19.2.0
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

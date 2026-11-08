# Contributing to DosKit

Thank you for your interest in contributing to DosKit! This document provides guidelines and instructions for contributing to the project.

## Getting Started

### Prerequisites

- **Node.js**: The version in `.nvmrc` (`nvm use` picks it up), which CI uses too
- **npm**: Comes with Node.js
- **Git**: For version control

### Development Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**:

   ```bash
   git clone https://github.com/YOUR_USERNAME/doskit.git
   cd doskit
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

   This also installs the pre-commit hook (see [Making Changes](#making-changes)).

4. **Start the development server**:

   ```bash
   npm run dev
   ```

   `npm run dev` and `npm run build` first copy the js-dos runtime from `node_modules` into `public/` (`scripts/copy-js-dos.js`); the copies are gitignored. If you start Vite another way, such as `npx vite`, run `node scripts/copy-js-dos.js` once first, and again after updating js-dos.

5. **Open your browser** to `http://localhost:5173`

## Development Workflow

### Branch Naming

Use descriptive branch names that follow this pattern:

- `feature/description` - For new features
- `fix/description` - For bug fixes
- `docs/description` - For documentation updates
- `refactor/description` - For code refactoring
- `test/description` - For test additions or updates

Example: `feature/add-gamepad-support`

### Making Changes

1. **Create a new branch** from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the code style guidelines below

3. **Write or update tests** for your changes

4. **Run the test suite** to ensure all tests pass:

   ```bash
   npm test
   ```

5. **Run the linter and the format check**:

   ```bash
   npm run lint
   npm run format:check
   ```

   CI fails on files Prettier would change; `npm run format` formats them.

6. **Build the project** to ensure it compiles:

   ```bash
   npm run build
   ```

   The build starts with `tsc -b`, which type-checks the app, the tests (through `tsconfig.test.json`) and the Vite and Vitest configs. Run `npx tsc -b` for the type check alone.

When you commit, the pre-commit hook (Husky) runs lint-staged on the staged files: `eslint --fix` and the tests that import them (`vitest related --run`) for TypeScript files, and `prettier --write` for TypeScript, CSS, Markdown and JSON files.

Pull requests to `main` run CI (`.github/workflows/ci.yml`): ESLint, the format check, the tests with coverage, the build and the type check.

### Commit Messages

Write clear, concise commit messages that describe what changed and why:

```
feat: add gamepad support for DOS games

- Implement gamepad API integration
- Add configuration options for button mapping
- Update documentation with gamepad usage

Closes #123
```

**Commit message format**:

- `feat:` - New feature
- `fix:` - Bug fix
- `perf:` - Performance improvement
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test additions or updates
- `build:` - Build system or dependency changes
- `ci:` - GitHub Actions workflow changes
- `chore:` - Other maintenance, such as tooling configuration

### Pull Requests

1. **Push your changes** to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** on GitHub from your fork to the main repository

3. **Describe the PR** with:
   - Description of changes
   - Related issue numbers
   - Testing performed
   - Screenshots (if applicable)

4. **Wait for review** - Maintainers will review your PR and may request changes

5. **Address feedback** - Make requested changes and push updates to your branch

6. **Merge** - Once approved, a maintainer will merge your PR

## Code Style Guidelines

### TypeScript

- Use **TypeScript** for all new code
- Pass **strict mode** type checking (`strict` is on for the app, the tests and the configs)
- Avoid using `any` type - use `unknown`, specific types, or proper generics (ESLint reports explicit `any` as an error)
- Document complex types with JSDoc comments

### React

- Use **functional components** with hooks
- Follow React best practices and hooks rules
- Use meaningful component and prop names
- Keep components focused and single-purpose

### Code Formatting

- **ESLint**: All code must pass ESLint checks
- **Prettier**: Applies the rules below, with the settings in `.prettierrc`
- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings (double quotes in JSX attributes)
- **Semicolons**: Required
- **Line length**: Maximum 100 characters (soft limit)

Let the tools fix what they can:

```bash
# Format every file with Prettier
npm run format

# Apply ESLint's automatic fixes
npm run lint -- --fix
```

### File Organization

```
src/
├── adapters/       # Emulator adapter around js-dos
├── components/     # React components
├── config/         # Configuration files
├── constants/      # Shared constants
├── dos-apps/       # One config module per DOS app
├── hooks/          # Custom React hooks
├── integration/    # Integration tests
├── test/           # Test setup
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

Static files, such as icons and the DOS app archives in `public/demos/`, live in `public/`. `scripts/` holds the Node scripts and the tests for code outside `src/`. [`src/dos-apps/README.md`](src/dos-apps/README.md) explains how to add a DOS app.

## Testing Guidelines

### Test Requirements

- **Coverage**: Stay at or above the thresholds in `vitest.config.ts`; `npm run test:coverage`, which CI runs, fails below them
- **Unit tests**: Required for all new features and bug fixes
- **Component tests**: Required for all React components
- **Integration tests**: Recommended for complex features

### Writing Tests

- Use **Vitest** as the testing framework
- Use **Testing Library** for React component tests
- Write descriptive test names that explain what is being tested
- Follow the AAA pattern: Arrange, Act, Assert

Example:

```typescript
describe('DosPlayer', () => {
  it('should initialize js-dos on mount', () => {
    // Arrange
    const mockDos = vi.fn();
    window.Dos = mockDos;

    // Act
    render(<DosPlayer />);

    // Assert
    expect(mockDos).toHaveBeenCalled();
  });
});
```

### Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run one test file
npx vitest run src/utils/urlRouting.test.ts
```

Vitest does not type-check the tests; `npx tsc -b` does, through `tsconfig.test.json`, and so does `npm run build`.

## Documentation

- Update **README.md** if you change functionality
- Add **JSDoc comments** for public APIs and complex functions
- Update **type definitions** in `src/types/` as needed
- Include **code examples** for new features

### Generating API Documentation

The API documentation is generated from JSDoc comments using [TypeDoc](https://typedoc.org/):

```bash
# Generate documentation
npm run docs

# Watch mode - regenerate on file changes
npm run docs:watch
```

Documentation is output to `docs/api/`. Open `docs/api/index.html` in your browser to view.

### JSDoc Guidelines

All public APIs should have JSDoc comments with:

- **Description** - Brief description of what the function/class does
- **@param** - Description of each parameter
- **@returns** - Description of the return value
- **@throws** - Description of errors that may be thrown
- **@example** - Usage examples (optional but recommended)

Example:

```typescript
/**
 * Load a ZIP archive for js-dos
 *
 * @param zipUrl - URL of the ZIP archive
 * @param onProgress - Optional callback for progress updates
 * @param signal - Optional AbortSignal that cancels the download
 * @returns Promise that resolves to the archive's bytes
 * @throws {Error} If the download fails or is aborted
 */
export async function loadZipArchive(
  zipUrl: string,
  onProgress?: (progress: LoadProgress) => void,
  signal?: AbortSignal
): Promise<Uint8Array> {
  // Implementation...
}
```

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

- **Description**: Clear description of the bug
- **Steps to reproduce**: Detailed steps to reproduce the issue
- **Expected behavior**: What you expected to happen
- **Actual behavior**: What actually happened
- **Environment**: Browser, OS, Node.js version
- **Screenshots**: If applicable

### Feature Requests

When requesting features, please include:

- **Description**: Clear description of the feature
- **Use case**: Why this feature would be useful
- **Proposed solution**: How you think it should work
- **Alternatives**: Other solutions you've considered

## Commit Messages

Use **conventional commits** for automatic versioning and changelog generation:

- `feat:` - New feature (minor version bump)
- `fix:` - Bug fix (patch version bump)
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `refactor:` - Code refactoring
- `test:` - Test changes
- `BREAKING CHANGE:` footer, or `!` after the type (`feat!:`) - Breaking changes (major version bump)

Examples:

```bash
git commit -m "feat: add gamepad support"
git commit -m "fix: resolve audio sync issue"
git commit -m "docs: update installation guide"
```

## Release Process

Releases are **fully automated** using [release-please](https://github.com/googleapis/release-please):

### How It Works

1. **Write code** with conventional commit messages
2. **Merge PR to main** - that's it!
3. **release-please bot** automatically:
   - Creates/updates a "Release PR" with version bump and changelog
   - When you merge the Release PR, it creates a GitHub release
   - Builds and uploads artifacts automatically

### Creating a Release

After merging PRs to main, release-please automatically creates a **Release PR**:

1. **Check for Release PR** - Look for a PR titled "chore(main): release X.Y.Z"
2. **Review the Release PR** - Check version number and auto-generated changelog
3. **Merge the Release PR** - This triggers the GitHub release creation

### Versioning

DosKit follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes, incompatible API changes
- **MINOR** (0.X.0): New features, backwards compatible
- **PATCH** (0.0.X): Bug fixes, backwards compatible

### Manual Release (Emergency Only)

If you need to create a release manually:

1. Update version in `package.json`
2. Update `CHANGELOG.md` manually
3. Commit: `git commit -m "chore: release X.Y.Z"`
4. Tag: `git tag vX.Y.Z`
5. Push: `git push origin main --tags`

## Questions?

If you have questions about contributing:

- Open a **GitHub Discussion**
- Check existing **Issues** and **Pull Requests**
- Contact the maintainer: [cameron@rye.dev](mailto:cameron@rye.dev)

## License

By contributing to DosKit, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to DosKit!

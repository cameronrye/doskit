# Contributing to DosKit

Thank you for your interest in contributing to DosKit! This document provides guidelines and instructions for contributing to the project.

## Getting Started

### Prerequisites

- **Node.js**: Version 24.x or higher
- **npm**: Version 10.x or higher
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

4. **Start the development server**:
   ```bash
   npm run dev
   ```

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

5. **Run the linter** to check code style:
   ```bash
   npm run lint
   ```

6. **Build the project** to ensure it compiles:
   ```bash
   npm run build
   ```

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
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test additions or updates
- `chore:` - Build process or auxiliary tool changes

### Pull Requests

1. **Push your changes** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** on GitHub from your fork to the main repository

3. **Fill out the PR template** with:
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
- Enable **strict mode** type checking
- Avoid using `any` type - use `unknown`, specific types, or proper generics
- Document complex types with JSDoc comments

### React

- Use **functional components** with hooks
- Follow React best practices and hooks rules
- Use meaningful component and prop names
- Keep components focused and single-purpose

### Code Formatting

- **ESLint**: All code must pass ESLint checks
- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Line length**: Maximum 100 characters (soft limit)

Run the linter to auto-fix many style issues:
```bash
npm run lint
```

### File Organization

```
src/
├── components/     # React components
├── config/         # Configuration files
├── hooks/          # Custom React hooks
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── assets/         # Static assets
```

## Testing Guidelines

### Test Requirements

- **Coverage**: Maintain minimum 70% code coverage
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
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## Documentation

- Update **README.md** if you change functionality
- Add **JSDoc comments** for public APIs and complex functions
- Update **type definitions** in `src/types/` as needed
- Include **code examples** for new features

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

## Questions?

If you have questions about contributing:
- Open a **GitHub Discussion**
- Check existing **Issues** and **Pull Requests**
- Contact the maintainer: [cameron@rye.dev](mailto:cameron@rye.dev)

## License

By contributing to DosKit, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to DosKit! 🎮


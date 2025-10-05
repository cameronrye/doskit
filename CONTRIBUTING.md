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

## WASM Compiler Development

### Architecture Overview

DosKit's compilation system consists of three main layers:

```
CompilerService (Orchestration)
    ↓
WasmCompilerService (Validation & Options)
    ↓
DosExecutableGenerator (Code Generation)
```

### Testing the WASM Compiler

#### Running Compiler Tests

```bash
# Run all compiler tests
npm test -- src/services/WasmCompilerService.test.ts --run

# Run integration tests
npm test -- src/services/CompilerService.integration.test.ts --run

# Run performance tests
npm test -- src/services/CompilerService.performance.test.ts --run

# Run all tests with coverage
npm run test:coverage
```

#### Test Coverage Requirements

- **Unit Tests**: Minimum 85% coverage for new compiler code
- **Integration Tests**: Test end-to-end compilation workflow
- **Performance Tests**: Verify compilation times meet benchmarks
- **Regression Tests**: Ensure existing functionality still works

### Updating the WASM Compiler

#### Adding New C Language Features

1. **Update DosExecutableGenerator** (`src/services/DosExecutableGenerator.ts`):
   - Add parsing logic for new C constructs
   - Generate corresponding x86 assembly code
   - Update DOS system call interface if needed

2. **Add Tests**:
   ```typescript
   it('should compile programs with new feature', async () => {
     const sourceCode = `/* Test code using new feature */`;
     const result = await wasmCompiler.compile(sourceCode, 'test.c', 'test.exe');
     expect(result.success).toBe(true);
   });
   ```

3. **Update Documentation**:
   - Add examples to `docs/WASM-GCC-INTEGRATION.md`
   - Update user guides with new capabilities

#### Adding Compiler Options

1. **Update CompilerOptions** interface in `src/types/compiler.d.ts`:
   ```typescript
   export interface CompilerOptions {
     // ... existing options
     newOption: boolean;  // Add new option
   }
   ```

2. **Update WasmCompilerService** to handle the new option:
   ```typescript
   private mergeOptions(options?: Partial<CompilerOptions>): CompilerOptions {
     return {
       // ... existing options
       newOption: options?.newOption ?? this.config.defaultNewOption,
     };
   }
   ```

3. **Add configuration** in `src/config/compiler.config.ts`:
   ```typescript
   export const wasmCompilerConfig: WasmCompilerConfig = {
     // ... existing config
     defaultNewOption: false,
   };
   ```

### Performance Considerations

#### Compilation Performance

**Target Benchmarks**:
- Simple programs (<50 lines): <100ms
- Medium programs (50-200 lines): <500ms
- Complex programs (200-500 lines): <2000ms

**Optimization Tips**:
1. **Minimize Validation Overhead**: Cache validation results when possible
2. **Efficient Code Generation**: Use typed arrays for binary data
3. **Avoid Unnecessary Copies**: Reuse buffers where possible
4. **Profile Regularly**: Use performance tests to catch regressions

#### Memory Usage

**Guidelines**:
- Keep executable size minimal (target <5KB for simple programs)
- Avoid memory leaks in compilation pipeline
- Clean up temporary buffers after compilation
- Use streaming for large files (future enhancement)

### Architecture Diagrams

#### Compilation Flow

```
┌─────────────┐
│ User clicks │
│   "Build"   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│   CompilerService.compile()     │
│   • Determine active compiler   │
│   • Read source file            │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  WasmCompilerService.compile()  │
│  • Validate source code         │
│  • Merge compiler options       │
│  • Handle timeout               │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ DosExecutableGenerator          │
│  • Parse C source               │
│  • Generate x86 assembly        │
│  • Create MZ executable         │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│   Write to DOS filesystem       │
│   Return CompileResult          │
└─────────────────────────────────┘
```

#### Component Responsibilities

**CompilerService**:
- Route compilation requests
- Manage build messages
- Coordinate filesystem operations
- Provide compiler status

**WasmCompilerService**:
- Validate C source code
- Manage compiler options
- Generate DOS executables
- Parse compiler messages
- Handle timeouts

**DosExecutableGenerator**:
- Parse simple C code
- Generate 16-bit x86 assembly
- Create DOS MZ executable format
- Implement DOS system calls

**FileSystemService**:
- Read/write DOS filesystem
- File existence checks
- Binary file operations

### Common Development Tasks

#### Adding a New DOS System Call

1. **Add to DosSystemCalls class**:
   ```typescript
   static generateNewSyscall(params: any): Uint8Array {
     return new Uint8Array([
       0xB4, 0xXX,  // MOV AH, XXh (DOS function)
       // ... more assembly
       0xCD, 0x21,  // INT 21h
     ]);
   }
   ```

2. **Update generateFromSimpleC()** to recognize the new call
3. **Add tests** for the new system call
4. **Document** in technical documentation

#### Debugging Compilation Issues

1. **Enable Verbose Logging**:
   ```typescript
   export const wasmCompilerConfig = {
     verbose: true,  // Enable detailed logs
   };
   ```

2. **Check Build Messages**:
   ```typescript
   const messages = compilerService.getBuildMessages();
   console.log('Build messages:', messages);
   ```

3. **Inspect Generated Executable**:
   ```typescript
   const result = await compile(...);
   console.log('Executable size:', result.executable?.length);
   console.log('Executable bytes:', Array.from(result.executable || []));
   ```

4. **Test in DOSBox**: Compare with real DOS executables

### Code Review Checklist

When reviewing compiler-related PRs:

- [ ] All tests pass (unit, integration, performance)
- [ ] Code coverage meets minimum requirements (85%)
- [ ] Performance benchmarks are met
- [ ] Documentation is updated
- [ ] Type definitions are complete
- [ ] Error messages are clear and helpful
- [ ] No memory leaks or performance regressions
- [ ] Code follows TypeScript best practices
- [ ] JSDoc comments for public APIs

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


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

## Open Watcom Compiler Development

### Architecture Overview

The Open Watcom integration provides **real DOS compilation** using the authentic Open Watcom C/C++ compiler running in the js-dos emulator. This is the primary compiler for DosKit.

#### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
│  (CodeEditor, BuildPanel, CompilerOptionsPanel)             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   CompilerService                            │
│  • Route to Open Watcom compiler                             │
│  • Manage build messages                                     │
│  • Coordinate filesystem operations                          │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│              OpenWatcomCompilerService                       │
│  • Generate DOS batch files                                  │
│  • Execute wcc.exe (compiler)                                │
│  • Execute wlink.exe (linker)                                │
│  • Parse compiler output                                     │
│  • Track progress                                            │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    js-dos Emulator                           │
│  • Execute DOS commands via CommandInterface                 │
│  • Provide DOS filesystem                                    │
│  • Run Open Watcom binaries                                  │
└─────────────────────────────────────────────────────────────┘
```

#### Key Components

**OpenWatcomCompilerService** (`src/services/OpenWatcomCompilerService.ts`):
- Main service for Open Watcom compilation
- Generates batch files for compilation and linking
- Executes DOS commands via js-dos CommandInterface
- Parses compiler/linker output for errors and warnings
- Tracks compilation progress with cancellation support

**OpenWatcomErrorParser** (`src/services/OpenWatcomErrorParser.ts`):
- Parses Open Watcom compiler output
- Extracts errors, warnings, and info messages
- Formats messages for UI display
- Handles multi-line error messages

**BatchFileGenerator** (part of OpenWatcomCompilerService):
- Generates DOS batch files for compilation
- Generates DOS batch files for linking
- Sets up environment variables (WATCOM, PATH, INCLUDE, LIB)
- Handles DOS path formatting

**DosCommandExecutor** (part of OpenWatcomCompilerService):
- Executes DOS commands via js-dos CommandInterface
- Captures command output (stdout/stderr)
- Handles timeouts and errors
- Provides retry logic for transient failures

### Testing the Open Watcom Compiler

#### Running Compiler Tests

```bash
# Run all Open Watcom tests
npm test -- src/services/OpenWatcomCompilerService.test.ts --run

# Run multi-file compilation tests
npm test -- src/services/OpenWatcomCompilerService.multifile.test.ts --run

# Run integration tests
npm test -- src/services/OpenWatcomCompilerService.integration.test.ts --run

# Run performance tests
npm test -- src/services/OpenWatcomCompilerService.performance.test.ts --run

# Run error parser tests
npm test -- src/services/OpenWatcomErrorParser.test.ts --run

# Run all tests with coverage
npm run test:coverage
```

#### Test Coverage Requirements

- **Unit Tests**: Minimum 85% coverage for new compiler code
- **Integration Tests**: Test end-to-end compilation with real Open Watcom
- **Performance Tests**: Verify compilation times meet benchmarks
- **Multi-file Tests**: Test complex projects with multiple source files
- **Error Handling Tests**: Test all error scenarios and recovery

### Developing Open Watcom Features

#### Adding New Compiler Options

1. **Update OpenWatcomOptions** interface in `src/types/compiler.d.ts`:
   ```typescript
   export interface OpenWatcomOptions extends Partial<CompilerOptions> {
     memoryModel?: MemoryModel;
     watcomOptimizations?: string[];
     warningLevel?: number;
     warningsAsErrors?: boolean;
     newOption?: boolean;  // Add new option
   }
   ```

2. **Update OpenWatcomCompilerService** to handle the new option:
   ```typescript
   private buildCompilerFlags(options: OpenWatcomOptions): string[] {
     const flags: string[] = [];
     // ... existing flags
     if (options.newOption) {
       flags.push('-new-flag');
     }
     return flags;
   }
   ```

3. **Add configuration** in `src/config/openwatcom.config.ts`:
   ```typescript
   export const defaultOpenWatcomConfig: OpenWatcomConfig = {
     // ... existing config
     defaultNewOption: false,
   };
   ```

4. **Add tests** for the new option:
   ```typescript
   it('should apply new option when specified', async () => {
     const result = await compiler.compile(
       sourceCode,
       'test.c',
       'test.exe',
       { newOption: true }
     );
     expect(result.success).toBe(true);
   });
   ```

#### Implementing DOS Command Execution

The DOS command execution is handled through js-dos CommandInterface. Here's how it works:

1. **Generate Batch File**:
   ```typescript
   private generateCompileBatch(sourceFile: string, options: OpenWatcomOptions): string {
     return `@ECHO OFF
SET WATCOM=C:\\WATCOM
SET PATH=%WATCOM%\\BINW;%PATH%
SET INCLUDE=%WATCOM%\\H
SET LIB=%WATCOM%\\LIB286\\DOS
WCC.EXE ${sourceFile} ${this.buildCompilerFlags(options).join(' ')}
`;
   }
   ```

2. **Write Batch File to DOS Filesystem**:
   ```typescript
   await this.fs.writeTextFile('C:\\TEMP\\COMPILE.BAT', batchContent);
   ```

3. **Execute Batch File**:
   ```typescript
   const output = await this.executeDosCommand('C:\\TEMP\\COMPILE.BAT');
   ```

4. **Parse Output**:
   ```typescript
   const parseResult = OpenWatcomErrorParser.parse(output);
   if (parseResult.hasErrors) {
     // Handle compilation errors
   }
   ```

### Debugging Open Watcom Compilation

#### Enable Verbose Logging

```typescript
export const defaultOpenWatcomConfig: OpenWatcomConfig = {
  verbose: true,  // Enable detailed logs
  // ... other config
};
```

This will log:
- Batch file contents
- DOS commands being executed
- Compiler/linker output
- File operations
- Progress updates

#### Check Build Messages

```typescript
const messages = compilerService.getBuildMessages();
console.log('Build messages:', messages);
```

#### Inspect Generated Files

```typescript
// Check if object file was created
const objExists = await fs.fileExists('C:\\TEMP\\SOURCE.OBJ');
console.log('Object file exists:', objExists);

// Check if executable was created
const exeExists = await fs.fileExists('C:\\OUTPUT\\PROGRAM.EXE');
console.log('Executable exists:', exeExists);

// Read executable
const executable = await fs.readBinaryFile('C:\\OUTPUT\\PROGRAM.EXE');
console.log('Executable size:', executable.length);
console.log('MZ header:', executable[0] === 0x4D && executable[1] === 0x5A);
```

#### Test in js-dos Emulator

After compilation, test the executable in the js-dos emulator:

```typescript
// Run the compiled program
await ci.exec('C:\\OUTPUT\\PROGRAM.EXE');
```

### Performance Considerations

#### Compilation Performance

**Target Benchmarks**:
- Simple programs (<50 lines): <1.5s
- Medium programs (50-200 lines): <3s
- Complex programs (200-500 lines): <6s

**Optimization Tips**:
1. **Minimize File I/O**: Batch file operations when possible
2. **Efficient Batch Files**: Keep batch files simple and focused
3. **Timeout Configuration**: Set appropriate timeouts for different program sizes
4. **Progress Updates**: Update progress at meaningful intervals (not too frequently)

#### Memory Usage

**Guidelines**:
- Clean up temporary files after compilation
- Avoid memory leaks in progress tracking
- Use appropriate memory models for programs
- Monitor js-dos emulator memory usage

### Common Development Tasks

#### Adding Support for New Memory Model

Memory models are already supported, but here's how to add a new one:

1. **Update MemoryModel type** in `src/types/compiler.d.ts`:
   ```typescript
   export type MemoryModel = 'tiny' | 'small' | 'compact' | 'medium' | 'large' | 'huge' | 'new-model';
   ```

2. **Add memory model flag mapping**:
   ```typescript
   private getMemoryModelFlag(model: MemoryModel): string {
     const flags: Record<MemoryModel, string> = {
       tiny: '-mt',
       small: '-ms',
       compact: '-mc',
       medium: '-mm',
       large: '-ml',
       huge: '-mh',
       'new-model': '-mnew',
     };
     return flags[model];
   }
   ```

#### Troubleshooting Compilation Issues

**Issue**: Compilation timeout

**Solutions**:
1. Increase `maxCompilationTime` in configuration
2. Check if js-dos emulator is responsive
3. Verify batch file is correct
4. Check for infinite loops in source code

**Issue**: Compiler not found

**Solutions**:
1. Verify Open Watcom toolchain is installed in js-dos
2. Check `compilerBin` path in configuration
3. Ensure `C:\WATCOM\BINW\WCC.EXE` exists
4. Check file permissions in js-dos filesystem

**Issue**: Linker errors

**Solutions**:
1. Verify all object files were created
2. Check library path configuration
3. Ensure standard libraries are available
4. Check for undefined symbols in source code

### Code Review Checklist

When reviewing Open Watcom compiler PRs:

- [ ] All tests pass (unit, integration, performance, multi-file)
- [ ] Code coverage meets minimum requirements (85%)
- [ ] Performance benchmarks are met
- [ ] Documentation is updated
- [ ] Type definitions are complete
- [ ] Error messages are clear and helpful
- [ ] Batch files are correct and efficient
- [ ] DOS command execution is robust
- [ ] Progress tracking works correctly
- [ ] Timeout handling is appropriate
- [ ] Temporary files are cleaned up
- [ ] Code follows TypeScript best practices
- [ ] JSDoc comments for public APIs

---

## WASM Compiler Development

### Architecture Overview

DosKit's WASM compilation system consists of three main layers:

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


# Quick Start: DosKit Code Mode

## 🚀 Get Started in 5 Minutes

This guide will help you start developing DOS applications with DosKit's Code Mode, featuring **real C compilation** that generates actual DOS executables!

## What You'll Get

- **Monaco Editor**: Professional code editor with syntax highlighting
- **Real C Compiler**: WebAssembly-based compilation (not a simulator!)
- **Instant Execution**: Compiled programs run immediately in DOS
- **Build Feedback**: Real-time errors, warnings, and compilation statistics

## Prerequisites

- Node.js 18+ installed
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Basic knowledge of C programming

## Step 1: Start DosKit

```bash
# Navigate to doskit directory
cd doskit

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

The server will start at `http://localhost:5173` (or another port if 5173 is in use).

## Step 2: Switch to Code Mode

1. Open DosKit in your browser
2. Look for the mode switcher in the header
3. Click the **"💻 Code"** button

You should now see:
- **Left side:** Code editor with a Hello World program
- **Right side:** Build panel with Build/Run/Clear buttons

## Step 3: Edit Your First Program

The editor loads with this Hello World template:

```c
/* Hello World - Classic DOS C Program */
#include <stdio.h>

int main(void) {
    printf("Hello, DOS!\n");
    printf("Welcome to DosKit Development Environment\n");
    printf("\n");
    printf("This program was compiled with DJGPP (GCC for DOS)\n");
    return 0;
}
```

Try modifying it:

```c
#include <stdio.h>

int main(void) {
    printf("Hello from DosKit!\n");
    printf("I'm learning DOS programming!\n");
    return 0;
}
```

**Save your changes:** Press `Ctrl+S` (or `Cmd+S` on Mac)

## Step 4: Build Your Program

1. Click the **"🔨 Build"** button
2. Watch the Build Panel for output
3. Look for the green success message: "✅ Compilation successful"

**What Happens During Build**:
- Your C code is validated for syntax errors
- The WebAssembly compiler generates real x86 assembly code
- A valid DOS MZ executable is created (not simulated!)
- The executable is written to the DOS filesystem
- Build statistics show compilation time and executable size

**Build Panel Shows**:
- ℹ️ Info messages (compilation progress)
- ⚠️ Warnings (non-critical issues)
- ❌ Errors (must be fixed to compile)
- ✅ Success message with statistics

If you see errors:
- Red messages (❌) indicate errors
- Yellow messages (⚠️) indicate warnings
- Fix the errors and build again

## Step 5: Run Your Program

1. After a successful build, the **"▶️ Run"** button becomes enabled
2. Click **"Run"** to execute your program
3. **The screen automatically switches to Terminal Mode** - no manual switching needed!
4. **The DOS window appears** and your program executes
5. Watch the output appear in the DOS window!

### Returning to the Editor

After your program runs, you'll see:
- **← Back to Editor** button at the top of the DOS window (purple gradient)
- **Program Running** indicator (green pulsing dot)

Click **← Back to Editor** to return to the code editor and continue development.

**Tip**: The mode switcher buttons are disabled while a program is running to prevent accidental mode changes. Use the "Back to Editor" button instead.

## 🎓 Try These Examples

### Example 1: User Input

```c
#include <stdio.h>
#include <string.h>

int main(void) {
    char name[50];
    
    printf("What is your name? ");
    fgets(name, sizeof(name), stdin);
    name[strcspn(name, "\n")] = 0;
    
    printf("Hello, %s!\n", name);
    return 0;
}
```

### Example 2: Simple Calculator

```c
#include <stdio.h>

int main(void) {
    double num1, num2, result;
    char operator;
    
    printf("Enter calculation (e.g., 5 + 3): ");
    scanf("%lf %c %lf", &num1, &operator, &num2);
    
    switch(operator) {
        case '+':
            result = num1 + num2;
            printf("%.2f + %.2f = %.2f\n", num1, num2, result);
            break;
        case '-':
            result = num1 - num2;
            printf("%.2f - %.2f = %.2f\n", num1, num2, result);
            break;
        case '*':
            result = num1 * num2;
            printf("%.2f * %.2f = %.2f\n", num1, num2, result);
            break;
        case '/':
            if(num2 != 0) {
                result = num1 / num2;
                printf("%.2f / %.2f = %.2f\n", num1, num2, result);
            } else {
                printf("Error: Division by zero!\n");
            }
            break;
        default:
            printf("Error: Invalid operator!\n");
    }
    
    return 0;
}
```

### Example 3: Loop Demo

```c
#include <stdio.h>

int main(void) {
    int i;
    
    printf("Counting to 10:\n");
    for(i = 1; i <= 10; i++) {
        printf("%d ", i);
    }
    printf("\n");
    
    printf("\nCounting down from 10:\n");
    for(i = 10; i >= 1; i--) {
        printf("%d ", i);
    }
    printf("\n");
    
    return 0;
}
```

## 💡 Tips & Tricks

### Keyboard Shortcuts

- `Ctrl+S` / `Cmd+S` - Save file
- `Ctrl+F` - Find in file
- `Ctrl+H` - Find and replace
- `Ctrl+/` - Toggle comment
- `Alt+Up/Down` - Move line up/down

### Editor Features

- **Auto-completion:** Start typing and press `Ctrl+Space`
- **Code folding:** Click the arrows next to line numbers
- **Multi-cursor:** Hold `Alt` and click
- **Select all occurrences:** `Ctrl+Shift+L`

### Build Panel

- **Clear output:** Click "🗑️ Clear" to start fresh
- **Auto-scroll:** Output automatically scrolls to latest message
- **Message types:**
  - ℹ️ Info - General information
  - ⚠️ Warning - Potential issues
  - ❌ Error - Compilation failed
  - ✅ Success - Compilation succeeded

### Common Errors

**Error: 'main' function not found**
```c
// Wrong - missing main function
#include <stdio.h>

void myFunction() {
    printf("Hello\n");
}

// Correct - has main function
#include <stdio.h>

int main(void) {
    printf("Hello\n");
    return 0;
}
```

**Warning: implicit declaration of function 'printf'**
```c
// Wrong - missing include
int main(void) {
    printf("Hello\n");
    return 0;
}

// Correct - has include
#include <stdio.h>

int main(void) {
    printf("Hello\n");
    return 0;
}
```

**Error: expected '}'**
```c
// Wrong - missing closing brace
int main(void) {
    printf("Hello\n");
    return 0;
// Missing }

// Correct - has closing brace
int main(void) {
    printf("Hello\n");
    return 0;
}
```

## 🔄 Switching Modes

### Back to Terminal Mode

Click the **"Terminal"** button (with DosKit logo) to return to the DOS emulator view.

### Why Two Modes?

- **Terminal Mode:** Run pre-built DOS applications and interact with DOS
- **Code Mode:** Create your own DOS applications

## 📚 Learning Resources

### C Programming Basics

- Variables and data types
- Control structures (if, switch, loops)
- Functions
- Arrays and strings
- Pointers (advanced)

### DOS-Specific Programming

- Console I/O (`printf`, `scanf`)
- File operations
- Graphics (future: Allegro library)
- Sound (future: Sound Blaster)

## 🐛 Troubleshooting

### Editor not loading
- Refresh the page
- Check browser console for errors
- Ensure JavaScript is enabled

### Build button disabled
- Wait for "Ready" status in footer
- Check that DOS emulator has initialized

### Code not saving
- Press `Ctrl+S` explicitly
- Check for "Last saved" timestamp in header

### Build errors
- Read error messages carefully
- Check for missing semicolons
- Verify all braces match
- Ensure `main()` function exists

## 🔬 How It Works

### Real Compilation, Not Simulation

DosKit uses a **real C compiler** that generates actual DOS executables:

1. **Source Validation**: Your C code is checked for syntax errors
2. **Code Generation**: The compiler generates 16-bit x86 assembly code
3. **Executable Creation**: A valid DOS MZ format executable is created
4. **DOS Execution**: The executable runs in the js-dos emulator

**This is not a simulator!** The generated `.exe` files are real DOS executables that:
- Use the standard DOS MZ executable format
- Contain actual x86 machine code
- Make real DOS INT 21h system calls
- Can be extracted and run in DOSBox or real DOS

### Compiler Architecture

```
Your C Code
    ↓
WasmCompilerService (Validation & Options)
    ↓
DosExecutableGenerator (x86 Code Generation)
    ↓
DOS MZ Executable (Binary)
    ↓
js-dos Emulator (Execution)
```

### Technical Details

- **Executable Format**: DOS MZ (Mark Zbikowski) format
- **Target Architecture**: 16-bit x86 (8086/80186 compatible)
- **System Calls**: DOS INT 21h API
- **Compilation Time**: Typically 50-500ms depending on code size
- **Executable Size**: 150 bytes to several KB

## 🎯 Next Steps

1. **Experiment:** Try modifying the examples
2. **Learn:** Study C programming basics
3. **Create:** Build your own DOS programs
4. **Share:** Export your programs (coming soon)

## 📖 Further Reading

- [WASM GCC Integration Documentation](WASM-GCC-INTEGRATION.md) - Technical details and architecture
- [Contributing Guide](../CONTRIBUTING.md) - Developer documentation and testing
- [DosKit Main README](../README.md) - Project overview
- [js-dos API Reference](js-dos-llm-reference.md) - Emulator API

## 🆘 Getting Help

- Check the [Troubleshooting](#troubleshooting) section
- Review error messages in Build Panel
- Open an issue on GitHub
- Join the DosKit community

---

**Happy DOS Programming! 🎉**

Start simple, experiment often, and have fun creating retro DOS applications!


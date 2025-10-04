/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Compiler configuration and project templates
 */

import type { CompilerConfig, ProjectTemplate } from '../types/compiler';

/**
 * Compiler configuration
 * Used for mock compiler and future WebAssembly GCC integration
 */
export const compilerConfig: CompilerConfig = {
  name: 'GCC',
  basePath: '/COMPILER',
  binPath: '/COMPILER/BIN',
  includePath: '/COMPILER/INCLUDE',
  libPath: '/COMPILER/LIB',
  compiler: 'gcc.exe',
  defaultFlags: ['-Wall', '-O2'],
};

/**
 * NASM assembler configuration (for future use)
 */
export const nasmConfig: CompilerConfig = {
  name: 'NASM',
  basePath: '/C/NASM',
  binPath: '/C/NASM/BIN',
  includePath: '/C/NASM/INCLUDE',
  libPath: '',
  compiler: 'nasm.exe',
  defaultFlags: ['-f', 'bin'],
};

/**
 * Default compiler configuration
 */
export const defaultCompilerConfig = compilerConfig;

/**
 * Project templates for quick start
 */
export const projectTemplates: Record<string, ProjectTemplate> = {
  'hello-world': {
    id: 'hello-world',
    name: 'Hello World',
    description: 'Simple C program that prints "Hello, DOS!" to the console',
    category: 'beginner',
    mainFile: 'hello.c',
    buildCommand: 'gcc -o hello.exe hello.c',
    files: [
      {
        name: 'hello.c',
        language: 'c',
        content: `/* Hello World - Classic DOS C Program */
#include <stdio.h>

int main(void) {
    printf("Hello, DOS!\\n");
    printf("Welcome to DosKit Development Environment\\n");
    printf("\\n");
    printf("This program was compiled with GCC\\n");
    return 0;
}
`,
      },
    ],
    compilerOptions: {
      optimization: 'O2',
      warnings: true,
      debug: false,
    },
  },

  'input-demo': {
    id: 'input-demo',
    name: 'User Input Demo',
    description: 'Demonstrates reading user input in DOS',
    category: 'beginner',
    mainFile: 'input.c',
    buildCommand: 'gcc -o input.exe input.c',
    files: [
      {
        name: 'input.c',
        language: 'c',
        content: `/* User Input Demo */
#include <stdio.h>
#include <string.h>

int main(void) {
    char name[50];
    int age;
    
    printf("=== User Input Demo ===\\n\\n");
    
    printf("What is your name? ");
    fgets(name, sizeof(name), stdin);
    name[strcspn(name, "\\n")] = 0; /* Remove newline */
    
    printf("How old are you? ");
    scanf("%d", &age);
    
    printf("\\nHello, %s!\\n", name);
    printf("You are %d years old.\\n", age);
    
    return 0;
}
`,
      },
    ],
    compilerOptions: {
      optimization: 'O2',
      warnings: true,
      debug: false,
    },
  },

  'calculator': {
    id: 'calculator',
    name: 'Simple Calculator',
    description: 'Basic calculator with arithmetic operations',
    category: 'intermediate',
    mainFile: 'calc.c',
    buildCommand: 'gcc -o calc.exe calc.c',
    files: [
      {
        name: 'calc.c',
        language: 'c',
        content: `/* Simple Calculator */
#include <stdio.h>

int main(void) {
    double num1, num2, result;
    char operator;
    
    printf("=== Simple DOS Calculator ===\\n\\n");
    printf("Enter calculation (e.g., 5 + 3): ");
    scanf("%lf %c %lf", &num1, &operator, &num2);
    
    switch(operator) {
        case '+':
            result = num1 + num2;
            printf("%.2f + %.2f = %.2f\\n", num1, num2, result);
            break;
        case '-':
            result = num1 - num2;
            printf("%.2f - %.2f = %.2f\\n", num1, num2, result);
            break;
        case '*':
            result = num1 * num2;
            printf("%.2f * %.2f = %.2f\\n", num1, num2, result);
            break;
        case '/':
            if(num2 != 0) {
                result = num1 / num2;
                printf("%.2f / %.2f = %.2f\\n", num1, num2, result);
            } else {
                printf("Error: Division by zero!\\n");
            }
            break;
        default:
            printf("Error: Invalid operator!\\n");
    }
    
    return 0;
}
`,
      },
    ],
    compilerOptions: {
      optimization: 'O2',
      warnings: true,
      debug: false,
    },
  },
};

/**
 * Get template by ID
 */
export function getTemplate(id: string): ProjectTemplate | null {
  return projectTemplates[id] || null;
}

/**
 * Get all available templates
 */
export function getAllTemplates(): ProjectTemplate[] {
  return Object.values(projectTemplates);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: ProjectTemplate['category']): ProjectTemplate[] {
  return Object.values(projectTemplates).filter(t => t.category === category);
}

/**
 * Mock compiler toggle
 * Set to false to use real DOS compilation (Phase 3 POC)
 * Set to true to use mock compiler (Phase 2 implementation)
 */
export const mockCompilerEnabled = true;

/**
 * Real DOS compiler toggle (Phase 3 Proof of Concept)
 * Set to true to use real DOS executable generation
 * Set to false to use mock compiler
 * Note: This overrides mockCompilerEnabled when true
 */
export const realDosCompilerEnabled = true;

/**
 * Mock compilation delay (ms) - simulates compilation time
 */
export const mockCompilationDelay = 1500;


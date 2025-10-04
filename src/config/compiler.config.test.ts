/**
 * DosKit - Compiler Config Tests
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { describe, it, expect } from 'vitest';
import {
  compilerConfig,
  nasmConfig,
  defaultCompilerConfig,
  projectTemplates,
  getTemplate,
  getAllTemplates,
  getTemplatesByCategory,
  mockCompilerEnabled,
  mockCompilationDelay,
} from './compiler.config';

describe('compiler.config', () => {
  describe('compilerConfig', () => {
    it('should have correct compiler configuration', () => {
      expect(compilerConfig.name).toBe('GCC');
      expect(compilerConfig.basePath).toBe('/COMPILER');
      expect(compilerConfig.binPath).toBe('/COMPILER/BIN');
      expect(compilerConfig.includePath).toBe('/COMPILER/INCLUDE');
      expect(compilerConfig.libPath).toBe('/COMPILER/LIB');
      expect(compilerConfig.compiler).toBe('gcc.exe');
      expect(compilerConfig.defaultFlags).toContain('-Wall');
      expect(compilerConfig.defaultFlags).toContain('-O2');
    });
  });

  describe('nasmConfig', () => {
    it('should have correct NASM configuration', () => {
      expect(nasmConfig.name).toBe('NASM');
      expect(nasmConfig.basePath).toBe('/C/NASM');
      expect(nasmConfig.binPath).toBe('/C/NASM/BIN');
      expect(nasmConfig.compiler).toBe('nasm.exe');
      expect(nasmConfig.defaultFlags).toContain('-f');
      expect(nasmConfig.defaultFlags).toContain('bin');
    });
  });

  describe('defaultCompilerConfig', () => {
    it('should default to compilerConfig', () => {
      expect(defaultCompilerConfig).toBe(compilerConfig);
    });
  });

  describe('projectTemplates', () => {
    it('should have hello-world template', () => {
      expect(projectTemplates['hello-world']).toBeDefined();
      expect(projectTemplates['hello-world'].name).toBe('Hello World');
      expect(projectTemplates['hello-world'].category).toBe('beginner');
    });

    it('should have input-demo template', () => {
      expect(projectTemplates['input-demo']).toBeDefined();
      expect(projectTemplates['input-demo'].name).toBe('User Input Demo');
      expect(projectTemplates['input-demo'].category).toBe('beginner');
    });

    it('should have calculator template', () => {
      expect(projectTemplates['calculator']).toBeDefined();
      expect(projectTemplates['calculator'].name).toBe('Simple Calculator');
      expect(projectTemplates['calculator'].category).toBe('intermediate');
    });

    it('should have valid file structures', () => {
      Object.values(projectTemplates).forEach(template => {
        expect(template.files).toBeDefined();
        expect(template.files.length).toBeGreaterThan(0);
        expect(template.mainFile).toBeDefined();
        expect(template.buildCommand).toBeDefined();
      });
    });

    it('should have valid C code in templates', () => {
      Object.values(projectTemplates).forEach(template => {
        template.files.forEach(file => {
          expect(file.content).toBeDefined();
          expect(file.content.length).toBeGreaterThan(0);
          
          if (file.language === 'c') {
            // Basic validation: should have main function
            expect(file.content).toContain('main');
            // Should have proper includes
            expect(file.content).toContain('#include');
          }
        });
      });
    });

    it('should have compiler options', () => {
      Object.values(projectTemplates).forEach(template => {
        expect(template.compilerOptions).toBeDefined();
        expect(template.compilerOptions?.optimization).toBeDefined();
        expect(template.compilerOptions?.warnings).toBeDefined();
        expect(template.compilerOptions?.debug).toBeDefined();
      });
    });
  });

  describe('getTemplate', () => {
    it('should return template by ID', () => {
      const template = getTemplate('hello-world');
      expect(template).toBeDefined();
      expect(template?.id).toBe('hello-world');
      expect(template?.name).toBe('Hello World');
    });

    it('should return null for non-existent template', () => {
      const template = getTemplate('non-existent');
      expect(template).toBeNull();
    });

    it('should return correct template for each ID', () => {
      const helloWorld = getTemplate('hello-world');
      const inputDemo = getTemplate('input-demo');
      const calculator = getTemplate('calculator');

      expect(helloWorld?.id).toBe('hello-world');
      expect(inputDemo?.id).toBe('input-demo');
      expect(calculator?.id).toBe('calculator');
    });
  });

  describe('getAllTemplates', () => {
    it('should return all templates', () => {
      const templates = getAllTemplates();
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.length).toBe(Object.keys(projectTemplates).length);
    });

    it('should return array of template objects', () => {
      const templates = getAllTemplates();
      templates.forEach(template => {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.category).toBeDefined();
        expect(template.files).toBeDefined();
      });
    });

    it('should include all known templates', () => {
      const templates = getAllTemplates();
      const ids = templates.map(t => t.id);
      
      expect(ids).toContain('hello-world');
      expect(ids).toContain('input-demo');
      expect(ids).toContain('calculator');
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should return beginner templates', () => {
      const beginnerTemplates = getTemplatesByCategory('beginner');
      expect(beginnerTemplates.length).toBeGreaterThan(0);
      beginnerTemplates.forEach(template => {
        expect(template.category).toBe('beginner');
      });
    });

    it('should return intermediate templates', () => {
      const intermediateTemplates = getTemplatesByCategory('intermediate');
      expect(intermediateTemplates.length).toBeGreaterThan(0);
      intermediateTemplates.forEach(template => {
        expect(template.category).toBe('intermediate');
      });
    });

    it('should return empty array for categories with no templates', () => {
      const advancedTemplates = getTemplatesByCategory('advanced');
      expect(advancedTemplates).toEqual([]);
    });

    it('should filter correctly', () => {
      const allTemplates = getAllTemplates();
      const beginnerTemplates = getTemplatesByCategory('beginner');
      const intermediateTemplates = getTemplatesByCategory('intermediate');

      expect(beginnerTemplates.length + intermediateTemplates.length).toBeLessThanOrEqual(
        allTemplates.length
      );
    });
  });

  describe('mock compiler settings', () => {
    it('should have mockCompilerEnabled flag', () => {
      expect(typeof mockCompilerEnabled).toBe('boolean');
    });

    it('should have mockCompilationDelay', () => {
      expect(typeof mockCompilationDelay).toBe('number');
      expect(mockCompilationDelay).toBeGreaterThan(0);
    });
  });

  describe('template content validation', () => {
    it('hello-world should have valid C code', () => {
      const template = getTemplate('hello-world');
      expect(template).toBeDefined();
      
      const mainFile = template?.files.find(f => f.name === template.mainFile);
      expect(mainFile).toBeDefined();
      expect(mainFile?.content).toContain('#include <stdio.h>');
      expect(mainFile?.content).toContain('int main(void)');
      expect(mainFile?.content).toContain('printf');
      expect(mainFile?.content).toContain('return 0');
    });

    it('input-demo should demonstrate user input', () => {
      const template = getTemplate('input-demo');
      expect(template).toBeDefined();
      
      const mainFile = template?.files.find(f => f.name === template.mainFile);
      expect(mainFile).toBeDefined();
      expect(mainFile?.content).toContain('scanf');
      expect(mainFile?.content).toContain('fgets');
    });

    it('calculator should have arithmetic operations', () => {
      const template = getTemplate('calculator');
      expect(template).toBeDefined();
      
      const mainFile = template?.files.find(f => f.name === template.mainFile);
      expect(mainFile).toBeDefined();
      expect(mainFile?.content).toContain('switch');
      expect(mainFile?.content).toContain('case');
    });
  });

  describe('build commands', () => {
    it('should have valid build commands', () => {
      Object.values(projectTemplates).forEach(template => {
        expect(template.buildCommand).toContain('gcc');
        expect(template.buildCommand).toContain('-o');
        expect(template.buildCommand).toContain('.exe');
      });
    });

    it('should reference correct source files', () => {
      Object.values(projectTemplates).forEach(template => {
        expect(template.buildCommand).toContain(template.mainFile);
      });
    });
  });
});


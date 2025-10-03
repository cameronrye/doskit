/**
 * Tests for DOSBox configuration
 */

import { describe, it, expect } from 'vitest';
import {
  defaultDosboxConfig,
  gameOptimizedConfig,
  compatibilityConfig,
} from './dosbox.conf';

describe('dosbox.conf', () => {
  describe('defaultDosboxConfig', () => {
    it('should be a non-empty string', () => {
      expect(typeof defaultDosboxConfig).toBe('string');
      expect(defaultDosboxConfig.length).toBeGreaterThan(0);
    });

    it('should contain CPU configuration', () => {
      expect(defaultDosboxConfig).toContain('[cpu]');
      expect(defaultDosboxConfig).toContain('core=auto');
      expect(defaultDosboxConfig).toContain('cycles=max');
    });

    it('should contain video configuration', () => {
      expect(defaultDosboxConfig).toContain('[video]');
      expect(defaultDosboxConfig).toContain('vmemsize=8');
    });

    it('should contain DOS configuration', () => {
      expect(defaultDosboxConfig).toContain('[dos]');
      expect(defaultDosboxConfig).toContain('ver=7.1');
      expect(defaultDosboxConfig).toContain('umb=true');
      expect(defaultDosboxConfig).toContain('ems=true');
      expect(defaultDosboxConfig).toContain('xms=true');
    });

    it('should contain Sound Blaster configuration', () => {
      expect(defaultDosboxConfig).toContain('[sblaster]');
      expect(defaultDosboxConfig).toContain('sbtype=sb16');
      expect(defaultDosboxConfig).toContain('oplrate=44100');
    });

    it('should contain autoexec section', () => {
      expect(defaultDosboxConfig).toContain('[autoexec]');
      expect(defaultDosboxConfig).toContain('DosKit');
    });

    it('should have welcome message', () => {
      expect(defaultDosboxConfig).toContain('DosKit - DOS Environment');
      expect(defaultDosboxConfig).toContain("Type 'help' for DOS commands");
    });
  });

  describe('gameOptimizedConfig', () => {
    it('should be a non-empty string', () => {
      expect(typeof gameOptimizedConfig).toBe('string');
      expect(gameOptimizedConfig.length).toBeGreaterThan(0);
    });

    it('should use Pentium CPU type', () => {
      expect(gameOptimizedConfig).toContain('cputype=pentium');
    });

    it('should have more video memory', () => {
      expect(gameOptimizedConfig).toContain('vmemsize=16');
    });

    it('should mount C drive in autoexec', () => {
      expect(gameOptimizedConfig).toContain('mount c .');
      expect(gameOptimizedConfig).toContain('c:');
    });
  });

  describe('compatibilityConfig', () => {
    it('should be a non-empty string', () => {
      expect(typeof compatibilityConfig).toBe('string');
      expect(compatibilityConfig.length).toBeGreaterThan(0);
    });

    it('should use normal CPU core for compatibility', () => {
      expect(compatibilityConfig).toContain('core=normal');
    });

    it('should use 486 CPU type', () => {
      expect(compatibilityConfig).toContain('cputype=486');
    });

    it('should have fixed cycle count', () => {
      expect(compatibilityConfig).toContain('cycles=10000');
    });

    it('should use DOS 5.0 for compatibility', () => {
      expect(compatibilityConfig).toContain('ver=5.0');
    });

    it('should have less video memory', () => {
      expect(compatibilityConfig).toContain('vmemsize=4');
    });
  });

  describe('Configuration validity', () => {
    it('all configs should have required sections', () => {
      const configs = [defaultDosboxConfig, gameOptimizedConfig, compatibilityConfig];
      
      configs.forEach((config) => {
        expect(config).toContain('[cpu]');
        expect(config).toContain('[autoexec]');
      });
    });

    it('all configs should be properly formatted', () => {
      const configs = [defaultDosboxConfig, gameOptimizedConfig, compatibilityConfig];
      
      configs.forEach((config) => {
        // Should have section headers
        expect(config.match(/\[.*\]/g)).toBeTruthy();
        // Should have key=value pairs
        expect(config.match(/\w+=\w+/g)).toBeTruthy();
      });
    });
  });
});


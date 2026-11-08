/**
 * Tests for DOSBox Configuration Builder
 */

import { describe, it, expect } from 'vitest';
import { createDOSBoxConfig, presets } from './dosboxConfigBuilder';

describe('DOSBoxConfigBuilder', () => {
  describe('Basic configuration', () => {
    it('should create an empty configuration', () => {
      const config = createDOSBoxConfig().build();
      expect(config).toBe('');
    });

    it('should create CPU configuration', () => {
      const config = createDOSBoxConfig()
        .setCPU({ core: 'normal', cputype: '486_slow', cycles: 15000 })
        .build();

      expect(config).toContain('[cpu]');
      expect(config).toContain('core=normal');
      expect(config).toContain('cputype=486_slow');
      expect(config).toContain('cycles=15000');
    });

    it('should create DOS configuration', () => {
      const config = createDOSBoxConfig().setDOS({ umb: true, ems: true, xms: true }).build();

      expect(config).toContain('[dos]');
      expect(config).toContain('umb=true');
      expect(config).toContain('ems=true');
      expect(config).toContain('xms=true');
    });

    it('should create Sound Blaster configuration', () => {
      const config = createDOSBoxConfig()
        .setSoundBlaster({
          sbtype: 'sb16',
          sbbase: 220,
          irq: 7,
          dma: 1,
          hdma: 5,
        })
        .build();

      expect(config).toContain('[sblaster]');
      expect(config).toContain('sbtype=sb16');
      expect(config).toContain('sbbase=220');
      expect(config).toContain('irq=7');
      expect(config).toContain('dma=1');
      expect(config).toContain('hdma=5');
    });

    it('should create autoexec section', () => {
      const config = createDOSBoxConfig()
        .addAutoexec('@echo off', 'mount c .', 'c:', 'dir')
        .build();

      expect(config).toContain('[autoexec]');
      expect(config).toContain('@echo off');
      expect(config).toContain('mount c .');
      expect(config).toContain('c:');
      expect(config).toContain('dir');
    });
  });

  describe('Settings the default js-dos backend does not have', () => {
    // DOSBox drops or resets these without a warning, so the setting types refuse them.
    // The @ts-expect-error lines are checked by `tsc -b`, which fails if one compiles again.
    it('should not accept values the backend would reset', () => {
      const builder = createDOSBoxConfig();

      // @ts-expect-error: there is no dynamic core; DOSBox would run the simple core
      builder.setCPU({ core: 'dynamic' });
      // @ts-expect-error: there is no plain 486 type; DOSBox would use auto
      builder.setCPU({ cputype: '486' });
      // @ts-expect-error: there is no plain Pentium type; DOSBox would use auto
      builder.setCPU({ cputype: 'pentium' });
      // @ts-expect-error: there is no Pentium MMX type; DOSBox would use auto
      builder.setCPU({ cputype: 'pentium_mmx' });
      // @ts-expect-error: there are no scalers, only none
      builder.setRender({ scaler: 'normal2x' });
    });

    it('should not accept properties the backend would drop', () => {
      const builder = createDOSBoxConfig();

      // @ts-expect-error: [dos] has no ver; DOS reports 5.00 (VER SET 7 10 in the autoexec changes that)
      builder.setDOS({ ver: '7.1' });
      // @ts-expect-error: [gus] has no gusrate
      builder.setGUS({ gusrate: 44100 });
    });

    it('should have no setters for sections the backend does not have', () => {
      const builder = createDOSBoxConfig();

      // No [video] section (vmemsize) and no [memory] section (memsize lives in [dosbox])
      expect(builder).not.toHaveProperty('setVideo');
      expect(builder).not.toHaveProperty('setMemory');
    });
  });

  describe('Chaining', () => {
    it('should support method chaining', () => {
      const config = createDOSBoxConfig()
        .setCPU({ core: 'auto' })
        .setRender({ aspect: false })
        .setDOS({ umb: true })
        .addAutoexec('@echo off')
        .build();

      expect(config).toContain('[cpu]');
      expect(config).toContain('[render]');
      expect(config).toContain('[dos]');
      expect(config).toContain('[autoexec]');
    });

    it('should merge multiple calls to the same setter', () => {
      const config = createDOSBoxConfig()
        .setCPU({ core: 'auto' })
        .setCPU({ cycles: 'max' })
        .build();

      expect(config).toContain('core=auto');
      expect(config).toContain('cycles=max');
    });
  });

  describe('Presets', () => {
    it('should create music tracker preset', () => {
      const config = presets.musicTracker().build();

      expect(config).toContain('[cpu]');
      expect(config).toContain('core=simple');
      expect(config).toContain('cputype=auto');
      expect(config).toContain('cycles=18000');
      expect(config).toContain('[mixer]');
      expect(config).toContain('blocksize=2048');
    });

    it('should create demo preset', () => {
      const config = presets.demo().build();

      expect(config).toContain('[cpu]');
      expect(config).toContain('core=simple');
      expect(config).toContain('cputype=auto');
      expect(config).toContain('cycles=30000');
    });

    it.each(Object.keys(presets) as (keyof typeof presets)[])(
      'should leave out of the %s preset what the default backend ignores',
      (name) => {
        const config = presets[name]().build();

        expect(config).not.toMatch(/^\[(video|memory)\]$/m);
        expect(config).not.toMatch(/^(vmemsize|memsize|ver|gusrate)=/m);
      }
    );

    it('should allow customizing presets', () => {
      const config = presets
        .demo()
        .setCPU({ cycles: 10000 })
        .addAutoexec('@echo off', 'echo Custom autoexec')
        .build();

      expect(config).toContain('cycles=10000');
      expect(config).not.toContain('cycles=30000');
      expect(config).toContain('[autoexec]');
      expect(config).toContain('echo Custom autoexec');
    });
  });
});

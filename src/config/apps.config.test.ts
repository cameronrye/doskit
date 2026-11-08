/**
 * Tests for the DOS application registry
 */

import { describe, it, expect } from 'vitest';
import { availableApps } from './apps.config';
import type { DosApp } from '../types/dos-app';

/** The DOSBox config an app runs with, as DemoSelector resolves it */
const dosboxConfOf = async (app: DosApp): Promise<string> =>
  (await app.loadDosboxConf?.()) ?? app.dosboxConf;

// Lines the default js-dos backend (see jsdos.config.ts) drops or resets without a
// warning. A config that has one states something that never runs.
const IGNORED_BY_DEFAULT_BACKEND = [
  /^\[(video|memory)\]$/m, // sections it does not have (memsize belongs in [dosbox])
  /^(vmemsize|ver|gusrate)=/m, // properties it does not have
  /^core=dynamic$/m, // it has no dynamic core and runs the simple one instead
  /^cputype=(486|pentium|pentium_mmx)$/m, // types it does not have; it uses auto instead
];

describe('availableApps', () => {
  describe.each(availableApps)('$name', (app) => {
    it('should only state DOSBox settings the default backend applies', async () => {
      const conf = await dosboxConfOf(app);

      for (const ignored of IGNORED_BY_DEFAULT_BACKEND) {
        expect(conf).not.toMatch(ignored);
      }
    });

    it('should not claim a CPU type in its banner', async () => {
      // The backend has no 486 or Pentium type to give it
      const conf = await dosboxConfOf(app);

      expect(conf).not.toMatch(/^echo CPU: .*(486|pentium)/im);
    });
  });
});

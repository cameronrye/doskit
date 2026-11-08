/**
 * Compile-time checks of the js-dos types against what js-dos 8.3.20 takes. `tsc -b`
 * type-checks this file and fails if one of these expectations stops holding; at run time
 * they do nothing.
 */

import { describe, it, expectTypeOf } from 'vitest';
import type { DosOptions, DosProps } from './js-dos';

type SoftKeyboardLayout = NonNullable<DosOptions['softKeyboardLayout']>;

describe('js-dos types', () => {
  describe('softKeyboardLayout', () => {
    it('should take rows of key names, or layouts of columns of rows', () => {
      expectTypeOf(['{esc} {f1} {f2}', 'q w e r t', '{up}']).toExtend<SoftKeyboardLayout>();
      expectTypeOf([
        [
          ['{esc} {f1}', 'q w e'],
          ['{up}', '{left} {down} {right}'],
        ],
      ]).toExtend<SoftKeyboardLayout>();
    });

    it('should refuse rows given as lists of key names, which js-dos reads as layouts', () => {
      expectTypeOf([
        ['{esc}', '{f1}'],
        ['q', 'w'],
      ]).not.toExtend<SoftKeyboardLayout>();
    });

    it('should be what setSoftKeyboardLayout takes', () => {
      expectTypeOf<DosProps['setSoftKeyboardLayout']>()
        .parameter(0)
        .toEqualTypeOf<SoftKeyboardLayout>();
    });
  });
});

/**
 * Tests for localStorage access that never throws
 */

import { describe, it, expect, afterEach } from 'vitest';
import { safeLocalStorage } from './storage';

const original = Object.getOwnPropertyDescriptor(window, 'localStorage')!;

/** Replace window.localStorage, as a browser that refuses storage presents it */
function replaceLocalStorage(descriptor: PropertyDescriptor) {
  Object.defineProperty(window, 'localStorage', { configurable: true, ...descriptor });
}

const securityError = () =>
  new DOMException('Access is denied for this document.', 'SecurityError');

describe('safeLocalStorage', () => {
  afterEach(() => {
    Object.defineProperty(window, 'localStorage', original);
    localStorage.clear();
  });

  describe('when storage works', () => {
    it('reads from localStorage', () => {
      localStorage.setItem('key', 'value');
      expect(safeLocalStorage.getItem('key')).toBe('value');
    });

    it('reads null for a key that was never stored', () => {
      expect(safeLocalStorage.getItem('missing')).toBeNull();
    });

    it('writes to localStorage', () => {
      safeLocalStorage.setItem('key', 'value');
      expect(localStorage.getItem('key')).toBe('value');
    });

    it('removes from localStorage', () => {
      localStorage.setItem('key', 'value');
      safeLocalStorage.removeItem('key');
      expect(localStorage.getItem('key')).toBeNull();
    });
  });

  describe.each([
    [
      'site data is blocked, so reading localStorage throws',
      {
        get() {
          throw securityError();
        },
      },
    ],
    ['storage is disabled, so localStorage is null', { value: null }],
    [
      'the browser refuses every call',
      {
        value: {
          getItem() {
            throw securityError();
          },
          setItem() {
            throw securityError();
          },
          removeItem() {
            throw securityError();
          },
        },
      },
    ],
  ])('when %s', (_, descriptor: PropertyDescriptor) => {
    it('reads null', () => {
      replaceLocalStorage(descriptor);
      expect(safeLocalStorage.getItem('key')).toBeNull();
    });

    it('drops writes', () => {
      replaceLocalStorage(descriptor);
      expect(() => safeLocalStorage.setItem('key', 'value')).not.toThrow();
    });

    it('ignores removals', () => {
      replaceLocalStorage(descriptor);
      expect(() => safeLocalStorage.removeItem('key')).not.toThrow();
    });
  });

  describe('when storage is full', () => {
    const full = () => {
      const storage = localStorage;
      replaceLocalStorage({
        value: {
          getItem: (key: string) => storage.getItem(key),
          setItem() {
            throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
          },
          removeItem: (key: string) => storage.removeItem(key),
        },
      });
    };

    it('drops a write that does not fit', () => {
      full();
      expect(() => safeLocalStorage.setItem('key', 'value')).not.toThrow();
    });

    it('still reads what was stored before', () => {
      localStorage.setItem('key', 'value');
      full();
      expect(safeLocalStorage.getItem('key')).toBe('value');
    });
  });
});

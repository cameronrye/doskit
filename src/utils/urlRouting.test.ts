/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * URL Routing Utilities Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeAppId,
  getUrlFriendlyId,
  updateDocumentTitle,
  registerAppIdMapping,
} from './urlRouting';

describe('urlRouting', () => {
  describe('normalizeAppId', () => {
    it('should normalize URL-friendly IDs to internal IDs', () => {
      expect(normalizeAppId('secondreality')).toBe('second-reality');
      expect(normalizeAppId('impulsetracker')).toBe('impulse-tracker');
    });

    it('should accept hyphenated IDs directly', () => {
      expect(normalizeAppId('second-reality')).toBe('second-reality');
      expect(normalizeAppId('impulse-tracker')).toBe('impulse-tracker');
    });

    it('should be case-insensitive', () => {
      expect(normalizeAppId('SECONDREALITY')).toBe('second-reality');
      expect(normalizeAppId('SecondReality')).toBe('second-reality');
      expect(normalizeAppId('IMPULSETRACKER')).toBe('impulse-tracker');
    });

    it('should handle whitespace', () => {
      expect(normalizeAppId(' secondreality ')).toBe('second-reality');
      expect(normalizeAppId(' impulsetracker ')).toBe('impulse-tracker');
    });

    it('should return null for unknown IDs', () => {
      expect(normalizeAppId('unknown')).toBe(null);
      expect(normalizeAppId('invalid-app')).toBe(null);
      expect(normalizeAppId('')).toBe(null);
    });
  });

  describe('getUrlFriendlyId', () => {
    it('should convert internal IDs to URL-friendly IDs', () => {
      expect(getUrlFriendlyId('second-reality')).toBe('secondreality');
      expect(getUrlFriendlyId('impulse-tracker')).toBe('impulsetracker');
    });

    it('should handle unknown IDs by removing hyphens', () => {
      expect(getUrlFriendlyId('my-new-app')).toBe('mynewapp');
      expect(getUrlFriendlyId('some-other-app')).toBe('someotherapp');
    });

    it('should handle IDs without hyphens', () => {
      expect(getUrlFriendlyId('myapp')).toBe('myapp');
    });
  });

  describe('updateDocumentTitle', () => {
    beforeEach(() => {
      // Reset document title before each test
      document.title = '';
    });

    it('should set title with app name', () => {
      updateDocumentTitle('Second Reality');
      expect(document.title).toBe('Second Reality - DosKit');
    });

    it('should set default title when no app name provided', () => {
      updateDocumentTitle();
      expect(document.title).toBe('DosKit - Cross-Platform DOS Emulator');
    });

    it('should set default title when undefined is provided', () => {
      updateDocumentTitle(undefined);
      expect(document.title).toBe('DosKit - Cross-Platform DOS Emulator');
    });

    it('should handle different app names', () => {
      updateDocumentTitle('Impulse Tracker');
      expect(document.title).toBe('Impulse Tracker - DosKit');

      updateDocumentTitle('My Custom App');
      expect(document.title).toBe('My Custom App - DosKit');
    });
  });

  describe('registerAppIdMapping', () => {
    it('should register new app ID mappings', () => {
      registerAppIdMapping('mynewapp', 'my-new-app');
      
      expect(normalizeAppId('mynewapp')).toBe('my-new-app');
      expect(normalizeAppId('my-new-app')).toBe('my-new-app');
      expect(getUrlFriendlyId('my-new-app')).toBe('mynewapp');
    });

    it('should handle case-insensitive registration', () => {
      registerAppIdMapping('MyNewApp', 'my-new-app');
      
      expect(normalizeAppId('mynewapp')).toBe('my-new-app');
      expect(normalizeAppId('MYNEWAPP')).toBe('my-new-app');
    });

    it('should allow overwriting existing mappings', () => {
      registerAppIdMapping('testapp', 'test-app-v1');
      expect(normalizeAppId('testapp')).toBe('test-app-v1');
      
      registerAppIdMapping('testapp', 'test-app-v2');
      expect(normalizeAppId('testapp')).toBe('test-app-v2');
    });
  });
});


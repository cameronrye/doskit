/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * URL Routing Utilities Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAppRequestFromUrl,
  normalizeAppId,
  getUrlFriendlyId,
  updateDocumentTitle,
  updateUrlWithApp,
} from './urlRouting';

describe('urlRouting', () => {
  describe('getAppRequestFromUrl', () => {
    it.each([
      ['/?app=secondreality', 'second-reality'],
      ['/?app=Second-Reality', 'second-reality'],
      ['/secondreality', 'second-reality'],
      ['/3drotate/', '3drotate'],
    ])('reads the app %s asks for', (url, appId) => {
      window.history.replaceState({}, '', url);

      expect(getAppRequestFromUrl()).toEqual({ appId, unknownApp: false, unknownAppId: null });
    });

    it('reports an ?app= value that names no app', () => {
      window.history.replaceState({}, '', '/?app=bogus');

      expect(getAppRequestFromUrl()).toEqual({
        appId: null,
        unknownApp: true,
        unknownAppId: 'bogus',
      });
    });

    it('reports an unknown app with only its safe characters', () => {
      window.history.replaceState({}, '', '/?app=%3Cimg%20src%3Dx%3E');

      expect(getAppRequestFromUrl()).toEqual({
        appId: null,
        unknownApp: true,
        unknownAppId: 'imgsrcx',
      });
    });

    // Names every plain object inherits, which a lookup by key must not take for apps
    it.each(['constructor', '__proto__', 'toString', 'CONSTRUCTOR', 'hasOwnProperty'])(
      'reports ?app=%s as naming no app',
      (name) => {
        window.history.replaceState({}, '', `/?app=${name}`);

        expect(getAppRequestFromUrl()).toEqual({
          appId: null,
          unknownApp: true,
          unknownAppId: name,
        });
      }
    );

    it('reports an unknown app of 100 characters in full', () => {
      window.history.replaceState({}, '', `/?app=${'a'.repeat(100)}`);

      expect(getAppRequestFromUrl()).toEqual({
        appId: null,
        unknownApp: true,
        unknownAppId: 'a'.repeat(100),
      });
    });

    it.each([
      ['no safe characters', '/?app=%3C%3E'],
      ['only characters outside ASCII', '/?app=%E2%9C%93'],
      ['a malformed escape', '/?app=%%%'],
      ['an empty value', '/?app='],
      ['over 100 characters', `/?app=${'a'.repeat(101)}`],
    ])('reports an ?app= value with %s as naming no app, without the value', (_, url) => {
      window.history.replaceState({}, '', url);

      expect(getAppRequestFromUrl()).toEqual({ appId: null, unknownApp: true, unknownAppId: null });
    });

    it.each(['/', '/index.html', '/no-such-page'])('treats %s as the start page', (url) => {
      window.history.replaceState({}, '', url);

      expect(getAppRequestFromUrl()).toEqual({
        appId: null,
        unknownApp: false,
        unknownAppId: null,
      });
    });
  });

  describe('updateUrlWithApp', () => {
    beforeEach(() => {
      window.history.replaceState({}, '', '/');
    });

    it('pushes one history entry when switching to a different app', () => {
      window.history.replaceState({}, '', '/?app=impulsetracker');
      const lengthBefore = window.history.length;

      updateUrlWithApp('second-reality');

      expect(window.location.search).toBe('?app=secondreality');
      expect(window.history.length).toBe(lengthBefore + 1);
    });

    it('does not push a duplicate entry when the URL already shows the app', () => {
      // Happens after a deep link or back/forward: the app finishes loading
      // asynchronously and reports itself while the URL already matches.
      window.history.replaceState({}, '', '/?app=secondreality');
      const lengthBefore = window.history.length;

      updateUrlWithApp('second-reality');

      expect(window.history.length).toBe(lengthBefore);
    });

    // /stars?app= names no app by its ?app=, but its path would run Starfield on a reload
    it('drops a path-style app with the parameter when clearing the app', () => {
      window.history.replaceState({}, '', '/stars?app=');

      updateUrlWithApp(null, true);

      expect(window.location.pathname).toBe('/');
      expect(window.location.search).toBe('');
    });

    it('does not push a duplicate entry when clearing an already-empty app param', () => {
      const lengthBefore = window.history.length;

      updateUrlWithApp(null);

      expect(window.history.length).toBe(lengthBefore);
    });

    it('rewrites a path-style link to /?app= in place', () => {
      window.history.replaceState({}, '', '/secondreality');
      const lengthBefore = window.history.length;

      updateUrlWithApp('second-reality', true);

      expect(window.location.pathname).toBe('/');
      expect(window.location.search).toBe('?app=secondreality');
      expect(window.history.length).toBe(lengthBefore);
    });

    it('keeps other parameters and the hash when rewriting', () => {
      window.history.replaceState({}, '', '/stars?ref=sceners#top');

      updateUrlWithApp('stars', true);

      expect(window.location.pathname + window.location.search + window.location.hash).toBe(
        '/?ref=sceners&app=stars#top'
      );
    });

    it('links an app picked on another page from the root', () => {
      window.history.replaceState({}, '', '/index.html');

      updateUrlWithApp('stars');

      expect(window.location.pathname + window.location.search).toBe('/?app=stars');
    });
  });

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
});

/**
 * DosKit - Cookie Utilities Tests
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setCookie, getCookie, deleteCookie, hasCookie } from './cookies';

describe('Cookie Utilities', () => {
  beforeEach(() => {
    // Clear all cookies before each test
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      if (name) {
        deleteCookie(name);
      }
    });
  });

  describe('setCookie', () => {
    it('should set a cookie with default options', () => {
      setCookie('test-cookie', 'test-value');
      expect(getCookie('test-cookie')).toBe('test-value');
    });

    it('should set a cookie with custom expiration', () => {
      setCookie('test-cookie', 'test-value', { days: 7 });
      expect(getCookie('test-cookie')).toBe('test-value');
    });

    it('should encode special characters in cookie name and value', () => {
      setCookie('test cookie', 'test value with spaces');
      expect(getCookie('test cookie')).toBe('test value with spaces');
    });
  });

  describe('getCookie', () => {
    it('should return cookie value if it exists', () => {
      setCookie('test-cookie', 'test-value');
      expect(getCookie('test-cookie')).toBe('test-value');
    });

    it('should return null if cookie does not exist', () => {
      expect(getCookie('non-existent-cookie')).toBeNull();
    });

    it('should handle cookies with similar names', () => {
      setCookie('test', 'value1');
      setCookie('test-cookie', 'value2');
      setCookie('test-cookie-2', 'value3');
      
      expect(getCookie('test')).toBe('value1');
      expect(getCookie('test-cookie')).toBe('value2');
      expect(getCookie('test-cookie-2')).toBe('value3');
    });
  });

  describe('deleteCookie', () => {
    it('should delete an existing cookie', () => {
      setCookie('test-cookie', 'test-value');
      expect(getCookie('test-cookie')).toBe('test-value');
      
      deleteCookie('test-cookie');
      expect(getCookie('test-cookie')).toBeNull();
    });

    it('should not throw error when deleting non-existent cookie', () => {
      expect(() => deleteCookie('non-existent-cookie')).not.toThrow();
    });
  });

  describe('hasCookie', () => {
    it('should return true if cookie exists', () => {
      setCookie('test-cookie', 'test-value');
      expect(hasCookie('test-cookie')).toBe(true);
    });

    it('should return false if cookie does not exist', () => {
      expect(hasCookie('non-existent-cookie')).toBe(false);
    });

    it('should return false after cookie is deleted', () => {
      setCookie('test-cookie', 'test-value');
      expect(hasCookie('test-cookie')).toBe(true);
      
      deleteCookie('test-cookie');
      expect(hasCookie('test-cookie')).toBe(false);
    });
  });

  describe('PWA install dismissed cookie', () => {
    it('should store and retrieve install dismissal preference', () => {
      const cookieName = 'pwa-install-dismissed';
      
      // Simulate user dismissing the install prompt
      setCookie(cookieName, 'true', { days: 30 });
      
      // Check if the preference is stored
      expect(getCookie(cookieName)).toBe('true');
      expect(hasCookie(cookieName)).toBe(true);
    });

    it('should allow clearing install dismissal preference', () => {
      const cookieName = 'pwa-install-dismissed';
      
      // Set the preference
      setCookie(cookieName, 'true', { days: 30 });
      expect(hasCookie(cookieName)).toBe(true);
      
      // Clear the preference
      deleteCookie(cookieName);
      expect(hasCookie(cookieName)).toBe(false);
    });
  });
});


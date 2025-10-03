/**
 * Tests for js-dos configuration utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  defaultJsDosConfig,
  mobileJsDosConfig,
  kioskJsDosConfig,
  devJsDosConfig,
  isMobileDevice,
  getDefaultConfig,
} from './jsdos.config';

describe('jsdos.config', () => {
  describe('defaultJsDosConfig', () => {
    it('should have correct default settings', () => {
      expect(defaultJsDosConfig.backend).toBe('dosbox');
      expect(defaultJsDosConfig.theme).toBe('dark');
      expect(defaultJsDosConfig.volume).toBe(0.7);
      expect(defaultJsDosConfig.autoStart).toBe(true);
      expect(defaultJsDosConfig.noCloud).toBe(true);
    });

    it('should use WebGL rendering by default', () => {
      expect(defaultJsDosConfig.renderBackend).toBe('webgl');
    });

    it('should have worker thread enabled', () => {
      expect(defaultJsDosConfig.workerThread).toBe(true);
    });

    it('should have correct aspect ratio', () => {
      expect(defaultJsDosConfig.renderAspect).toBe('4/3');
    });
  });

  describe('mobileJsDosConfig', () => {
    it('should extend default config', () => {
      expect(mobileJsDosConfig.backend).toBe('dosbox');
      expect(mobileJsDosConfig.theme).toBe('dark');
    });

    it('should have larger controls for mobile', () => {
      expect(mobileJsDosConfig.scaleControls).toBe(0.4);
      expect(defaultJsDosConfig.scaleControls).toBe(0.3);
    });

    it('should have soft keyboard layout', () => {
      expect(mobileJsDosConfig.softKeyboardLayout).toBeDefined();
      expect(Array.isArray(mobileJsDosConfig.softKeyboardLayout)).toBe(true);
    });

    it('should have keyboard symbols defined', () => {
      expect(mobileJsDosConfig.softKeyboardSymbols).toBeDefined();
      expect(Array.isArray(mobileJsDosConfig.softKeyboardSymbols)).toBe(true);
    });
  });

  describe('kioskJsDosConfig', () => {
    it('should have kiosk mode enabled', () => {
      expect(kioskJsDosConfig.kiosk).toBe(true);
    });

    it('should have fullscreen enabled', () => {
      expect(kioskJsDosConfig.fullScreen).toBe(true);
    });

    it('should have mouse capture enabled', () => {
      expect(kioskJsDosConfig.mouseCapture).toBe(true);
    });
  });

  describe('devJsDosConfig', () => {
    it('should have worker thread disabled for debugging', () => {
      expect(devJsDosConfig.workerThread).toBe(false);
    });

    it('should have autoStart disabled', () => {
      expect(devJsDosConfig.autoStart).toBe(false);
    });

    it('should use light theme', () => {
      expect(devJsDosConfig.theme).toBe('light');
    });
  });

  describe('isMobileDevice', () => {
    let originalUserAgent: string;

    beforeEach(() => {
      originalUserAgent = navigator.userAgent;
    });

    afterEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true,
      });
    });

    it('should detect Android devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
        writable: true,
      });
      expect(isMobileDevice()).toBe(true);
    });

    it('should detect iPhone devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
      });
      expect(isMobileDevice()).toBe(true);
    });

    it('should detect iPad devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        writable: true,
      });
      expect(isMobileDevice()).toBe(true);
    });

    it('should not detect desktop as mobile', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true,
      });
      expect(isMobileDevice()).toBe(false);
    });
  });

  describe('getDefaultConfig', () => {
    let originalUserAgent: string;

    beforeEach(() => {
      originalUserAgent = navigator.userAgent;
    });

    afterEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        writable: true,
      });
    });

    it('should return mobile config for mobile devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
      });
      const config = getDefaultConfig();
      expect(config.scaleControls).toBe(0.4);
      expect(config.softKeyboardLayout).toBeDefined();
    });

    it('should return default config for desktop', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true,
      });
      const config = getDefaultConfig();
      expect(config.scaleControls).toBe(0.3);
      expect(config.softKeyboardLayout).toBeUndefined();
    });
  });
});


/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * js-dos configuration settings
 * Centralized configuration for the DOS emulator
 */

import type { DosOptions } from '../types/js-dos';

/**
 * Default js-dos configuration
 * Optimized for cross-platform compatibility and user experience
 */
export const defaultJsDosConfig: Partial<DosOptions> = {
  // Emulator Settings
  backend: 'dosbox', // Use DOSBox for better performance
  backendLocked: false, // Allow users to switch backends if needed
  workerThread: true, // Use worker thread for non-blocking UI
  offscreenCanvas: false, // Disable for better compatibility

  // Display Settings
  theme: 'dark',
  imageRendering: 'pixelated', // Authentic DOS look
  renderBackend: 'webgl', // WebGL for better performance
  renderAspect: '4/3', // Classic DOS aspect ratio
  fullScreen: false,
  softFullscreen: true, // Better cross-platform fullscreen support

  // Input Settings
  mouseCapture: false, // Don't auto-capture mouse
  mouseSensitivity: 1.0,
  noCursor: false,

  // Audio Settings
  volume: 0.7, // 70% volume by default

  // Behavior Settings
  autoStart: true, // Auto-start the emulator
  countDownStart: 0, // No countdown
  autoSave: false, // Manual save control
  kiosk: false, // Show UI controls

  // UI Settings
  lang: 'en',
  thinSidebar: false,
  scaleControls: 0.3, // Mobile-friendly control size

  // Cloud/Network Settings
  noCloud: true, // Disable cloud features by default

  // Advanced Settings
  pathPrefix: '/emulators/', // Local WASM files (copied from node_modules/js-dos/dist/emulators)
};

/**
 * Mobile-optimized configuration
 */
export const mobileJsDosConfig: Partial<DosOptions> = {
  ...defaultJsDosConfig,
  softFullscreen: true,
  scaleControls: 0.4, // Larger controls for touch
  mouseCapture: false,
  softKeyboardLayout: [
    ['Esc', 'F1', 'F2', 'F3', 'F5'],
    ['1', '2', '3', '4', '5'],
    ['Q', 'W', 'E', 'R', 'T'],
    ['A', 'S', 'D', 'F', 'G'],
    ['Z', 'X', 'C', 'V', 'B'],
    ['Ctrl', 'Alt', 'Space', 'Enter'],
  ],
  softKeyboardSymbols: [
    {
      '↑': 'ArrowUp',
      '↓': 'ArrowDown',
      '←': 'ArrowLeft',
      '→': 'ArrowRight',
    },
  ],
};

/**
 * Detect if the user is on a mobile device
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Get the appropriate configuration based on the environment
 */
export function getDefaultConfig(): Partial<DosOptions> {
  if (isMobileDevice()) {
    return mobileJsDosConfig;
  }
  return defaultJsDosConfig;
}


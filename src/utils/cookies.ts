/**
 * DosKit - Cookie Utilities
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 * 
 * Simple cookie management utilities for browser storage
 */

export interface CookieOptions {
  /** Number of days until the cookie expires (default: 30) */
  days?: number;
  /** Cookie path (default: '/') */
  path?: string;
  /** SameSite attribute (default: 'Lax') */
  sameSite?: 'Strict' | 'Lax' | 'None';
  /** Secure flag - automatically set to true for HTTPS (default: auto-detect) */
  secure?: boolean;
}

/**
 * Set a cookie with the given name, value, and options
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options (expiration, path, etc.)
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  const {
    days = 30,
    path = '/',
    sameSite = 'Lax',
    secure = window.location.protocol === 'https:',
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  // Set expiration date
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    cookieString += `; expires=${date.toUTCString()}`;
  }

  // Set path
  if (path) {
    cookieString += `; path=${path}`;
  }

  // Set SameSite
  if (sameSite) {
    cookieString += `; SameSite=${sameSite}`;
  }

  // Set Secure flag (required for SameSite=None)
  if (secure || sameSite === 'None') {
    cookieString += '; Secure';
  }

  document.cookie = cookieString;

  if (import.meta.env.DEV) {
    console.log(`[Cookie] Set: ${name}=${value} (expires in ${days} days)`);
  }
}

/**
 * Get a cookie value by name
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      const value = decodeURIComponent(
        cookie.substring(nameEQ.length, cookie.length)
      );
      if (import.meta.env.DEV) {
        console.log(`[Cookie] Get: ${name}=${value}`);
      }
      return value;
    }
  }

  if (import.meta.env.DEV) {
    console.log(`[Cookie] Get: ${name} not found`);
  }
  return null;
}

/**
 * Delete a cookie by name
 * @param name - Cookie name
 * @param path - Cookie path (default: '/')
 */
export function deleteCookie(name: string, path: string = '/'): void {
  setCookie(name, '', { days: -1, path });

  if (import.meta.env.DEV) {
    console.log(`[Cookie] Deleted: ${name}`);
  }
}

/**
 * Check if a cookie exists
 * @param name - Cookie name
 * @returns true if cookie exists, false otherwise
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}


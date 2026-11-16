/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Sharing a production's link
 */

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

/**
 * Share a link through the system's share sheet, or copy it where there is none. Closing the
 * sheet is the visitor's choice, so it is not a failure and nothing is copied after it.
 */
export async function shareLink(
  data: { title: string; url: string },
  nav: Navigator = navigator
): Promise<ShareResult> {
  if (typeof nav.share === 'function') {
    try {
      await nav.share(data);
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      // Any other refusal falls through to the copy
    }
  }
  try {
    await nav.clipboard.writeText(data.url);
    return 'copied';
  } catch {
    // No clipboard, or it was refused
    return 'failed';
  }
}

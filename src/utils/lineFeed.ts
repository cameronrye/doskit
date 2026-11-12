/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * A feed of text lines, such as what DOS prints. js-dos hands its whole backlog to the first
 * consumer of a stream and offers no way to stop listening, so DosKit subscribes once, as the
 * emulator gets ready, and hands the lines out from here: a later listener first gets the
 * lines it missed, and can unsubscribe.
 */

export interface LineFeed {
  /**
   * Listen for lines: the listener first gets the lines kept so far, then each new one
   * @returns A function that stops this listener
   */
  subscribe(listener: (line: string) => void): () => void;
}

export interface WritableLineFeed extends LineFeed {
  push(line: string): void;
}

/**
 * @param keep - How many of the latest lines to keep for listeners that subscribe later
 */
export function createLineFeed(keep = 500): WritableLineFeed {
  const lines: string[] = [];
  const listeners = new Set<(line: string) => void>();

  return {
    push(line) {
      lines.push(line);
      if (lines.length > keep) {
        lines.splice(0, lines.length - keep);
      }
      for (const listener of [...listeners]) {
        if (listeners.has(listener)) listener(line);
      }
    },
    subscribe(listener) {
      for (const line of lines) {
        listener(line);
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

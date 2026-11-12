/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Keys sent to DOS one at a time, through js-dos's ci.sendKeyEvent(). Not
 * ci.simulateKeyPress(): it stamps each release 16 ms ahead, and two presses, or a press and
 * any other key, within those 16 ms wrap the emulator's unsigned event clock, which stops its
 * keyboard for good. Here each key goes down, is held, comes up, and only then does the next
 * one go down, with real waits between.
 */

export interface KeyTarget {
  sendKeyEvent(keyCode: number, pressed: boolean): void;
}

export interface KeyQueue {
  /** Press keys together and release them, after every key queued before */
  press(keys: readonly number[], holdMs?: number): Promise<void>;
  /** Release keys without pressing them, after every key queued before */
  release(keys: readonly number[]): Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Between the keys of a combination, such as Ctrl and then L */
const CHORD_GAP_MS = 40;

export function createKeyQueue(
  target: KeyTarget,
  { sleep = defaultSleep }: { sleep?: (ms: number) => Promise<void> } = {}
): KeyQueue {
  let tail: Promise<void> = Promise.resolve();
  const enqueue = (work: () => Promise<void>) => {
    const run = tail.then(work);
    // A failed send must not stop the keys queued after it
    tail = run.catch(() => {});
    return run;
  };

  return {
    press: (keys, holdMs = 60) =>
      enqueue(async () => {
        for (const [i, key] of keys.entries()) {
          if (i > 0) await sleep(CHORD_GAP_MS);
          target.sendKeyEvent(key, true);
        }
        await sleep(holdMs);
        for (const [i, key] of [...keys].reverse().entries()) {
          if (i > 0) await sleep(CHORD_GAP_MS);
          target.sendKeyEvent(key, false);
        }
      }),
    release: (keys) =>
      enqueue(async () => {
        for (const key of keys) target.sendKeyEvent(key, false);
      }),
  };
}

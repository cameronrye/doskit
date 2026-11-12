/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Asks js-dos for the files a program has saved: ci.persist(true) packs every file that
 * differs from what the emulator started with into one bundle, and a bundle started after
 * the archive brings them back. Its traps: two calls in the same tick leave the first one
 * hanging for good, and a call after the worker has stopped never answers. So calls go one
 * at a time, saves asked for during one fold into a single follow-up, and each call has a
 * time limit.
 */

/** ci.persist, as js-dos types it */
export type Persist = (onlyChanges: boolean) => Promise<Uint8Array | object | null>;

export interface PersistQueue {
  /**
   * The bundle of saved files, or null when nothing differs from the start. Rejects when
   * js-dos does not answer in time.
   */
  save(): Promise<Uint8Array | null>;
}

export function createPersistQueue(
  persist: Persist,
  { timeoutMs = 10_000 }: { timeoutMs?: number } = {}
): PersistQueue {
  let running: Promise<Uint8Array | null> | null = null;
  let next: Promise<Uint8Array | null> | null = null;

  const run = async (): Promise<Uint8Array | null> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const packed = await Promise.race([
        persist(true),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`js-dos did not answer persist() within ${timeoutMs} ms`)),
            timeoutMs
          );
        }),
      ]);
      return packed instanceof Uint8Array ? packed : null;
    } finally {
      clearTimeout(timer);
    }
  };

  const start = (): Promise<Uint8Array | null> => {
    const current = run();
    running = current;
    const settle = () => {
      if (running === current) running = null;
    };
    current.then(settle, settle);
    return current;
  };

  return {
    save() {
      if (!running) return start();
      // One follow-up for every save asked for while a call runs: it packs what they want
      next ??= running
        .then(
          () => undefined,
          () => undefined
        )
        .then(() => {
          next = null;
          return start();
        });
      return next;
    },
  };
}

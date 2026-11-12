/**
 * Tests for the queue that asks js-dos for the files a program saved
 */

import { describe, it, expect, vi } from 'vitest';
import { createPersistQueue } from './persistQueue';

/** A persist() whose calls the test answers, in order */
function deferredPersist() {
  const calls: { resolve: (bytes: Uint8Array | null) => void }[] = [];
  const persist = vi.fn(
    () =>
      new Promise<Uint8Array | null>((resolve) => {
        calls.push({ resolve });
      })
  );
  return { persist, calls };
}

describe('createPersistQueue', () => {
  it("hands back what js-dos packed: the files that differ from the program's archive", async () => {
    const { persist, calls } = deferredPersist();
    const queue = createPersistQueue(persist);

    const saved = queue.save();
    calls[0]?.resolve(new Uint8Array([1, 2]));

    await expect(saved).resolves.toEqual(new Uint8Array([1, 2]));
    expect(persist).toHaveBeenCalledWith(true);
  });

  // Two persist() calls in the same tick leave the first one hanging for good
  it('asks js-dos once at a time, and folds the saves asked for meanwhile into one more', async () => {
    const { persist, calls } = deferredPersist();
    const queue = createPersistQueue(persist);

    const first = queue.save();
    const second = queue.save();
    const third = queue.save();
    expect(persist).toHaveBeenCalledTimes(1);

    calls[0]?.resolve(new Uint8Array([1]));
    await expect(first).resolves.toEqual(new Uint8Array([1]));
    await vi.waitFor(() => expect(persist).toHaveBeenCalledTimes(2));
    calls[1]?.resolve(new Uint8Array([2]));

    await expect(second).resolves.toEqual(new Uint8Array([2]));
    await expect(third).resolves.toEqual(new Uint8Array([2]));
    expect(persist).toHaveBeenCalledTimes(2);
  });

  it('gives up on a call js-dos never answers, such as one after its worker stopped', async () => {
    vi.useFakeTimers();
    try {
      const { persist, calls } = deferredPersist();
      const queue = createPersistQueue(persist, { timeoutMs: 1000 });

      const hung = queue.save();
      const failed = expect(hung).rejects.toThrow(/did not answer/);
      await vi.advanceTimersByTimeAsync(1000);
      await failed;

      // The next save still runs
      const next = queue.save();
      await vi.advanceTimersByTimeAsync(0);
      calls[1]?.resolve(null);
      await expect(next).resolves.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('still runs the save asked for during a call that fails', async () => {
    let calls = 0;
    const queue = createPersistQueue(async () => {
      calls += 1;
      if (calls === 1) throw new Error('worker gone');
      return new Uint8Array([3]);
    });

    const failed = queue.save();
    const next = queue.save();

    await expect(failed).rejects.toThrow('worker gone');
    await expect(next).resolves.toEqual(new Uint8Array([3]));
  });

  it('takes what is not a single bundle, such as saved sockdrives, for nothing saved', async () => {
    const queue = createPersistQueue(async () => ({ drives: [] }));

    await expect(queue.save()).resolves.toBeNull();
  });
});

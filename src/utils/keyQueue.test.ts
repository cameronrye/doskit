/**
 * Tests for the queue that sends keys to DOS one at a time
 */

import { describe, it, expect } from 'vitest';
import { createKeyQueue } from './keyQueue';
import { dosKey } from './dosKeys';

/** A clock whose waits pass at once, and a log of the keys sent, with the time of each */
function harness() {
  let now = 0;
  const sent: string[] = [];
  const sleep = async (ms: number) => {
    now += ms;
  };
  const target = {
    sendKeyEvent: (code: number, pressed: boolean) =>
      sent.push(`${now} ${code} ${pressed ? 'down' : 'up'}`),
  };
  return { sent, queue: createKeyQueue(target, { sleep }) };
}

describe('createKeyQueue', () => {
  it('holds a key down for a while before releasing it', async () => {
    const { sent, queue } = harness();

    await queue.press([dosKey.Enter]);

    expect(sent).toEqual(['0 257 down', '60 257 up']);
  });

  it('sends keys pressed one after another without overlap, though nobody waited', async () => {
    const { sent, queue } = harness();

    void queue.press([dosKey.Right]);
    await queue.press([dosKey.Enter]);

    expect(sent).toEqual(['0 262 down', '60 262 up', '60 257 down', '120 257 up']);
  });

  it('presses keys held together in order, and releases them in reverse', async () => {
    const { sent, queue } = harness();

    await queue.press([dosKey.LeftCtrl, dosKey.L]);

    expect(sent).toEqual(['0 341 down', '40 76 down', '100 76 up', '140 341 up']);
  });

  it('releases keys without pressing them, for keys js-dos may think are down', async () => {
    const { sent, queue } = harness();

    await queue.release([dosKey.Right, dosKey.Enter]);

    expect(sent).toEqual(['0 262 up', '0 257 up']);
  });
});

describe('dosKey', () => {
  it("names js-dos's codes for the keys the start recipes press", () => {
    expect([dosKey.Enter, dosKey.Space, dosKey.Escape, dosKey.Down, dosKey.F5, dosKey.Y]).toEqual([
      257, 32, 256, 264, 294, 89,
    ]);
  });
});

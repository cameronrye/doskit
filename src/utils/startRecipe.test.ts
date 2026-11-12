/**
 * Tests for starting a production with its own keys once its setup screen is up
 */

import { describe, it, expect } from 'vitest';
import { runStartRecipe, type StartRecipe, type RecipeEmulator } from './startRecipe';
import { createLineFeed } from './lineFeed';
import { dosKey } from './dosKeys';
import { fnv1a } from './frameHash';

/**
 * An emulator on a clock of its own: a test schedules what DOS prints and draws, and the
 * runner's waits move the clock on, running what falls due
 */
function fakeEmulator() {
  let now = 0;
  const due: { at: number; run: () => void }[] = [];
  const stdout = createLineFeed();
  const messages = createLineFeed();
  const frameListeners: ((rgb: Uint8Array | null, rgba: Uint8Array | null) => void)[] = [];
  const soundListeners: ((samples: Float32Array) => void)[] = [];
  let size: [number, number] = [640, 400];
  const keys: string[] = [];
  let onKey: (code: number, pressed: boolean) => void = () => {};

  const emulator: RecipeEmulator = {
    stdout,
    messages,
    onFrame: (listener) => frameListeners.push(listener),
    onSoundPush: (listener) => soundListeners.push(listener),
    width: () => size[0],
    height: () => size[1],
    sendKeyEvent: (code, pressed) => {
      keys.push(`${now} ${code} ${pressed ? 'down' : 'up'}`);
      onKey(code, pressed);
    },
  };
  /** Draw a screen: its bytes, and its size */
  const show = (bytes: number[], width = 640, height = 400) => {
    size = [width, height];
    const frame = new Uint8Array(bytes);
    frameListeners.forEach((listener) => listener(frame, null));
  };
  /** Push samples: a sine wave of this amplitude, or silence */
  const play = (amplitude: number) => {
    const samples = Float32Array.from({ length: 512 }, (_, i) => amplitude * Math.sin(i / 4));
    soundListeners.forEach((listener) => listener(samples));
  };
  const at = (time: number, run: () => void) => due.push({ at: time, run });
  const sleep = async (ms: number) => {
    const until = now + ms;
    due.sort((a, b) => a.at - b.at);
    while (due.length > 0 && due[0]!.at <= until) {
      const next = due.shift()!;
      now = Math.max(now, next.at);
      next.run();
    }
    now = until;
  };
  return {
    emulator,
    stdout,
    messages,
    show,
    play,
    at,
    keys,
    /** The keys pressed, with when */
    presses: () => keys.filter((key) => key.endsWith('down')),
    options: { sleep, now: () => now },
    reactTo: (handler: (code: number, pressed: boolean) => void) => {
      onKey = handler;
    },
  };
}

const SETUP = [1, 2, 3];
const LOADING = [9, 9, 9];
const DEMO = [7, 7, 7];

/** Enter at the setup screen of fakeEmulator, which a screen fingerprint finds */
const enterAtSetup: StartRecipe = {
  steps: [{ keys: [dosKey.Enter] }],
  gapMs: 250,
  ready: { frames: [fnv1a(new Uint8Array(SETUP))] },
};

describe('runStartRecipe', () => {
  it('waits for the DOS line its signal names before the first key', async () => {
    const fake = fakeEmulator();
    fake.at(1500, () => fake.stdout.push('Control the angular velocity by hitting F1-F6'));
    fake.reactTo((_code, pressed) => pressed && fake.show(DEMO, 320, 200));

    const result = await runStartRecipe(
      fake.emulator,
      { steps: [{ keys: [dosKey.Enter] }], gapMs: 250, ready: { stdout: 'angular velocity' } },
      fake.options
    );

    expect(result).toBe('started');
    expect(fake.presses()).toEqual(['1500 257 down']);
  });

  it('finds the setup screen by its fingerprint', async () => {
    const fake = fakeEmulator();
    fake.at(0, () => fake.show(LOADING));
    fake.at(2000, () => fake.show(SETUP));
    fake.reactTo((_code, pressed) => pressed && fake.show(DEMO, 320, 200));

    const result = await runStartRecipe(fake.emulator, enterAtSetup, fake.options);

    expect(result).toBe('started');
    expect(fake.presses()).toEqual(['2000 257 down']);
  });

  it('waits for the screen to rest once the message comes, for a program that draws a cursor', async () => {
    const fake = fakeEmulator();
    fake.at(1000, () => fake.messages.push('error DOS:Multiplex Unhandled call BC00'));
    fake.at(1100, () => fake.show(LOADING));
    fake.at(1200, () => fake.show(SETUP));
    fake.reactTo((_code, pressed) => pressed && fake.show(DEMO));

    const result = await runStartRecipe(
      fake.emulator,
      {
        steps: [{ keys: [dosKey.Enter] }],
        gapMs: 250,
        ready: { message: 'Multiplex Unhandled call BC00', calmMs: 300 },
      },
      fake.options
    );

    expect(result).toBe('started');
    expect(fake.presses()).toEqual(['1500 257 down']);
  });

  it('releases its keys first, then sends one at a time with real waits', async () => {
    const fake = fakeEmulator();
    fake.at(0, () => fake.show(SETUP));
    fake.reactTo((code, pressed) => code === dosKey.Enter && pressed && fake.show(DEMO, 320, 200));

    await runStartRecipe(
      fake.emulator,
      {
        steps: [{ keys: [dosKey.Right] }, { keys: [dosKey.Down] }, { keys: [dosKey.Enter] }],
        gapMs: 100,
        ready: { frames: [fnv1a(new Uint8Array(SETUP))] },
      },
      fake.options
    );

    // Its screen is seen at the first look, 100 ms in
    expect(fake.keys).toEqual([
      '100 262 up',
      '100 264 up',
      '100 257 up',
      '100 262 down',
      '160 262 up',
      '260 264 down',
      '320 264 up',
      '420 257 down',
      '480 257 up',
    ]);
  });

  it('sends a single key again when the program dropped it', async () => {
    const fake = fakeEmulator();
    fake.at(0, () => fake.show(SETUP));
    let presses = 0;
    fake.reactTo((_code, pressed) => {
      if (pressed && ++presses === 2) fake.show(DEMO);
    });

    const result = await runStartRecipe(fake.emulator, enterAtSetup, fake.options);

    expect(result).toBe('started');
    expect(fake.presses()).toHaveLength(2);
  });

  it('takes music that starts after the key for the program going on, on a screen it saw', async () => {
    // Second Reality: after Enter, 17 s of black text mode with its music playing, and
    // black was on screen while it loaded too
    const fake = fakeEmulator();
    const BLACK = [0, 0, 0];
    fake.at(0, () => fake.show(BLACK));
    fake.at(1000, () => fake.show(SETUP));
    fake.reactTo((_code, pressed) => {
      if (!pressed) return;
      fake.show(BLACK);
      fake.at(1700, () => fake.play(0.2));
    });

    const result = await runStartRecipe(fake.emulator, enterAtSetup, fake.options);

    expect(result).toBe('started');
    expect(fake.presses()).toHaveLength(1);
  });

  it('gives up after three tries, for the visitor to press the key', async () => {
    const fake = fakeEmulator();
    fake.at(0, () => fake.show(SETUP));

    const result = await runStartRecipe(fake.emulator, enterAtSetup, fake.options);

    expect(result).toBe('fallback');
    expect(fake.presses()).toHaveLength(3);
  });

  it('takes a blinking cursor for the screen it was, not for the program going on', async () => {
    const fake = fakeEmulator();
    const CURSOR_OFF = [1, 2, 4];
    fake.at(0, () => fake.show(SETUP));
    fake.at(100, () => fake.show(CURSOR_OFF));
    // The program never takes the key, but its cursor goes on blinking
    for (let time = 200; time < 20_000; time += 200) {
      fake.at(time, () => fake.show(time % 400 === 0 ? SETUP : CURSOR_OFF));
    }

    const result = await runStartRecipe(fake.emulator, enterAtSetup, fake.options);

    expect(result).toBe('fallback');
  });

  it('sends nothing when its screen never comes, and leaves the start to the visitor', async () => {
    const fake = fakeEmulator();
    fake.at(0, () => fake.show(LOADING));

    const result = await runStartRecipe(fake.emulator, enterAtSetup, fake.options);

    expect(result).toBe('fallback');
    expect(fake.keys).toEqual([]);
  });

  it('stops, sending nothing, once aborted', async () => {
    const fake = fakeEmulator();
    const controller = new AbortController();
    fake.at(0, () => fake.show(LOADING));
    fake.at(500, () => controller.abort());
    fake.at(1000, () => fake.show(SETUP));

    const result = await runStartRecipe(fake.emulator, enterAtSetup, {
      ...fake.options,
      signal: controller.signal,
    });

    expect(result).toBe('aborted');
    expect(fake.keys).toEqual([]);
  });

  it('tells its caller what it is doing', async () => {
    const fake = fakeEmulator();
    const states: string[] = [];
    fake.at(500, () => fake.show(SETUP));
    fake.reactTo((_code, pressed) => pressed && fake.show(DEMO));

    await runStartRecipe(fake.emulator, enterAtSetup, {
      ...fake.options,
      onState: (state) => states.push(state),
    });

    expect(states).toEqual(['waiting', 'sending', 'started']);
  });
});

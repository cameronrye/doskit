/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Starts a production with the keys its setup screen waits for, such as Enter at Second
 * Reality's sound setup, through js-dos's key API. Keys sent too early are lost: Second
 * Reality, Crystal Dream 2 and Impulse Tracker drop every key that comes before they read the
 * keyboard, and js-dos has no event for that moment. So each recipe waits for a signal that
 * its screen is up (a line DOS prints, the screen's fingerprint, or a log line and then a
 * screen at rest), then sends its keys one at a time, and then checks that the screen went
 * on. A key the program dropped is sent again, if it was the recipe's only one; otherwise, or
 * when the signal never comes, the visitor is left to press the keys, with a hint.
 */

import type { LineFeed } from './lineFeed';
import { createKeyQueue } from './keyQueue';
import { fnv1a } from './frameHash';

/** What says that a production's setup screen is up and takes keys */
export type ReadySignal =
  /** DOS printed a line holding this text */
  | { stdout: string }
  /** The screen's fingerprint is one of these */
  | { frames: readonly number[] }
  /** DOSBox logged a line holding this text, and the screen has rested this long since */
  | { message: string; calmMs: number };

export interface StartStep {
  /** js-dos key codes, pressed together */
  keys: readonly number[];
}

export interface StartRecipe {
  steps: readonly StartStep[];
  /** Between one step's release and the next step's press */
  gapMs: number;
  ready: ReadySignal;
}

/** What the runner needs of a running emulator */
export interface RecipeEmulator {
  stdout: LineFeed;
  messages: LineFeed;
  onFrame(listener: (rgb: Uint8Array | null, rgba: Uint8Array | null) => void): void;
  width(): number;
  height(): number;
  sendKeyEvent(keyCode: number, pressed: boolean): void;
}

export type RecipeState = 'waiting' | 'sending' | 'started' | 'fallback';
export type RecipeResult = 'started' | 'fallback' | 'aborted';

export interface RecipeOptions {
  signal?: AbortSignal;
  /** How long to wait for the signal: a starved emulator took 36 s to show its setup */
  timeoutMs?: number;
  /** How long the screen has to go on after the keys */
  verifyMs?: number;
  /** How often to look at the screen */
  pollMs?: number;
  onState?: (state: RecipeState) => void;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** How often a recipe of one key is sent before the visitor is asked to press it */
const SINGLE_KEY_TRIES = 3;

export async function runStartRecipe(
  emulator: RecipeEmulator,
  recipe: StartRecipe,
  {
    signal,
    timeoutMs = 45_000,
    verifyMs = 4_000,
    pollMs = 100,
    onState,
    sleep = defaultSleep,
    now = () => performance.now(),
  }: RecipeOptions = {}
): Promise<RecipeResult> {
  const { ready } = recipe;
  let active = true;
  let latest: Uint8Array | null = null;
  // js-dos offers no way to stop listening for frames: the listener goes quiet instead
  emulator.onFrame((rgb, rgba) => {
    if (active) latest = rgb ?? rgba;
  });
  let printed = false;
  let messageAt: number | null = null;
  const stopStdout =
    'stdout' in ready
      ? emulator.stdout.subscribe((line) => {
          if (line.includes(ready.stdout)) printed = true;
        })
      : () => {};
  const stopMessages =
    'message' in ready
      ? emulator.messages.subscribe((line) => {
          if (messageAt === null && line.includes(ready.message)) messageAt = now();
        })
      : () => {};

  // The fingerprint of the latest frame, and when it last changed
  let lastHash: number | null = null;
  let lastChangeAt = now();
  const look = (): number | null => {
    if (!latest) return null;
    const hash = fnv1a(latest);
    if (hash !== lastHash) {
      lastHash = hash;
      lastChangeAt = now();
    }
    return hash;
  };
  const holds = (hash: number | null): boolean => {
    if ('stdout' in ready) return printed;
    if (hash === null) return false;
    if ('frames' in ready) return ready.frames.includes(hash);
    return messageAt !== null && now() - Math.max(lastChangeAt, messageAt) >= ready.calmMs;
  };

  const queue = createKeyQueue(emulator, { sleep });
  const keys = [...new Set(recipe.steps.flatMap((step) => step.keys))];

  try {
    onState?.('waiting');
    // Every screen seen while waiting, a blinking cursor's two among them: only a screen not
    // among these shows that a key was taken
    const seen = new Set<number>();
    const startedAt = now();
    for (;;) {
      if (signal?.aborted) return 'aborted';
      const hash = look();
      if (hash !== null) seen.add(hash);
      if (holds(hash)) break;
      if (now() - startedAt >= timeoutMs) {
        onState?.('fallback');
        return 'fallback';
      }
      await sleep(pollMs);
    }

    const size = [emulator.width(), emulator.height()];
    const send = async (): Promise<boolean> => {
      // js-dos drops a press of a key it believes is down
      await queue.release(keys);
      for (const [i, step] of recipe.steps.entries()) {
        if (i > 0) await sleep(recipe.gapMs);
        if (signal?.aborted) return false;
        await queue.press(step.keys);
      }
      return true;
    };
    const wentOn = async (): Promise<boolean | 'aborted'> => {
      const until = now() + verifyMs;
      while (now() < until) {
        await sleep(pollMs);
        if (signal?.aborted) return 'aborted';
        const hash = look();
        if (emulator.width() !== size[0] || emulator.height() !== size[1]) return true;
        if (hash !== null && !seen.has(hash)) return true;
      }
      return false;
    };

    onState?.('sending');
    // A second Right would move a menu's choice again: only a lone key is sent again
    const tries = recipe.steps.length === 1 ? SINGLE_KEY_TRIES : 1;
    for (let attempt = 0; attempt < tries; attempt++) {
      if (!(await send())) return 'aborted';
      const outcome = await wentOn();
      if (outcome === 'aborted') return 'aborted';
      if (outcome) {
        onState?.('started');
        return 'started';
      }
    }
    onState?.('fallback');
    return 'fallback';
  } finally {
    active = false;
    stopStdout();
    stopMessages();
  }
}

/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Tests for keeping the keys of DosKit's controls away from js-dos
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { keepKeyFromDos, watchKeysAroundDos } from './keysAroundDos';

describe('keysAroundDos', () => {
  // Stands in for js-dos, which listens for keys on window and sends each one to DOS
  const reachedDos: string[] = [];
  const recordKey = (event: KeyboardEvent) => reachedDos.push(`${event.type} ${event.code}`);

  // One of DosKit's controls, at the root of a part of its UI that keeps keys from js-dos
  let control: HTMLButtonElement;
  let stopWatching: () => void;

  const press = (target: EventTarget, code: string, init: KeyboardEventInit = {}) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, ...init }));
  const release = (target: EventTarget, code: string) =>
    target.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));

  beforeEach(() => {
    reachedDos.length = 0;
    window.addEventListener('keydown', recordKey);
    window.addEventListener('keyup', recordKey);
    const controls = document.createElement('div');
    controls.addEventListener('keydown', keepKeyFromDos);
    control = document.createElement('button');
    controls.append(control);
    document.body.append(controls);
    stopWatching = watchKeysAroundDos();
  });

  afterEach(() => {
    stopWatching();
    window.removeEventListener('keydown', recordKey);
    window.removeEventListener('keyup', recordKey);
    document.body.replaceChildren();
  });

  it("keeps a key pressed on DosKit's controls from DOS, its release included", () => {
    press(control, 'Enter');
    release(control, 'Enter');

    expect(reachedDos).toEqual([]);
  });

  // Escape closes the selector as it goes down, and the focus falls to the page
  it("keeps the release of a key pressed on DosKit's controls from DOS, wherever it lands", () => {
    press(control, 'Escape');
    release(document.body, 'Escape');

    expect(reachedDos).toEqual([]);
  });

  // Such as a key held in DOS while Change Application is clicked, or the update prompt
  // takes the focus: without its release, DOSBox repeats the key without end
  it("gives DOS the release of a key pressed in DOS, even on DosKit's controls", () => {
    press(document.body, 'KeyA');
    release(control, 'KeyA');

    expect(reachedDos).toEqual(['keydown KeyA', 'keyup KeyA']);
  });

  it("gives DOS the release of a key pressed in DOS that repeated on DosKit's controls", () => {
    press(document.body, 'KeyA');
    press(control, 'KeyA', { repeat: true });
    release(control, 'KeyA');

    expect(reachedDos).toEqual(['keydown KeyA', 'keyup KeyA']);
  });

  // Enter held on a disk: the selector closes as the app starts, the focus falls to the
  // page, and the key goes on repeating there. DOS never had it go down, and its release
  // stays with the controls, so a repeat that got through would leave it down in DOS.
  it('stops the repeats of a key held down from a control once the focus has left it', () => {
    press(control, 'Enter');
    press(document.body, 'Enter', { repeat: true });
    press(document.body, 'Enter', { repeat: true });
    release(document.body, 'Enter');

    expect(reachedDos).toEqual([]);
  });

  it('lets the repeats of a key held on a control reach that control', () => {
    const seenByControl: boolean[] = [];
    control.addEventListener('keydown', (event) => seenByControl.push(event.repeat));
    press(control, 'ArrowRight');
    press(control, 'ArrowRight', { repeat: true });
    release(control, 'ArrowRight');

    expect(seenByControl).toEqual([false, true]);
    expect(reachedDos).toEqual([]);
  });

  it('gives DOS the repeats of a key held down in DOS', () => {
    press(document.body, 'KeyA');
    press(document.body, 'KeyA', { repeat: true });
    release(document.body, 'KeyA');

    expect(reachedDos).toEqual(['keydown KeyA', 'keydown KeyA', 'keyup KeyA']);
  });

  // Its release may never come, such as after Ctrl+Tab to another tab
  it('forgets a key pressed on the controls once it is pressed in DOS', () => {
    press(control, 'ControlLeft');
    press(document.body, 'ControlLeft');
    release(document.body, 'ControlLeft');

    expect(reachedDos).toEqual(['keydown ControlLeft', 'keyup ControlLeft']);
  });

  it('forgets the keys pressed on the controls when the window loses the focus', () => {
    press(control, 'ControlLeft');
    window.dispatchEvent(new Event('blur'));
    release(document.body, 'ControlLeft');

    expect(reachedDos).toEqual(['keyup ControlLeft']);
  });

  // macOS sends no keyup for a key released while Cmd is down
  it('forgets the keys pressed on the controls when Cmd comes up', () => {
    press(control, 'KeyC', { metaKey: true });
    document.body.dispatchEvent(
      new KeyboardEvent('keyup', { code: 'MetaLeft', key: 'Meta', bubbles: true })
    );
    release(document.body, 'KeyC');

    expect(reachedDos).toEqual(['keyup MetaLeft', 'keyup KeyC']);
  });

  it('tells keys without a code apart by their key', () => {
    control.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', bubbles: true }));

    // Only DOS's own key, pressed and released; Escape's release stays with the controls
    expect(reachedDos).toEqual(['keydown ', 'keyup ']);
  });

  it('stops watching once every part of the UI that asked has stopped', () => {
    const stopSecond = watchKeysAroundDos();
    stopWatching();
    press(control, 'Escape');
    release(document.body, 'Escape');
    expect(reachedDos).toEqual([]);

    stopSecond();
    press(control, 'Escape');
    release(document.body, 'Escape');
    // Nothing watches the releases any more
    expect(reachedDos).toEqual(['keyup Escape']);
  });
});

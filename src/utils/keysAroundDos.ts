/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Keeps the keys of DosKit's own controls away from js-dos. js-dos listens for keys on
 * window, sends each one to DOS and cancels the browser's own handling of it, so without
 * this Tab, Enter and Space would do nothing on DosKit's controls, and keys meant for them
 * would reach the running program.
 *
 * A key's release follows its press, wherever the focus is when the key comes up: the
 * release of a key pressed on DosKit's controls is kept from js-dos, even once the focus has
 * fallen to the page, and the release of a key pressed in DOS reaches js-dos, even once one
 * of DosKit's controls has the focus. DOS would otherwise get releases of keys it never had
 * pressed, or keep a key down for good, which DOSBox then repeats.
 */

/** Keys pressed on DosKit's controls that have not come up yet */
const pressedOnControls = new Set<string>();

/** The parts of DosKit's UI watching key releases */
let watchers = 0;

/** A key by its physical key, or by its key for one without a code, such as some on-screen keyboards' */
function keyOf(event: Pick<KeyboardEvent, 'code' | 'key'>): string {
  return event.code || event.key;
}

/**
 * Keep a key pressed on DosKit's controls from js-dos. For keydown at the root of a part of
 * DosKit's UI, after the handlers inside it have run.
 * @param event - The keydown, native or React's
 */
export function keepKeyFromDos(
  event: Pick<KeyboardEvent, 'code' | 'key' | 'repeat' | 'stopPropagation'>
): void {
  // A repeat is no press: the key may have gone down in DOS, which keeps it until its release
  if (watchers > 0 && !event.repeat) {
    pressedOnControls.add(keyOf(event));
  }
  event.stopPropagation();
}

// Window sees each key before the page does. A key pressed again belongs to wherever this
// press goes: keepKeyFromDos records it once more if that is one of DosKit's controls.
const forgetPress = (event: KeyboardEvent) => {
  if (!event.repeat) {
    pressedOnControls.delete(keyOf(event));
  }
};

// A key held down from one of DosKit's controls goes on repeating wherever the focus goes,
// such as to the page once the selector closes over a starting app. A repeat that reaches
// document has passed every control, so js-dos, which listens on window, would send it to
// DOS as a press: DOS would then keep the key down, as its release stays with the controls.
const keepRepeatFromDos = (event: KeyboardEvent) => {
  if (event.repeat && pressedOnControls.has(keyOf(event))) {
    event.stopPropagation();
  }
};

const keepReleaseFromDos = (event: KeyboardEvent) => {
  if (pressedOnControls.delete(keyOf(event))) {
    event.stopPropagation();
  }
  // macOS sends no keyup for keys released while Cmd is down
  if (event.key === 'Meta') {
    pressedOnControls.clear();
  }
};

// Keys that come up while the window lacks the focus send it no keyup
const forgetAll = () => pressedOnControls.clear();

/**
 * Watch key releases on window, for as long as a part of DosKit's UI keeps keys from js-dos
 * @returns A function that stops this part's watch; the listeners go with the last one
 */
export function watchKeysAroundDos(): () => void {
  if (watchers === 0) {
    window.addEventListener('keydown', forgetPress, { capture: true });
    document.addEventListener('keydown', keepRepeatFromDos);
    window.addEventListener('keyup', keepReleaseFromDos, { capture: true });
    window.addEventListener('blur', forgetAll);
  }
  watchers += 1;

  let watching = true;
  return () => {
    if (!watching) return;
    watching = false;
    watchers -= 1;
    if (watchers === 0) {
      window.removeEventListener('keydown', forgetPress, { capture: true });
      document.removeEventListener('keydown', keepRepeatFromDos);
      window.removeEventListener('keyup', keepReleaseFromDos, { capture: true });
      window.removeEventListener('blur', forgetAll);
      pressedOnControls.clear();
    }
  };
}

/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * js-dos never reports a program returning to DOS: its exit event fires only when the
 * emulator itself stops. So each app's autoexec ends with one more line, an echo DosKit
 * listens for on the emulator's console output, where it arrives within milliseconds of the
 * program's end. The line shows on the DOS screen too, so it is a sentence.
 */

/** Characters DOS would read as redirection or a pipe, which an echo must not hold */
function forEcho(text: string): string {
  return text.replace(/&/g, 'and').replace(/[<>|]/g, '').replace(/\s+/g, ' ').trim();
}

/** The line an app's autoexec prints once its program has returned to DOS */
export function endMarkerFor(appName: string): string {
  return forEcho(`${appName} has ended.`);
}

/**
 * The config with the end marker printed after its autoexec's last line, the program's.
 * The autoexec must be the last section, as DOSBoxConfigBuilder writes it.
 */
export function withEndMarker(conf: string, marker: string): string {
  const start = conf.search(/^\[autoexec\]$/m);
  if (start === -1) {
    return conf;
  }
  if (/^\[[^\]]+\]$/m.test(conf.slice(start + '[autoexec]'.length))) {
    throw new Error('The [autoexec] section must be the last one, for the end marker to follow it');
  }
  return `${conf.trimEnd()}\necho.\necho ${forEcho(marker)}\n`;
}

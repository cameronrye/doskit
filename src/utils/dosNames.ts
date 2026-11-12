/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Names DOS can open for a visitor's own files, such as modules brought into a tracker: DOS
 * takes eight characters, a dot and three, in capitals, from a short list. js-dos writes loose
 * files before it unpacks the archive and the saved files, so an imported file named like one
 * of theirs would be replaced: its name must be one of its own.
 */

/** The characters a DOS file name may hold, besides letters and digits */
const ALLOWED = /[^A-Z0-9!#$%&'()\-@^_`{}~]/g;

/** A DOS name for a file, other than those taken (compared in capitals) */
export function dosNameFor(name: string, taken: ReadonlySet<string>): string {
  const dot = name.lastIndexOf('.');
  const base = (dot === -1 ? name : name.slice(0, dot)).toUpperCase().replace(ALLOWED, '');
  const ext = (dot === -1 ? '' : name.slice(dot + 1))
    .toUpperCase()
    .replace(ALLOWED, '')
    .slice(0, 3);
  const withExt = (stem: string) => (ext ? `${stem}.${ext}` : stem);
  const stem = base.slice(0, 8) || 'MODULE';
  if (!taken.has(withExt(stem))) return withExt(stem);
  for (let n = 1; n < 1000; n++) {
    const suffix = `~${n}`;
    const candidate = withExt(`${stem.slice(0, 8 - suffix.length)}${suffix}`);
    if (!taken.has(candidate)) return candidate;
  }
  throw new Error(`No DOS name is left for ${name}`);
}

/**
 * The names of the entries in a ZIP archive, in capitals, as DOS sees them; none for bytes
 * that are no ZIP archive. Read from its central directory, as the end record points to it.
 */
export function zipEntryNames(zip: Uint8Array): string[] {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  // The end record is at least 22 bytes long, followed by a comment of up to 65535
  let end = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 22 - 0xffff); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end === -1) return [];
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  const decoder = new TextDecoder();
  const names: string[] = [];
  for (let i = 0; i < count && offset + 46 <= zip.length; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) break;
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    names.push(decoder.decode(zip.subarray(offset + 46, offset + 46 + nameLength)).toUpperCase());
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return names;
}

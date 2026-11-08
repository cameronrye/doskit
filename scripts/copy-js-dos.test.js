import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { copyJsDos } from './copy-js-dos.js';

// Mirrors the layout of node_modules/js-dos/dist
const JS_DOS_DIST = {
  'js-dos.js': 'js-dos runtime',
  'js-dos.js.map': 'source map',
  'js-dos.css': 'js-dos styles',
  'emulators/emulators.js': 'emulators loader',
  'emulators/emulators.js.map': 'source map',
  'emulators/wdosbox.js': 'dosbox glue',
  'emulators/wdosbox.js.symbols': 'debug symbols',
  'emulators/wdosbox.wasm': 'dosbox wasm',
  'emulators/wdosbox-x.js': 'dosbox-x glue',
  'emulators/wdosbox-x.wasm': 'dosbox-x wasm',
  'emulators/types/emulators.d.ts': 'type declarations',
};

const RUNTIME_FILES = [
  'emulators/emulators.js',
  'emulators/wdosbox-x.js',
  'emulators/wdosbox-x.wasm',
  'emulators/wdosbox.js',
  'emulators/wdosbox.wasm',
  'js-dos.css',
  'js-dos.js',
];

let root;
let from;
let to;

function writeFiles(base, files) {
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(dirname(join(base, file)), { recursive: true });
    writeFileSync(join(base, file), content);
  }
}

function listFiles(dir) {
  return readdirSync(dir, { recursive: true })
    .filter((file) => statSync(join(dir, file)).isFile())
    .map((file) => file.replaceAll('\\', '/'))
    .sort();
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'copy-js-dos-'));
  from = join(root, 'node_modules/js-dos/dist');
  to = join(root, 'public');
  writeFiles(from, JS_DOS_DIST);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('copyJsDos', () => {
  it('copies only the files the browser loads', () => {
    const result = copyJsDos({ from, to });

    expect(listFiles(to)).toEqual(RUNTIME_FILES);
    expect(result.copied.sort()).toEqual(RUNTIME_FILES);
    for (const file of RUNTIME_FILES) {
      expect(readFileSync(join(to, file), 'utf8')).toBe(JS_DOS_DIST[file]);
    }
  });

  it('leaves the rest of public/ alone', () => {
    writeFiles(to, { 'sw.js': 'service worker', 'demos/game.zip': 'demo' });

    copyJsDos({ from, to });

    expect(readFileSync(join(to, 'sw.js'), 'utf8')).toBe('service worker');
    expect(readFileSync(join(to, 'demos/game.zip'), 'utf8')).toBe('demo');
  });

  it('does not rewrite files that are already up to date', () => {
    copyJsDos({ from, to });
    const target = join(to, 'emulators/wdosbox.wasm');
    const past = new Date('2020-01-01T00:00:00Z');
    utimesSync(target, past, past);

    const result = copyJsDos({ from, to });

    expect(result.copied).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(statSync(target).mtime).toEqual(past);
  });

  it('replaces files that differ from node_modules', () => {
    copyJsDos({ from, to });
    writeFileSync(join(to, 'js-dos.js'), 'older js-dos');

    const result = copyJsDos({ from, to });

    expect(result.copied).toEqual(['js-dos.js']);
    expect(readFileSync(join(to, 'js-dos.js'), 'utf8')).toBe('js-dos runtime');
  });

  it('removes files from public/emulators/ that js-dos does not ship', () => {
    writeFiles(to, {
      'emulators/wdosbox.js.symbols': 'debug symbols',
      'emulators/types/emulators.d.ts': 'type declarations',
      'emulators/renamed.wasm': 'left over from an older js-dos',
    });

    const result = copyJsDos({ from, to });

    expect(result.removed.sort()).toEqual([
      'emulators/renamed.wasm',
      'emulators/types',
      'emulators/wdosbox.js.symbols',
    ]);
    expect(listFiles(to)).toEqual(RUNTIME_FILES);
  });

  it('explains how to fix a missing js-dos install', () => {
    rmSync(join(root, 'node_modules'), { recursive: true });

    expect(() => copyJsDos({ from, to })).toThrow(/js-dos is not installed.*npm ci/);
  });
});

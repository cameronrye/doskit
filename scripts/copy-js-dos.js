/**
 * Copy the js-dos runtime from node_modules into public/, where index.html,
 * the js-dos pathPrefix and the service worker expect it:
 * /js-dos.js, /js-dos.css and /emulators/*.{js,wasm}.
 *
 * Source maps, debug symbols and type declarations stay behind; browsers
 * never request them. Runs before `npm run dev` and `npm run build`, and
 * leaves files that are already up to date untouched.
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const JS_DOS_DIR = join(ROOT, 'node_modules', 'js-dos');

const isRuntimeFile = (name) => name.endsWith('.js') || name.endsWith('.wasm');

const isUpToDate = (source, target) =>
  existsSync(target) && readFileSync(target).equals(readFileSync(source));

/**
 * @param {{ from?: string, to?: string }} [dirs] js-dos dist folder and public folder
 * @returns {{ copied: string[], removed: string[] }} paths relative to `to`
 */
export function copyJsDos({ from = join(JS_DOS_DIR, 'dist'), to = join(ROOT, 'public') } = {}) {
  if (!existsSync(join(from, 'js-dos.js')) || !existsSync(join(from, 'emulators'))) {
    throw new Error(`js-dos is not installed (nothing at ${from}). Run "npm ci" first.`);
  }

  const emulators = readdirSync(join(from, 'emulators'), { withFileTypes: true })
    .filter((entry) => entry.isFile() && isRuntimeFile(entry.name))
    .map((entry) => `emulators/${entry.name}`);
  const files = ['js-dos.js', 'js-dos.css', ...emulators];

  // public/emulators/ holds nothing else, so clear out what js-dos no longer ships
  mkdirSync(join(to, 'emulators'), { recursive: true });
  const removed = readdirSync(join(to, 'emulators'))
    .map((name) => `emulators/${name}`)
    .filter((file) => !files.includes(file));
  for (const file of removed) {
    rmSync(join(to, file), { recursive: true, force: true });
  }

  const copied = files.filter((file) => !isUpToDate(join(from, file), join(to, file)));
  for (const file of copied) {
    copyFileSync(join(from, file), join(to, file));
  }

  return { copied, removed };
}

function main() {
  try {
    const { copied, removed } = copyJsDos();
    const { version } = JSON.parse(readFileSync(join(JS_DOS_DIR, 'package.json'), 'utf8'));
    const changes = copied.length + removed.length;
    console.log(
      changes === 0
        ? `[copy-js-dos] js-dos ${version} in public/ is up to date`
        : `[copy-js-dos] Copied js-dos ${version} into public/ (${copied.length} updated, ${removed.length} removed)`
    );
  } catch (error) {
    console.error(`[copy-js-dos] ${error.message}`);
    process.exit(1);
  }
}

const isEntryPoint = () => {
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
};

if (isEntryPoint()) {
  main();
}

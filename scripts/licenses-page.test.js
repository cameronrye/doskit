// @vitest-environment node
// public/licenses/index.html, the licenses of what the site serves, and the licenses of
// the bundled packages, which vite.config.ts's build.license writes beside it
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import viteConfig from '../vite.config.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = join(ROOT, 'public');
const LICENSES_DIR = join(PUBLIC_DIR, 'licenses');
const page = readFileSync(join(LICENSES_DIR, 'index.html'), 'utf8');
// The js-dos that copy-js-dos.js copies into the site
const jsDos = JSON.parse(readFileSync(join(ROOT, 'node_modules/js-dos/package.json'), 'utf8'));

/** The href and src of every element on the page */
const urls = [...page.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(([, url]) => url);
const licenseFile = viteConfig.build?.license?.fileName;

describe('the licenses page', () => {
  it('links the text of the GPL-2.0, which is next to it', () => {
    expect(urls).toContain('/licenses/gpl-2.0.txt');
    expect(readFileSync(join(LICENSES_DIR, 'gpl-2.0.txt'), 'utf8')).toMatch(
      /^\s*GNU GENERAL PUBLIC LICENSE\s+Version 2, June 1991\n/
    );
  });

  it('links the licenses of the bundled packages, which the build writes next to it', () => {
    expect(licenseFile).toBeTypeOf('string');
    expect(posix.dirname(licenseFile)).toBe('licenses');
    expect(urls).toContain(`/${licenseFile}`);
  });

  // Site paths, which also work at /licenses without the slash
  it("links only this site's files that the build puts in dist, by their paths", () => {
    const local = urls.filter((url) => !/^https?:\/\//.test(url) && !url.startsWith('#'));
    const missing = local.filter(
      (url) =>
        !url.startsWith('/') ||
        (url !== '/' && url !== `/${licenseFile}` && !existsSync(join(PUBLIC_DIR, url)))
    );

    expect(local.length).toBeGreaterThan(0);
    expect(missing).toEqual([]);
  });

  it('gives the source of the js-dos version the site serves', () => {
    expect(urls).toContain(`https://github.com/caiiiycuk/js-dos/tree/v${jsDos.version}`);
  });

  it('gives the source of the emulators that js-dos version was built with', () => {
    expect(urls).toContain(
      `https://github.com/caiiiycuk/emulators/tree/v${jsDos.devDependencies.emulators}`
    );
  });
});

describe("vite.config.ts's build.license", () => {
  let root;

  beforeEach(() => {
    // An app that bundles a package from node_modules, as DosKit bundles React
    root = mkdtempSync(join(tmpdir(), 'doskit-licenses-'));
    const files = {
      'index.html': '<!doctype html>\n<script type="module" src="/main.js"></script>\n',
      'main.js': "import greet from 'licensed-package';\ndocument.title = greet(document.title);\n",
      'node_modules/licensed-package/package.json': JSON.stringify({
        name: 'licensed-package',
        version: '1.2.3',
        license: 'MIT',
        type: 'module',
        main: 'index.js',
      }),
      'node_modules/licensed-package/LICENSE': 'MIT License\n\nCopyright (c) 2025 Package Author\n',
      'node_modules/licensed-package/index.js':
        'export default function greet(name) {\n  return `Hello, ${name}`;\n}\n',
    };
    for (const [file, contents] of Object.entries(files)) {
      mkdirSync(dirname(join(root, file)), { recursive: true });
      writeFileSync(join(root, file), contents);
    }
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('writes the license of each bundled package where the page links it', async () => {
    await build({
      root,
      configFile: false,
      logLevel: 'silent',
      build: { license: viteConfig.build?.license },
    });

    const licenses = readFileSync(join(root, 'dist', licenseFile), 'utf8');
    expect(licenses).toContain('licensed-package - 1.2.3 (MIT)');
    expect(licenses).toContain('Copyright (c) 2025 Package Author');
  });
});

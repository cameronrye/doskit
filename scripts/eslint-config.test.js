// @vitest-environment node
// eslint.config.js, as ESLint applies it to the service worker and the build scripts
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const eslint = new ESLint({ cwd: ROOT });

/** The messages ESLint gives for `code` as the file at `path` */
async function lint(code, path) {
  const [result] = await eslint.lintText(code, { filePath: join(ROOT, path) });
  return result.messages;
}

// The first lint loads the config, its plugins and both parsers, which takes seconds on a
// busy machine, longer than a test's own time limit: done once here, with time to spare
beforeAll(async () => {
  await lint('', 'public/sw.js');
  await lint('', 'scripts/warm-up.js');
}, 60_000);

describe('public/sw.js', () => {
  // The page registers it as a classic script, where import and export are syntax errors
  // that would stop the worker from installing
  it('may not use import or export', async () => {
    const messages = await lint(
      "import { version } from './version.js';\nexport const CACHE_NAME = `doskit-${version}`;\n",
      'public/sw.js'
    );

    expect(messages).toEqual([
      expect.objectContaining({
        fatal: true,
        message: expect.stringMatching(
          /'import' and 'export' may appear only with 'sourceType: module'/
        ),
      }),
    ]);
  });

  it('can use the service worker globals', async () => {
    const messages = await lint(
      "self.addEventListener('install', (event) => {\n  event.waitUntil(caches.open('doskit'));\n});\n",
      'public/sw.js'
    );

    expect(messages).toEqual([]);
  });
});

describe('scripts/', () => {
  it('lints the build scripts as ES modules with the Node.js globals', async () => {
    const messages = await lint(
      "import { readFileSync } from 'node:fs';\nexport const read = (path) => readFileSync(`${process.cwd()}/${path}`);\n",
      'scripts/example.js'
    );

    expect(messages).toEqual([]);
  });
});

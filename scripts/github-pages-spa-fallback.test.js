// @vitest-environment node
// The 404.html that vite.config.ts adds to the build for GitHub Pages
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'vite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { githubPagesSpaFallback } from '../vite.config.ts';

describe('githubPagesSpaFallback', () => {
  let root;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'doskit-spa-fallback-'));
    writeFileSync(
      join(root, 'index.html'),
      '<!doctype html>\n<title>DosKit</title>\n<script type="module" src="/main.js"></script>\n'
    );
    writeFileSync(join(root, 'main.js'), "document.title = 'built';\n");
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('emits 404.html as a copy of the built index.html', async () => {
    await build({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [githubPagesSpaFallback()],
    });

    const index = readFileSync(join(root, 'dist/index.html'), 'utf8');
    // The built page, which loads the hashed bundle rather than /main.js
    expect(index).toMatch(/src="\/assets\/index-[\w-]+\.js"/);
    expect(readFileSync(join(root, 'dist/404.html'), 'utf8')).toBe(index);
  });
});

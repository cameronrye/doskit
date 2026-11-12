// @vitest-environment node
// The app lists in the README and the llms files, which scripts/generate-app-lists.js writes
// from the app data files: a test fails when they are stale
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { listTargets, readAppData, replaceBlock } from './generate-app-lists.js';

describe('the generated app lists', () => {
  const apps = readAppData('src/apps');

  it.each(listTargets(apps))(
    'are current in $file (run npm run generate-app-lists)',
    ({ file, render }) => {
      const text = readFileSync(file, 'utf8');

      expect(replaceBlock(text, render())).toBe(text);
    }
  );

  it("list every app, in the selector's order, at its page", () => {
    const readme = listTargets(apps).find(({ file }) => file === 'README.md');
    const list = readme.render();

    expect(list.indexOf('Second Reality')).toBeLessThan(list.indexOf('Unreal'));
    expect(list).toContain('https://doskit.net/secondreality');
    expect(list.match(/https:\/\/doskit\.net\/[a-z0-9]+/g)).toHaveLength(apps.length);
  });
});

describe('replaceBlock', () => {
  it('replaces what is between the markers, and nothing else', () => {
    const text = 'before\n<!-- apps:start -->\nold\n<!-- apps:end -->\nafter\n';

    expect(replaceBlock(text, 'new')).toBe(
      'before\n<!-- apps:start -->\nnew\n<!-- apps:end -->\nafter\n'
    );
  });

  it('fails for a file without its markers', () => {
    expect(() => replaceBlock('no markers', 'new')).toThrow(/apps:start/);
  });
});

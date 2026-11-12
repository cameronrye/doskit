/**
 * The lists of DosKit's apps in README.md and public/llms-full.txt, written from the app
 * data files in src/apps between the markers <!-- apps:start --> and <!-- apps:end -->, so
 * that adding an app updates them all. Run it after adding or renaming an app:
 *
 *   node scripts/generate-app-lists.js
 *
 * scripts/generate-app-lists.test.js fails while a list is stale.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const START = '<!-- apps:start -->';
const END = '<!-- apps:end -->';

/** The apps' data files, in the selector's order */
export function readAppData(dir) {
  return readdirSync(dir)
    .filter((name) => /^[^.]+\.json$/.test(name))
    .map((name) => JSON.parse(readFileSync(join(dir, name), 'utf8')))
    .sort((a, b) => a.order - b.order);
}

const pageOf = (app) => `https://doskit.net/${app.id.replace(/-/g, '')}`;
const KINDS = { demo: 'Demo', intro: 'Intro', tracker: 'Tracker', effect: 'Effect' };

/** A Markdown table: production, by, year, what it is, and its page */
function readmeList(apps) {
  return [
    '| Production | By | Year | What it is | Page |',
    '| --- | --- | --- | --- | --- |',
    ...apps.map(
      (app) =>
        `| ${app.name} | ${app.author ?? ''} | ${app.year ?? ''} | ${KINDS[app.kind] ?? app.kind}: ${app.description} | [${pageOf(app).replace('https://', '')}](${pageOf(app)}) |`
    ),
  ].join('\n');
}

/** A plain list for language models, one app a line */
function llmsList(apps) {
  return apps
    .map(
      (app) =>
        `- ${app.name} (${[app.author, app.year].filter(Boolean).join(', ')}), ${(KINDS[app.kind] ?? app.kind).toLowerCase()}: ${pageOf(app)}`
    )
    .join('\n');
}

/** The files that hold a list, and what each list is */
export function listTargets(apps) {
  return [
    { file: 'README.md', render: () => readmeList(apps) },
    { file: 'public/llms-full.txt', render: () => llmsList(apps) },
  ];
}

/** The text with what is between its markers replaced */
export function replaceBlock(text, block) {
  const start = text.indexOf(START);
  const end = text.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`No ${START} ... ${END} block to replace`);
  }
  return `${text.slice(0, start + START.length)}\n${block}\n${text.slice(end)}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const apps = readAppData(join(ROOT, 'src', 'apps'));
  for (const { file, render } of listTargets(apps)) {
    const path = join(ROOT, file);
    const text = readFileSync(path, 'utf8');
    const updated = replaceBlock(text, render());
    if (updated !== text) {
      writeFileSync(path, updated);
      console.log(`Updated the app list in ${file}`);
    }
  }
}

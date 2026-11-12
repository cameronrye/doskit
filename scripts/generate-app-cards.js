/**
 * A 1200x630 share card per app, public/cards/<id>.png, from a frame of the app running
 * (cards-src/<id>.png, at the emulator's own resolution, as e2e/tools/frames.mjs captures it)
 * and the app's name, author and year from its data file in src/apps.
 *
 * The cards are committed, not built: the text is drawn with the machine's fonts, and the
 * frames need a browser and the emulator. Run it after changing a frame or an app's name, and
 * commit the PNGs:
 *
 *   node scripts/generate-app-cards.js
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CARD = { width: 1200, height: 630 };
// The DOS screen, at 4:3 as a monitor showed every mode of these programs
const FRAME = { left: 30, top: 30, width: 760, height: 570 };

const escapeXml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** A title broken into lines of at most `width` characters, at spaces */
function wrap(text, width) {
  const lines = [''];
  for (const word of text.split(' ')) {
    const line = lines.at(-1);
    if (line && line.length + 1 + word.length > width) lines.push(word);
    else lines[lines.length - 1] = line ? `${line} ${word}` : word;
  }
  return lines;
}

function overlay({ name, author, year }) {
  const x = FRAME.left + FRAME.width + 34;
  const title = wrap(name, 13)
    .map(
      (line, i) =>
        `<text x="${x}" y="${150 + i * 54}" font-size="46" font-weight="700" fill="#ffffff">${escapeXml(line)}</text>`
    )
    .join('');
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD.width}" height="${CARD.height}" font-family="Helvetica, Arial, sans-serif">
      <rect x="${FRAME.left - 2}" y="${FRAME.top - 2}" width="${FRAME.width + 4}" height="${FRAME.height + 4}" fill="none" stroke="#667eea" stroke-width="2"/>
      ${title}
      <text x="${x}" y="360" font-size="28" fill="#c9cbe0">${escapeXml(author ?? '')}</text>
      <text x="${x}" y="398" font-size="28" fill="#c9cbe0">${year ?? ''}</text>
      <text x="${x}" y="560" font-size="26" fill="#a9acd6">Plays in your browser</text>
      <text x="${x}" y="596" font-size="26" font-weight="700" fill="#8c9eff">doskit.net</text>
    </svg>`
  );
}

/** The card of one app, as a palette PNG: real frames and flat text fit in 256 colours */
export async function renderCard(app, frame) {
  const screen = await sharp(frame)
    // Nearest neighbour keeps the VGA pixels hard
    .resize(FRAME.width, FRAME.height, { kernel: 'nearest', fit: 'fill' })
    .toBuffer();
  return sharp({ create: { ...CARD, channels: 3, background: '#12121a' } })
    .composite([
      { input: screen, left: FRAME.left, top: FRAME.top },
      { input: overlay(app), left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9, palette: true, colours: 256 })
    .toBuffer();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const appsDir = join(ROOT, 'src', 'apps');
  const outDir = join(ROOT, 'public', 'cards');
  mkdirSync(outDir, { recursive: true });
  for (const name of readdirSync(appsDir).filter((file) => /^[^.]+\.json$/.test(file))) {
    const app = JSON.parse(readFileSync(join(appsDir, name), 'utf8'));
    const urlId = app.id.replace(/-/g, '');
    const card = await renderCard(app, readFileSync(join(ROOT, 'cards-src', `${urlId}.png`)));
    writeFileSync(join(outDir, `${urlId}.png`), card);
    console.log(`public/cards/${urlId}.png  ${card.length} bytes`);
  }
}

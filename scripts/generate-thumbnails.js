/**
 * A 4:3 thumbnail per production, src/assets/thumbs/<id>.png, from the frame the share card
 * uses (cards-src/<id>.png, at the emulator's own resolution), where <id> is the app's id
 * without hyphens.
 *
 * They are committed, not built, as the frames need a browser and the emulator. They live in
 * src/assets/ so that Vite hashes their names and the service worker precaches them like
 * bundles. Run it after changing a frame, and commit the PNGs:
 *
 *   npm run generate-thumbnails
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_WIDTH = 640;

/**
 * A frame at up to 640 wide, stretched to 4:3 as a monitor showed it, as a palette PNG
 * @param {Buffer} frame - The frame as the emulator drew it
 * @returns {Promise<{ png: Buffer, width: number, height: number }>}
 */
export async function renderThumbnail(frame) {
  const source = await sharp(frame).metadata();
  const width = Math.min(source.width, MAX_WIDTH);
  const height = Math.round((width * 3) / 4);
  const png = await sharp(frame)
    // Nearest neighbour keeps the VGA pixels hard, unless the frame must shrink
    .resize(width, height, {
      kernel: source.width > MAX_WIDTH ? 'lanczos3' : 'nearest',
      fit: 'fill',
    })
    .png({ palette: true, colours: 256, compressionLevel: 9 })
    .toBuffer();
  return { png, width, height };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const appsDir = join(ROOT, 'src', 'apps');
  const outDir = join(ROOT, 'src', 'assets', 'thumbs');
  mkdirSync(outDir, { recursive: true });
  for (const name of readdirSync(appsDir).filter((file) => /^[^.]+\.json$/.test(file))) {
    const app = JSON.parse(readFileSync(join(appsDir, name), 'utf8'));
    const urlId = app.id.replace(/-/g, '');
    const { png, width, height } = await renderThumbnail(
      readFileSync(join(ROOT, 'cards-src', `${urlId}.png`))
    );
    writeFileSync(join(outDir, `${urlId}.png`), png);
    console.log(`src/assets/thumbs/${urlId}.png  ${width}x${height}  ${png.length} bytes`);
  }
}

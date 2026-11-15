import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { renderThumbnail } from './generate-thumbnails.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const frameOf = (width, height) =>
  sharp({ create: { width, height, channels: 3, background: '#0000aa' } })
    .png()
    .toBuffer();

describe('renderThumbnail', () => {
  it('stretches a 320x200 frame to 320x240 with hard pixels', async () => {
    const { width, height, png } = await renderThumbnail(await frameOf(320, 200));
    expect([width, height]).toEqual([320, 240]);
    expect((await sharp(png).metadata()).width).toBe(320);
  });

  it('keeps a 640x400 frame at 640 wide, 4:3', async () => {
    const { width, height } = await renderThumbnail(await frameOf(640, 400));
    expect([width, height]).toEqual([640, 480]);
  });

  it('narrows a frame wider than 640 to 640x480', async () => {
    const { width, height, png } = await renderThumbnail(await frameOf(792, 558));
    expect([width, height]).toEqual([640, 480]);
    expect((await sharp(png).metadata()).height).toBe(480);
  });
});

describe('the committed thumbnails', () => {
  it('has a 4:3 thumbnail for every production, under 2 MB in all', () => {
    const appsDir = join(ROOT, 'src', 'apps');
    const files = readdirSync(appsDir).filter((file) => /^[^.]+\.json$/.test(file));
    expect(files.length).toBeGreaterThan(0);
    let total = 0;
    for (const file of files) {
      const { id } = JSON.parse(readFileSync(join(appsDir, file), 'utf8'));
      const path = join(ROOT, 'src', 'assets', 'thumbs', `${id.replace(/-/g, '')}.png`);
      expect(existsSync(path), path).toBe(true);
      const bytes = readFileSync(path);
      const width = bytes.readUInt32BE(16);
      const height = bytes.readUInt32BE(20);
      expect(width, path).toBeLessThanOrEqual(640);
      expect(width * 3, path).toBe(height * 4);
      total += bytes.length;
    }
    expect(total).toBeLessThan(2_000_000);
  });
});

/**
 * Thumbnail URLs of the productions: src/assets/thumbs/<id>.png, made by
 * scripts/generate-thumbnails.js. Vite hashes their names, and the service worker
 * precaches them with the other bundles.
 */
import type { DosApp } from '../types/dos-app';

const thumbnails = import.meta.glob<string>('../assets/thumbs/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

const byId = new Map(
  Object.entries(thumbnails).map(([path, url]) => [
    path
      .split('/')
      .pop()!
      .replace(/\.png$/, ''),
    url,
  ])
);

/** The thumbnail of a production: 4:3, up to 640 wide */
export function thumbnailOf(app: Pick<DosApp, 'id'>): string | undefined {
  return byId.get(app.id.replace(/-/g, ''));
}

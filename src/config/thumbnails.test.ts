import { describe, expect, it } from 'vitest';
import { availableApps } from './apps.config';
import { thumbnailOf } from './thumbnails';

describe('thumbnailOf', () => {
  it('gives every production a thumbnail URL', () => {
    for (const app of availableApps) {
      expect(thumbnailOf(app), app.id).toMatch(/thumbs\/[a-z0-9]+.*\.png/);
    }
  });

  it('gives nothing for an unknown production', () => {
    expect(thumbnailOf({ id: 'no-such-production' })).toBeUndefined();
  });
});

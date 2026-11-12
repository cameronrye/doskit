/**
 * Tests for the feeds that hand out what DOS prints
 */

import { describe, it, expect } from 'vitest';
import { createLineFeed } from './lineFeed';

describe('createLineFeed', () => {
  it('gives a new listener the lines it missed, then each new line', () => {
    const feed = createLineFeed();
    feed.push('one');
    const heard: string[] = [];

    feed.subscribe((line) => heard.push(line));
    feed.push('two');

    expect(heard).toEqual(['one', 'two']);
  });

  it('stops giving lines to a listener that unsubscribed', () => {
    const feed = createLineFeed();
    const heard: string[] = [];
    const unsubscribe = feed.subscribe((line) => heard.push(line));

    unsubscribe();
    feed.push('one');

    expect(heard).toEqual([]);
  });

  it('keeps only the most recent lines for later listeners', () => {
    const feed = createLineFeed(2);
    feed.push('one');
    feed.push('two');
    feed.push('three');
    const heard: string[] = [];

    feed.subscribe((line) => heard.push(line));

    expect(heard).toEqual(['two', 'three']);
  });

  it('lets a listener unsubscribe while the feed calls it', () => {
    const feed = createLineFeed();
    const heard: string[] = [];
    const unsubscribe = feed.subscribe((line) => {
      heard.push(line);
      unsubscribe();
    });
    feed.subscribe((line) => heard.push(`second ${line}`));

    feed.push('one');
    feed.push('two');

    expect(heard).toEqual(['one', 'second one', 'second two']);
  });
});

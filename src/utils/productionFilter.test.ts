import { describe, expect, it } from 'vitest';
import { availableApps } from '../config/apps.config';
import {
  KIND_TABS,
  countByKind,
  filterProductions,
  kindLabel,
  moreByAuthor,
  pickRandom,
  shortYear,
} from './productionFilter';

describe('productionFilter', () => {
  it('filters by words in any order, ignoring case and outer spaces', () => {
    const found = filterProductions(availableApps, 'all', '  CREW future ');
    expect(found.length).toBeGreaterThan(5);
    expect(found.every((app) => app.author?.includes('Future Crew'))).toBe(true);
  });

  it('matches a year and the description', () => {
    expect(filterProductions(availableApps, 'all', '1997').map((a) => a.id)).toContain('boost');
    expect(filterProductions(availableApps, 'demo', "assembly '93").map((a) => a.id)).toContain(
      'second-reality'
    );
  });

  it('returns nothing for no match, and keeps data order', () => {
    expect(filterProductions(availableApps, 'all', 'zzzz')).toEqual([]);
    const demos = filterProductions(availableApps, 'demo', '');
    expect(demos.map((a) => a.id)).toEqual(
      availableApps.filter((a) => a.kind === 'demo').map((a) => a.id)
    );
  });

  it('keeps only the chosen kind', () => {
    const trackers = filterProductions(availableApps, 'tracker', '');
    expect(trackers.length).toBeGreaterThan(0);
    expect(trackers.every((a) => a.kind === 'tracker')).toBe(true);
  });

  it('counts each kind and all', () => {
    const counts = countByKind(availableApps);
    expect(counts.all).toBe(availableApps.length);
    expect(
      counts.demo +
        counts.intro +
        counts.tracker +
        counts.musicdisk +
        counts.effect +
        counts.diskmag
    ).toBe(counts.all);
  });

  it('labels the tabs in order', () => {
    expect(KIND_TABS.map((t) => t.label)).toEqual([
      'All',
      'Demos',
      'Intros',
      'Trackers',
      'Musicdisks',
      'Effects',
      'Diskmag',
    ]);
    expect(kindLabel('demo')).toBe('Demos');
  });

  it('lists other productions by the same author only', () => {
    const unreal = availableApps.find((a) => a.id === 'unreal')!;
    const more = moreByAuthor(unreal, availableApps);
    expect(more).toHaveLength(6);
    expect(more.every((a) => a.author === 'Future Crew' && a.id !== 'unreal')).toBe(true);
  });

  it('lists nothing by an unknown author', () => {
    const anon = { ...availableApps[0]!, author: undefined };
    expect(moreByAuthor(anon, availableApps)).toEqual([]);
  });

  it('shortens years and picks within range', () => {
    expect(shortYear(1993)).toBe("'93");
    expect(shortYear(undefined)).toBeNull();
    expect(pickRandom(['a', 'b', 'c'], () => 0.99)).toBe('c');
    expect(pickRandom([], () => 0)).toBeUndefined();
  });
});

/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Filtering for the start page and the production page's "more by" list
 */

import type { AppKind, DosApp } from '../types/dos-app';

export type KindFilter = 'all' | AppKind;

/** The start page's tabs, in order */
export const KIND_TABS: readonly { kind: KindFilter; label: string }[] = [
  { kind: 'all', label: 'All' },
  { kind: 'demo', label: 'Demos' },
  { kind: 'intro', label: 'Intros' },
  { kind: 'tracker', label: 'Trackers' },
  { kind: 'musicdisk', label: 'Musicdisks' },
  { kind: 'effect', label: 'Effects' },
  { kind: 'diskmag', label: 'Diskmag' },
];

/** The tab label of a kind, such as "Demos" */
export function kindLabel(kind: AppKind): string {
  return KIND_TABS.find((tab) => tab.kind === kind)?.label ?? kind;
}

/** How many productions each tab holds */
export function countByKind(apps: readonly DosApp[]): Record<KindFilter, number> {
  const counts: Record<KindFilter, number> = {
    all: apps.length,
    demo: 0,
    intro: 0,
    tracker: 0,
    musicdisk: 0,
    effect: 0,
    diskmag: 0,
  };
  for (const app of apps) counts[app.kind] += 1;
  return counts;
}

/**
 * The productions of a kind whose name, author, year and description hold every word of
 * the query, in any order and case; in the order of the input
 */
export function filterProductions(
  apps: readonly DosApp[],
  kind: KindFilter,
  query: string
): DosApp[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return apps.filter((app) => {
    if (kind !== 'all' && app.kind !== kind) return false;
    const text = [app.name, app.author, app.year, app.description].join(' ').toLowerCase();
    return words.every((word) => text.includes(word));
  });
}

/** Other productions by the same author, in the order of the input */
export function moreByAuthor(app: DosApp, apps: readonly DosApp[], limit = 6): DosApp[] {
  if (!app.author) return [];
  return apps.filter((other) => other.author === app.author && other.id !== app.id).slice(0, limit);
}

/** A year as an apostrophe and two digits, such as "'93" */
export function shortYear(year?: number): string | null {
  return year === undefined ? null : `'${String(year).slice(-2)}`;
}

/** One of the items, chosen with random() in [0, 1); undefined for none */
export function pickRandom<T>(
  items: readonly T[],
  random: () => number = Math.random
): T | undefined {
  return items[Math.floor(random() * items.length)];
}

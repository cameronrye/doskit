/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * The apps' page text, src/apps/<id>.page.json, each file a chunk of its own that the About
 * panel imports when it opens: the text stays out of the main bundle
 */

import type { AppPage } from '../types/dos-app';

const pageModules = import.meta.glob<AppPage>('../apps/*.page.json', { import: 'default' });

/** An app's page text, or null for an app without a page file */
export async function loadAppPage(id: string): Promise<AppPage | null> {
  const load = pageModules[`../apps/${id}.page.json`];
  return load ? load() : null;
}

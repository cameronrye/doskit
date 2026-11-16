/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import type { AppKind } from '../types/dos-app';

/** What the Play button says: a tracker is started, a diskmag read, the rest played */
export function playLabelOf(kind: AppKind): string {
  if (kind === 'tracker') return 'Start';
  if (kind === 'diskmag') return 'Read';
  return 'Play';
}

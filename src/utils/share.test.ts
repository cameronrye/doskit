/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { describe, expect, it, vi } from 'vitest';
import { shareLink } from './share';

const data = { title: 'Unreal', url: 'https://doskit.net/unreal' };

describe('shareLink', () => {
  it('uses the Web Share API where there is one', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    expect(await shareLink(data, { share } as unknown as Navigator)).toBe('shared');
    expect(share).toHaveBeenCalledWith(data);
  });

  it('reports a cancelled share as cancelled', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'));
    expect(await shareLink(data, { share } as unknown as Navigator)).toBe('cancelled');
  });

  it('copies the link when the share sheet fails', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('no', 'NotAllowedError'));
    const writeText = vi.fn().mockResolvedValue(undefined);
    const nav = { share, clipboard: { writeText } } as unknown as Navigator;
    expect(await shareLink(data, nav)).toBe('copied');
    expect(writeText).toHaveBeenCalledWith(data.url);
  });

  it('copies the link without a share sheet', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    expect(await shareLink(data, { clipboard: { writeText } } as unknown as Navigator)).toBe(
      'copied'
    );
    expect(writeText).toHaveBeenCalledWith(data.url);
  });

  it('fails with neither, or when the copy is refused', async () => {
    expect(await shareLink(data, {} as Navigator)).toBe('failed');
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    expect(await shareLink(data, { clipboard: { writeText } } as unknown as Navigator)).toBe(
      'failed'
    );
  });
});

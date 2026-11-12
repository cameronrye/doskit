/**
 * Tests for a tracker's Files panel: what it has kept, and downloading, bringing in and
 * deleting files
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrackerFiles } from './TrackerFiles';

const props = {
  appName: 'Impulse Tracker',
  savedAt: null,
  kept: true,
  onDownload: vi.fn(),
  onImport: vi.fn(),
  onReset: vi.fn(),
  onClose: vi.fn(),
};

describe('TrackerFiles', () => {
  it('says when it last kept what the tracker saved', () => {
    render(<TrackerFiles {...props} savedAt={new Date(2026, 10, 11, 21, 5).getTime()} />);

    expect(screen.getByRole('dialog', { name: 'Your files' })).toBeInTheDocument();
    expect(screen.getByText(/kept in this browser at 21:05/i)).toBeInTheDocument();
  });

  it('says how to keep work before anything is saved', () => {
    render(<TrackerFiles {...props} />);

    expect(screen.getByText(/save in Impulse Tracker/i)).toBeInTheDocument();
  });

  it('says so where the browser cannot keep files', () => {
    render(<TrackerFiles {...props} kept={false} />);

    expect(screen.getByText(/can't keep files/i)).toBeInTheDocument();
  });

  it('downloads the files, and brings in modules chosen from the computer', () => {
    const onDownload = vi.fn();
    const onImport = vi.fn();
    render(<TrackerFiles {...props} onDownload={onDownload} onImport={onImport} />);
    const song = new File([new Uint8Array([1])], 'song.it');

    fireEvent.click(screen.getByRole('button', { name: /download/i }));
    fireEvent.change(screen.getByLabelText(/bring in modules/i), { target: { files: [song] } });

    expect(onDownload).toHaveBeenCalledOnce();
    expect(onImport).toHaveBeenCalledWith([song]);
  });

  it('asks before it deletes the files and restarts the tracker', () => {
    const onReset = vi.fn();
    render(<TrackerFiles {...props} onReset={onReset} />);

    fireEvent.click(screen.getByRole('button', { name: 'Start over' }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep them' }));
    expect(onReset).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Start over' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete them and restart' }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<TrackerFiles {...props} onClose={onClose} />);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(onClose).toHaveBeenCalledOnce();
  });
});

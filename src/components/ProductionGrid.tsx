/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { useCallback, useEffect, useRef } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import CrtScreen from './CrtScreen';
import { thumbnailOf } from '../config/thumbnails';
import { countGridColumns } from '../utils/gridColumns';
import { shortYear } from '../utils/productionFilter';
import { getUrlFriendlyId } from '../utils/urlRouting';
import type { DosApp } from '../types/dos-app';
import './ProductionGrid.css';

interface ProductionGridProps {
  apps: readonly DosApp[];
  /** The list's accessible name */
  label: string;
  onOpen: (app: DosApp) => void;
  /** The roving tab stop; the first app when null or not in `apps` */
  activeId: string | null;
  /** The focus reached an app, which becomes the tab stop */
  onActiveChange: (app: DosApp) => void;
  /**
   * The pointer entered, or the focus reached, an app, such as for an info window. The pointer
   * leaves the tab stop where it is, so that Tab from a link goes where the keyboard left it.
   */
  onHighlight?: (app: DosApp) => void;
  /** Focus the active link once mounted, such as on return to the start page */
  autoFocusActive?: boolean;
  variant?: 'grid' | 'strip';
}

/** Productions as a list of real links with one tab stop and arrow-key movement */
export function ProductionGrid({
  apps,
  label,
  onOpen,
  activeId,
  onActiveChange,
  onHighlight,
  autoFocusActive = false,
  variant = 'grid',
}: ProductionGridProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const found = apps.findIndex((app) => app.id === activeId);
  const activeIndex = found === -1 ? 0 : found;

  useEffect(() => {
    if (autoFocusActive) {
      listRef.current?.querySelectorAll<HTMLElement>('a')[activeIndex]?.focus();
    }
    // Once, on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = (event: MouseEvent, app: DosApp) => {
    // Other buttons and modified clicks, such as a new tab, belong to the browser
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    onOpen(app);
  };

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLUListElement>) => {
      const links = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a'));
      const index = links.findIndex((link) => link === event.target);
      // Combinations belong to the browser and the system, such as Alt+Left for Back
      if (index === -1 || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      const end = links.length - 1;
      const columns = variant === 'grid' ? countGridColumns(event.currentTarget) : 0;
      let next: number;
      switch (event.key) {
        case 'ArrowRight':
          next = index === end ? 0 : index + 1;
          break;
        case 'ArrowLeft':
          next = index === 0 ? end : index - 1;
          break;
        case 'ArrowDown':
          if (variant === 'strip') return;
          next = Math.min(index + columns, end);
          break;
        case 'ArrowUp':
          if (variant === 'strip') return;
          next = Math.max(index - columns, 0);
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = end;
          break;
        default:
          return;
      }
      event.preventDefault();
      links[next]?.focus();
    },
    [variant]
  );

  return (
    <ul
      ref={listRef}
      className={`production-grid production-grid--${variant}`}
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      {apps.map((app, index) => {
        const year = shortYear(app.year);
        return (
          <li key={app.id}>
            <a
              className="production-link"
              href={`/${getUrlFriendlyId(app.id)}`}
              tabIndex={index === activeIndex ? 0 : -1}
              onClick={(event) => handleClick(event, app)}
              onMouseEnter={() => onHighlight?.(app)}
              onFocus={() => {
                onActiveChange(app);
                onHighlight?.(app);
              }}
            >
              <CrtScreen src={thumbnailOf(app)} alt="" size="small" />
              <span className="production-name">{app.name}</span>{' '}
              {(app.author || year) && (
                <span className="production-meta">
                  {app.author && <span className="production-author">{app.author}</span>}{' '}
                  {year && <span className="production-year">{year}</span>}
                </span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

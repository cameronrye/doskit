/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import type { ReactNode } from 'react';
import './DosWindow.css';

interface DosWindowProps {
  title?: ReactNode;
  titleId?: string;
  as?: 'div' | 'section' | 'aside';
  className?: string;
  children: ReactNode;
}

/** A blue DOS window: a double border with the title set into it. */
function DosWindow({ title, titleId, as: Tag = 'div', className, children }: DosWindowProps) {
  return (
    <Tag className={className ? `dos-window ${className}` : 'dos-window'}>
      <div className="dos-window-frame">
        {title && (
          <span className="dos-window-title" id={titleId}>
            {title}
          </span>
        )}
        {children}
      </div>
    </Tag>
  );
}

export default DosWindow;

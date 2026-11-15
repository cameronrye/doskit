/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import type { ReactNode } from 'react';
import './KeyHint.css';

interface KeyHintProps {
  keyName: string;
  children: ReactNode;
}

/** A key cap and what it does: [Esc] Close. */
function KeyHint({ keyName, children }: KeyHintProps) {
  return (
    <span className="key-hint">
      <kbd>{keyName}</kbd>
      {children}
    </span>
  );
}

export default KeyHint;

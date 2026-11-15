/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import './SiteFooter.css';

/** Credits and the licenses link; each opens in a new tab so a running program keeps running. */
function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={className ? `site-footer ${className}` : 'site-footer'}>
      <span>
        Made by{' '}
        <a href="https://rye.dev/" target="_blank" rel="noopener noreferrer">
          Cameron Rye
        </a>
      </span>
      <span>
        Powered by{' '}
        <a href="https://js-dos.com" target="_blank" rel="noopener noreferrer">
          js-dos v{import.meta.env.VITE_JSDOS_VERSION}
        </a>
      </span>
      {/* The GPL notices of js-dos and DOSBox, which DosKit ships */}
      <a href="/licenses/" target="_blank" rel="noopener noreferrer">
        Licenses
      </a>
    </footer>
  );
}

export default SiteFooter;

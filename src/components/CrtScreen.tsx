/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import './CrtScreen.css';

interface CrtScreenProps {
  src: string | undefined;
  alt: string;
  size?: 'small' | 'medium' | 'large';
  loading?: 'lazy' | 'eager';
}

/** A production's screenshot in a CRT bezel; without a src, the empty bezel. */
function CrtScreen({ src, alt, size = 'medium', loading = 'lazy' }: CrtScreenProps) {
  return (
    <div className={`crt crt--${size}`}>
      {src && (
        <img className="crt-image" src={src} alt={alt} width={320} height={240} loading={loading} />
      )}
    </div>
  );
}

export default CrtScreen;

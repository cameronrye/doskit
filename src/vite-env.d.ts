/// <reference types="vite/client" />

// Set by `define` in vite.config.ts, which vitest.config.ts shares.
interface ImportMetaEnv {
  /** DosKit's version from package.json. */
  readonly VITE_APP_VERSION: string;
  /** The installed js-dos package version. */
  readonly VITE_JSDOS_VERSION: string;
}

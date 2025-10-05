/**
 * Open Watcom Virtual Filesystem Configuration for js-dos
 * 
 * This configuration defines how to mount the Open Watcom toolchain
 * in the js-dos virtual filesystem at C:\WATCOM\
 */

export interface WatcomInitFsConfig {
  /** Base path where Open Watcom files are located (relative to public/) */
  basePath: string;
  
  /** Mount point in DOS filesystem */
  mountPoint: string;
  
  /** Whether to preload all files or load on-demand */
  preload: boolean;
  
  /** Files to preload (if preload is true) */
  preloadFiles?: string[];
}

/**
 * Default Open Watcom InitFs configuration
 */
export const watcomInitFsConfig: WatcomInitFsConfig = {
  basePath: '/watcom',
  mountPoint: 'C:\\WATCOM',
  preload: false, // Load on-demand for better initial load time
  preloadFiles: [
    // Essential compiler binaries
    'BINW/WCC.EXE',
    'BINW/WLINK.EXE',
    
    // Essential headers
    'H/STDIO.H',
    'H/STDLIB.H',
    'H/STRING.H',
    'H/STDDEF.H',
    'H/LIMITS.H',
    
    // Small model library
    'LIB286/DOS/CLIBS.LIB',
  ],
};

/**
 * Generate initFs array for js-dos
 * 
 * This function creates the initFs configuration that js-dos uses
 * to populate the virtual filesystem before starting DOS.
 * 
 * @param config - WatcomInitFsConfig
 * @returns Array of file paths to mount
 */
export function generateWatcomInitFs(config: WatcomInitFsConfig = watcomInitFsConfig): string[] {
  if (config.preload && config.preloadFiles) {
    return config.preloadFiles.map(file => `${config.basePath}/${file}`);
  }
  
  // Return empty array for on-demand loading
  return [];
}

/**
 * Environment variables to set in DOS for Open Watcom
 */
export const watcomEnvironment = {
  WATCOM: 'C:\\WATCOM',
  PATH: 'C:\\WATCOM\\BINW;%PATH%',
  INCLUDE: 'C:\\WATCOM\\H',
  LIB: 'C:\\WATCOM\\LIB286\\DOS',
};

/**
 * AUTOEXEC.BAT content for Open Watcom setup
 */
export const watcomAutoexec = `@ECHO OFF
REM Open Watcom C/C++ Compiler Environment Setup
SET WATCOM=C:\\WATCOM
SET PATH=%WATCOM%\\BINW;%PATH%
SET INCLUDE=%WATCOM%\\H
SET LIB=%WATCOM%\\LIB286\\DOS
ECHO Open Watcom C/C++ Compiler Ready
`;

/**
 * Helper function to create AUTOEXEC.BAT content with custom commands
 * 
 * @param additionalCommands - Additional DOS commands to append
 * @returns Complete AUTOEXEC.BAT content
 */
export function createAutoexec(additionalCommands: string[] = []): string {
  const commands = [
    '@ECHO OFF',
    'REM Open Watcom C/C++ Compiler Environment Setup',
    'SET WATCOM=C:\\WATCOM',
    'SET PATH=%WATCOM%\\BINW;%PATH%',
    'SET INCLUDE=%WATCOM%\\H',
    'SET LIB=%WATCOM%\\LIB286\\DOS',
    ...additionalCommands,
  ];
  
  return commands.join('\r\n') + '\r\n';
}


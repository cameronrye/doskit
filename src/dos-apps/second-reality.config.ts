/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Second Reality Demo Configuration
 * Configuration for running the famous Second Reality demo by Future Crew (1993)
 */

import type { DosFile } from '../utils/diskLoader';

/**
 * Base URL for Second Reality files
 * Using the official GitHub repository (public domain/Unlicense)
 */
const SECOND_REALITY_BASE_URL =
  'https://raw.githubusercontent.com/mtuomi/SecondReality/master/';

/**
 * Main executable and core files for Second Reality
 * Note: This is a minimal set - the full demo has many more data files
 */
export const secondRealityFiles: DosFile[] = [
  // Main executable
  { path: '/U2.EXE', url: `${SECOND_REALITY_BASE_URL}U2.EXE` },

  // Script and configuration files
  { path: '/SCRIPT', url: `${SECOND_REALITY_BASE_URL}SCRIPT` },
  { path: '/VECSCR', url: `${SECOND_REALITY_BASE_URL}VECSCR` },

  // Batch files
  { path: '/U2.BAT', url: `${SECOND_REALITY_BASE_URL}U2.BAT` },
  { path: '/MEM.BAT', url: `${SECOND_REALITY_BASE_URL}MEM.BAT` },

  // Documentation files (optional)
  // { path: '/CODE', url: `${SECOND_REALITY_BASE_URL}CODE` },
  // { path: '/DESIGN', url: `${SECOND_REALITY_BASE_URL}DESIGN` },
  // { path: '/IDEAS', url: `${SECOND_REALITY_BASE_URL}IDEAS` },
];

/**
 * Data directories for Second Reality
 * Each directory contains assets for different parts of the demo
 * You may need to fetch these recursively or create a complete file list
 */
export const secondRealityDirectories = [
  '3DS',
  'ALKU',
  'BEG',
  'COMAN',
  'CREDITS',
  'DDSTARS',
  'DIS',
  'DOTS',
  'END',
  'ENDPIC',
  'ENDSCRL',
  'FCP',
  'FOREST',
  'GLENZ',
  'GRAB',
  'GRID',
  'HARD',
  'JPLOGO',
  'LENS',
  'MAIN',
  'PAM',
  'PANIC',
  'PICS',
  'PLZPART',
  'START',
  'TECHNO',
  'TUNNELI',
  'TWIST',
  'UTIL',
  'VISU',
  'WATER',
];

/**
 * DOSBox configuration optimized for Second Reality
 *
 * Second Reality requirements:
 * - 386 CPU minimum, 486+ recommended
 * - VGA graphics
 * - Sound card: Gravis UltraSound (recommended), Sound Blaster, or no sound
 * - Memory: 570KB conventional, 1MB EMS for SB (GUS doesn't need EMS)
 *
 * This configuration uses:
 * - Gravis UltraSound with 512KB stereo memory (optimal audio quality)
 * - Pentium CPU with maximum cycles (best performance)
 * - 16MB RAM with EMS/XMS enabled
 * - Sound Blaster as fallback
 *
 * Based on Archive.org's working configuration and Second Reality README.1ST
 */
export const secondRealityDosboxConf = `
[cpu]
core=dynamic
cputype=pentium
cycles=max

[video]
vmemsize=8

[dos]
ver=7.1
umb=true
ems=true
xms=true

[memory]
memsize=16

[sblaster]
sbtype=sb16
sbbase=220
irq=7
dma=1
hdma=5
sbmixer=true
oplmode=auto
oplemu=default
oplrate=44100

[gus]
gus=true
gusrate=44100
gusbase=240
gusirq=5
gusdma=3
ultradir=C:\\ULTRASND

[speaker]
pcspeaker=true
pcrate=44100
tandy=auto
tandyrate=44100
disney=true

[joystick]
joysticktype=none

[autoexec]
@echo off
echo.
echo ========================================
echo   Second Reality by Future Crew (1993)
echo ========================================
echo.
echo Audio: Gravis UltraSound (512KB Stereo)
echo CPU: Pentium (Maximum Cycles)
echo.
echo Mounting C: drive...
mount c .
c:
echo.
echo Starting Second Reality...
echo.
SECOND.EXE
`;

/**
 * Alternative configuration for running from a disk image
 * Use this if you create a floppy or hard disk image
 */
export const secondRealityDiskImageConf = `
[cpu]
core=auto
cputype=486
cycles=max

[video]
vmemsize=8

[dos]
ver=7.1
umb=true
ems=true
xms=true

[sblaster]
sbtype=sb16
sbbase=220
irq=7
dma=1
hdma=5
oplmode=auto

[autoexec]
@echo off
echo Mounting Second Reality disk image...
imgmount c /sr.img -t hdd
c:
echo Starting Second Reality...
U2.EXE
`;

/**
 * Minimal configuration for testing
 * Just boots to DOS prompt with Second Reality files available
 */
export const secondRealityTestConf = `
[cpu]
core=auto
cputype=486
cycles=max

[autoexec]
@echo off
mount c .
c:
echo.
echo Second Reality files loaded.
echo Type 'U2' to start the demo.
echo Type 'dir' to see available files.
echo.
`;

/**
 * Fetch the complete file tree from GitHub repository
 * Uses GitHub API to get all files recursively
 */
async function fetchGitHubTree(
  owner: string,
  repo: string,
  branch: string = 'master'
): Promise<{ path: string; type: string }[]> {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tree.filter((item: { type: string }) => item.type === 'blob');
  } catch (error) {
    console.error('[SecondReality] Error fetching GitHub tree:', error);
    throw error;
  }
}

/**
 * Get the complete file list for Second Reality
 * Fetches all files from the GitHub repository dynamically
 */
export async function getCompleteFileList(): Promise<DosFile[]> {
  try {
    // Fetch the complete file tree from GitHub
    const files = await fetchGitHubTree('mtuomi', 'SecondReality');

    // Convert to DosFile format
    const dosFiles: DosFile[] = files.map((file) => {
      let path = `/${file.path}`;

      // Rename MAIN/U2.EXE to SECOND.EXE in the root
      // The demo expects SECOND.EXE to be in the current directory
      if (file.path === 'MAIN/U2.EXE') {
        path = '/SECOND.EXE';
      }

      return {
        path,
        url: `${SECOND_REALITY_BASE_URL}${file.path}`,
      };
    });

    if (import.meta.env.DEV) {
      console.log(
        `[SecondReality] Found ${dosFiles.length} files in repository`
      );
    }

    return dosFiles;
  } catch (error) {
    console.error('[SecondReality] Error getting complete file list:', error);
    // Fallback to basic files if GitHub API fails
    return secondRealityFiles;
  }
}

/**
 * Second Reality compiled demo (hosted locally)
 * This is the actual compiled demo (not source code)
 * Originally from Archive.org, now hosted locally to avoid CORS issues
 *
 * Source: https://archive.org/details/demoscene_SecondReality-FutureCrew
 * File: 2nd_real.zip (2.1 MB)
 * Contains: SECOND.EXE, REALITY.FC, README.1ST, FCINFO10.TXT, FILE_ID.DIZ
 */
export const secondRealityZipUrl = '/demos/second-reality.zip';

/**
 * Configuration metadata
 */
export const secondRealityMetadata = {
  name: 'Second Reality',
  author: 'Future Crew',
  year: 1993,
  description:
    'One of the most influential demos in PC demo scene history. Features groundbreaking 3D graphics, music, and effects.',
  requirements: {
    cpu: '486 or better',
    memory: '4MB RAM',
    graphics: 'VGA',
    sound: 'Sound Blaster (optional)',
  },
  license: 'Public Domain (Unlicense)',
  repository: 'https://github.com/mtuomi/SecondReality',
  notes: [
    'Released to celebrate the 20th anniversary of the demo',
    'Source code and data released into public domain',
    'May require specific DOSBox settings for optimal performance',
  ],
};


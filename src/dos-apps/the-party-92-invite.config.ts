/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * The Party '92 Invitation Configuration
 * Configuration for running The Party 1992 invitation intro by Future Crew (1992)
 */

import { presets } from '../utils/dosboxConfigBuilder';

/**
 * The Party '92 Invitation (hosted locally)
 * Future Crew's invitation intro for the PC side of The Party 1992
 *
 * Source: https://files.scene.org/get/demos/groups/future_crew/intros/theparty.zip
 * License: Freeware (Future Crew's FCINFO files and PANIC.NFO; see public/demos/README.md)
 */
export const theParty92InviteZipUrl = '/demos/the-party-92-invite.zip';

/**
 * DOSBox configuration for The Party '92 Invitation
 *
 * The Party '92 Invitation requirements (Future Crew's release list: "SB/SBp"):
 * - VGA graphics
 * - A Sound Blaster or Sound Blaster Pro, which it finds by itself
 *
 * This configuration uses:
 * - The demo preset's simple CPU core at a fixed 30000 cycles
 * - The preset's Sound Blaster 16
 * - Standard VGA graphics
 */
export const theParty92InviteDosboxConf = presets
  .demo()
  .addAutoexec(
    '@echo off',
    'echo.',
    'echo ========================================',
    "echo   The Party '92 Invitation",
    'echo   by Future Crew (1992)',
    'echo ========================================',
    'echo.',
    'echo Code by Psi and Wildfire, music by Skaven',
    'echo Graphics by Pixel and Marvel',
    'echo.',
    'echo Audio: Sound Blaster 16',
    'echo CPU: 30000 cycles',
    'echo Graphics: VGA',
    'echo.',
    'echo Mounting C: drive...',
    'mount c .',
    'c:',
    'echo.',
    "echo Starting The Party '92 Invitation...",
    'echo.',
    'THEPARTY.EXE'
  )
  .build();

/** The config under the name the registry reads */
export { theParty92InviteDosboxConf as dosboxConf };

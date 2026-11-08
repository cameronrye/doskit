/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DOSBox configuration for the interactive DOS prompt
 *
 * - A fixed 25000 cycles per millisecond on the simple CPU core
 * - A mixer at 44100 Hz that keeps 64 ms of audio on top of each block, where DOSBox's default
 *   is 40 (it goes up to 100: DOSBox lowers anything higher to 100). There is no blocksize: the
 *   backend's mixer never reads it and always works in 2048-sample blocks.
 * - A Sound Blaster 16 and the PC speaker, and no Gravis UltraSound
 *
 * Every setting here is one the default js-dos backend ("dosbox", see jsdos.config.ts)
 * applies; it drops or resets anything else without a warning. That backend has no
 * dynamic core, reports DOS 5.00 and runs with 16 MB of memory (its default memsize).
 */

export const defaultDosboxConfig = `
[cpu]
core=simple
cputype=auto
cycles=25000

[render]
scaler=none
aspect=false

[dos]
umb=true
ems=true
xms=true

[mixer]
rate=44100
prebuffer=64

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
gus=false

[speaker]
pcspeaker=true
pcrate=44100
tandy=auto
tandyrate=44100
disney=true

[joystick]
joysticktype=auto

[serial]
serial1=dummy
serial2=dummy
serial3=disabled
serial4=disabled

[autoexec]
@echo off
echo.
echo ========================================
echo   DosKit - DOS Environment
echo ========================================
echo.
echo Type 'help' for DOS commands
echo Type 'dir' to list files
echo.
`;

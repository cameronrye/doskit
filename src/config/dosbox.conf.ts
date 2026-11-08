/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DOSBox configuration for interactive DOS prompt
 * Optimized for performance and high-quality audio
 * Based on research of DOSBox performance optimization techniques
 *
 * Audio Optimization Notes:
 * - Fixed CPU cycles (25000) instead of "max" to prevent audio stuttering/crackling
 * - Mixer prebuffer increased to 64 ms for smoother audio buffering
 *   (it goes up to 100: DOSBox lowers anything higher to 100)
 * - Sample rate 44100 Hz is standard for DOS audio (CD quality)
 * - No blocksize: the backend's mixer never reads it and always works in 2048-sample blocks
 *
 * Research Sources:
 * - DOSBox Wiki Performance Guide
 * - Community feedback on cycles=max causing audio issues
 * - DOSBox Staging audio optimization recommendations
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

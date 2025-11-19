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
 * - Mixer prebuffer increased to 64 for smoother audio buffering
 *   (can go up to 8192 max for extremely problematic cases)
 * - Blocksize 2048 provides good balance between latency and stability
 * - Sample rate 44100 Hz is standard for DOS audio (CD quality)
 *
 * Research Sources:
 * - DOSBox Wiki Performance Guide
 * - Community feedback on cycles=max causing audio issues
 * - DOSBox Staging audio optimization recommendations
 */

export const defaultDosboxConfig = `
[cpu]
core=dynamic
cputype=auto
cycles=25000

[video]
vmemsize=8

[render]
scaler=none
aspect=false

[dos]
ver=7.1
umb=true
ems=true
xms=true

[mixer]
rate=44100
blocksize=2048
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

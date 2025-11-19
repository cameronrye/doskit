/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DOSBox configuration for interactive DOS prompt
 * Optimized for performance and high-quality audio
 * Based on research of DOSBox performance optimization techniques
 */

export const defaultDosboxConfig = `
[cpu]
core=dynamic
cputype=auto
cycles=max

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
prebuffer=40

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

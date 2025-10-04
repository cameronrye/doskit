/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DOSBox configuration for interactive DOS prompt
 * This configuration boots to a DOS prompt with optimal settings
 * for keyboard input, audio output, and general compatibility
 */

export const defaultDosboxConfig = `
[cpu]
core=auto
cputype=auto
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
mount c .
c:
echo.
echo ========================================
echo   DosKit - DOS Environment
echo ========================================
echo.
echo Type 'help' for DOS commands
echo Type 'dir' to list files
echo.
`;



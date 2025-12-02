# Sceners Integration

This document tracks the integration of historical scene content from the [sceners](https://github.com/sceners) organization into DosKit.

## Overview

The sceners organization (curated by Defacto2) contains 157 repositories of historical scene content including:

- Classic DOS demos and intros
- Source code for demo effects
- Scene tools and utilities
- Educational resources

## Integrated Demos

### Successfully Added

| Demo             | ID                | Author              | Year  | Status     |
| ---------------- | ----------------- | ------------------- | ----- | ---------- |
| Squid BBS Intro  | `squid-bbstro`    | cld & The Doctor    | 1994  | ✅ Working |
| 3D Rotation Demo | `3drotate`        | Grumpy's Collection | 1990s | ✅ Working |
| Starfield Effect | `stars`           | Grumpy's Collection | 1990s | ✅ Working |
| Crystal Dream 2  | `crystal-dream-2` | Triton              | 1993  | ✅ Working |

### Demo Details

#### Squid BBS Intro (1994)

- **Size**: 1899 bytes
- **Features**: Character smoother, mini AdLib player, 8x16 custom charset
- **URL**: `https://doskit.net/?app=squid-bbstro`
- **Source**: https://github.com/sceners/squid-bbstro

#### 3D Rotation Demo

- **Features**: Real-time 3D object rotation in VGA mode
- **URL**: `https://doskit.net/?app=3drotate`
- **Source**: https://github.com/sceners/grumpys-source-pack-collection

#### Starfield Effect

- **Features**: Classic starfield effect simulating flying through space
- **URL**: `https://doskit.net/?app=stars`
- **Source**: https://github.com/sceners/grumpys-source-pack-collection

#### Crystal Dream 2 (1993)

- **Ranking**: 1st place at The Computer Crossroads 1993
- **Features**: 3D vector graphics, fractal zoomer, vector slime, raytraced scenes
- **Music**: Lizardking ("Trans Atlantic"), Vogue
- **URL**: `https://doskit.net/?app=crystal-dream-2`
- **Source**: https://files.scene.org/get/demos/groups/triton/cd2-trn.zip

### Not Compatible

- **Plasma Effect** - Blank screen, not compatible with js-dos
- **Fire/Flames Effect** - Runtime error, not compatible with js-dos

## Technical Implementation

### Files Created

**Config Files** (in `src/dos-apps/`):

- `squid-bbstro.config.ts`
- `3drotate.config.ts`
- `stars.config.ts`
- `crystal-dream-2.config.ts`

**Demo Bundles** (in `public/demos/`):

- `squid-bbstro.zip` (2.2 KB)
- `3drotate.zip` (3.0 KB)
- `stars.zip` (1.5 KB)
- `crystal-dream-2.zip` (2.0 MB)

### Integration Steps

For each demo:

1. **Prepare Files** - Copy executable and required data files, create ZIP bundle in `public/demos/`
2. **Create Config** - Add config file in `src/dos-apps/`, define DOSBox configuration
3. **Register App** - Add to app registry, update app selector UI
4. **Test** - Verify demo runs correctly, check audio/video output

## Available Repositories

### Cloned Repositories (in `~/sceners/`)

1. **squid-bbstro** - 1899-byte BBS intro with AdLib music
2. **grumpys-source-pack-collection** - 35+ MS-DOS demo/intro effects with source
3. **AMN-SRCE** - Amnesia VR by Renaissance (source only)
4. **x-mas_92-razor_1911** - Classic Christmas demo from Razor 1911
5. **x23_quantum** - Cracktro source code
6. **masm32-graphical-effects** - Huge collection of graphical effects
7. **writing-graphic-vga-intros-loaders-fred-nietzche** - VGA Intro Tutorial
8. **Code-Breaker** - Tools, trainers, and utilities (1992-1995)

### Ready to Integrate

**Grumpys Collection (Selected)**:

- `TEXTURE/TEXMAP.EXE` - Texture mapping
- `XLIB06/DEMO1.EXE` through `DEMO10.EXE` - XLIB demos

## Future Plans

- [ ] Add X-Mas'92 demo
- [ ] Add more grumpys effects (texture mapping, etc.)
- [ ] Create educational section with source code examples
- [ ] Add Code-Breaker tools
- [ ] Add thumbnails/screenshots for all demos

## Educational Value

These demos are excellent for:

- Learning classic demo scene programming techniques
- Understanding VGA graphics modes (Mode 13h, text mode)
- Studying size optimization (Squid is only 1899 bytes!)
- Exploring real-time graphics algorithms
- Historical preservation of demo scene culture

## Resources

- **Sceners Organization**: https://github.com/sceners
- **Defacto2**: https://defacto2.net
- **Scene.org**: Official demoscene file archive

## License Notes

- **Code-Breaker**: Public Domain (Unlicense)
- **Other repos**: Various scene/historical licenses
- **Usage**: Educational and historical preservation

## Credits

- **Sceners Organization**: https://github.com/sceners
- **Scene.org**: Official demoscene file archive
- **Defacto2**: Curation and preservation of scene content
- **Original Authors**: cld, The Doctor, Grumpy, Triton, and the demo scene community

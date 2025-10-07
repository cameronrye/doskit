# DOS Demos Directory

This directory contains DOS demo files that are bundled with the application to avoid CORS (Cross-Origin Resource Sharing) issues when loading from external sources.

## Files

### second-reality.zip (2.1 MB)

**Demo**: Second Reality by Future Crew (1993)

**Source**: https://archive.org/details/demoscene_SecondReality-FutureCrew

**Original URL**: https://archive.org/download/demoscene_SecondReality-FutureCrew/2nd_real.zip

**License**: Public Domain (released by Future Crew to celebrate the 20th anniversary)

**Contents**:
- `SECOND.EXE` (1.4 MB) - Main demo executable
- `REALITY.FC` (992 KB) - Demo data file
- `README.1ST` - Instructions and information
- `FCINFO10.TXT` - Future Crew information
- `FILE_ID.DIZ` - Demo description

**Description**: One of the most influential demos in PC demo scene history. Released in 1993, it showcased groundbreaking 3D graphics, music, and effects that pushed the limits of PC hardware at the time.

**Requirements**:
- CPU: 486 or better
- Memory: 4MB RAM
- Graphics: VGA
- Sound: Sound Blaster (optional)

### impulse-tracker.zip (1.0 MB)

**Application**: Impulse Tracker 2.14 by Jeffrey Lim (1997)

**Source**: https://archive.org/details/demoscene_ImpulseTracker214

**Original URL**: https://archive.org/download/demoscene_ImpulseTracker214/it214v3.zip

**License**: BSD-3-Clause (source code released in 2014)

**Contents**:
- `IT.EXE` (91 KB) - Main tracker executable
- 26 sound driver files (.DRV) for various sound cards
- Support for Sound Blaster, Gravis UltraSound, AWE32, and more

**Description**: A legendary music tracker for creating MOD/IT music. One of the most popular and influential trackers in the demoscene. Impulse Tracker introduced many advanced features like filters, New Note Actions (NNA), and created the .IT module format that became widely used in the scene.

**Requirements**:
- CPU: 486 or better
- Memory: 4MB RAM
- Graphics: VGA (text mode)
- Sound: Sound Blaster or compatible (optional)

**Additional Info**:
- Pouet.net: https://www.pouet.net/prod.php?which=13366
- GitHub (source code): https://github.com/jthlim/impulse-tracker

## Why Local Hosting?

While Archive.org is an excellent resource for preserving digital history, loading files directly from external sources can encounter CORS (Cross-Origin Resource Sharing) restrictions in modern browsers. By hosting the demo files locally:

1. ✅ **No CORS issues** - Files are served from the same origin as the application
2. ✅ **Faster loading** - No external network requests
3. ✅ **Offline support** - Works with PWA offline functionality
4. ✅ **Reliable** - No dependency on external services
5. ✅ **Better UX** - Instant loading without external delays

## Adding More Demos

To add more DOS demos to this directory:

1. **Find a demo** on Archive.org or other legal sources
2. **Download the ZIP file** to this directory
3. **Update the configuration** in `src/dos-apps/` to reference the local file
4. **Document it here** with source, license, and description

### Recommended Sources

- **Archive.org DOS Demos**: https://archive.org/details/msdos_demoscene
- **Pouet.net**: https://www.pouet.net/ (demo scene database)
- **Scene.org**: https://www.scene.org/ (demo scene file archive)

## Legal Considerations

All demos in this directory should be:
- Legally distributable (public domain, freeware, or with permission)
- Properly attributed to their creators
- Documented with their original source

Second Reality was explicitly released into the public domain by Future Crew in 2013 to celebrate the demo's 20th anniversary.

## File Size Considerations

- Keep individual demos under 10 MB for reasonable download times
- Consider the total size of the `public/demos/` directory
- Larger demos (>10 MB) should be loaded on-demand rather than bundled

## Build Process

Files in the `public/` directory are automatically copied to the build output by Vite. No special configuration is needed - just place the files here and reference them with paths like `/demos/filename.zip`.

## Maintenance

When updating demos:
1. Replace the ZIP file in this directory
2. Update the configuration in `src/dos-apps/`
3. Update this README with any changes
4. Test that the demo loads and runs correctly

---

**Last Updated**: 2025-10-06
**Maintained By**: DosKit Project


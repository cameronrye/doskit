# DOS Applications and Games

This directory is reserved for DOS applications, games, and programs that you want to run in the emulator.

## Purpose

Store your DOS programs here to keep them organized and easily accessible. The DosPlayer component can load programs from this directory.

## Supported Formats

- `.jsdos` - js-dos bundle format (recommended)
- `.zip` - ZIP archives containing DOS programs
- Individual DOS executables and data files

## Creating .jsdos Bundles

The `.jsdos` format is a bundle that contains your DOS program and its configuration. You can create bundles using:

1. **js-dos Studio**: https://studio.js-dos.com/
2. **Command line tools**: Use the js-dos CLI

Example structure:
```
game.jsdos
├── game.exe
├── game.dat
└── dosbox.conf
```

## Directory Structure

Organize your DOS programs by category:

```
src/dos-apps/
├── games/
│   ├── doom.jsdos
│   ├── prince.jsdos
│   └── commander-keen.jsdos
├── utilities/
│   ├── norton-commander.jsdos
│   └── qbasic.jsdos
└── demos/
    └── second-reality.jsdos
```

## Loading Programs

To load a DOS program in your application:

```typescript
import { DosPlayer } from './components/DosPlayer';

function App() {
  return (
    <DosPlayer
      bundleUrl="/src/dos-apps/games/doom.jsdos"
      // or
      // bundleUrl="https://example.com/path/to/game.jsdos"
    />
  );
}
```

## Legal Considerations

**Important**: Only include DOS programs that you have the legal right to distribute:

- Freeware and shareware programs
- Programs you own the rights to
- Open source DOS software
- Abandonware (check local laws)

Do not include:
- Copyrighted commercial software without permission
- Pirated games or applications

## Resources

- **Free DOS Games**: https://www.dosgames.com/
- **Abandonware**: https://www.myabandonware.com/
- **js-dos Bundles**: https://dos.zone/
- **FreeDOS**: https://www.freedos.org/


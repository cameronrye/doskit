/**
 * Compile-time checks of the js-dos types against js-dos 8.3.20. `tsc -b` type-checks this
 * file and fails if one of these expectations stops holding; at run time they do nothing.
 */

import { describe, it, expectTypeOf } from 'vitest';
import type {
  AsyncifyStats,
  CommandInterface,
  CommandInterfaceEvents,
  DosConfig,
  DosOptions,
  DosProps,
  FsNode,
  InitFs,
} from './js-dos';

type SoftKeyboardLayout = NonNullable<DosOptions['softKeyboardLayout']>;

/**
 * Every option js-dos 8.3.20 reads from what Dos() is given (in its src/main.tsx, store.ts
 * and window/dos/dos-window.tsx)
 */
type OptionJsDosReads =
  | 'url'
  | 'dosboxConf'
  | 'jsdosConf'
  | 'initFs'
  | 'backend'
  | 'backendLocked'
  | 'backendHardware'
  | 'workerThread'
  | 'pathPrefix'
  | 'pathSuffix'
  | 'theme'
  | 'lang'
  | 'background'
  | 'imageRendering'
  | 'renderBackend'
  | 'renderAspect'
  | 'fullScreen'
  | 'softFullscreen'
  | 'thinSidebar'
  | 'scaleControls'
  | 'mouseCapture'
  | 'mouseSensitivity'
  | 'noCursor'
  | 'softKeyboardLayout'
  | 'softKeyboardSymbols'
  | 'volume'
  | 'autoStart'
  | 'countDownStart'
  | 'autoSave'
  | 'kiosk'
  | 'noCloud'
  | 'key'
  | 'noNetworking'
  | 'ipx'
  | 'ipxBackend'
  | 'room'
  | 'onEvent';

/** Every member of the player js-dos 8.3.20's Dos() returns (at the end of its src/main.tsx) */
type MemberJsDosReturns =
  | 'getVersion'
  | 'getToken'
  | 'setTheme'
  | 'setLang'
  | 'setBackend'
  | 'setBackendLocked'
  | 'setWorkerThread'
  | 'setMouseCapture'
  | 'setIpx'
  | 'setIpxBackend'
  | 'setRoom'
  | 'setFrame'
  | 'setBackground'
  | 'setFullScreen'
  | 'setAutoStart'
  | 'setCountDownStart'
  | 'setAutoSave'
  | 'setKiosk'
  | 'setImageRendering'
  | 'setRenderBackend'
  | 'setRenderAspect'
  | 'setNoNetworking'
  | 'setNoCloud'
  | 'setPaused'
  | 'setScaleControls'
  | 'setMouseSensitivity'
  | 'setNoCursor'
  | 'setSoftKeyboardLayout'
  | 'setSoftKeyboardSymbols'
  | 'setVolume'
  | 'setKey'
  | 'setSoftFullscreen'
  | 'setThinSidebar'
  | 'save'
  | 'stop';

/**
 * Every member of the command interface of js-dos 8.3.20's emulators package
 * (CommandInterface in its src/emulators.ts)
 */
type MemberOfCommandInterface =
  | 'config'
  | 'height'
  | 'width'
  | 'soundFrequency'
  | 'screenshot'
  | 'pause'
  | 'resume'
  | 'mute'
  | 'unmute'
  | 'exit'
  | 'simulateKeyPress'
  | 'sendKeyEvent'
  | 'sendMouseMotion'
  | 'sendMouseRelativeMotion'
  | 'sendMouseButton'
  | 'sendMouseSync'
  | 'sendBackendEvent'
  | 'persist'
  | 'events'
  | 'networkConnect'
  | 'networkDisconnect'
  | 'asyncifyStats'
  | 'fsTree'
  | 'fsReadFile'
  | 'fsWriteFile'
  | 'fsDeleteFile';

/** Every event the command interface reports (CommandInterfaceEvents in src/emulators.ts) */
type EventOfCommandInterface =
  | 'onStdout'
  | 'onFrameSize'
  | 'onFrame'
  | 'onSoundPush'
  | 'onExit'
  | 'onMessage'
  | 'onNetworkConnected'
  | 'onNetworkDisconnected'
  | 'onUnload';

describe('js-dos types', () => {
  it('should declare only options js-dos reads', () => {
    expectTypeOf<keyof DosOptions>().toExtend<OptionJsDosReads>();
  });

  it('should declare only members of the player js-dos returns', () => {
    expectTypeOf<keyof DosProps>().toExtend<MemberJsDosReturns>();
  });

  describe('softKeyboardLayout', () => {
    it('should take rows of key names, or layouts of columns of rows', () => {
      expectTypeOf(['{esc} {f1} {f2}', 'q w e r t', '{up}']).toExtend<SoftKeyboardLayout>();
      expectTypeOf([
        [
          ['{esc} {f1}', 'q w e'],
          ['{up}', '{left} {down} {right}'],
        ],
      ]).toExtend<SoftKeyboardLayout>();
    });

    it('should refuse rows given as lists of key names, which js-dos reads as layouts', () => {
      expectTypeOf([
        ['{esc}', '{f1}'],
        ['q', 'w'],
      ]).not.toExtend<SoftKeyboardLayout>();
    });

    it('should be what setSoftKeyboardLayout takes', () => {
      expectTypeOf<DosProps['setSoftKeyboardLayout']>()
        .parameter(0)
        .toEqualTypeOf<SoftKeyboardLayout>();
    });
  });

  describe('initFs', () => {
    const archive = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
    const file = { path: 'README.TXT', contents: new TextEncoder().encode('Hello') };

    it('should take one bundle or a list of files', () => {
      expectTypeOf(archive).toExtend<InitFs>();
      expectTypeOf([file, file]).toExtend<InitFs>();
    });

    it('should take several bundles, which js-dos extracts in order', () => {
      const saved = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
      expectTypeOf([archive, saved]).toExtend<InitFs>();
    });

    it('should take a single file, or bundles and files in one list', () => {
      expectTypeOf(file).toExtend<InitFs>();
      expectTypeOf([archive, file]).toExtend<InitFs>();
    });

    it('should be what the initFs option takes', () => {
      expectTypeOf<DosOptions['initFs']>().toEqualTypeOf<InitFs | undefined>();
    });
  });

  // The emulators package, which emulators.js and the worker's wdosbox.js ship
  describe('command interface', () => {
    it('should declare every member and event of js-dos', () => {
      expectTypeOf<keyof CommandInterface>().toEqualTypeOf<MemberOfCommandInterface>();
      expectTypeOf<keyof CommandInterfaceEvents>().toEqualTypeOf<EventOfCommandInterface>();
    });

    it('should call back when the emulator unloads, and wait for the promise returned', () => {
      expectTypeOf<CommandInterfaceEvents['onUnload']>()
        .parameter(0)
        .toEqualTypeOf<() => Promise<void>>();
    });

    // NetworkType.NETWORK_DOSBOX_IPX, the only member of a numeric enum; js-dos passes 0
    it('should take IPX, 0, as the network to connect and disconnect', () => {
      expectTypeOf<CommandInterface['networkConnect']>().parameter(0).toEqualTypeOf<0>();
      expectTypeOf<CommandInterface['networkDisconnect']>().parameter(0).toEqualTypeOf<0>();
      expectTypeOf<CommandInterfaceEvents['onNetworkConnected']>()
        .parameter(0)
        .parameter(0)
        .toEqualTypeOf<0>();
    });

    it('should resolve fsDeleteFile to whether the file was deleted', () => {
      expectTypeOf<CommandInterface['fsDeleteFile']>().returns.toEqualTypeOf<Promise<boolean>>();
    });

    it('should resolve persist to a bundle, the changes of sockdrives, or null', () => {
      expectTypeOf<CommandInterface['persist']>().returns.resolves.toEqualTypeOf<
        Uint8Array | { drives: { url: string; persist: Uint8Array }[] } | null
      >();
    });

    it("should give the bundle's DOSBox config and its js-dos config", () => {
      expectTypeOf<CommandInterface['config']>().returns.resolves.toEqualTypeOf<DosConfig>();
      expectTypeOf<DosConfig>().toEqualTypeOf<{
        dosboxConf: string;
        jsdosConf: { version: string };
      }>();
    });

    // The worker builds the tree: a folder has nodes and no size, a file a size and no nodes
    it('should give each node of the file tree a size or nodes, the other null', () => {
      expectTypeOf<FsNode>().toEqualTypeOf<{
        name: string;
        size: number | null;
        nodes: FsNode[] | null;
      }>();
    });

    it("should give the worker's counters and each sockdrive's reads and writes as stats", () => {
      expectTypeOf<keyof AsyncifyStats>().toEqualTypeOf<
        | 'messageSent'
        | 'messageReceived'
        | 'messageFrame'
        | 'messageSound'
        | 'nonSkippableSleepCount'
        | 'sleepCount'
        | 'sleepTime'
        | 'cycles'
        | 'netSent'
        | 'netRecv'
        | 'driveIo'
      >();
      expectTypeOf<AsyncifyStats['cycles']>().toEqualTypeOf<number>();
      expectTypeOf<AsyncifyStats['driveIo']>().toEqualTypeOf<
        { url: string; preload: number; total: number; read: number; write: number }[]
      >();
    });
  });
});

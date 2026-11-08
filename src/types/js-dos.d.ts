/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * TypeScript type definitions for js-dos 8.3.20, checked against its code
 * (node_modules/js-dos/dist/js-dos.js and its source map) and, from CommandInterface on,
 * against the declarations of its emulators package (node_modules/js-dos/dist/emulators/
 * types). DosOptions declares only options Dos() reads, DosProps only members of the player
 * it returns, and CommandInterface every member of the emulators' command interface, which
 * js-dos.test.ts checks; of the options and the player, what DosKit does not use, such as
 * js-dos's IPX networking, is left out.
 */

export interface DosOptions {
  // Bundle/Configuration
  url?: string;
  dosboxConf?: string;
  jsdosConf?: Record<string, unknown>;
  initFs?: InitFs;

  // Emulator Settings
  backend?: 'dosbox' | 'dosboxX';
  backendLocked?: boolean;
  workerThread?: boolean;

  // Display Settings
  theme?: string;
  background?: string;
  imageRendering?: 'pixelated' | 'smooth';
  renderBackend?: 'webgl' | 'canvas';
  renderAspect?: 'AsIs' | '1/1' | '5/4' | '4/3' | '16/10' | '16/9' | 'Fit';
  fullScreen?: boolean;
  softFullscreen?: boolean;

  // Input Settings
  mouseCapture?: boolean;
  mouseSensitivity?: number;
  noCursor?: boolean;
  softKeyboardLayout?: SoftKeyboardLayout;
  softKeyboardSymbols?: SoftKeyboardSymbols;

  // Audio Settings
  volume?: number;

  // Behavior Settings
  autoStart?: boolean;
  countDownStart?: number;
  autoSave?: boolean;
  kiosk?: boolean;

  // UI Settings
  lang?: 'ru' | 'en';
  thinSidebar?: boolean;
  scaleControls?: number;

  // Cloud/Network Settings
  noCloud?: boolean;
  key?: string;

  // Advanced
  pathPrefix?: string;
  pathSuffix?: string;
  backendHardware?: (backend: string) => Promise<string | null>;
  onEvent?: (event: DosEvent, arg?: unknown) => void;
}

export type DosEvent = 'emu-ready' | 'ci-ready' | 'bnd-play' | 'open-key' | 'fullscreen-change';

/**
 * The on-screen keyboard that the keyboard button in the js-dos sidebar opens: a list of
 * rows, or a list of layouts, each a list of columns of rows. js-dos reads a list whose
 * first element is an array as layouts, so a list of lists of key names fails to render.
 *
 * A row is a string of key names separated by spaces, and an empty row leaves a gap. A key
 * is a letter or digit, one of , . ' : ; - = + ( ) [ ] { }, or a name in braces: {esc},
 * {tab}, {lock}, {shift}, {ctrl}, {alt}, {space}, {enter}, {bksp}, {del}, {up}, {down},
 * {left}, {right}, {home}, {end}, {pgup}, {pgdown}, {f1} to {f12} or {kp0} to {kp9}. Any
 * other key, / and \ among them, presses nothing. {layout} switches to the next layout and
 * {symbols} to the next set of labels.
 */
export type SoftKeyboardLayout = string[] | string[][][];

/**
 * Labels for the on-screen keyboard's keys by key name, such as `{ '{up}': '↑' }`: one set,
 * or several that {symbols} switches between. A key without a label shows its name,
 * capitalised and without braces ({esc} shows Esc).
 */
export type SoftKeyboardSymbols = Record<string, string>[];

/** A file to write into the DOS file system, by its path there */
export interface InitFileEntry {
  path: string;
  contents: Uint8Array;
}

/** A bundle (a ZIP archive, such as a .jsdos file), or a single file */
export type InitFsEntry = Uint8Array | InitFileEntry;

/**
 * What js-dos puts in the DOS file system before DOS starts: an entry or a list of them.
 * The emulator writes the files first, then extracts the bundles in list order, so a
 * bundle's files replace those of the bundles before it, and any file given at the same
 * path. Changes packed by ci.persist() come back when they follow the archive they were
 * made in.
 */
export type InitFs = InitFsEntry | InitFsEntry[];

export interface DosProps {
  // Version Information
  getVersion(): [string, string];
  getToken(): string | null;

  // Configuration Methods
  setTheme(theme: string): void;
  setLang(lang: 'ru' | 'en'): void;
  setBackend(backend: 'dosbox' | 'dosboxX'): void;
  setBackendLocked(locked: boolean): void;
  setWorkerThread(workerThread: boolean): void;

  // Display Methods
  setBackground(background: string | null): void;
  setFullScreen(fullScreen: boolean): void;
  setImageRendering(rendering: 'pixelated' | 'smooth'): void;
  setRenderBackend(backend: 'webgl' | 'canvas'): void;
  setRenderAspect(aspect: DosOptions['renderAspect']): void;
  setSoftFullscreen(softFullscreen: boolean): void;
  setThinSidebar(thinSidebar: boolean): void;

  // Input Methods
  setMouseCapture(capture: boolean): void;
  setMouseSensitivity(sensitivity: number): void;
  setNoCursor(noCursor: boolean): void;
  setSoftKeyboardLayout(layout: SoftKeyboardLayout): void;
  setSoftKeyboardSymbols(symbols: SoftKeyboardSymbols): void;

  // Audio Methods
  setVolume(volume: number): void;

  // Behavior Methods
  setAutoStart(autoStart: boolean): void;
  setCountDownStart(countDownStart: number): void;
  setAutoSave(autoSave: boolean): void;
  setKiosk(kiosk: boolean): void;
  setPaused(paused: boolean): void;

  // UI Methods
  setScaleControls(scale: number): void;

  // Cloud/Network Methods
  setNoCloud(noCloud: boolean): void;
  setKey(key: string | null): void;

  // Lifecycle Methods
  save(): Promise<boolean>;
  stop(): Promise<void>;
}

export interface CommandInterface {
  // Configuration
  config(): Promise<DosConfig>;

  // Display Information
  height(): number;
  width(): number;
  soundFrequency(): number;

  // Screen Capture
  screenshot(): Promise<ImageData>;

  // Emulation Control
  pause(): void;
  resume(): void;
  mute(): void;
  unmute(): void;
  exit(): Promise<void>;

  // Input Simulation
  simulateKeyPress(...keyCodes: number[]): void;
  sendKeyEvent(keyCode: number, pressed: boolean): void;
  sendMouseMotion(x: number, y: number): void;
  sendMouseRelativeMotion(x: number, y: number): void;
  sendMouseButton(button: number, pressed: boolean): void;
  sendMouseSync(): void;
  sendBackendEvent(event: Record<string, unknown>): void;

  // File System Operations
  fsTree(): Promise<FsNode>;
  fsReadFile(file: string): Promise<Uint8Array>;
  fsWriteFile(file: string, contents: ReadableStream<Uint8Array> | Uint8Array): Promise<void>;
  /** Resolves to whether the file was deleted */
  fsDeleteFile(file: string): Promise<boolean>;

  // State Management
  /**
   * Pack the changes made to the DOS file system, or with onlyChanges false all of it, into
   * a bundle; null when the emulator packs none. With onlyChanges, the default, a bundle
   * that mounts sockdrives gets the changes of each drive instead.
   */
  persist(onlyChanges?: boolean): Promise<Uint8Array | PersistedSockdrives | null>;

  // Network
  networkConnect(networkType: NetworkType, address: string): Promise<void>;
  networkDisconnect(networkType: NetworkType): Promise<void>;

  // Events
  events(): CommandInterfaceEvents;

  // Performance
  asyncifyStats(): Promise<AsyncifyStats>;
}

export interface CommandInterfaceEvents {
  onStdout(consumer: (message: string) => void): void;
  onFrameSize(consumer: (width: number, height: number) => void): void;
  onFrame(consumer: (rgb: Uint8Array | null, rgba: Uint8Array | null) => void): void;
  onSoundPush(consumer: (samples: Float32Array) => void): void;
  onExit(consumer: () => void): void;
  onMessage(consumer: (msgType: MessageType, ...args: unknown[]) => void): void;
  onNetworkConnected(consumer: (networkType: NetworkType, address: string) => void): void;
  onNetworkDisconnected(consumer: (networkType: NetworkType) => void): void;
  /**
   * Called as DOS unloads, which waits for the promises the consumers return. Only the
   * DOSBox-X backend reports it; the default backend, which DosKit runs, never does.
   */
  onUnload(consumer: () => Promise<void>): void;
}

/** A bundle's configuration: its dosbox.conf, and its .jsdos/jsdos.json */
export interface DosConfig {
  dosboxConf: string;
  jsdosConf: { version: string };
}

/** A file or folder in the tree fsTree() gives: a file has a size, a folder its nodes */
export interface FsNode {
  name: string;
  size: number | null;
  nodes: FsNode[] | null;
}

/** What persist() packs, with onlyChanges, for a bundle that mounts sockdrives */
export interface PersistedSockdrives {
  drives: { url: string; persist: Uint8Array }[];
}

/**
 * The network to connect DOSBox to: NetworkType.NETWORK_DOSBOX_IPX, 0, the only member of
 * a numeric enum in js-dos's emulators package. js-dos itself passes 0.
 */
export type NetworkType = 0;
export type MessageType = string;

/** The emulator's counters, and the reads and writes of each sockdrive */
export interface AsyncifyStats {
  messageSent: number;
  messageReceived: number;
  messageFrame: number;
  messageSound: number;
  nonSkippableSleepCount: number;
  sleepCount: number;
  sleepTime: number;
  cycles: number;
  netSent: number;
  netRecv: number;
  driveIo: { url: string; preload: number; total: number; read: number; write: number }[];
}

/** js-dos's Dos(): renders a player into the element, starts it and returns it at once */
export type DosFn = (element: HTMLDivElement, options?: Partial<DosOptions>) => DosProps;

// Global Window interface declaration for js-dos
declare global {
  interface Window {
    /**
     * js-dos's Dos(), which js-dos.js defines. The page runs without it when that script
     * fails to download or is blocked.
     */
    Dos?: DosFn;
    /**
     * js-dos's emulators package, which emulators.js defines when it runs. DosKit only
     * checks that it is there.
     */
    emulators?: unknown;
  }
}

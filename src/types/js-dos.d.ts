/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * TypeScript type definitions for js-dos 8.3.20, checked against its code
 * (node_modules/js-dos/dist/js-dos.js and its source map). DosOptions declares only options
 * Dos() reads and DosProps only members of the player it returns, which js-dos.test.ts
 * checks; what DosKit does not use, such as js-dos's IPX networking, is left out.
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

export interface InitFileEntry {
  path: string;
  contents: Uint8Array;
}

export type InitFs = Array<InitFileEntry> | Uint8Array;

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
  fsDeleteFile(file: string): Promise<void>;

  // State Management
  persist(onlyChanges?: boolean): Promise<Uint8Array | null>;

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
}

export interface DosConfig {
  [key: string]: unknown;
}

export interface FsNode {
  name: string;
  size: number;
  nodes?: FsNode[];
}

export type NetworkType = 'ipx';
export type MessageType = string;

export interface AsyncifyStats {
  [key: string]: number | string | boolean;
}

export function Dos(element: HTMLDivElement, options?: Partial<DosOptions>): DosProps;

// Global Window interface declaration for js-dos
declare global {
  interface Window {
    Dos: typeof Dos;
  }
}

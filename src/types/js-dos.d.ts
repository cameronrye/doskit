/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * TypeScript type definitions for js-dos v8.3.20
 * Based on the official js-dos API reference
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
    offscreenCanvas?: boolean;

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
    softKeyboardLayout?: string[][] | string[][][];
    softKeyboardSymbols?: { [key: string]: string }[];

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
    sockdrivePreload?: 'none' | 'all' | 'default';
    startIpxServer?: boolean;
    connectIpxAddress?: string;

    // Advanced
    pathPrefix?: string;
    pathSuffix?: string;
    backendHardware?: (backend: string) => Promise<string | null>;
    onEvent?: (event: DosEvent, arg?: unknown) => void;
}

export type DosEvent =
  | 'emu-ready'
  | 'ci-ready'
  | 'bnd-play'
  | 'open-key'
  | 'fullscreen-change';

export type InitFs =
  | Array<{ path: string; contents: Uint8Array }>
  | Uint8Array;

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
    setOffscreenCanvas(offscreenCanvas: boolean): void;

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
    setSoftKeyboardLayout(layout: string[][] | string[][][]): void;
    setSoftKeyboardSymbols(symbols: { [key: string]: string }[]): void;

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
    fsWriteFile(
      file: string,
      contents: ReadableStream<Uint8Array> | Uint8Array
    ): Promise<void>;
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
  onFrame(
    consumer: (rgb: Uint8Array | null, rgba: Uint8Array | null) => void
  ): void;
  onSoundPush(consumer: (samples: Float32Array) => void): void;
  onExit(consumer: () => void): void;
  onMessage(consumer: (msgType: MessageType, ...args: unknown[]) => void): void;
  onNetworkConnected(
    consumer: (networkType: NetworkType, address: string) => void
  ): void;
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

export function Dos(
  element: HTMLDivElement,
  options?: Partial<DosOptions>
): DosProps;

// Also declare the module for js-dos imports
declare module 'js-dos' {
  export * from '../types/js-dos';
}


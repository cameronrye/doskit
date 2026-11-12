/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DOSBox Configuration Builder
 * Provides a fluent API for building DOSBox configuration strings
 * Reduces duplication across dos-apps config files
 *
 * The settings and values here are the ones the default js-dos backend ("dosbox",
 * wdosbox.wasm, chosen in src/config/jsdos.config.ts) applies. DOSBox drops sections and
 * properties it does not have, and resets values it does not accept to the default,
 * without a warning, so a setting this backend lacks would only make a config claim
 * something that never runs.
 */

/** The whole numbers from 0 to Max */
export type UpTo<Max extends number, Counted extends number[] = []> = Counted['length'] extends Max
  ? Counted[number] | Max
  : UpTo<Max, [...Counted, Counted['length']]>;

/** The [dosbox] section: the emulated machine and its memory */
export interface MachineConfig {
  /**
   * `svga_s3`, the default, applies the VGA palette once a frame; `vgaonly` draws line by
   * line, as a real VGA does, for programs that change the palette while a frame is drawn
   * (raster bars, split-screen palettes). `vgaonly` renders through 16-bit colour, so red and
   * blue get half the steps, and costs about 10% more CPU.
   */
  machine?: 'svga_s3' | 'vgaonly';
  /** Megabytes of memory, up to 63; DOSBox's default is 16 */
  memsize?: UpTo<63>;
}

export interface CPUConfig {
  /** The backend has no dynamic core */
  core?: 'auto' | 'normal' | 'simple';
  /**
   * The backend has no plain 486, Pentium or Pentium MMX type.
   * `386_prefetch` needs core `normal` or `auto`; with `simple` the backend stops.
   */
  cputype?: 'auto' | '386' | '386_slow' | '486_slow' | 'pentium_slow' | '386_prefetch';
  cycles?: number | 'auto' | 'max';
}

export interface RenderConfig {
  /**
   * Only `none`, the backend's one scaler. It resets any other value, `normal2x` included, to
   * the setting's default, `normal2x`, which `config -get render scaler` then reports, but
   * frames reach js-dos at the program's own resolution either way: `none` is the value that
   * says so.
   */
  scaler?: 'none';
  aspect?: boolean;
}

/**
 * The backend has no `ver` setting: DOS reports version 5.00. To report another
 * version, run `VER SET 7 10` (major, minor) in the autoexec.
 */
export interface DOSConfig {
  umb?: boolean;
  ems?: boolean;
  xms?: boolean;
}

/**
 * The sample rates, in Hz, the backend has for the mixer, the OPL, the PC speaker and the
 * Tandy sound. It resets any other rate to 44100.
 */
export type SampleRate = 8000 | 11025 | 16000 | 22050 | 32000 | 44100 | 48000 | 49716;

/**
 * There is no `blocksize`: the backend's mixer never reads it, always works in 2048-sample
 * blocks, and hands the page 512 to 2048 samples at a time.
 */
export interface MixerConfig {
  nosound?: boolean;
  rate?: SampleRate;
  /**
   * How many milliseconds of audio the mixer keeps on top of each block, from 0 to 100:
   * DOSBox lowers anything above 100 to 100. Left out, it is 40.
   */
  prebuffer?: UpTo<100>;
}

export interface SoundBlasterConfig {
  sbtype?: 'none' | 'sb1' | 'sb2' | 'sbpro1' | 'sbpro2' | 'sb16';
  /** I/O port, read as hex: 220 means 220h */
  sbbase?: number;
  irq?: number;
  dma?: number;
  hdma?: number;
  sbmixer?: boolean;
  oplmode?: 'auto' | 'cms' | 'opl2' | 'dualopl2' | 'opl3' | 'none';
  oplemu?: 'default' | 'compat' | 'fast';
  oplrate?: SampleRate;
}

export interface GUSConfig {
  gus?: boolean;
  /** I/O port, read as hex: 240 means 240h */
  gusbase?: number;
  gusirq?: number;
  gusdma?: number;
  ultradir?: string;
}

export interface SpeakerConfig {
  pcspeaker?: boolean;
  pcrate?: SampleRate;
  tandy?: 'auto' | 'on' | 'off';
  tandyrate?: SampleRate;
  disney?: boolean;
}

export interface JoystickConfig {
  joysticktype?: 'auto' | 'none' | '2axis' | '4axis' | 'fcs' | 'ch';
}

export interface SerialConfig {
  serial1?: string;
  serial2?: string;
  serial3?: string;
  serial4?: string;
}

/**
 * DOSBox Configuration Builder
 * Provides a fluent API for building DOSBox configuration strings
 */
export class DOSBoxConfigBuilder {
  private machine: MachineConfig = {};
  private cpu: CPUConfig = {};
  private render: RenderConfig = {};
  private dos: DOSConfig = {};
  private mixer: MixerConfig = {};
  private soundBlaster: SoundBlasterConfig = {};
  private gus: GUSConfig = {};
  private speaker: SpeakerConfig = {};
  private joystick: JoystickConfig = {};
  private serial: SerialConfig = {};
  private autoexec: string[] = [];

  /**
   * Set the machine: its video adapter and its memory
   * @param config - [dosbox] options (machine, memsize)
   * @returns This builder instance for method chaining
   */
  setMachine(config: MachineConfig): this {
    this.machine = { ...this.machine, ...config };
    return this;
  }

  /**
   * Set CPU configuration
   * @param config - CPU configuration options (core, cputype, cycles)
   * @returns This builder instance for method chaining
   */
  setCPU(config: CPUConfig): this {
    this.cpu = { ...this.cpu, ...config };
    return this;
  }

  /**
   * Set render configuration
   * @param config - Render configuration options (scaler, aspect)
   * @returns This builder instance for method chaining
   */
  setRender(config: RenderConfig): this {
    this.render = { ...this.render, ...config };
    return this;
  }

  /**
   * Set DOS configuration
   * @param config - DOS configuration options (umb, ems, xms)
   * @returns This builder instance for method chaining
   */
  setDOS(config: DOSConfig): this {
    this.dos = { ...this.dos, ...config };
    return this;
  }

  /**
   * Set mixer configuration
   * @param config - Mixer configuration options (nosound, rate, prebuffer)
   * @returns This builder instance for method chaining
   */
  setMixer(config: MixerConfig): this {
    this.mixer = { ...this.mixer, ...config };
    return this;
  }

  /**
   * Set Sound Blaster configuration
   * @param config - Sound Blaster configuration options (sbtype, sbbase, irq, dma, etc.)
   * @returns This builder instance for method chaining
   */
  setSoundBlaster(config: SoundBlasterConfig): this {
    this.soundBlaster = { ...this.soundBlaster, ...config };
    return this;
  }

  /**
   * Set Gravis UltraSound configuration
   * @param config - GUS configuration options (gus, gusbase, gusirq, etc.)
   * @returns This builder instance for method chaining
   */
  setGUS(config: GUSConfig): this {
    this.gus = { ...this.gus, ...config };
    return this;
  }

  /**
   * Set PC speaker configuration
   * @param config - Speaker configuration options (pcspeaker, pcrate, tandy, etc.)
   * @returns This builder instance for method chaining
   */
  setSpeaker(config: SpeakerConfig): this {
    this.speaker = { ...this.speaker, ...config };
    return this;
  }

  /**
   * Set joystick configuration
   * @param config - Joystick configuration options (joysticktype)
   * @returns This builder instance for method chaining
   */
  setJoystick(config: JoystickConfig): this {
    this.joystick = { ...this.joystick, ...config };
    return this;
  }

  /**
   * Set serial port configuration
   * @param config - Serial port configuration options (serial1-4)
   * @returns This builder instance for method chaining
   */
  setSerial(config: SerialConfig): this {
    this.serial = { ...this.serial, ...config };
    return this;
  }

  /**
   * Add autoexec commands to be executed when DOSBox starts
   * @param commands - One or more command strings to add to the autoexec section
   * @returns This builder instance for method chaining
   */
  addAutoexec(...commands: string[]): this {
    this.autoexec.push(...commands);
    return this;
  }

  /**
   * Build a configuration section from a config object
   * @param name - The section name (e.g., 'cpu', 'dos')
   * @param config - The configuration object with key-value pairs
   * @returns The formatted configuration section string, or empty string if no entries
   * @private
   */
  private buildSection(name: string, config: object): string {
    const entries = Object.entries(config)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    return entries ? `[${name}]\n${entries}\n` : '';
  }

  /**
   * Build the complete DOSBox configuration string
   * @returns The complete DOSBox configuration as a string in INI format
   */
  build(): string {
    const sections: string[] = [];

    if (Object.keys(this.machine).length > 0) {
      sections.push(this.buildSection('dosbox', this.machine));
    }

    if (Object.keys(this.cpu).length > 0) {
      sections.push(this.buildSection('cpu', this.cpu));
    }

    if (Object.keys(this.render).length > 0) {
      sections.push(this.buildSection('render', this.render));
    }

    if (Object.keys(this.dos).length > 0) {
      sections.push(this.buildSection('dos', this.dos));
    }

    if (Object.keys(this.mixer).length > 0) {
      sections.push(this.buildSection('mixer', this.mixer));
    }

    if (Object.keys(this.soundBlaster).length > 0) {
      sections.push(this.buildSection('sblaster', this.soundBlaster));
    }

    if (Object.keys(this.gus).length > 0) {
      sections.push(this.buildSection('gus', this.gus));
    }

    if (Object.keys(this.speaker).length > 0) {
      sections.push(this.buildSection('speaker', this.speaker));
    }

    if (Object.keys(this.joystick).length > 0) {
      sections.push(this.buildSection('joystick', this.joystick));
    }

    if (Object.keys(this.serial).length > 0) {
      sections.push(this.buildSection('serial', this.serial));
    }

    if (this.autoexec.length > 0) {
      sections.push(`[autoexec]\n${this.autoexec.join('\n')}\n`);
    }

    return sections.join('\n');
  }
}

/**
 * Create a new DOSBox configuration builder
 * @returns A new instance of DOSBoxConfigBuilder
 * @example
 * ```typescript
 * const config = createDOSBoxConfig()
 *   .setCPU({ core: 'auto', cycles: 'max' })
 *   .setDOS({ ems: true })
 *   .build();
 * ```
 */
export function createDOSBoxConfig(): DOSBoxConfigBuilder {
  return new DOSBoxConfigBuilder();
}

/**
 * Preset configurations for common use cases
 *
 * Every preset runs on the simple CPU core with the auto CPU type at a fixed number of cycles
 * per millisecond, and leaves memory at DOSBox's default of 16 MB. Its mixer runs at 44100 Hz
 * and keeps 64 ms of audio on top of each 2048-sample block, where DOSBox's default is 40. It
 * has a Sound Blaster 16 and the PC speaker, and no Gravis UltraSound.
 */
export const presets = {
  /**
   * Configuration for music trackers, such as Impulse Tracker
   *
   * - Fixed cycles (18000)
   * - EMS and XMS, where trackers keep their samples, out of DOSBox's default 16 MB of RAM
   */
  musicTracker: (): DOSBoxConfigBuilder =>
    createDOSBoxConfig()
      .setCPU({ core: 'simple', cputype: 'auto', cycles: 18000 })
      .setDOS({ umb: true, ems: true, xms: true })
      .setMixer({ nosound: false, rate: 44100, prebuffer: 64 })
      .setSoundBlaster({
        sbtype: 'sb16',
        sbbase: 220,
        irq: 7,
        dma: 1,
        hdma: 5,
        sbmixer: true,
        oplmode: 'auto',
        oplemu: 'default',
        oplrate: 44100,
      })
      .setGUS({ gus: false })
      .setSpeaker({
        pcspeaker: true,
        pcrate: 44100,
        tandy: 'auto',
        tandyrate: 44100,
        disney: true,
      })
      .setJoystick({ joysticktype: 'none' }),

  /**
   * Configuration for demos and intros
   *
   * - Fixed cycles (30000): src/dos-apps/README.md says when a program needs 'max' instead
   * - EMS, XMS and UMB
   */
  demo: (): DOSBoxConfigBuilder =>
    createDOSBoxConfig()
      .setCPU({ core: 'simple', cputype: 'auto', cycles: 30000 })
      .setDOS({ umb: true, ems: true, xms: true })
      .setMixer({ rate: 44100, prebuffer: 64 })
      .setSoundBlaster({
        sbtype: 'sb16',
        sbbase: 220,
        irq: 7,
        dma: 1,
        hdma: 5,
        sbmixer: true,
        oplmode: 'auto',
        oplemu: 'default',
        oplrate: 44100,
      })
      .setGUS({ gus: false })
      .setSpeaker({
        pcspeaker: true,
        pcrate: 44100,
        tandy: 'auto',
        tandyrate: 44100,
        disney: true,
      })
      .setJoystick({ joysticktype: 'auto' }),
};

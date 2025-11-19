/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * DOSBox Configuration Builder
 * Provides a fluent API for building DOSBox configuration strings
 * Reduces duplication across dos-apps config files
 */

export interface CPUConfig {
  core?: "auto" | "dynamic" | "normal" | "simple";
  cputype?: "auto" | "386" | "486" | "pentium" | "pentium_mmx";
  cycles?: number | "auto" | "max";
}

export interface VideoConfig {
  vmemsize?: number;
}

export interface RenderConfig {
  scaler?:
    | "none"
    | "normal2x"
    | "normal3x"
    | "hardware2x"
    | "advmame2x"
    | "advmame3x";
  aspect?: boolean;
}

export interface DOSConfig {
  ver?: string;
  umb?: boolean;
  ems?: boolean;
  xms?: boolean;
}

export interface MemoryConfig {
  memsize?: number;
}

export interface MixerConfig {
  nosound?: boolean;
  rate?: number;
  blocksize?: number;
  prebuffer?: number;
}

export interface SoundBlasterConfig {
  sbtype?: "none" | "sb1" | "sb2" | "sbpro1" | "sbpro2" | "sb16";
  sbbase?: number;
  irq?: number;
  dma?: number;
  hdma?: number;
  sbmixer?: boolean;
  oplmode?: "auto" | "cms" | "opl2" | "dualopl2" | "opl3" | "none";
  oplemu?: "default" | "compat" | "fast";
  oplrate?: number;
}

export interface GUSConfig {
  gus?: boolean;
  gusrate?: number;
  gusbase?: number;
  gusirq?: number;
  gusdma?: number;
  ultradir?: string;
}

export interface SpeakerConfig {
  pcspeaker?: boolean;
  pcrate?: number;
  tandy?: "auto" | "on" | "off";
  tandyrate?: number;
  disney?: boolean;
}

export interface JoystickConfig {
  joysticktype?: "auto" | "none" | "2axis" | "4axis" | "fcs" | "ch";
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
  private cpu: CPUConfig = {};
  private video: VideoConfig = {};
  private render: RenderConfig = {};
  private dos: DOSConfig = {};
  private memory: MemoryConfig = {};
  private mixer: MixerConfig = {};
  private soundBlaster: SoundBlasterConfig = {};
  private gus: GUSConfig = {};
  private speaker: SpeakerConfig = {};
  private joystick: JoystickConfig = {};
  private serial: SerialConfig = {};
  private autoexec: string[] = [];

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
   * Set video configuration
   * @param config - Video configuration options (vmemsize)
   * @returns This builder instance for method chaining
   */
  setVideo(config: VideoConfig): this {
    this.video = { ...this.video, ...config };
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
   * @param config - DOS configuration options (ver, umb, ems, xms)
   * @returns This builder instance for method chaining
   */
  setDOS(config: DOSConfig): this {
    this.dos = { ...this.dos, ...config };
    return this;
  }

  /**
   * Set memory configuration
   * @param config - Memory configuration options (memsize)
   * @returns This builder instance for method chaining
   */
  setMemory(config: MemoryConfig): this {
    this.memory = { ...this.memory, ...config };
    return this;
  }

  /**
   * Set mixer configuration
   * @param config - Mixer configuration options (nosound, rate, blocksize, prebuffer)
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
   * @param config - GUS configuration options (gus, gusrate, gusbase, etc.)
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
   * @param name - The section name (e.g., 'cpu', 'video')
   * @param config - The configuration object with key-value pairs
   * @returns The formatted configuration section string, or empty string if no entries
   * @private
   */
  private buildSection(name: string, config: object): string {
    const entries = Object.entries(config)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    return entries ? `[${name}]\n${entries}\n` : "";
  }

  /**
   * Build the complete DOSBox configuration string
   * @returns The complete DOSBox configuration as a string in INI format
   */
  build(): string {
    const sections: string[] = [];

    if (Object.keys(this.cpu).length > 0) {
      sections.push(this.buildSection("cpu", this.cpu));
    }

    if (Object.keys(this.video).length > 0) {
      sections.push(this.buildSection("video", this.video));
    }

    if (Object.keys(this.render).length > 0) {
      sections.push(this.buildSection("render", this.render));
    }

    if (Object.keys(this.dos).length > 0) {
      sections.push(this.buildSection("dos", this.dos));
    }

    if (Object.keys(this.memory).length > 0) {
      sections.push(this.buildSection("memory", this.memory));
    }

    if (Object.keys(this.mixer).length > 0) {
      sections.push(this.buildSection("mixer", this.mixer));
    }

    if (Object.keys(this.soundBlaster).length > 0) {
      sections.push(this.buildSection("sblaster", this.soundBlaster));
    }

    if (Object.keys(this.gus).length > 0) {
      sections.push(this.buildSection("gus", this.gus));
    }

    if (Object.keys(this.speaker).length > 0) {
      sections.push(this.buildSection("speaker", this.speaker));
    }

    if (Object.keys(this.joystick).length > 0) {
      sections.push(this.buildSection("joystick", this.joystick));
    }

    if (Object.keys(this.serial).length > 0) {
      sections.push(this.buildSection("serial", this.serial));
    }

    if (this.autoexec.length > 0) {
      sections.push(`[autoexec]\n${this.autoexec.join("\n")}\n`);
    }

    return sections.join("\n");
  }
}

/**
 * Create a new DOSBox configuration builder
 * @returns A new instance of DOSBoxConfigBuilder
 * @example
 * ```typescript
 * const config = createDOSBoxConfig()
 *   .setCPU({ core: 'auto', cycles: 'max' })
 *   .setVideo({ vmemsize: 8 })
 *   .build();
 * ```
 */
export function createDOSBoxConfig(): DOSBoxConfigBuilder {
  return new DOSBoxConfigBuilder();
}

/**
 * Preset configurations for common use cases
 * Optimized for performance and audio quality based on research
 *
 * Audio Optimization Research:
 * - Fixed CPU cycles prevent audio stuttering (cycles=max causes issues)
 * - Larger prebuffer values (50+) reduce audio crackling
 * - Blocksize 2048 balances latency and stability
 * - Sample rate 44100 Hz is standard for DOS audio
 *
 * Sources:
 * - DOSBox Wiki Performance Guide
 * - VOGONS forum discussions on audio optimization
 * - DOSBox Staging audio recommendations
 */
export const presets = {
  /**
   * Default configuration for general DOS applications
   * Optimized for performance with high-quality audio
   * Uses fixed cycles (25000) to prevent audio stuttering
   */
  default: (): DOSBoxConfigBuilder =>
    createDOSBoxConfig()
      .setCPU({ core: "dynamic", cputype: "auto", cycles: 25000 })
      .setVideo({ vmemsize: 8 })
      .setRender({ scaler: "none", aspect: false })
      .setDOS({ ver: "7.1", umb: true, ems: true, xms: true })
      .setMixer({ rate: 44100, blocksize: 2048, prebuffer: 64 })
      .setSoundBlaster({
        sbtype: "sb16",
        sbbase: 220,
        irq: 7,
        dma: 1,
        hdma: 5,
        sbmixer: true,
        oplmode: "auto",
        oplemu: "default",
        oplrate: 44100,
      })
      .setGUS({ gus: false })
      .setSpeaker({
        pcspeaker: true,
        pcrate: 44100,
        tandy: "auto",
        tandyrate: 44100,
        disney: true,
      })
      .setJoystick({ joysticktype: "auto" })
      .setSerial({
        serial1: "dummy",
        serial2: "dummy",
        serial3: "disabled",
        serial4: "disabled",
      }),

  /**
   * Configuration optimized for music trackers and MOD playback
   * (Impulse Tracker, FastTracker, ScreamTracker, etc.)
   *
   * Optimizations:
   * - Fixed cycles (18000) for stable audio timing
   * - Pentium CPU for better instruction set support
   * - Increased prebuffer (64) for smooth MOD playback (max 8192 if needed)
   * - Blocksize 2048 for optimal buffering
   * - 16MB RAM for loading large samples
   */
  musicTracker: (): DOSBoxConfigBuilder =>
    createDOSBoxConfig()
      .setCPU({ core: "dynamic", cputype: "pentium", cycles: 18000 })
      .setVideo({ vmemsize: 2 })
      .setDOS({ ver: "7.1", umb: true, ems: true, xms: true })
      .setMemory({ memsize: 16 })
      .setMixer({ nosound: false, rate: 44100, blocksize: 2048, prebuffer: 64 })
      .setSoundBlaster({
        sbtype: "sb16",
        sbbase: 220,
        irq: 7,
        dma: 1,
        hdma: 5,
        sbmixer: true,
        oplmode: "auto",
        oplemu: "default",
        oplrate: 44100,
      })
      .setGUS({ gus: false })
      .setSpeaker({
        pcspeaker: true,
        pcrate: 44100,
        tandy: "auto",
        tandyrate: 44100,
        disney: true,
      })
      .setJoystick({ joysticktype: "none" }),

  /**
   * Configuration optimized for demos and graphics applications
   * Demos often have synchronized audio/video, so stable timing is critical
   * Uses fixed cycles (30000) for consistent performance
   */
  demo: (): DOSBoxConfigBuilder =>
    createDOSBoxConfig()
      .setCPU({ core: "dynamic", cputype: "auto", cycles: 30000 })
      .setVideo({ vmemsize: 8 })
      .setDOS({ ver: "7.1", umb: true, ems: true, xms: true })
      .setMixer({ rate: 44100, blocksize: 2048, prebuffer: 64 })
      .setSoundBlaster({
        sbtype: "sb16",
        sbbase: 220,
        irq: 7,
        dma: 1,
        hdma: 5,
        sbmixer: true,
        oplmode: "auto",
        oplemu: "default",
        oplrate: 44100,
      })
      .setGUS({ gus: false })
      .setSpeaker({
        pcspeaker: true,
        pcrate: 44100,
        tandy: "auto",
        tandyrate: 44100,
        disney: true,
      })
      .setJoystick({ joysticktype: "auto" }),
};

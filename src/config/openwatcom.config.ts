/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * Open Watcom C/C++ Compiler Configuration
 */

/**
 * Open Watcom memory models
 */
export type MemoryModel = 'tiny' | 'small' | 'compact' | 'medium' | 'large' | 'huge';

/**
 * Open Watcom optimization presets
 */
export interface OptimizationPreset {
  /** Preset name */
  name: string;
  /** Description */
  description: string;
  /** Compiler flags */
  flags: string[];
}

/**
 * Open Watcom compiler configuration
 */
export interface OpenWatcomConfig {
  /** Path to Open Watcom installation in DOS filesystem */
  watcomPath: string;
  /** Path to 16-bit compiler binary (wcc.exe) */
  compilerBin: string;
  /** Path to 32-bit compiler binary (wcc386.exe) */
  compiler386Bin: string;
  /** Path to linker binary (wlink.exe) */
  linkerBin: string;
  /** Path to librarian binary (wlib.exe) */
  librarianBin: string;
  /** Path to headers directory */
  includePath: string;
  /** Path to 16-bit libraries directory */
  libPath: string;
  /** Path to 32-bit libraries directory */
  lib386Path: string;
  /** Temporary directory for compilation */
  tempPath: string;
  /** Output directory for executables */
  outputPath: string;
  /** Maximum compilation time in milliseconds */
  maxCompilationTime: number;
  /** Enable verbose logging */
  verbose: boolean;
  /** Default memory model */
  defaultMemoryModel: MemoryModel;
  /** Default compiler flags */
  defaultFlags: string[];
  /** Default linker flags */
  defaultLinkerFlags: string[];
}

/**
 * Default Open Watcom configuration
 */
export const defaultOpenWatcomConfig: OpenWatcomConfig = {
  watcomPath: 'C:\\WATCOM',
  compilerBin: 'C:\\WATCOM\\BINW\\WCC.EXE',
  compiler386Bin: 'C:\\WATCOM\\BINW\\WCC386.EXE',
  linkerBin: 'C:\\WATCOM\\BINW\\WLINK.EXE',
  librarianBin: 'C:\\WATCOM\\BINW\\WLIB.EXE',
  includePath: 'C:\\WATCOM\\H',
  libPath: 'C:\\WATCOM\\LIB286\\DOS',
  lib386Path: 'C:\\WATCOM\\LIB386\\DOS',
  tempPath: 'C:\\TEMP',
  outputPath: 'C:\\OUTPUT',
  maxCompilationTime: 30000, // 30 seconds
  verbose: true,
  defaultMemoryModel: 'small',
  defaultFlags: ['-w4', '-e25'], // Warning level 4, max 25 errors
  defaultLinkerFlags: ['format dos'],
};

/**
 * Open Watcom optimization presets
 */
export const optimizationPresets: Record<string, OptimizationPreset> = {
  none: {
    name: 'No Optimization',
    description: 'No optimization, fastest compilation',
    flags: ['-od'], // Disable optimization
  },
  size: {
    name: 'Optimize for Size',
    description: 'Minimize executable size',
    flags: ['-os', '-s'], // Size optimization, no stack overflow checks
  },
  speed: {
    name: 'Optimize for Speed',
    description: 'Maximize execution speed',
    flags: ['-ot', '-oh', '-oi', '-ol', '-or'], // Time, hotspots, inline, loops, reorder
  },
  balanced: {
    name: 'Balanced Optimization',
    description: 'Balance between size and speed',
    flags: ['-ox'], // Equivalent to -oh -oi -ok -ol -or -ot
  },
  aggressive: {
    name: 'Aggressive Optimization',
    description: 'Maximum optimization, slower compilation',
    flags: ['-ox', '-ol+', '-oe', '-on'], // Max optimization + extras
  },
};

/**
 * Memory model configurations
 */
export const memoryModelConfigs: Record<MemoryModel, {
  flag: string;
  description: string;
  maxCode: string;
  maxData: string;
}> = {
  tiny: {
    flag: '-mt',
    description: 'Code and data in single 64KB segment',
    maxCode: '64KB',
    maxData: '64KB (shared)',
  },
  small: {
    flag: '-ms',
    description: 'Code in one segment, data in another',
    maxCode: '64KB',
    maxData: '64KB',
  },
  compact: {
    flag: '-mc',
    description: 'Code in one segment, multiple data segments',
    maxCode: '64KB',
    maxData: '1MB',
  },
  medium: {
    flag: '-mm',
    description: 'Multiple code segments, data in one segment',
    maxCode: '1MB',
    maxData: '64KB',
  },
  large: {
    flag: '-ml',
    description: 'Multiple code and data segments',
    maxCode: '1MB',
    maxData: '1MB',
  },
  huge: {
    flag: '-mh',
    description: 'Large model with huge arrays support',
    maxCode: '1MB',
    maxData: '1MB+',
  },
};

/**
 * Common linker options
 */
export const linkerOptions = {
  /** Output formats */
  formats: {
    dos: 'format dos',
    com: 'format dos com',
    exe: 'format dos',
  },
  /** Stack size options */
  stackSizes: {
    small: 'option stack=2048',
    medium: 'option stack=4096',
    large: 'option stack=8192',
  },
  /** Debug options */
  debug: {
    none: '',
    codeview: 'debug codeview',
    watcom: 'debug watcom',
  },
};

/**
 * Get memory model flag for given model
 */
export function getMemoryModelFlag(model: MemoryModel): string {
  return memoryModelConfigs[model].flag;
}

/**
 * Get optimization flags for preset
 */
export function getOptimizationFlags(preset: string): string[] {
  return optimizationPresets[preset]?.flags || [];
}

/**
 * Build compiler command line
 */
export function buildCompilerCommand(
  sourceFile: string,
  objectFile: string,
  options: {
    memoryModel?: MemoryModel;
    optimization?: string;
    warnings?: boolean;
    debug?: boolean;
    customFlags?: string[];
  } = {}
): string {
  const flags: string[] = [...defaultOpenWatcomConfig.defaultFlags];
  
  // Memory model
  if (options.memoryModel) {
    flags.push(getMemoryModelFlag(options.memoryModel));
  } else {
    flags.push(getMemoryModelFlag(defaultOpenWatcomConfig.defaultMemoryModel));
  }
  
  // Optimization
  if (options.optimization) {
    flags.push(...getOptimizationFlags(options.optimization));
  }
  
  // Debug info
  if (options.debug) {
    flags.push('-d2'); // Full debug info
  }
  
  // Custom flags
  if (options.customFlags) {
    flags.push(...options.customFlags);
  }
  
  return `wcc ${flags.join(' ')} -fo=${objectFile} ${sourceFile}`;
}

/**
 * Build linker command line
 */
export function buildLinkerCommand(
  objectFiles: string[],
  outputFile: string,
  options: {
    format?: 'dos' | 'com';
    stackSize?: 'small' | 'medium' | 'large';
    debug?: boolean;
    customOptions?: string[];
  } = {}
): string {
  const commands: string[] = [];
  
  // Output format
  const format = options.format || 'dos';
  commands.push(linkerOptions.formats[format]);
  
  // Stack size
  if (options.stackSize) {
    commands.push(linkerOptions.stackSizes[options.stackSize]);
  }
  
  // Debug info
  if (options.debug) {
    commands.push(linkerOptions.debug.watcom);
  }
  
  // Custom options
  if (options.customOptions) {
    commands.push(...options.customOptions);
  }
  
  // Files
  const fileList = objectFiles.join(',');
  commands.push(`file ${fileList}`);
  commands.push(`name ${outputFile}`);
  
  return `wlink ${commands.join(' ')}`;
}

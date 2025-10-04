/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * useDosCompiler Hook
 * React hook for DOS compilation operations
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { CommandInterface } from '../types/js-dos';
import type { CompileResult, BuildMessage, BuildStatus } from '../types/compiler';
import { CompilerService } from '../services/CompilerService';

export interface UseDosCompilerResult {
  /** Compile a source file */
  compile: (sourceFile: string, outputFile: string) => Promise<CompileResult>;
  /** Get build messages */
  buildMessages: BuildMessage[];
  /** Clear build messages */
  clearBuildMessages: () => void;
  /** Build status */
  buildStatus: BuildStatus;
  /** Last compile result */
  lastResult: CompileResult | null;
  /** Compilation error */
  error: string | null;
  /** Clear error */
  clearError: () => void;
}

/**
 * Hook for DOS compilation operations
 */
export function useDosCompiler(ci: CommandInterface | null): UseDosCompilerResult {
  const [buildMessages, setBuildMessages] = useState<BuildMessage[]>([]);
  const [buildStatus, setBuildStatus] = useState<BuildStatus>('idle');
  const [lastResult, setLastResult] = useState<CompileResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const compilerServiceRef = useRef<CompilerService | null>(null);

  // Initialize CompilerService when CommandInterface is available
  useEffect(() => {
    if (ci) {
      compilerServiceRef.current = new CompilerService(ci);
    } else {
      compilerServiceRef.current = null;
    }
  }, [ci]);

  const compile = useCallback(async (sourceFile: string, outputFile: string): Promise<CompileResult> => {
    if (!compilerServiceRef.current) {
      throw new Error('CompilerService not initialized');
    }

    setBuildStatus('building');
    setError(null);
    setBuildMessages([]);

    try {
      const result = await compilerServiceRef.current.compile(sourceFile, outputFile);
      
      // Get build messages from compiler service
      const messages = compilerServiceRef.current.getBuildMessages();
      setBuildMessages(messages);
      
      setLastResult(result);
      setBuildStatus(result.success ? 'success' : 'error');
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Compilation failed';
      setError(errorMessage);
      setBuildStatus('error');
      
      const failedResult: CompileResult = {
        success: false,
        errors: [errorMessage],
        warnings: [],
        outputFile,
        rawOutput: errorMessage,
      };
      
      setLastResult(failedResult);
      return failedResult;
    }
  }, []);

  const clearBuildMessages = useCallback(() => {
    setBuildMessages([]);
    if (compilerServiceRef.current) {
      compilerServiceRef.current.clearBuildMessages();
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    compile,
    buildMessages,
    clearBuildMessages,
    buildStatus,
    lastResult,
    error,
    clearError,
  };
}


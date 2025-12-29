/**
 * Hook for OpenTelemetry configuration validation using the backend API
 */

import { useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import type { ValidationError, ParseResult } from '@/lib/otel-parser';
import { parseOTelConfig } from '@/lib/otel-parser';

export interface BinaryValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  rawOutput?: string;
  binaryVersion?: string;
}

export interface ValidationStatus {
  binaryAvailable: boolean;
  binaryVersion: string | null;
  validationMode: 'binary' | 'fallback';
}

export function useOtelValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [binaryResult, setBinaryResult] = useState<BinaryValidationResult | null>(null);
  
  // Get validation status (binary availability)
  const statusQuery = trpc.otel.status.useQuery(undefined, {
    staleTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: false,
  });
  
  // Validation mutation
  const validateMutation = trpc.otel.validate.useMutation({
    onMutate: () => {
      setIsValidating(true);
    },
    onSettled: () => {
      setIsValidating(false);
    },
  });
  
  /**
   * Validate configuration using the backend API (otelcol binary)
   * Falls back to client-side validation if API fails
   */
  const validateWithBinary = useCallback(async (config: string): Promise<BinaryValidationResult> => {
    try {
      const result = await validateMutation.mutateAsync({ config });
      setBinaryResult(result);
      return result;
    } catch (error) {
      console.error('[OTel Validation] API error, falling back to client-side:', error);
      
      // Fallback to client-side validation
      const clientResult = parseOTelConfig(config);
      const fallbackResult: BinaryValidationResult = {
        isValid: clientResult.isValid,
        errors: clientResult.errors,
        rawOutput: 'Validated using client-side parser (API unavailable)',
      };
      setBinaryResult(fallbackResult);
      return fallbackResult;
    }
  }, [validateMutation]);
  
  /**
   * Combined validation that uses both client-side parsing (for visualization)
   * and binary validation (for accurate error detection)
   */
  const validateConfig = useCallback(async (config: string): Promise<{
    parseResult: ParseResult;
    binaryResult: BinaryValidationResult;
  }> => {
    // Client-side parsing for visualization (always runs)
    const parseResult = parseOTelConfig(config);
    
    // Binary validation for accurate errors
    const binaryResult = await validateWithBinary(config);
    
    // Merge binary errors into parse result if binary found more issues
    if (!binaryResult.isValid && binaryResult.errors.length > 0) {
      // Add binary-specific errors that aren't already in parseResult
      const existingMessages = new Set(parseResult.errors.map(e => e.message));
      
      for (const error of binaryResult.errors) {
        if (!existingMessages.has(error.message)) {
          parseResult.errors.push(error);
        }
      }
      
      // Update validity based on binary result
      parseResult.isValid = binaryResult.isValid;
    }
    
    return { parseResult, binaryResult };
  }, [validateWithBinary]);
  
  return {
    // State
    isValidating,
    binaryResult,
    validationStatus: statusQuery.data,
    isStatusLoading: statusQuery.isLoading,
    
    // Actions
    validateWithBinary,
    validateConfig,
    
    // Helpers
    isBinaryAvailable: statusQuery.data?.binaryAvailable ?? false,
    binaryVersion: statusQuery.data?.binaryVersion ?? null,
    validationMode: statusQuery.data?.validationMode ?? 'fallback',
  };
}

/**
 * Error Console Component
 * 
 * Terminal/CLI Aesthetic: Displays validation errors and warnings
 * with line numbers, styled like a terminal output.
 */

import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, CheckCircle2, Terminal } from 'lucide-react';
import type { ValidationError } from '@/lib/otel-parser';

interface ErrorConsoleProps {
  errors: ValidationError[];
  isValid: boolean;
  onErrorClick?: (line?: number) => void;
}

export function ErrorConsole({ errors, isValid, onErrorClick }: ErrorConsoleProps) {
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;
  
  return (
    <div className="h-full flex flex-col bg-card border-t border-border">
      {/* Console header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 font-mono text-sm">
          <Terminal className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Validation Output</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs">
          {isValid ? (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Valid configuration</span>
            </div>
          ) : (
            <>
              {errorCount > 0 && (
                <div className="flex items-center gap-1.5 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorCount} error{errorCount !== 1 ? 's' : ''}</span>
                </div>
              )}
              {warningCount > 0 && (
                <div className="flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{warningCount} warning{warningCount !== 1 ? 's' : ''}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Console output */}
      <div className="flex-1 overflow-auto p-2 font-mono text-sm">
        {errors.length === 0 ? (
          <div className="flex items-center gap-2 px-2 py-1 text-emerald-400">
            <span className="text-muted-foreground select-none">$</span>
            <span>Configuration validated successfully</span>
            <span className="cursor-blink" />
          </div>
        ) : (
          <div className="space-y-1">
            {errors.map((error, index) => (
              <div
                key={index}
                onClick={() => onErrorClick?.(error.line)}
                className={cn(
                  'flex items-start gap-2 px-2 py-1.5 rounded cursor-pointer',
                  'transition-colors duration-150',
                  error.severity === 'error' 
                    ? 'hover:bg-red-500/10 text-red-400' 
                    : 'hover:bg-amber-500/10 text-amber-400'
                )}
              >
                {/* Line indicator */}
                <span className="text-muted-foreground select-none shrink-0">
                  {error.line ? `L${error.line}:` : '   '}
                </span>
                
                {/* Icon */}
                {error.severity === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                
                {/* Message */}
                <span className="break-words">{error.message}</span>
              </div>
            ))}
            
            {/* Summary line */}
            <div className="flex items-center gap-2 px-2 py-1 mt-2 border-t border-border/50 text-muted-foreground">
              <span className="select-none">$</span>
              <span>
                Validation complete: {errorCount} error{errorCount !== 1 ? 's' : ''}, {warningCount} warning{warningCount !== 1 ? 's' : ''}
              </span>
              <span className="cursor-blink" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

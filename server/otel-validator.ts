/**
 * OpenTelemetry Collector Binary Validator
 * 
 * This module provides validation of OTel configurations using the actual
 * otelcol binary for accurate, production-grade validation.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

const execAsync = promisify(exec);

// Path to the otelcol binary - configurable via environment variable
const OTELCOL_PATH = process.env.OTELCOL_PATH || 'otelcol';

// Temp directory for config files
const TEMP_DIR = '/tmp/otel-validator';

export interface ValidationError {
  message: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning';
  component?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  rawOutput?: string;
  binaryVersion?: string;
}

/**
 * Parse error messages from otelcol output
 */
function parseOtelErrors(stderr: string, stdout: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const output = stderr + '\n' + stdout;
  
  // Common error patterns from otelcol
  const patterns = [
    // YAML syntax errors
    /yaml: line (\d+): (.+)/gi,
    // Component errors
    /error decoding '([^']+)': (.+)/gi,
    // Unknown component
    /unknown type: "([^"]+)" for id: "([^"]+)"/gi,
    // Configuration errors
    /failed to (get|create|build) ([^:]+): (.+)/gi,
    // Pipeline errors
    /pipeline "([^"]+)" (.+)/gi,
    // General errors
    /Error: (.+)/gi,
    /error: (.+)/gi,
  ];
  
  // Split output into lines for processing
  const lines = output.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Check for YAML line errors
    const yamlMatch = trimmedLine.match(/yaml: line (\d+): (.+)/i);
    if (yamlMatch) {
      errors.push({
        message: yamlMatch[2],
        line: parseInt(yamlMatch[1], 10),
        severity: 'error',
      });
      continue;
    }
    
    // Check for unknown type errors
    const unknownTypeMatch = trimmedLine.match(/unknown type: "([^"]+)" for id: "([^"]+)"/i);
    if (unknownTypeMatch) {
      errors.push({
        message: `Unknown component type "${unknownTypeMatch[1]}" for "${unknownTypeMatch[2]}"`,
        severity: 'error',
        component: unknownTypeMatch[2],
      });
      continue;
    }
    
    // Check for decoding errors
    const decodingMatch = trimmedLine.match(/error decoding '([^']+)': (.+)/i);
    if (decodingMatch) {
      errors.push({
        message: `Configuration error in "${decodingMatch[1]}": ${decodingMatch[2]}`,
        severity: 'error',
        component: decodingMatch[1],
      });
      continue;
    }
    
    // Check for pipeline errors
    const pipelineMatch = trimmedLine.match(/pipeline "([^"]+)" (.+)/i);
    if (pipelineMatch) {
      errors.push({
        message: `Pipeline "${pipelineMatch[1]}": ${pipelineMatch[2]}`,
        severity: 'error',
        component: `pipelines.${pipelineMatch[1]}`,
      });
      continue;
    }
    
    // Check for failed to build/create errors
    const failedMatch = trimmedLine.match(/failed to (get|create|build) ([^:]+): (.+)/i);
    if (failedMatch) {
      errors.push({
        message: `Failed to ${failedMatch[1]} ${failedMatch[2]}: ${failedMatch[3]}`,
        severity: 'error',
        component: failedMatch[2],
      });
      continue;
    }
    
    // Check for general errors
    const errorMatch = trimmedLine.match(/^error:\s*(.+)/i) || trimmedLine.match(/^Error:\s*(.+)/i);
    if (errorMatch) {
      errors.push({
        message: errorMatch[1],
        severity: 'error',
      });
      continue;
    }
    
    // Check for cannot unmarshal errors (common YAML type errors)
    const unmarshalMatch = trimmedLine.match(/cannot unmarshal (.+) into (.+)/i);
    if (unmarshalMatch) {
      errors.push({
        message: `Type error: cannot convert ${unmarshalMatch[1]} to ${unmarshalMatch[2]}`,
        severity: 'error',
      });
      continue;
    }
  }
  
  // If no specific errors found but output contains error indicators
  if (errors.length === 0 && (output.toLowerCase().includes('error') || output.toLowerCase().includes('failed'))) {
    // Extract any meaningful error message
    const meaningfulLines = lines.filter(l => 
      l.trim() && 
      (l.toLowerCase().includes('error') || l.toLowerCase().includes('failed') || l.toLowerCase().includes('invalid'))
    );
    
    if (meaningfulLines.length > 0) {
      errors.push({
        message: meaningfulLines[0].trim(),
        severity: 'error',
      });
    }
  }
  
  return errors;
}

/**
 * Get the version of the otelcol binary
 */
export async function getOtelcolVersion(): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`${OTELCOL_PATH} --version`, { timeout: 5000 });
    const versionMatch = stdout.match(/otelcol[^\s]* version ([^\s]+)/i);
    return versionMatch ? versionMatch[1] : stdout.trim().split('\n')[0];
  } catch {
    return null;
  }
}

/**
 * Check if otelcol binary is available
 */
export async function isOtelcolAvailable(): Promise<boolean> {
  try {
    await execAsync(`${OTELCOL_PATH} --version`, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate an OpenTelemetry configuration using the otelcol binary
 */
export async function validateWithBinary(configYaml: string): Promise<ValidationResult> {
  // Ensure temp directory exists
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }
  
  // Create a unique temp file for this validation
  const tempFile = path.join(TEMP_DIR, `config-${nanoid()}.yaml`);
  
  try {
    // Write config to temp file
    await writeFile(tempFile, configYaml, 'utf-8');
    
    // Run otelcol validate command
    const { stdout, stderr } = await execAsync(
      `${OTELCOL_PATH} validate --config=${tempFile}`,
      { timeout: 30000 }
    );
    
    // If we get here without error, config is valid
    return {
      isValid: true,
      errors: [],
      rawOutput: stdout || 'Configuration is valid',
      binaryVersion: await getOtelcolVersion() || undefined,
    };
    
  } catch (error: unknown) {
    // otelcol returns non-zero exit code for invalid configs
    const execError = error as { stdout?: string; stderr?: string; message?: string };
    const stdout = execError.stdout || '';
    const stderr = execError.stderr || execError.message || '';
    
    const errors = parseOtelErrors(stderr, stdout);
    
    // If no specific errors were parsed, add a generic one
    if (errors.length === 0) {
      errors.push({
        message: stderr || 'Configuration validation failed',
        severity: 'error',
      });
    }
    
    return {
      isValid: false,
      errors,
      rawOutput: stderr || stdout,
      binaryVersion: await getOtelcolVersion() || undefined,
    };
    
  } finally {
    // Clean up temp file
    try {
      await unlink(tempFile);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Fallback validation when otelcol binary is not available
 * Uses basic YAML parsing and structural validation
 */
export async function validateWithFallback(configYaml: string): Promise<ValidationResult> {
  const { parse } = await import('yaml');
  const errors: ValidationError[] = [];
  
  try {
    const config = parse(configYaml);
    
    if (!config) {
      errors.push({
        message: 'Empty configuration',
        severity: 'error',
      });
      return { isValid: false, errors };
    }
    
    // Check for required sections
    if (!config.service) {
      errors.push({
        message: 'Missing required "service" section',
        severity: 'error',
      });
    }
    
    if (!config.service?.pipelines) {
      errors.push({
        message: 'Missing required "service.pipelines" section',
        severity: 'error',
      });
    }
    
    // Validate component references
    const receivers = new Set(Object.keys(config.receivers || {}));
    const processors = new Set(Object.keys(config.processors || {}));
    const exporters = new Set(Object.keys(config.exporters || {}));
    const extensions = new Set(Object.keys(config.extensions || {}));
    
    // Check pipeline references
    const pipelines = config.service?.pipelines || {};
    for (const [pipelineName, pipelineConfig] of Object.entries(pipelines)) {
      const pipeline = pipelineConfig as {
        receivers?: string[];
        processors?: string[];
        exporters?: string[];
      };
      
      // Check receivers
      for (const receiver of pipeline.receivers || []) {
        if (!receivers.has(receiver)) {
          errors.push({
            message: `Pipeline "${pipelineName}" references undefined receiver "${receiver}"`,
            severity: 'error',
            component: `service.pipelines.${pipelineName}`,
          });
        }
      }
      
      // Check processors
      for (const processor of pipeline.processors || []) {
        if (!processors.has(processor)) {
          errors.push({
            message: `Pipeline "${pipelineName}" references undefined processor "${processor}"`,
            severity: 'error',
            component: `service.pipelines.${pipelineName}`,
          });
        }
      }
      
      // Check exporters
      for (const exporter of pipeline.exporters || []) {
        if (!exporters.has(exporter)) {
          errors.push({
            message: `Pipeline "${pipelineName}" references undefined exporter "${exporter}"`,
            severity: 'error',
            component: `service.pipelines.${pipelineName}`,
          });
        }
      }
    }
    
    // Check service extensions
    for (const ext of config.service?.extensions || []) {
      if (!extensions.has(ext)) {
        errors.push({
          message: `Service references undefined extension "${ext}"`,
          severity: 'error',
          component: 'service.extensions',
        });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      rawOutput: 'Validated using fallback parser (otelcol binary not available)',
    };
    
  } catch (e: unknown) {
    const yamlError = e as { message?: string };
    errors.push({
      message: `YAML syntax error: ${yamlError.message || 'Unknown error'}`,
      severity: 'error',
    });
    
    return {
      isValid: false,
      errors,
      rawOutput: yamlError.message,
    };
  }
}

/**
 * Main validation function - uses binary if available, falls back to parser
 */
export async function validateOtelConfig(configYaml: string): Promise<ValidationResult> {
  const binaryAvailable = await isOtelcolAvailable();
  
  if (binaryAvailable) {
    return validateWithBinary(configYaml);
  } else {
    console.warn('[OTel Validator] otelcol binary not found, using fallback validation');
    return validateWithFallback(configYaml);
  }
}

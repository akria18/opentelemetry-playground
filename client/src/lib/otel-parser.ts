/**
 * OpenTelemetry Configuration Parser and Validator
 * 
 * Parses YAML configuration and extracts pipeline components,
 * validates structure, and reports errors with line numbers.
 */

import YAML from 'yaml';

// Types for OpenTelemetry configuration
export interface OTelComponent {
  id: string;
  type: 'receiver' | 'processor' | 'exporter' | 'connector' | 'extension';
  name: string;
  fullName: string;
  config: Record<string, unknown>;
  lineNumber?: number;
}

export interface OTelPipeline {
  id: string;
  name: string;
  type: 'traces' | 'metrics' | 'logs';
  receivers: string[];
  processors: string[];
  exporters: string[];
  lineNumber?: number;
}

export interface ValidationError {
  message: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning';
  path?: string;
}

export interface ParseResult {
  receivers: OTelComponent[];
  processors: OTelComponent[];
  exporters: OTelComponent[];
  connectors: OTelComponent[];
  extensions: OTelComponent[];
  pipelines: OTelPipeline[];
  enabledExtensions: string[];
  errors: ValidationError[];
  isValid: boolean;
  rawConfig: Record<string, unknown> | null;
}

// Parse component name from type[/name] format
function parseComponentName(fullName: string): { type: string; name: string } {
  const parts = fullName.split('/');
  return {
    type: parts[0],
    name: parts.length > 1 ? parts.slice(1).join('/') : parts[0],
  };
}

// Get line number for a key in YAML document
function getLineNumber(doc: YAML.Document, path: string[]): number | undefined {
  try {
    let node: unknown = doc.contents;
    
    for (const key of path) {
      if (node && typeof node === 'object' && 'items' in node) {
        const yamlMap = node as YAML.YAMLMap;
        const pair = yamlMap.items.find(
          (item) => {
            const keyNode = item.key as YAML.Scalar | undefined;
            return keyNode && keyNode.value === key;
          }
        );
        if (pair) {
          if (path.indexOf(key) === path.length - 1) {
            const keyNode = pair.key as YAML.Scalar | undefined;
            const range = keyNode?.range;
            if (range && range[0] !== undefined) {
              return doc.toString().substring(0, range[0]).split('\n').length;
            }
            return undefined;
          }
          node = pair.value;
        } else {
          return undefined;
        }
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
}

// Extract components from a section
function extractComponents(
  section: Record<string, unknown> | undefined,
  type: OTelComponent['type'],
  doc: YAML.Document,
  sectionName: string
): OTelComponent[] {
  if (!section || typeof section !== 'object') return [];
  
  return Object.entries(section).map(([fullName, config]) => {
    const { type: componentType, name } = parseComponentName(fullName);
    return {
      id: `${type}-${fullName}`,
      type,
      name: componentType,
      fullName,
      config: (config as Record<string, unknown>) || {},
      lineNumber: getLineNumber(doc, [sectionName, fullName]),
    };
  });
}

// Extract pipelines from service section
function extractPipelines(
  service: Record<string, unknown> | undefined,
  doc: YAML.Document
): OTelPipeline[] {
  if (!service || typeof service !== 'object') return [];
  
  const pipelines = service.pipelines as Record<string, unknown> | undefined;
  if (!pipelines || typeof pipelines !== 'object') return [];
  
  return Object.entries(pipelines).map(([fullName, config]) => {
    const pipelineConfig = config as Record<string, unknown>;
    const parts = fullName.split('/');
    const pipelineType = parts[0] as 'traces' | 'metrics' | 'logs';
    
    return {
      id: `pipeline-${fullName}`,
      name: fullName,
      type: pipelineType,
      receivers: Array.isArray(pipelineConfig?.receivers) 
        ? pipelineConfig.receivers.map(String) 
        : [],
      processors: Array.isArray(pipelineConfig?.processors) 
        ? pipelineConfig.processors.map(String) 
        : [],
      exporters: Array.isArray(pipelineConfig?.exporters) 
        ? pipelineConfig.exporters.map(String) 
        : [],
      lineNumber: getLineNumber(doc, ['service', 'pipelines', fullName]),
    };
  });
}

// Validate configuration
function validateConfig(
  config: Record<string, unknown>,
  receivers: OTelComponent[],
  processors: OTelComponent[],
  exporters: OTelComponent[],
  connectors: OTelComponent[],
  extensions: OTelComponent[],
  pipelines: OTelPipeline[],
  enabledExtensions: string[],
  doc: YAML.Document
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check for required service section
  if (!config.service) {
    errors.push({
      message: 'Missing required "service" section',
      severity: 'error',
    });
    return errors;
  }
  
  const service = config.service as Record<string, unknown>;
  
  // Check for pipelines
  if (!service.pipelines) {
    errors.push({
      message: 'Missing required "service.pipelines" section',
      severity: 'error',
      line: getLineNumber(doc, ['service']),
    });
  }
  
  // Validate each pipeline
  const receiverNames = new Set([
    ...receivers.map(r => r.fullName),
    ...connectors.map(c => c.fullName),
  ]);
  const processorNames = new Set(processors.map(p => p.fullName));
  const exporterNames = new Set([
    ...exporters.map(e => e.fullName),
    ...connectors.map(c => c.fullName),
  ]);
  const extensionNames = new Set(extensions.map(e => e.fullName));
  
  for (const pipeline of pipelines) {
    // Check receivers
    for (const receiver of pipeline.receivers) {
      if (!receiverNames.has(receiver)) {
        errors.push({
          message: `Pipeline "${pipeline.name}" references undefined receiver "${receiver}"`,
          severity: 'error',
          line: pipeline.lineNumber,
          path: `service.pipelines.${pipeline.name}.receivers`,
        });
      }
    }
    
    // Check processors
    for (const processor of pipeline.processors) {
      if (!processorNames.has(processor)) {
        errors.push({
          message: `Pipeline "${pipeline.name}" references undefined processor "${processor}"`,
          severity: 'error',
          line: pipeline.lineNumber,
          path: `service.pipelines.${pipeline.name}.processors`,
        });
      }
    }
    
    // Check exporters
    for (const exporter of pipeline.exporters) {
      if (!exporterNames.has(exporter)) {
        errors.push({
          message: `Pipeline "${pipeline.name}" references undefined exporter "${exporter}"`,
          severity: 'error',
          line: pipeline.lineNumber,
          path: `service.pipelines.${pipeline.name}.exporters`,
        });
      }
    }
    
    // Warn if pipeline has no receivers
    if (pipeline.receivers.length === 0) {
      errors.push({
        message: `Pipeline "${pipeline.name}" has no receivers defined`,
        severity: 'warning',
        line: pipeline.lineNumber,
      });
    }
    
    // Warn if pipeline has no exporters
    if (pipeline.exporters.length === 0) {
      errors.push({
        message: `Pipeline "${pipeline.name}" has no exporters defined`,
        severity: 'warning',
        line: pipeline.lineNumber,
      });
    }
  }
  
  // Validate enabled extensions
  for (const ext of enabledExtensions) {
    if (!extensionNames.has(ext)) {
      errors.push({
        message: `Service references undefined extension "${ext}"`,
        severity: 'error',
        line: getLineNumber(doc, ['service', 'extensions']),
        path: 'service.extensions',
      });
    }
  }
  
  // Warn about unused components
  const usedReceivers = new Set(pipelines.flatMap(p => p.receivers));
  const usedProcessors = new Set(pipelines.flatMap(p => p.processors));
  const usedExporters = new Set(pipelines.flatMap(p => p.exporters));
  
  for (const receiver of receivers) {
    if (!usedReceivers.has(receiver.fullName)) {
      errors.push({
        message: `Receiver "${receiver.fullName}" is defined but not used in any pipeline`,
        severity: 'warning',
        line: receiver.lineNumber,
        path: `receivers.${receiver.fullName}`,
      });
    }
  }
  
  for (const processor of processors) {
    if (!usedProcessors.has(processor.fullName)) {
      errors.push({
        message: `Processor "${processor.fullName}" is defined but not used in any pipeline`,
        severity: 'warning',
        line: processor.lineNumber,
        path: `processors.${processor.fullName}`,
      });
    }
  }
  
  for (const exporter of exporters) {
    if (!usedExporters.has(exporter.fullName)) {
      errors.push({
        message: `Exporter "${exporter.fullName}" is defined but not used in any pipeline`,
        severity: 'warning',
        line: exporter.lineNumber,
        path: `exporters.${exporter.fullName}`,
      });
    }
  }
  
  for (const extension of extensions) {
    if (!enabledExtensions.includes(extension.fullName)) {
      errors.push({
        message: `Extension "${extension.fullName}" is defined but not enabled in service.extensions`,
        severity: 'warning',
        line: extension.lineNumber,
        path: `extensions.${extension.fullName}`,
      });
    }
  }
  
  return errors;
}

// Main parse function
export function parseOTelConfig(yamlContent: string): ParseResult {
  const result: ParseResult = {
    receivers: [],
    processors: [],
    exporters: [],
    connectors: [],
    extensions: [],
    pipelines: [],
    enabledExtensions: [],
    errors: [],
    isValid: false,
    rawConfig: null,
  };
  
  if (!yamlContent.trim()) {
    result.errors.push({
      message: 'Configuration is empty',
      severity: 'error',
    });
    return result;
  }
  
  let doc: YAML.Document;
  let config: Record<string, unknown>;
  
  try {
    doc = YAML.parseDocument(yamlContent);
    
    // Check for YAML syntax errors
    if (doc.errors.length > 0) {
      for (const error of doc.errors) {
        result.errors.push({
          message: error.message,
          line: error.linePos?.[0]?.line,
          column: error.linePos?.[0]?.col,
          severity: 'error',
        });
      }
      return result;
    }
    
    config = doc.toJS() as Record<string, unknown>;
    result.rawConfig = config;
  } catch (error) {
    result.errors.push({
      message: `YAML parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'error',
    });
    return result;
  }
  
  // Extract components
  result.receivers = extractComponents(
    config.receivers as Record<string, unknown>,
    'receiver',
    doc,
    'receivers'
  );
  
  result.processors = extractComponents(
    config.processors as Record<string, unknown>,
    'processor',
    doc,
    'processors'
  );
  
  result.exporters = extractComponents(
    config.exporters as Record<string, unknown>,
    'exporter',
    doc,
    'exporters'
  );
  
  result.connectors = extractComponents(
    config.connectors as Record<string, unknown>,
    'connector',
    doc,
    'connectors'
  );
  
  result.extensions = extractComponents(
    config.extensions as Record<string, unknown>,
    'extension',
    doc,
    'extensions'
  );
  
  // Extract pipelines
  result.pipelines = extractPipelines(
    config.service as Record<string, unknown>,
    doc
  );
  
  // Extract enabled extensions
  const service = config.service as Record<string, unknown> | undefined;
  if (service?.extensions && Array.isArray(service.extensions)) {
    result.enabledExtensions = service.extensions.map(String);
  }
  
  // Validate configuration
  result.errors = validateConfig(
    config,
    result.receivers,
    result.processors,
    result.exporters,
    result.connectors,
    result.extensions,
    result.pipelines,
    result.enabledExtensions,
    doc
  );
  
  result.isValid = result.errors.filter(e => e.severity === 'error').length === 0;
  
  return result;
}

// Sample configuration for demo
export const sampleConfig = `# OpenTelemetry Collector Configuration
# This is a sample configuration demonstrating receivers, processors, and exporters

receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318
  
  prometheus:
    config:
      scrape_configs:
        - job_name: 'otel-collector'
          scrape_interval: 10s
          static_configs:
            - targets: ['localhost:8888']

processors:
  batch:
    timeout: 10s
    send_batch_size: 1024
  
  memory_limiter:
    check_interval: 1s
    limit_mib: 1000
    spike_limit_mib: 200
  
  attributes:
    actions:
      - key: environment
        value: production
        action: insert

exporters:
  otlp:
    endpoint: otelcol:4317
    tls:
      insecure: true
  
  debug:
    verbosity: detailed
  
  prometheus:
    endpoint: 0.0.0.0:8889
    namespace: otel

extensions:
  health_check:
    endpoint: 0.0.0.0:13133
  
  pprof:
    endpoint: 0.0.0.0:1777
  
  zpages:
    endpoint: 0.0.0.0:55679

service:
  extensions: [health_check, pprof, zpages]
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch, attributes]
      exporters: [otlp, debug]
    metrics:
      receivers: [otlp, prometheus]
      processors: [memory_limiter, batch]
      exporters: [prometheus, debug]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlp, debug]
`;

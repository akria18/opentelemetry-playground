/**
 * OpenTelemetry Collector Configuration Templates
 * 
 * Preset configurations for common use cases to help users get started quickly.
 */

export interface ConfigTemplate {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'tracing' | 'metrics' | 'logging' | 'advanced';
  config: string;
}

export const configTemplates: ConfigTemplate[] = [
  {
    id: 'basic-otlp',
    name: 'Basic OTLP',
    description: 'Simple OTLP receiver to debug exporter setup',
    category: 'basic',
    config: `# Basic OTLP Configuration
# Receives telemetry via OTLP and outputs to debug console

receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 10s
    send_batch_size: 1024

exporters:
  debug:
    verbosity: detailed

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [debug]
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [debug]
    logs:
      receivers: [otlp]
      processors: [batch]
      exporters: [debug]
`
  },
  {
    id: 'jaeger-tracing',
    name: 'Jaeger Tracing',
    description: 'Collect traces and export to Jaeger backend',
    category: 'tracing',
    config: `# Jaeger Tracing Configuration
# Receives traces via OTLP and exports to Jaeger

receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 5s
    send_batch_size: 512
  memory_limiter:
    check_interval: 1s
    limit_mib: 512
    spike_limit_mib: 128

exporters:
  otlp/jaeger:
    endpoint: jaeger-collector:4317
    tls:
      insecure: true

extensions:
  health_check:
    endpoint: 0.0.0.0:13133

service:
  extensions: [health_check]
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlp/jaeger]
`
  },
  {
    id: 'prometheus-metrics',
    name: 'Prometheus Metrics',
    description: 'Scrape and export metrics to Prometheus',
    category: 'metrics',
    config: `# Prometheus Metrics Configuration
# Scrapes metrics and exposes them for Prometheus

receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
  prometheus:
    config:
      scrape_configs:
        - job_name: 'otel-collector'
          scrape_interval: 15s
          static_configs:
            - targets: ['localhost:8888']

processors:
  batch:
    timeout: 10s
  memory_limiter:
    check_interval: 1s
    limit_mib: 1000

exporters:
  prometheus:
    endpoint: 0.0.0.0:8889
    namespace: otel
  debug:
    verbosity: basic

extensions:
  health_check:
    endpoint: 0.0.0.0:13133
  pprof:
    endpoint: 0.0.0.0:1777

service:
  extensions: [health_check, pprof]
  pipelines:
    metrics:
      receivers: [otlp, prometheus]
      processors: [memory_limiter, batch]
      exporters: [prometheus, debug]
`
  },
  {
    id: 'loki-logging',
    name: 'Loki Logging',
    description: 'Collect logs and export to Grafana Loki',
    category: 'logging',
    config: `# Loki Logging Configuration
# Receives logs via OTLP and exports to Loki

receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 5s
    send_batch_size: 1000
  memory_limiter:
    check_interval: 1s
    limit_mib: 512
  attributes:
    actions:
      - key: loki.attribute.labels
        action: insert
        value: level, service.name

exporters:
  loki:
    endpoint: http://loki:3100/loki/api/v1/push
    labels:
      attributes:
        level: ""
        service.name: ""

extensions:
  health_check:
    endpoint: 0.0.0.0:13133

service:
  extensions: [health_check]
  pipelines:
    logs:
      receivers: [otlp]
      processors: [memory_limiter, attributes, batch]
      exporters: [loki]
`
  },
  {
    id: 'full-observability',
    name: 'Full Observability Stack',
    description: 'Complete setup with traces, metrics, and logs',
    category: 'advanced',
    config: `# Full Observability Stack Configuration
# Complete setup for traces, metrics, and logs

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
  resource:
    attributes:
      - key: service.version
        value: "1.0.0"
        action: insert

exporters:
  otlp/traces:
    endpoint: tempo:4317
    tls:
      insecure: true
  prometheus:
    endpoint: 0.0.0.0:8889
    namespace: app
  loki:
    endpoint: http://loki:3100/loki/api/v1/push
  debug:
    verbosity: basic

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
      processors: [memory_limiter, attributes, resource, batch]
      exporters: [otlp/traces, debug]
    metrics:
      receivers: [otlp, prometheus]
      processors: [memory_limiter, batch]
      exporters: [prometheus]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, attributes, batch]
      exporters: [loki]
`
  },
  {
    id: 'gateway-loadbalancer',
    name: 'Gateway with Load Balancing',
    description: 'Load balancing gateway for multiple backends',
    category: 'advanced',
    config: `# Gateway with Load Balancing Configuration
# Distributes telemetry across multiple backend collectors

receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 5s
    send_batch_size: 512
  memory_limiter:
    check_interval: 1s
    limit_mib: 2000
    spike_limit_mib: 400

exporters:
  loadbalancing:
    protocol:
      otlp:
        tls:
          insecure: true
    resolver:
      static:
        hostnames:
          - collector-1:4317
          - collector-2:4317
          - collector-3:4317

extensions:
  health_check:
    endpoint: 0.0.0.0:13133

service:
  extensions: [health_check]
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [loadbalancing]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [loadbalancing]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [loadbalancing]
`
  },
  {
    id: 'connector-spanmetrics',
    name: 'Span Metrics Connector',
    description: 'Generate metrics from trace spans using connectors',
    category: 'advanced',
    config: `# Span Metrics Connector Configuration
# Generates metrics from trace spans using the spanmetrics connector

receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 10s
  memory_limiter:
    check_interval: 1s
    limit_mib: 512

connectors:
  spanmetrics:
    histogram:
      explicit:
        buckets: [5ms, 10ms, 25ms, 50ms, 100ms, 250ms, 500ms, 1s, 2.5s, 5s, 10s]
    dimensions:
      - name: http.method
      - name: http.status_code
      - name: service.name

exporters:
  otlp/traces:
    endpoint: tempo:4317
    tls:
      insecure: true
  prometheus:
    endpoint: 0.0.0.0:8889
    namespace: traces
  debug:
    verbosity: basic

extensions:
  health_check:
    endpoint: 0.0.0.0:13133

service:
  extensions: [health_check]
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [spanmetrics, otlp/traces]
    metrics:
      receivers: [spanmetrics]
      processors: [batch]
      exporters: [prometheus, debug]
`
  },
  {
    id: 'tail-sampling',
    name: 'Tail-Based Sampling',
    description: 'Intelligent trace sampling based on span attributes',
    category: 'advanced',
    config: `# Tail-Based Sampling Configuration
# Samples traces based on latency, errors, and other attributes

receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  memory_limiter:
    check_interval: 1s
    limit_mib: 1000
  tail_sampling:
    decision_wait: 10s
    num_traces: 100000
    expected_new_traces_per_sec: 1000
    policies:
      - name: errors
        type: status_code
        status_code:
          status_codes: [ERROR]
      - name: slow-traces
        type: latency
        latency:
          threshold_ms: 1000
      - name: probabilistic
        type: probabilistic
        probabilistic:
          sampling_percentage: 10
  batch:
    timeout: 10s

exporters:
  otlp:
    endpoint: backend:4317
    tls:
      insecure: true
  debug:
    verbosity: basic

extensions:
  health_check:
    endpoint: 0.0.0.0:13133

service:
  extensions: [health_check]
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, tail_sampling, batch]
      exporters: [otlp, debug]
`
  }
];

export const templateCategories = [
  { id: 'basic', name: 'Basic', icon: '📦' },
  { id: 'tracing', name: 'Tracing', icon: '🔍' },
  { id: 'metrics', name: 'Metrics', icon: '📊' },
  { id: 'logging', name: 'Logging', icon: '📝' },
  { id: 'advanced', name: 'Advanced', icon: '⚡' },
] as const;

export function getTemplatesByCategory(category: string): ConfigTemplate[] {
  return configTemplates.filter(t => t.category === category);
}

export function getTemplateById(id: string): ConfigTemplate | undefined {
  return configTemplates.find(t => t.id === id);
}

import { describe, expect, it, vi, beforeEach } from "vitest";
import { validateWithFallback } from "./otel-validator";

describe("otel-validator", () => {
  describe("validateWithFallback", () => {
    it("returns valid for correct configuration", async () => {
      const validConfig = `
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317

processors:
  batch:
    timeout: 10s

exporters:
  debug:
    verbosity: detailed

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [debug]
`;

      const result = await validateWithFallback(validConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0);
    });

    it("detects missing service section", async () => {
      const configWithoutService = `
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317

processors:
  batch:
    timeout: 10s

exporters:
  debug:
    verbosity: detailed
`;

      const result = await validateWithFallback(configWithoutService);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('service'))).toBe(true);
    });

    it("detects undefined receiver reference", async () => {
      const configWithUndefinedReceiver = `
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317

processors:
  batch:
    timeout: 10s

exporters:
  debug:
    verbosity: detailed

service:
  pipelines:
    traces:
      receivers: [nonexistent_receiver]
      processors: [batch]
      exporters: [debug]
`;

      const result = await validateWithFallback(configWithUndefinedReceiver);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => 
        e.message.includes('undefined receiver') && 
        e.message.includes('nonexistent_receiver')
      )).toBe(true);
    });

    it("detects undefined processor reference", async () => {
      const configWithUndefinedProcessor = `
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317

exporters:
  debug:
    verbosity: detailed

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [undefined_processor]
      exporters: [debug]
`;

      const result = await validateWithFallback(configWithUndefinedProcessor);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => 
        e.message.includes('undefined processor') && 
        e.message.includes('undefined_processor')
      )).toBe(true);
    });

    it("detects undefined exporter reference", async () => {
      const configWithUndefinedExporter = `
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317

processors:
  batch:
    timeout: 10s

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [missing_exporter]
`;

      const result = await validateWithFallback(configWithUndefinedExporter);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => 
        e.message.includes('undefined exporter') && 
        e.message.includes('missing_exporter')
      )).toBe(true);
    });

    it("detects undefined extension reference", async () => {
      const configWithUndefinedExtension = `
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317

exporters:
  debug:
    verbosity: detailed

service:
  extensions: [nonexistent_extension]
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [debug]
`;

      const result = await validateWithFallback(configWithUndefinedExtension);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => 
        e.message.includes('undefined extension') && 
        e.message.includes('nonexistent_extension')
      )).toBe(true);
    });

    it("handles YAML syntax errors", async () => {
      const invalidYaml = `
receivers:
  otlp:
    protocols:
      grpc
        endpoint: 0.0.0.0:4317  # Invalid indentation
`;

      const result = await validateWithFallback(invalidYaml);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => 
        e.message.toLowerCase().includes('yaml') || 
        e.message.toLowerCase().includes('syntax')
      )).toBe(true);
    });

    it("handles empty configuration", async () => {
      const result = await validateWithFallback("");
      
      expect(result.isValid).toBe(false);
    });

    it("validates multiple pipelines correctly", async () => {
      const multiPipelineConfig = `
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317

processors:
  batch:
    timeout: 10s

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
`;

      const result = await validateWithFallback(multiPipelineConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0);
    });
  });
});

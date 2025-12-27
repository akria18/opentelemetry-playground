/**
 * OpenTelemetry Config Playground - Home Page
 * 
 * Terminal/CLI Aesthetic: Split-pane interface with YAML editor,
 * pipeline visualization, and error console.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  RotateCcw, 
  Download, 
  Upload,
  Github,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PipelineVisualization } from '@/components/PipelineVisualization';
import { ErrorConsole } from '@/components/ErrorConsole';
import { parseOTelConfig, sampleConfig, type ParseResult } from '@/lib/otel-parser';
import { cn } from '@/lib/utils';

// Initial empty parse result
const emptyParseResult: ParseResult = {
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

export default function Home() {
  const [yamlContent, setYamlContent] = useState(sampleConfig);
  const [parseResult, setParseResult] = useState<ParseResult>(() => parseOTelConfig(sampleConfig));
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(true);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  
  // Parse configuration on content change
  const handleEditorChange = useCallback((value: string | undefined) => {
    const content = value || '';
    setYamlContent(content);
    
    // Debounce parsing
    const result = parseOTelConfig(content);
    setParseResult(result);
  }, []);
  
  // Handle editor mount
  const handleEditorMount = useCallback((
    editor: monaco.editor.IStandaloneCodeEditor,
    monacoInstance: Monaco
  ) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;
    
    // Configure YAML language
    monacoInstance.languages.register({ id: 'yaml' });
    
    // Set editor theme
    monacoInstance.editor.defineTheme('otel-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
        { token: 'string', foreground: '4ade80' },
        { token: 'number', foreground: 'f59e0b' },
        { token: 'keyword', foreground: '22d3ee' },
        { token: 'type', foreground: 'a855f7' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#e5e7eb',
        'editor.lineHighlightBackground': '#1f2937',
        'editor.selectionBackground': '#374151',
        'editorCursor.foreground': '#22d3ee',
        'editorLineNumber.foreground': '#4b5563',
        'editorLineNumber.activeForeground': '#9ca3af',
        'editor.selectionHighlightBackground': '#374151',
        'editorIndentGuide.background': '#1f2937',
        'editorIndentGuide.activeBackground': '#374151',
      },
    });
    
    monacoInstance.editor.setTheme('otel-dark');
  }, []);
  
  // Update error markers in editor
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    
    const model = editorRef.current.getModel();
    if (!model) return;
    
    const markers: monaco.editor.IMarkerData[] = parseResult.errors.map(error => ({
      severity: error.severity === 'error' 
        ? monacoRef.current!.MarkerSeverity.Error 
        : monacoRef.current!.MarkerSeverity.Warning,
      message: error.message,
      startLineNumber: error.line || 1,
      startColumn: error.column || 1,
      endLineNumber: error.line || 1,
      endColumn: 1000,
    }));
    
    monacoRef.current.editor.setModelMarkers(model, 'otel-validator', markers);
  }, [parseResult.errors]);
  
  // Jump to error line
  const handleErrorClick = useCallback((line?: number) => {
    if (!editorRef.current || !line) return;
    
    editorRef.current.revealLineInCenter(line);
    editorRef.current.setPosition({ lineNumber: line, column: 1 });
    editorRef.current.focus();
  }, []);
  
  // Reset to sample config
  const handleReset = useCallback(() => {
    setYamlContent(sampleConfig);
    setParseResult(parseOTelConfig(sampleConfig));
  }, []);
  
  // Download configuration
  const handleDownload = useCallback(() => {
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'otel-collector-config.yaml';
    a.click();
    URL.revokeObjectURL(url);
  }, [yamlContent]);
  
  // Upload configuration
  const handleUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.yaml,.yml';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setYamlContent(content);
        setParseResult(parseOTelConfig(content));
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);
  
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-semibold font-mono tracking-tight">
              OTel Config Playground
            </h1>
          </div>
          <span className="text-xs text-muted-foreground font-mono px-2 py-0.5 bg-muted rounded">
            v1.0
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUpload}
            className="font-mono text-xs"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            Import
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="font-mono text-xs"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="font-mono text-xs"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Reset
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Editor panel */}
          <ResizablePanel defaultSize={40} minSize={25}>
            <div className="h-full flex flex-col">
              {/* Editor header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-muted-foreground">config.yaml</span>
                  {parseResult.isValid ? (
                    <span className="px-1.5 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded">
                      valid
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                      invalid
                    </span>
                  )}
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setParseResult(parseOTelConfig(yamlContent))}
                  className="font-mono text-xs h-7"
                >
                  <Play className="w-3 h-3 mr-1.5" />
                  Validate
                </Button>
              </div>
              
              {/* Monaco Editor */}
              <div className="flex-1">
                <Editor
                  height="100%"
                  defaultLanguage="yaml"
                  value={yamlContent}
                  onChange={handleEditorChange}
                  onMount={handleEditorMount}
                  options={{
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontLigatures: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    renderLineHighlight: 'line',
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                    smoothScrolling: true,
                    padding: { top: 16, bottom: 16 },
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'on',
                  }}
                  loading={
                    <div className="h-full flex items-center justify-center text-muted-foreground font-mono">
                      Loading editor...
                    </div>
                  }
                />
              </div>
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle className="bg-border" />
          
          {/* Visualization panel */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              {/* Pipeline visualization */}
              <ResizablePanel defaultSize={70} minSize={30}>
                <div className="h-full flex flex-col">
                  {/* Visualization header */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2 font-mono text-sm">
                      <span className="text-muted-foreground">Pipeline Visualization</span>
                    </div>
                    <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                        <span>Receivers</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                        <span>Processors</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <span>Exporters</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* React Flow visualization */}
                  <div className="flex-1">
                    <PipelineVisualization parseResult={parseResult} />
                  </div>
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle className="bg-border" />
              
              {/* Error console */}
              <ResizablePanel 
                defaultSize={30} 
                minSize={10}
                collapsible
                collapsedSize={5}
              >
                <div className="h-full flex flex-col">
                  {/* Console toggle header */}
                  <button
                    onClick={() => setIsConsoleExpanded(!isConsoleExpanded)}
                    className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-mono text-sm text-muted-foreground">
                      Validation Console
                    </span>
                    {isConsoleExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  
                  {/* Console content */}
                  <div className={cn(
                    'flex-1 overflow-hidden transition-all duration-200',
                    !isConsoleExpanded && 'h-0'
                  )}>
                    <ErrorConsole 
                      errors={parseResult.errors}
                      isValid={parseResult.isValid}
                      onErrorClick={handleErrorClick}
                    />
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

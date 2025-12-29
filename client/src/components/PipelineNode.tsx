/**
 * Pipeline Node Components for React Flow
 * 
 * Terminal/CLI Aesthetic: Monospace typography, glow effects,
 * color-coded by component type with configuration tooltips.
 */

import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { 
  Radio, 
  Cog, 
  Send, 
  Link2, 
  Puzzle,
  AlertCircle,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ComponentType = 'receiver' | 'processor' | 'exporter' | 'connector' | 'extension';

export interface PipelineNodeData {
  label: string;
  fullName: string;
  componentType: ComponentType;
  hasError?: boolean;
  isActive?: boolean;
  isConnector?: boolean;
  config?: Record<string, unknown>;
}

const typeConfig: Record<ComponentType, {
  icon: typeof Radio;
  colorClass: string;
  borderColor: string;
  bgColor: string;
  glowColor: string;
  label: string;
}> = {
  receiver: {
    icon: Radio,
    colorClass: 'text-cyan-400',
    borderColor: 'border-cyan-500/50',
    bgColor: 'bg-cyan-500/10',
    glowColor: 'shadow-cyan-500/20',
    label: 'Receiver',
  },
  processor: {
    icon: Cog,
    colorClass: 'text-purple-400',
    borderColor: 'border-purple-500/50',
    bgColor: 'bg-purple-500/10',
    glowColor: 'shadow-purple-500/20',
    label: 'Processor',
  },
  exporter: {
    icon: Send,
    colorClass: 'text-emerald-400',
    borderColor: 'border-emerald-500/50',
    bgColor: 'bg-emerald-500/10',
    glowColor: 'shadow-emerald-500/20',
    label: 'Exporter',
  },
  connector: {
    icon: Link2,
    colorClass: 'text-amber-400',
    borderColor: 'border-amber-500/50',
    bgColor: 'bg-amber-500/10',
    glowColor: 'shadow-amber-500/20',
    label: 'Connector',
  },
  extension: {
    icon: Puzzle,
    colorClass: 'text-blue-400',
    borderColor: 'border-blue-500/50',
    bgColor: 'bg-blue-500/10',
    glowColor: 'shadow-blue-500/20',
    label: 'Extension',
  },
};

// Format config value for display
function formatConfigValue(value: unknown, depth = 0): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.length <= 3 && value.every(v => typeof v !== 'object')) {
      return `[${value.map(v => formatConfigValue(v, depth + 1)).join(', ')}]`;
    }
    return `[${value.length} items]`;
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return '{}';
    if (depth > 1) return `{${keys.length} keys}`;
    return keys.slice(0, 5).map(k => `${k}: ${formatConfigValue((value as Record<string, unknown>)[k], depth + 1)}`).join('\n');
  }
  return String(value);
}

// Render config as formatted list
function ConfigTooltipContent({ config, componentType, fullName }: { 
  config?: Record<string, unknown>; 
  componentType: ComponentType;
  fullName: string;
}) {
  const typeInfo = typeConfig[componentType];
  
  return (
    <div className="max-w-xs">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
        <typeInfo.icon className={cn('w-4 h-4', typeInfo.colorClass)} />
        <span className={cn('font-semibold', typeInfo.colorClass)}>{typeInfo.label}</span>
      </div>
      <div className="font-mono text-xs mb-2">
        <span className="text-muted-foreground">Name: </span>
        <span className="text-foreground">{fullName}</span>
      </div>
      
      {config && Object.keys(config).length > 0 ? (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground mb-1">Configuration:</div>
          <div className="font-mono text-xs space-y-0.5 max-h-48 overflow-y-auto">
            {Object.entries(config).slice(0, 10).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <span className="text-purple-400 shrink-0">{key}:</span>
                <span className="text-emerald-400 break-all whitespace-pre-wrap">
                  {formatConfigValue(value)}
                </span>
              </div>
            ))}
            {Object.keys(config).length > 10 && (
              <div className="text-muted-foreground italic">
                ...and {Object.keys(config).length - 10} more
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground italic">
          No configuration options
        </div>
      )}
    </div>
  );
}

interface PipelineNodeProps {
  data: PipelineNodeData;
  selected?: boolean;
}

export function PipelineNode({ data, selected }: PipelineNodeProps) {
  const config = typeConfig[data.componentType];
  const Icon = config.icon;
  const hasConfig = data.config && Object.keys(data.config).length > 0;
  
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'relative px-4 py-3 rounded-lg border-2 min-w-[160px] max-w-[220px]',
            'font-mono text-sm transition-all duration-200 cursor-pointer',
            config.borderColor,
            config.bgColor,
            selected && `shadow-lg ${config.glowColor}`,
            data.hasError && 'border-red-500/70 bg-red-500/10',
            data.isActive && 'animate-pulse-glow',
            data.isConnector && 'border-dashed'
          )}
        >
          {/* Input handle for processors, exporters, and connectors */}
          {(data.componentType === 'processor' || data.componentType === 'exporter' || data.componentType === 'connector') && (
            <Handle
              type="target"
              position={Position.Left}
              className={cn(
                'w-3 h-3 !bg-slate-600 border-2',
                config.borderColor
              )}
            />
          )}
          
          {/* Output handle for receivers, processors, and connectors */}
          {(data.componentType === 'receiver' || data.componentType === 'processor' || data.componentType === 'connector') && (
            <Handle
              type="source"
              position={Position.Right}
              className={cn(
                'w-3 h-3 !bg-slate-600 border-2',
                config.borderColor
              )}
            />
          )}
          
          {/* Header with icon and type label */}
          <div className="flex items-center gap-2 mb-1">
            <Icon className={cn('w-4 h-4', config.colorClass)} />
            <span className={cn('text-xs uppercase tracking-wider', config.colorClass)}>
              {config.label}
            </span>
            {data.hasError && (
              <AlertCircle className="w-4 h-4 text-red-400 ml-auto" />
            )}
            {!data.hasError && hasConfig && (
              <Info className="w-3 h-3 text-muted-foreground ml-auto opacity-50" />
            )}
          </div>
          
          {/* Component name */}
          <div className="text-foreground font-medium truncate" title={data.fullName}>
            {data.fullName}
          </div>
          
          {/* Connector indicator */}
          {data.isConnector && (
            <div className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-amber-500 text-amber-950 text-[10px] font-bold rounded">
              ⟷
            </div>
          )}
          
          {/* Subtle glow effect */}
          <div 
            className={cn(
              'absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 pointer-events-none',
              selected && 'opacity-100',
              `shadow-[0_0_15px_rgba(0,0,0,0.3)] ${config.glowColor}`
            )}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent 
        side="right" 
        className="bg-card border-border p-3"
        sideOffset={10}
      >
        <ConfigTooltipContent 
          config={data.config} 
          componentType={data.componentType}
          fullName={data.fullName}
        />
      </TooltipContent>
    </Tooltip>
  );
}

// Pipeline label node for showing pipeline name
export interface PipelineLabelData {
  label: string;
  pipelineType: 'traces' | 'metrics' | 'logs';
}

const pipelineTypeColors: Record<string, string> = {
  traces: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5',
  metrics: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  logs: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
};

interface PipelineLabelNodeProps {
  data: PipelineLabelData;
}

export function PipelineLabelNode({ data }: PipelineLabelNodeProps) {
  return (
    <div
      className={cn(
        'px-3 py-1.5 rounded border font-mono text-xs uppercase tracking-wider',
        pipelineTypeColors[data.pipelineType] || 'text-slate-400 border-slate-500/30'
      )}
    >
      {data.label}
    </div>
  );
}

// Export node types for React Flow
export const nodeTypes = {
  pipeline: PipelineNode,
  pipelineLabel: PipelineLabelNode,
};

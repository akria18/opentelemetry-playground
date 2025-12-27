/**
 * Pipeline Node Components for React Flow
 * 
 * Terminal/CLI Aesthetic: Monospace typography, glow effects,
 * color-coded by component type.
 */

import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { 
  Radio, 
  Cog, 
  Send, 
  Link2, 
  Puzzle,
  AlertCircle
} from 'lucide-react';

export type ComponentType = 'receiver' | 'processor' | 'exporter' | 'connector' | 'extension';

export interface PipelineNodeData {
  label: string;
  fullName: string;
  componentType: ComponentType;
  hasError?: boolean;
  isActive?: boolean;
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

interface PipelineNodeProps {
  data: PipelineNodeData;
  selected?: boolean;
}

export function PipelineNode({ data, selected }: PipelineNodeProps) {
  const config = typeConfig[data.componentType];
  const Icon = config.icon;
  
  return (
    <div
      className={cn(
        'relative px-4 py-3 rounded-lg border-2 min-w-[160px] max-w-[220px]',
        'font-mono text-sm transition-all duration-200',
        config.borderColor,
        config.bgColor,
        selected && `shadow-lg ${config.glowColor}`,
        data.hasError && 'border-red-500/70 bg-red-500/10',
        data.isActive && 'animate-pulse-glow'
      )}
    >
      {/* Input handle for processors and exporters */}
      {(data.componentType === 'processor' || data.componentType === 'exporter') && (
        <Handle
          type="target"
          position={Position.Left}
          className={cn(
            'w-3 h-3 !bg-slate-600 border-2',
            config.borderColor
          )}
        />
      )}
      
      {/* Output handle for receivers and processors */}
      {(data.componentType === 'receiver' || data.componentType === 'processor') && (
        <Handle
          type="source"
          position={Position.Right}
          className={cn(
            'w-3 h-3 !bg-slate-600 border-2',
            config.borderColor
          )}
        />
      )}
      
      {/* Connector has both handles */}
      {data.componentType === 'connector' && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            className={cn(
              'w-3 h-3 !bg-slate-600 border-2',
              config.borderColor
            )}
          />
          <Handle
            type="source"
            position={Position.Right}
            className={cn(
              'w-3 h-3 !bg-slate-600 border-2',
              config.borderColor
            )}
          />
        </>
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
      </div>
      
      {/* Component name */}
      <div className="text-foreground font-medium truncate" title={data.fullName}>
        {data.fullName}
      </div>
      
      {/* Subtle glow effect */}
      <div 
        className={cn(
          'absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 pointer-events-none',
          selected && 'opacity-100',
          `shadow-[0_0_15px_rgba(0,0,0,0.3)] ${config.glowColor}`
        )}
      />
    </div>
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

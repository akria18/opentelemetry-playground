/**
 * Pipeline Visualization Component
 * 
 * Renders OpenTelemetry pipelines as a flow diagram using React Flow.
 * Shows data flow from receivers through processors to exporters.
 * Supports connectors that link pipelines together.
 */

import { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './PipelineNode';
import type { ParseResult, OTelPipeline, ValidationError, OTelComponent } from '@/lib/otel-parser';

// Use Record<string, unknown> for node data to satisfy React Flow types
type FlowNodeData = Record<string, unknown>;
type FlowNode = Node<FlowNodeData>;

interface PipelineVisualizationProps {
  parseResult: ParseResult;
  onNodeClick?: (nodeId: string, componentType: string) => void;
}

// Check if a component name is a connector
function isConnector(name: string, connectors: OTelComponent[]): boolean {
  return connectors.some(c => c.fullName === name);
}

// Generate nodes and edges from parse result
function generateFlowElements(
  parseResult: ParseResult,
  errors: ValidationError[]
): { nodes: FlowNode[]; edges: Edge[] } {
  const nodes: FlowNode[] = [];
  const edges: Edge[] = [];
  let edgeCounter = 0; // Counter to ensure unique edge IDs
  
  const errorPaths = new Set(errors.map(e => e.path).filter(Boolean));
  
  // Layout constants
  const PIPELINE_SPACING = 180;
  const NODE_SPACING_X = 200;
  const LABEL_OFFSET_Y = -40;
  const START_X = 50;
  const START_Y = 100;
  
  // Track connector nodes for cross-pipeline connections
  const connectorNodes: Map<string, { nodeId: string; pipelineId: string; role: 'exporter' | 'receiver' }[]> = new Map();
  
  // Process each pipeline independently - each pipeline gets its own nodes
  parseResult.pipelines.forEach((pipeline: OTelPipeline, pipelineIndex: number) => {
    const baseY = START_Y + pipelineIndex * PIPELINE_SPACING;
    
    // Add pipeline label node
    nodes.push({
      id: `label-${pipeline.id}`,
      type: 'pipelineLabel',
      position: { x: START_X - 30, y: baseY + LABEL_OFFSET_Y },
      data: {
        label: pipeline.name,
        pipelineType: pipeline.type,
      },
      draggable: false,
      selectable: false,
    });
    
    let currentX = START_X;
    let prevNodeId: string | null = null;
    
    // Add receiver nodes - each pipeline gets its own receiver nodes
    pipeline.receivers.forEach((receiverName) => {
      const nodeId = `${pipeline.id}-receiver-${receiverName}`;
      const receiver = parseResult.receivers.find(r => r.fullName === receiverName);
      const connector = parseResult.connectors.find(c => c.fullName === receiverName);
      const isConnectorNode = isConnector(receiverName, parseResult.connectors);
      const hasError = errorPaths.has(`receivers.${receiverName}`) || 
                       errorPaths.has(`connectors.${receiverName}`) ||
                       errors.some(e => e.message.includes(`"${receiverName}"`));
      
      nodes.push({
        id: nodeId,
        type: 'pipeline',
        position: { x: currentX, y: baseY },
        data: {
          label: receiverName,
          fullName: receiverName,
          componentType: isConnectorNode ? 'connector' : 'receiver',
          hasError,
          config: connector?.config || receiver?.config,
          isConnector: isConnectorNode,
        },
      });
      
      // Track connector for cross-pipeline edges
      if (isConnectorNode) {
        if (!connectorNodes.has(receiverName)) {
          connectorNodes.set(receiverName, []);
        }
        connectorNodes.get(receiverName)!.push({ nodeId, pipelineId: pipeline.id, role: 'receiver' });
      }
      
      prevNodeId = nodeId;
      currentX += NODE_SPACING_X;
    });
    
    // Add processor nodes
    pipeline.processors.forEach((processorName) => {
      const nodeId = `${pipeline.id}-processor-${processorName}`;
      const processor = parseResult.processors.find(p => p.fullName === processorName);
      const hasError = errorPaths.has(`processors.${processorName}`) ||
                       errors.some(e => e.message.includes(`"${processorName}"`));
      
      nodes.push({
        id: nodeId,
        type: 'pipeline',
        position: { x: currentX, y: baseY },
        data: {
          label: processorName,
          fullName: processorName,
          componentType: 'processor',
          hasError,
          config: processor?.config,
        },
      });
      
      if (prevNodeId) {
        edges.push({
          id: `edge-${edgeCounter++}-${prevNodeId}-${nodeId}`,
          source: prevNodeId,
          target: nodeId,
          animated: true,
          style: { stroke: '#a855f7', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#a855f7' },
        });
      }
      
      prevNodeId = nodeId;
      currentX += NODE_SPACING_X;
    });
    
    // Add exporter nodes
    pipeline.exporters.forEach((exporterName) => {
      const nodeId = `${pipeline.id}-exporter-${exporterName}`;
      const exporter = parseResult.exporters.find(e => e.fullName === exporterName);
      const connector = parseResult.connectors.find(c => c.fullName === exporterName);
      const isConnectorNode = isConnector(exporterName, parseResult.connectors);
      const hasError = errorPaths.has(`exporters.${exporterName}`) ||
                       errorPaths.has(`connectors.${exporterName}`) ||
                       errors.some(e => e.message.includes(`"${exporterName}"`));
      
      nodes.push({
        id: nodeId,
        type: 'pipeline',
        position: { x: currentX, y: baseY },
        data: {
          label: exporterName,
          fullName: exporterName,
          componentType: isConnectorNode ? 'connector' : 'exporter',
          hasError,
          config: connector?.config || exporter?.config,
          isConnector: isConnectorNode,
        },
      });
      
      // Track connector for cross-pipeline edges
      if (isConnectorNode) {
        if (!connectorNodes.has(exporterName)) {
          connectorNodes.set(exporterName, []);
        }
        connectorNodes.get(exporterName)!.push({ nodeId, pipelineId: pipeline.id, role: 'exporter' });
      }
      
      if (prevNodeId) {
        edges.push({
          id: `edge-${edgeCounter++}-${prevNodeId}-${nodeId}`,
          source: prevNodeId,
          target: nodeId,
          animated: true,
          style: { stroke: isConnectorNode ? '#f59e0b' : '#10b981', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: isConnectorNode ? '#f59e0b' : '#10b981' },
        });
      }
      
      prevNodeId = nodeId;
      currentX += NODE_SPACING_X;
    });
    
    // Connect receivers to first processor (or first exporter if no processors)
    if (pipeline.receivers.length > 0) {
      const firstTargetId = pipeline.processors.length > 0
        ? `${pipeline.id}-processor-${pipeline.processors[0]}`
        : pipeline.exporters.length > 0
          ? `${pipeline.id}-exporter-${pipeline.exporters[0]}`
          : null;
      
      if (firstTargetId) {
        pipeline.receivers.forEach((receiverName, idx) => {
          const sourceId = `${pipeline.id}-receiver-${receiverName}`;
          const isConnectorNode = isConnector(receiverName, parseResult.connectors);
          // Only connect if this is the last receiver (to avoid duplicate edges)
          if (idx === pipeline.receivers.length - 1) {
            edges.push({
              id: `edge-${edgeCounter++}-${sourceId}-${firstTargetId}`,
              source: sourceId,
              target: firstTargetId,
              animated: true,
              style: { stroke: isConnectorNode ? '#f59e0b' : '#22d3ee', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: isConnectorNode ? '#f59e0b' : '#22d3ee' },
            });
          }
        });
      }
    }
  });
  
  // Add cross-pipeline connector edges (from exporter to receiver)
  connectorNodes.forEach((nodeList, connectorName) => {
    const exporters = nodeList.filter(n => n.role === 'exporter');
    const receivers = nodeList.filter(n => n.role === 'receiver');
    
    // Connect each exporter to each receiver of the same connector
    exporters.forEach(exp => {
      receivers.forEach(rec => {
        if (exp.pipelineId !== rec.pipelineId) {
          edges.push({
            id: `edge-${edgeCounter++}-connector-${connectorName}-${exp.pipelineId}-${rec.pipelineId}`,
            source: exp.nodeId,
            target: rec.nodeId,
            animated: true,
            style: { 
              stroke: '#f59e0b', 
              strokeWidth: 2,
              strokeDasharray: '5,5',
            },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
            label: connectorName,
            labelStyle: { fill: '#f59e0b', fontSize: 10, fontFamily: 'monospace' },
            labelBgStyle: { fill: '#1f2937', fillOpacity: 0.9 },
            labelBgPadding: [4, 4] as [number, number],
            labelBgBorderRadius: 4,
          });
        }
      });
    });
  });
  
  // Add connectors section if any exist (standalone connectors not in pipelines)
  const usedConnectors = new Set<string>();
  parseResult.pipelines.forEach(p => {
    p.receivers.forEach(r => {
      if (isConnector(r, parseResult.connectors)) usedConnectors.add(r);
    });
    p.exporters.forEach(e => {
      if (isConnector(e, parseResult.connectors)) usedConnectors.add(e);
    });
  });
  
  const unusedConnectors = parseResult.connectors.filter(c => !usedConnectors.has(c.fullName));
  
  if (unusedConnectors.length > 0) {
    const connectorY = START_Y + parseResult.pipelines.length * PIPELINE_SPACING + 30;
    let connectorX = START_X;
    
    // Add connectors label
    nodes.push({
      id: 'label-connectors',
      type: 'pipelineLabel',
      position: { x: START_X - 30, y: connectorY + LABEL_OFFSET_Y },
      data: {
        label: 'Connectors',
        pipelineType: 'traces',
      },
      draggable: false,
      selectable: false,
    });
    
    unusedConnectors.forEach((connector) => {
      const hasError = errorPaths.has(`connectors.${connector.fullName}`) ||
                       errors.some(e => e.message.includes(`"${connector.fullName}"`));
      
      nodes.push({
        id: `connector-${connector.fullName}`,
        type: 'pipeline',
        position: { x: connectorX, y: connectorY },
        data: {
          label: connector.fullName,
          fullName: connector.fullName,
          componentType: 'connector',
          hasError,
          config: connector.config,
          isConnector: true,
        },
      });
      connectorX += NODE_SPACING_X;
    });
  }
  
  // Add extensions as a separate row if any exist
  if (parseResult.extensions.length > 0) {
    const extensionY = START_Y + parseResult.pipelines.length * PIPELINE_SPACING + 
                       (unusedConnectors.length > 0 ? PIPELINE_SPACING : 0) + 30;
    let extensionX = START_X;
    
    // Add extensions label
    nodes.push({
      id: 'label-extensions',
      type: 'pipelineLabel',
      position: { x: START_X - 30, y: extensionY + LABEL_OFFSET_Y },
      data: {
        label: 'Extensions',
        pipelineType: 'logs',
      },
      draggable: false,
      selectable: false,
    });
    
    parseResult.extensions.forEach((extension) => {
      const isEnabled = parseResult.enabledExtensions.includes(extension.fullName);
      const hasError = errorPaths.has(`extensions.${extension.fullName}`) ||
                       errors.some(e => e.message.includes(`"${extension.fullName}"`));
      
      nodes.push({
        id: `extension-${extension.fullName}`,
        type: 'pipeline',
        position: { x: extensionX, y: extensionY },
        data: {
          label: extension.fullName,
          fullName: extension.fullName,
          componentType: 'extension',
          hasError: hasError || !isEnabled,
          isActive: isEnabled,
          config: extension.config,
        },
      });
      extensionX += NODE_SPACING_X;
    });
  }
  
  return { nodes, edges };
}

export function PipelineVisualization({ parseResult, onNodeClick }: PipelineVisualizationProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => generateFlowElements(parseResult, parseResult.errors),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Update nodes when parse result changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = generateFlowElements(parseResult, parseResult.errors);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [parseResult, setNodes, setEdges]);
  
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: FlowNode) => {
      if (onNodeClick && node.data) {
        const componentType = node.data.componentType as string;
        if (componentType) {
          onNodeClick(node.id, componentType);
        }
      }
    },
    [onNodeClick]
  );
  
  if (parseResult.pipelines.length === 0 && parseResult.extensions.length === 0 && parseResult.connectors.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground font-mono">
        <div className="text-center">
          <div className="text-lg mb-2">No pipelines defined</div>
          <div className="text-sm opacity-70">
            Add a service.pipelines section to visualize your configuration
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        defaultEdgeOptions={{
          animated: true,
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1} 
          color="rgba(255,255,255,0.05)" 
        />
        <Controls 
          className="!bg-card !border-border !rounded-lg overflow-hidden"
          showInteractive={false}
        />
        <MiniMap 
          className="!bg-card !border-border !rounded-lg"
          nodeColor={(node) => {
            const hasError = node.data?.hasError as boolean;
            const componentType = node.data?.componentType as string;
            if (hasError) return '#f87171';
            switch (componentType) {
              case 'receiver': return '#22d3ee';
              case 'processor': return '#a855f7';
              case 'exporter': return '#10b981';
              case 'connector': return '#f59e0b';
              case 'extension': return '#3b82f6';
              default: return '#64748b';
            }
          }}
          maskColor="rgba(0,0,0,0.8)"
        />
      </ReactFlow>
    </div>
  );
}

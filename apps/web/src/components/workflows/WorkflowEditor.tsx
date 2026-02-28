'use client';

import { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './nodes';
import { ConfigPanel } from './ConfigPanel';
import { VariablesPanel } from './VariablesPanel';
import { Button } from '@/components/ui/button';
import {
  Zap,
  Bot,
  GitBranch,
  ShieldCheck,
  Timer,
  FileOutput,
  Variable,
} from 'lucide-react';
import type { WorkflowVariable } from '@ai-office/shared';

interface WorkflowEditorProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  initialVariables?: WorkflowVariable[];
  onSave?: (nodes: Node[], edges: Edge[], variables: WorkflowVariable[]) => void;
}

const NODE_TEMPLATES: Record<
  string,
  { type: string; data: Record<string, unknown>; icon: typeof Zap; label: string; color: string }
> = {
  trigger: {
    type: 'trigger',
    data: { nodeType: 'trigger', triggerType: 'manual' },
    icon: Zap,
    label: 'Trigger',
    color: '#2EA043',
  },
  agent: {
    type: 'agent',
    data: { nodeType: 'agent', agentId: '', agentName: '' },
    icon: Bot,
    label: 'Agent',
    color: '#3B82F6',
  },
  condition: {
    type: 'condition',
    data: { nodeType: 'condition', conditionType: 'llm_eval', condition: '' },
    icon: GitBranch,
    label: 'Condition',
    color: '#D29922',
  },
  approval: {
    type: 'approval',
    data: { nodeType: 'approval', approverRole: '' },
    icon: ShieldCheck,
    label: 'Approval',
    color: '#D29922',
  },
  delay: {
    type: 'delay',
    data: { nodeType: 'delay', duration: 5, unit: 'minutes' },
    icon: Timer,
    label: 'Delay',
    color: '#484F58',
  },
  output: {
    type: 'output',
    data: { nodeType: 'output', outputType: 'log' },
    icon: FileOutput,
    label: 'Output',
    color: '#8B5CF6',
  },
};

const defaultEdgeOptions = {
  type: 'smoothstep',
  style: { stroke: '#484F58', strokeWidth: 1.5 },
  animated: false,
};

let nodeIdCounter = 0;
function getNextNodeId() {
  nodeIdCounter += 1;
  return `node_${Date.now()}_${nodeIdCounter}`;
}

export function WorkflowEditor({
  initialNodes = [],
  initialEdges = [],
  initialVariables = [],
  onSave,
}: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [variables, setVariables] = useState<WorkflowVariable[]>(initialVariables);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showVariables, setShowVariables] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, ...defaultEdgeOptions }, eds));
    },
    [setEdges],
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setShowVariables(false);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const addNode = useCallback(
    (templateKey: string) => {
      const template = NODE_TEMPLATES[templateKey];
      if (!template) return;

      const newNode: Node = {
        id: getNextNodeId(),
        type: template.type,
        position: {
          x: 250 + Math.random() * 100,
          y: 100 + nodes.length * 100,
        },
        data: { ...template.data },
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newNode.id);
      setShowVariables(false);
    },
    [nodes.length, setNodes],
  );

  const handleNodeDataUpdate = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? { ...n, data } : n)),
      );
    },
    [setNodes],
  );

  const handleCloseConfig = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  return (
    <div className="flex h-full w-full" ref={reactFlowWrapper}>
      <div className="relative flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          snapToGrid
          snapGrid={[16, 16]}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          colorMode="dark"
          proOptions={{ hideAttribution: true }}
          fitView={initialNodes.length > 0}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} color="#1a1f2e" />
          <MiniMap
            position="bottom-right"
            style={{
              backgroundColor: '#0A0E14',
              border: '1px solid #1c2333',
            }}
            maskColor="rgba(0, 0, 0, 0.6)"
            nodeColor={(node) => {
              const colors: Record<string, string> = {
                trigger: '#2EA043',
                agent: '#3B82F6',
                condition: '#D29922',
                approval: '#D29922',
                delay: '#484F58',
                output: '#8B5CF6',
              };
              return colors[node.type ?? ''] ?? '#484F58';
            }}
          />
          <Controls
            position="bottom-left"
            style={{
              border: '1px solid #1c2333',
              borderRadius: 0,
            }}
          />
          <Panel position="top-left" className="!m-3">
            {showVariables ? (
              <VariablesPanel
                variables={variables}
                onChange={setVariables}
                nodes={nodes}
                onClose={() => setShowVariables(false)}
              />
            ) : (
              <div className="border border-border-default bg-bg-raised p-2 space-y-1.5">
                <p className="text-[8px] uppercase tracking-[0.15em] text-text-muted mb-2">
                  Add Node
                </p>
                {Object.entries(NODE_TEMPLATES).map(([key, tpl]) => {
                  const Icon = tpl.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => addNode(key)}
                      className="flex w-full items-center gap-2 border border-border-default bg-bg-base px-2 py-1.5 text-[10px] text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
                    >
                      <Icon size={11} strokeWidth={1.5} style={{ color: tpl.color }} />
                      <span>{tpl.label}</span>
                    </button>
                  );
                })}
                <button
                  onClick={() => setShowVariables(true)}
                  className="flex w-full items-center gap-2 border border-border-default bg-bg-base px-2 py-1.5 text-[10px] text-accent-cyan transition-colors hover:border-border-hover"
                >
                  <Variable size={11} strokeWidth={1.5} />
                  <span>Variables</span>
                  {variables.length > 0 && (
                    <span className="ml-auto text-[8px] text-text-muted">{variables.length}</span>
                  )}
                </button>
              </div>
            )}
          </Panel>
          {onSave && (
            <Panel position="top-right" className="!m-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onSave(nodes, edges, variables)}
              >
                Save
              </Button>
            </Panel>
          )}
        </ReactFlow>
      </div>
      {selectedNode && (
        <ConfigPanel
          node={selectedNode}
          onUpdate={handleNodeDataUpdate}
          onClose={handleCloseConfig}
        />
      )}
    </div>
  );
}

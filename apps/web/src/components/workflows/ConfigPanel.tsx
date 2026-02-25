'use client';

import { type Node } from '@xyflow/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ConfigPanelProps {
  node: Node;
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void;
  onClose: () => void;
}

const TRIGGER_TYPES = ['scheduled', 'event', 'manual', 'webhook'] as const;
const OUTPUT_TYPES = ['email', 'slack', 'webhook', 'log'] as const;
const DELAY_UNITS = ['minutes', 'hours', 'days'] as const;

function TriggerConfig({ node, onUpdate }: { node: Node; onUpdate: ConfigPanelProps['onUpdate'] }) {
  const data = node.data as { triggerType?: string; cronExpression?: string };
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          Trigger Type
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {TRIGGER_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => onUpdate(node.id, { ...node.data, triggerType: type })}
              className={`border px-2 py-1.5 text-[10px] transition-colors ${
                data.triggerType === type
                  ? 'border-[#2EA043] bg-[#2EA043]/10 text-[#2EA043]'
                  : 'border-border-default bg-bg-base text-text-secondary hover:border-border-hover'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      {data.triggerType === 'scheduled' && (
        <div>
          <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
            Cron Expression
          </label>
          <Input
            value={(data.cronExpression as string) ?? ''}
            onChange={(e) =>
              onUpdate(node.id, { ...node.data, cronExpression: e.target.value })
            }
            placeholder="0 * * * *"
          />
        </div>
      )}
    </div>
  );
}

function AgentConfig({ node, onUpdate }: { node: Node; onUpdate: ConfigPanelProps['onUpdate'] }) {
  const data = node.data as { agentName?: string; agentId?: string };
  const dummyAgents = [
    { id: 'agent-1', name: 'Research Agent' },
    { id: 'agent-2', name: 'Writer Agent' },
    { id: 'agent-3', name: 'Analyst Agent' },
    { id: 'agent-4', name: 'Coordinator Agent' },
  ];
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          Agent
        </label>
        <select
          value={data.agentId ?? ''}
          onChange={(e) => {
            const agent = dummyAgents.find((a) => a.id === e.target.value);
            onUpdate(node.id, {
              ...node.data,
              agentId: e.target.value,
              agentName: agent?.name ?? '',
            });
          }}
          className="w-full border border-border-default bg-bg-base px-2.5 py-1.5 text-xs text-text-primary transition-colors focus:border-accent-cyan focus:outline-none"
        >
          <option value="">Select agent...</option>
          {dummyAgents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ConditionConfig({ node, onUpdate }: { node: Node; onUpdate: ConfigPanelProps['onUpdate'] }) {
  const data = node.data as { condition?: string };
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          Condition
        </label>
        <textarea
          value={(data.condition as string) ?? ''}
          onChange={(e) => onUpdate(node.id, { ...node.data, condition: e.target.value })}
          placeholder="Describe the condition in plain language..."
          rows={4}
          className="w-full border border-border-default bg-bg-base px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted transition-colors focus:border-accent-cyan focus:outline-none resize-none"
        />
      </div>
    </div>
  );
}

function ApprovalConfig({ node, onUpdate }: { node: Node; onUpdate: ConfigPanelProps['onUpdate'] }) {
  const data = node.data as { approver?: string; timeoutMinutes?: number };
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          Approver
        </label>
        <select
          value={(data.approver as string) ?? ''}
          onChange={(e) => onUpdate(node.id, { ...node.data, approver: e.target.value })}
          className="w-full border border-border-default bg-bg-base px-2.5 py-1.5 text-xs text-text-primary transition-colors focus:border-accent-cyan focus:outline-none"
        >
          <option value="">Select approver...</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="team-lead">Team Lead</option>
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          Timeout (minutes)
        </label>
        <Input
          type="number"
          min={1}
          value={data.timeoutMinutes ?? ''}
          onChange={(e) =>
            onUpdate(node.id, {
              ...node.data,
              timeoutMinutes: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          placeholder="60"
        />
      </div>
    </div>
  );
}

function DelayConfig({ node, onUpdate }: { node: Node; onUpdate: ConfigPanelProps['onUpdate'] }) {
  const data = node.data as { duration?: number; unit?: string };
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          Duration
        </label>
        <Input
          type="number"
          min={1}
          value={data.duration ?? ''}
          onChange={(e) =>
            onUpdate(node.id, {
              ...node.data,
              duration: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          placeholder="5"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          Unit
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {DELAY_UNITS.map((unit) => (
            <button
              key={unit}
              onClick={() => onUpdate(node.id, { ...node.data, unit })}
              className={`border px-2 py-1.5 text-[10px] transition-colors ${
                data.unit === unit
                  ? 'border-[#484F58] bg-[#484F58]/10 text-text-primary'
                  : 'border-border-default bg-bg-base text-text-secondary hover:border-border-hover'
              }`}
            >
              {unit}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function OutputConfig({ node, onUpdate }: { node: Node; onUpdate: ConfigPanelProps['onUpdate'] }) {
  const data = node.data as { outputType?: string; destination?: string };
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          Output Type
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {OUTPUT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => onUpdate(node.id, { ...node.data, outputType: type })}
              className={`border px-2 py-1.5 text-[10px] transition-colors ${
                data.outputType === type
                  ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 text-[#8B5CF6]'
                  : 'border-border-default bg-bg-base text-text-secondary hover:border-border-hover'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          Destination
        </label>
        <Input
          value={(data.destination as string) ?? ''}
          onChange={(e) => onUpdate(node.id, { ...node.data, destination: e.target.value })}
          placeholder={
            data.outputType === 'email'
              ? 'user@example.com'
              : data.outputType === 'slack'
                ? '#channel'
                : data.outputType === 'webhook'
                  ? 'https://...'
                  : 'log name'
          }
        />
      </div>
    </div>
  );
}

const NODE_LABELS: Record<string, string> = {
  trigger: 'Trigger',
  agent: 'Agent',
  condition: 'Condition',
  approval: 'Approval',
  delay: 'Delay',
  output: 'Output',
};

const NODE_COLORS: Record<string, string> = {
  trigger: '#2EA043',
  agent: '#3B82F6',
  condition: '#D29922',
  approval: '#D29922',
  delay: '#484F58',
  output: '#8B5CF6',
};

export function ConfigPanel({ node, onUpdate, onClose }: ConfigPanelProps) {
  const nodeType = node.type ?? 'unknown';
  const color = NODE_COLORS[nodeType] ?? '#484F58';

  return (
    <div className="h-full w-80 border-l border-border-default bg-bg-raised overflow-y-auto">
      <div className="flex items-center justify-between border-b border-border-default p-3">
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2"
            style={{ backgroundColor: color }}
          />
          <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-text-primary">
            {NODE_LABELS[nodeType] ?? nodeType}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="!p-1">
          <X size={12} />
        </Button>
      </div>
      <div className="p-3">
        {nodeType === 'trigger' && <TriggerConfig node={node} onUpdate={onUpdate} />}
        {nodeType === 'agent' && <AgentConfig node={node} onUpdate={onUpdate} />}
        {nodeType === 'condition' && <ConditionConfig node={node} onUpdate={onUpdate} />}
        {nodeType === 'approval' && <ApprovalConfig node={node} onUpdate={onUpdate} />}
        {nodeType === 'delay' && <DelayConfig node={node} onUpdate={onUpdate} />}
        {nodeType === 'output' && <OutputConfig node={node} onUpdate={onUpdate} />}
      </div>
    </div>
  );
}

'use client';

import { type Node } from '@xyflow/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc/client';

interface ConfigPanelProps {
  node: Node;
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void;
  onClose: () => void;
}

const TRIGGER_TYPES = ['scheduled', 'event', 'manual', 'webhook'] as const;
const OUTPUT_TYPES = ['email', 'webhook', 'log'] as const;
const DELAY_UNITS = ['minutes', 'hours', 'days'] as const;
const CONDITION_TYPES = ['llm_eval', 'contains', 'json_path'] as const;
const CONDITION_TYPE_LABELS: Record<string, string> = {
  llm_eval: 'AI Eval',
  contains: 'Contains',
  json_path: 'JSON Path',
};

function TriggerConfig({ node, onUpdate }: { node: Node; onUpdate: ConfigPanelProps['onUpdate'] }) {
  const data = node.data as { triggerType?: string; cronExpression?: string; eventName?: string };
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
      {data.triggerType === 'event' && (
        <div>
          <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
            Event Name
          </label>
          <Input
            value={(data.eventName as string) ?? ''}
            onChange={(e) =>
              onUpdate(node.id, { ...node.data, eventName: e.target.value })
            }
            placeholder="order.created"
          />
        </div>
      )}
    </div>
  );
}

function AgentConfig({ node, onUpdate }: { node: Node; onUpdate: ConfigPanelProps['onUpdate'] }) {
  const data = node.data as { agentName?: string; agentId?: string; promptTemplate?: string };
  const { data: agents } = trpc.agents.list.useQuery();

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          Agent
        </label>
        <select
          value={data.agentId ?? ''}
          onChange={(e) => {
            const agent = agents?.find((a: { id: string; name: string }) => a.id === e.target.value);
            onUpdate(node.id, {
              ...node.data,
              agentId: e.target.value,
              agentName: agent?.name ?? '',
            });
          }}
          className="w-full border border-border-default bg-bg-base px-2.5 py-1.5 text-xs text-text-primary transition-colors focus:border-accent-cyan focus:outline-none"
        >
          <option value="">Select agent...</option>
          {agents?.map((agent: { id: string; name: string }) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          Prompt Template
        </label>
        <textarea
          value={(data.promptTemplate as string) ?? ''}
          onChange={(e) => onUpdate(node.id, { ...node.data, promptTemplate: e.target.value })}
          placeholder={'Use {{variable}} to reference workflow variables...'}
          rows={4}
          className="w-full border border-border-default bg-bg-base px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted transition-colors focus:border-accent-cyan focus:outline-none resize-none font-mono"
        />
        <p className="mt-1 text-[8px] text-text-muted">
          Tip: Use {'{{variableName}}'} to inject variables
        </p>
      </div>
    </div>
  );
}

function ConditionConfig({ node, onUpdate }: { node: Node; onUpdate: ConfigPanelProps['onUpdate'] }) {
  const data = node.data as {
    conditionType?: string;
    condition?: string;
    jsonPath?: string;
    expectedValue?: string;
  };
  const conditionType = data.conditionType ?? 'llm_eval';

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          Condition Type
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {CONDITION_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => onUpdate(node.id, { ...node.data, conditionType: type })}
              className={`border px-2 py-1.5 text-[10px] transition-colors ${
                conditionType === type
                  ? 'border-[#D29922] bg-[#D29922]/10 text-[#D29922]'
                  : 'border-border-default bg-bg-base text-text-secondary hover:border-border-hover'
              }`}
            >
              {CONDITION_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {conditionType === 'llm_eval' ? 'Condition (natural language)' : 'Search Text'}
        </label>
        <textarea
          value={(data.condition as string) ?? ''}
          onChange={(e) => onUpdate(node.id, { ...node.data, condition: e.target.value })}
          placeholder={
            conditionType === 'llm_eval'
              ? 'Does the response indicate a positive sentiment?'
              : conditionType === 'contains'
                ? 'Text to search for...'
                : 'Condition value...'
          }
          rows={3}
          className="w-full border border-border-default bg-bg-base px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted transition-colors focus:border-accent-cyan focus:outline-none resize-none"
        />
      </div>
      {conditionType === 'json_path' && (
        <>
          <div>
            <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
              JSON Path
            </label>
            <Input
              value={(data.jsonPath as string) ?? ''}
              onChange={(e) => onUpdate(node.id, { ...node.data, jsonPath: e.target.value })}
              placeholder="data.status"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
              Expected Value
            </label>
            <Input
              value={(data.expectedValue as string) ?? ''}
              onChange={(e) => onUpdate(node.id, { ...node.data, expectedValue: e.target.value })}
              placeholder="success"
            />
          </div>
        </>
      )}
    </div>
  );
}

function ApprovalConfig({ node, onUpdate }: { node: Node; onUpdate: ConfigPanelProps['onUpdate'] }) {
  const data = node.data as { approverRole?: string; timeoutMinutes?: number; autoAction?: string };
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          Approver Role
        </label>
        <select
          value={(data.approverRole as string) ?? ''}
          onChange={(e) => onUpdate(node.id, { ...node.data, approverRole: e.target.value })}
          className="w-full border border-border-default bg-bg-base px-2.5 py-1.5 text-xs text-text-primary transition-colors focus:border-accent-cyan focus:outline-none"
        >
          <option value="">Select role...</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
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
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          Auto Action (on timeout)
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {(['approve', 'reject'] as const).map((action) => (
            <button
              key={action}
              onClick={() => onUpdate(node.id, { ...node.data, autoAction: action })}
              className={`border px-2 py-1.5 text-[10px] transition-colors ${
                data.autoAction === action
                  ? 'border-[#D29922] bg-[#D29922]/10 text-[#D29922]'
                  : 'border-border-default bg-bg-base text-text-secondary hover:border-border-hover'
              }`}
            >
              {action}
            </button>
          ))}
        </div>
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
  const data = node.data as { outputType?: string; destination?: string; templateContent?: string };
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          Output Type
        </label>
        <div className="grid grid-cols-3 gap-1.5">
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
      {data.outputType !== 'log' && (
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
                : data.outputType === 'webhook'
                  ? 'https://...'
                  : 'log name'
            }
          />
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          Template Content
        </label>
        <textarea
          value={(data.templateContent as string) ?? ''}
          onChange={(e) => onUpdate(node.id, { ...node.data, templateContent: e.target.value })}
          placeholder={'Use {{variable}} to inject workflow variables...'}
          rows={4}
          className="w-full border border-border-default bg-bg-base px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted transition-colors focus:border-accent-cyan focus:outline-none resize-none font-mono"
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

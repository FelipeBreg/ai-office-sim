'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Bot } from 'lucide-react';

type AgentData = {
  agentName?: string;
  agentId?: string;
  label?: string;
};

function AgentNode({ data, selected }: NodeProps) {
  const d = data as AgentData;

  return (
    <div
      className={`w-40 border bg-bg-raised p-3 ${selected ? 'border-[#3B82F6]' : 'border-border-default'}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-border-default !bg-[#3B82F6]"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center border border-[#3B82F6]/30 bg-[#3B82F6]/10">
          <Bot size={12} strokeWidth={1.5} className="text-[#3B82F6]" />
        </div>
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#3B82F6]">
            Agent
          </p>
          <p className="text-[8px] text-text-muted truncate max-w-[90px]">
            {d.agentName || 'Select agent...'}
          </p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-border-default !bg-[#3B82F6]"
      />
    </div>
  );
}

export default memo(AgentNode);

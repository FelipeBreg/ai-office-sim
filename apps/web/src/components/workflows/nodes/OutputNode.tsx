'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Mail, MessageSquare, Globe, FileText } from 'lucide-react';

const OUTPUT_ICONS = {
  email: Mail,
  slack: MessageSquare,
  webhook: Globe,
  log: FileText,
} as const;

type OutputData = {
  outputType?: 'email' | 'slack' | 'webhook' | 'log';
  destination?: string;
  label?: string;
};

function OutputNode({ data, selected }: NodeProps) {
  const d = data as OutputData;
  const outputType = d.outputType ?? 'log';
  const Icon = OUTPUT_ICONS[outputType] ?? FileText;

  return (
    <div
      className={`w-40 border bg-bg-raised p-3 ${selected ? 'border-[#8B5CF6]' : 'border-border-default'}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-border-default !bg-[#8B5CF6]"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center border border-[#8B5CF6]/30 bg-[#8B5CF6]/10">
          <Icon size={12} strokeWidth={1.5} className="text-[#8B5CF6]" />
        </div>
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#8B5CF6]">
            Output
          </p>
          <p className="text-[8px] text-text-muted">
            {outputType}
          </p>
        </div>
      </div>
    </div>
  );
}

export default memo(OutputNode);

'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Clock, Zap, Hand, Globe } from 'lucide-react';

const TRIGGER_ICONS = {
  scheduled: Clock,
  event: Zap,
  manual: Hand,
  webhook: Globe,
} as const;

type TriggerData = {
  triggerType: 'scheduled' | 'event' | 'manual' | 'webhook';
  label?: string;
  cronExpression?: string;
};

function TriggerNode({ data, selected }: NodeProps) {
  const d = data as TriggerData;
  const Icon = TRIGGER_ICONS[d.triggerType] ?? Zap;

  return (
    <div
      className={`w-40 border bg-bg-raised p-3 ${selected ? 'border-[#2EA043]' : 'border-border-default'}`}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center border border-[#2EA043]/30 bg-[#2EA043]/10">
          <Icon size={12} strokeWidth={1.5} className="text-[#2EA043]" />
        </div>
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#2EA043]">
            Trigger
          </p>
          <p className="text-[8px] text-text-muted">{d.triggerType}</p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-border-default !bg-[#2EA043]"
      />
    </div>
  );
}

export default memo(TriggerNode);

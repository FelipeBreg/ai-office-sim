'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Timer } from 'lucide-react';

type DelayData = {
  duration?: number;
  unit?: 'minutes' | 'hours' | 'days';
  label?: string;
};

function formatDelay(duration?: number, unit?: string): string {
  if (!duration || !unit) return 'Set delay...';
  return `${duration} ${unit}`;
}

function DelayNode({ data, selected }: NodeProps) {
  const d = data as DelayData;

  return (
    <div
      className={`w-40 border bg-bg-raised p-3 ${selected ? 'border-[#484F58]' : 'border-border-default'}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-border-default !bg-[#484F58]"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center border border-[#484F58]/30 bg-[#484F58]/10">
          <Timer size={12} strokeWidth={1.5} className="text-[#484F58]" />
        </div>
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#484F58]">
            Delay
          </p>
          <p className="text-[8px] text-text-muted">
            {formatDelay(d.duration, d.unit)}
          </p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-border-default !bg-[#484F58]"
      />
    </div>
  );
}

export default memo(DelayNode);

'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

type ConditionData = {
  condition?: string;
  label?: string;
};

function ConditionNode({ data, selected }: NodeProps) {
  const d = data as ConditionData;

  return (
    <div
      className={`w-40 border bg-bg-raised p-3 ${selected ? 'border-[#D29922]' : 'border-border-default'}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-border-default !bg-[#D29922]"
      />
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center border border-[#D29922]/30 bg-[#D29922]/10">
          <GitBranch size={12} strokeWidth={1.5} className="text-[#D29922]" />
        </div>
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#D29922]">
            IF
          </p>
          <p className="text-[8px] text-text-muted truncate max-w-[90px]">
            {d.condition || 'Set condition...'}
          </p>
        </div>
      </div>
      <div className="mt-2 flex justify-between px-1">
        <span className="text-[7px] uppercase tracking-[0.1em] text-status-error">No</span>
        <span className="text-[7px] uppercase tracking-[0.1em] text-[#2EA043]">Yes</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        style={{ left: '25%' }}
        className="!h-2 !w-2 !border-border-default !bg-status-error"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        style={{ left: '75%' }}
        className="!h-2 !w-2 !border-border-default !bg-[#2EA043]"
      />
    </div>
  );
}

export default memo(ConditionNode);

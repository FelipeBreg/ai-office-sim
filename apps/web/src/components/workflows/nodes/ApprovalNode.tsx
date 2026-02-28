'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ShieldCheck } from 'lucide-react';
import type { ApprovalNodeConfig } from '@ai-office/shared';

function ApprovalNode({ data, selected }: NodeProps) {
  const d = data as unknown as Partial<ApprovalNodeConfig>;

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
          <ShieldCheck size={12} strokeWidth={1.5} className="text-[#D29922]" />
        </div>
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#D29922]">
            Approval
          </p>
          <p className="text-[8px] text-text-muted truncate max-w-[90px]">
            {d.approverRole || 'Approval required'}
          </p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-border-default !bg-[#D29922]"
      />
    </div>
  );
}

export default memo(ApprovalNode);

'use client';

import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { PendingToolCall } from '@/stores/atlas-store';

interface ApprovalPopupProps {
  toolCall: PendingToolCall;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

function formatToolName(name: string): string {
  return name
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function ApprovalPopup({ toolCall, onApprove, onReject }: ApprovalPopupProps) {
  const t = useTranslations('atlas');
  const isPending = toolCall.status === 'pending';

  return (
    <div
      className={`my-1 border-l-2 p-3 ${
        toolCall.status === 'approved'
          ? 'border-status-success bg-status-success/5'
          : toolCall.status === 'rejected'
            ? 'border-status-error bg-status-error/5'
            : 'border-status-warning bg-status-warning/5'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[8px] uppercase tracking-[0.15em] text-text-muted">
            {t('toolCallApproval')} · {formatToolName(toolCall.name)}
          </p>

          {/* Tool parameters */}
          {Object.keys(toolCall.input).length > 0 && (
            <div className="mt-1.5 space-y-0.5">
              <p className="text-[8px] uppercase tracking-wider text-text-disabled">
                {t('toolParams')}
              </p>
              {Object.entries(toolCall.input).map(([key, value]) => (
                <div key={key} className="flex gap-1.5 font-mono text-[9px]">
                  <span className="shrink-0 text-text-muted">{key}:</span>
                  <span className="text-text-secondary truncate">
                    {typeof value === 'string'
                      ? value.length > 80
                        ? value.slice(0, 80) + '...'
                        : value
                      : JSON.stringify(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isPending ? (
        <div className="mt-2 flex items-center gap-1.5">
          <Button size="sm" variant="primary" onClick={() => onApprove(toolCall.id)}>
            <Check size={10} strokeWidth={2} className="mr-0.5" />
            {t('approve')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onReject(toolCall.id)}>
            <X size={10} strokeWidth={2} className="mr-0.5" />
            {t('reject')}
          </Button>
        </div>
      ) : (
        <p
          className={`mt-2 text-[9px] font-medium ${
            toolCall.status === 'approved' ? 'text-status-success' : 'text-status-error'
          }`}
        >
          {toolCall.status === 'approved' ? t('actionApproved') : t('actionRejected')}
        </p>
      )}
    </div>
  );
}

'use client';

import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { AtlasAction } from '@/stores/atlas-store';

interface ApprovalPopupProps {
  action: AtlasAction;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function ApprovalPopup({ action, onApprove, onReject }: ApprovalPopupProps) {
  const t = useTranslations('atlas');

  const isPending = action.status === 'pending';

  return (
    <div
      className={`my-1 border-l-2 p-3 ${
        action.status === 'approved'
          ? 'border-status-success bg-status-success/5'
          : action.status === 'rejected'
            ? 'border-status-error bg-status-error/5'
            : 'border-status-warning bg-status-warning/5'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[8px] uppercase tracking-[0.15em] text-text-muted">
            {t('actionSuggestion')} · {action.type.replace(/_/g, ' ')}
          </p>
          <p className="mt-0.5 text-[10px] font-medium text-text-primary">{action.title}</p>
          <p className="mt-0.5 text-[9px] leading-relaxed text-text-secondary">{action.description}</p>
        </div>
      </div>

      {isPending ? (
        <div className="mt-2 flex items-center gap-1.5">
          <Button
            size="sm"
            variant="primary"
            onClick={() => onApprove(action.id)}
          >
            <Check size={10} strokeWidth={2} className="mr-0.5" />
            {t('approve')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onReject(action.id)}
          >
            <X size={10} strokeWidth={2} className="mr-0.5" />
            {t('reject')}
          </Button>
        </div>
      ) : (
        <p className={`mt-2 text-[9px] font-medium ${
          action.status === 'approved' ? 'text-status-success' : 'text-status-error'
        }`}>
          {action.status === 'approved' ? t('actionApproved') : t('actionRejected')}
        </p>
      )}
    </div>
  );
}

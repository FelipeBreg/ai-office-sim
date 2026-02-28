'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, X, GripVertical, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const STAGES = [
  'prospect',
  'qualified',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
] as const;

type Stage = (typeof STAGES)[number];

const STAGE_COLORS: Record<Stage, string> = {
  prospect: 'text-text-muted',
  qualified: 'text-accent-cyan',
  proposal: 'text-status-warning',
  negotiation: 'text-blue-400',
  closed_won: 'text-status-success',
  closed_lost: 'text-status-error',
};

const STAGE_BORDER: Record<Stage, string> = {
  prospect: 'border-t-text-muted/30',
  qualified: 'border-t-accent-cyan/40',
  proposal: 'border-t-status-warning/40',
  negotiation: 'border-t-blue-400/40',
  closed_won: 'border-t-status-success/40',
  closed_lost: 'border-t-status-error/40',
};

const STAGE_LABEL_KEYS: Record<Stage, string> = {
  prospect: 'stageProspect',
  qualified: 'stageQualified',
  proposal: 'stageProposal',
  negotiation: 'stageNegotiation',
  closed_won: 'stageClosedWon',
  closed_lost: 'stageClosedLost',
};

export function CommercialTab() {
  const t = useTranslations('dashboard');
  const utils = trpc.useUtils();

  const { data: deals, isLoading, error } = trpc.deals.list.useQuery();

  const createMutation = trpc.deals.create.useMutation({
    onSuccess: () => utils.deals.list.invalidate(),
  });
  const updateStageMutation = trpc.deals.updateStage.useMutation({
    onSuccess: () => utils.deals.list.invalidate(),
  });
  const deleteMutation = trpc.deals.delete.useMutation({
    onSuccess: () => utils.deals.list.invalidate(),
  });

  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const draggedIdRef = useRef<string | null>(null);

  const dealsByStage = useCallback(
    (stage: Stage) => (deals ?? []).filter((d) => d.stage === stage),
    [deals],
  );

  function handleDragStart(id: string) {
    draggedIdRef.current = id;
  }

  function handleDrop(targetStage: Stage) {
    const id = draggedIdRef.current;
    if (!id) return;
    draggedIdRef.current = null;

    const deal = deals?.find((d) => d.id === id);
    if (!deal || deal.stage === targetStage) return;

    updateStageMutation.mutate({ id, stage: targetStage, sortOrder: 0 });
  }

  function handleCreate() {
    if (!formTitle.trim()) return;
    createMutation.mutate(
      {
        title: formTitle.trim(),
        companyName: formCompany.trim() || undefined,
        value: formValue.trim() || undefined,
        notes: formNotes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setFormTitle('');
          setFormCompany('');
          setFormValue('');
          setFormNotes('');
          setShowForm(false);
        },
      },
    );
  }

  if (error) {
    return <p className="text-xs text-status-error">{t('loadError')}</p>;
  }

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((s) => (
          <div key={s} className="flex min-w-[220px] flex-col gap-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const hasDealData = deals && deals.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-text-muted">
          {hasDealData ? t('dealCount', { count: deals.length }) : t('noDealTitle')}
        </p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X size={12} className="mr-1" /> : <Plus size={12} className="mr-1" />}
          {t('newDeal')}
        </Button>
      </div>

      {/* Inline create form */}
      {showForm && (
        <div className="flex flex-wrap items-end gap-2 border border-border-default bg-bg-base p-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-text-muted">{t('dealTitle')}</label>
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder={t('placeholderTitle')}
              className="w-48"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-text-muted">{t('dealCompany')}</label>
            <Input
              value={formCompany}
              onChange={(e) => setFormCompany(e.target.value)}
              placeholder={t('placeholderCompany')}
              className="w-36"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-text-muted">{t('dealValue')}</label>
            <Input
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              placeholder={t('placeholderValue')}
              className="w-28"
              type="text"
              inputMode="decimal"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-text-muted">{t('dealNotes')}</label>
            <Input
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder={t('placeholderNotes')}
              className="w-48"
            />
          </div>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!formTitle.trim() || createMutation.isPending}
          >
            {t('createDeal')}
          </Button>
        </div>
      )}

      {/* Kanban board */}
      <div className="flex gap-2 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageDeals = dealsByStage(stage);
          return (
            <div
              key={stage}
              className={`flex min-w-[210px] flex-1 flex-col border-t-2 ${STAGE_BORDER[stage]} bg-bg-base`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(stage)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-2.5 py-2">
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${STAGE_COLORS[stage]}`}>
                  {t(STAGE_LABEL_KEYS[stage])}
                </span>
                <span className="text-[10px] text-text-muted">{stageDeals.length}</span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-1.5 px-1.5 pb-2">
                {stageDeals.length === 0 && (
                  <p className="px-2 py-4 text-center text-[10px] text-text-muted">
                    {t('emptyColumn')}
                  </p>
                )}
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => handleDragStart(deal.id)}
                    className="group cursor-grab border border-border-default bg-bg-overlay p-2.5 transition-colors hover:border-border-hover active:cursor-grabbing"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <GripVertical size={10} className="shrink-0 text-text-muted opacity-0 group-hover:opacity-100" />
                        <span className="text-[11px] font-medium text-text-primary">{deal.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate({ id: deal.id })}
                        className="shrink-0 text-text-muted opacity-0 transition-opacity hover:text-status-error group-hover:opacity-100"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                    {deal.companyName && (
                      <p className="mt-1 text-[10px] text-text-secondary">{deal.companyName}</p>
                    )}
                    {deal.value && (
                      <p className="mt-1 text-[10px] font-medium text-accent-cyan">
                        ${Number(deal.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                    {deal.contactName && (
                      <p className="mt-0.5 text-[10px] text-text-muted">{deal.contactName}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

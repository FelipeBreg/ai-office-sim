'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Plus, X, GripVertical, Trash2, Settings, TrendingUp, TrendingDown } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PeriodSelector } from '@/components/period-selector';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import type { Locale } from '@/i18n/routing';

export function CommercialTab() {
  const t = useTranslations('dashboard');
  const locale = useLocale() as Locale;
  const utils = trpc.useUtils();

  const { data: stages, isLoading: stagesLoading } = trpc.pipelineStages.list.useQuery();
  const { data: deals, isLoading: dealsLoading, error } = trpc.deals.list.useQuery();
  const [days, setDays] = useState(30);
  const { data: kpis } = trpc.deals.kpis.useQuery({ days });

  const seedMutation = trpc.pipelineStages.seedDefaults.useMutation({
    onSuccess: () => utils.pipelineStages.list.invalidate(),
  });
  const createMutation = trpc.deals.create.useMutation({
    onSuccess: () => utils.deals.list.invalidate(),
  });
  const updateStageMutation = trpc.deals.updateStage.useMutation({
    onSuccess: () => utils.deals.list.invalidate(),
  });
  const deleteMutation = trpc.deals.delete.useMutation({
    onSuccess: () => utils.deals.list.invalidate(),
  });

  // Stage management
  const createStageMutation = trpc.pipelineStages.create.useMutation({
    onSuccess: () => utils.pipelineStages.list.invalidate(),
  });
  const updateStagePipelineMutation = trpc.pipelineStages.update.useMutation({
    onSuccess: () => utils.pipelineStages.list.invalidate(),
  });
  const deleteStageMutation = trpc.pipelineStages.delete.useMutation({
    onSuccess: () => {
      utils.pipelineStages.list.invalidate();
      utils.deals.list.invalidate();
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [showStageManager, setShowStageManager] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#00C8E0');
  const draggedIdRef = useRef<string | null>(null);
  const seededRef = useRef(false);

  // Auto-seed stages if empty
  useEffect(() => {
    if (stages && stages.length === 0 && !seedMutation.isPending && !seededRef.current) {
      seededRef.current = true;
      seedMutation.mutate();
    }
  }, [stages]); // eslint-disable-line react-hooks/exhaustive-deps

  const dealsByStage = useCallback(
    (stageId: string) => (deals ?? []).filter((d) => d.stageId === stageId),
    [deals],
  );

  function handleDragStart(id: string) {
    draggedIdRef.current = id;
  }

  function handleDrop(targetStageId: string) {
    const id = draggedIdRef.current;
    if (!id) return;
    draggedIdRef.current = null;

    const deal = deals?.find((d) => d.id === id);
    if (!deal || deal.stageId === targetStageId) return;

    updateStageMutation.mutate({ id, stageId: targetStageId, sortOrder: 0 });
  }

  function handleCreate() {
    if (!formTitle.trim()) return;
    setCreateError(null);
    const cleanValue = formValue.replace(/[^\d.]/g, '').trim();
    const firstStageId = stages?.[0]?.id;
    createMutation.mutate(
      {
        title: formTitle.trim(),
        companyName: formCompany.trim() || undefined,
        value: cleanValue || undefined,
        notes: formNotes.trim() || undefined,
        stageId: firstStageId,
      },
      {
        onSuccess: () => {
          setFormTitle('');
          setFormCompany('');
          setFormValue('');
          setFormNotes('');
          setShowForm(false);
          setCreateError(null);
        },
        onError: (err) => {
          setCreateError(err.message ?? t('createDealError'));
        },
      },
    );
  }

  function handleAddStage() {
    if (!newStageName.trim()) return;
    const slug = newStageName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    createStageMutation.mutate({
      name: newStageName.trim(),
      slug,
      color: newStageColor,
      sortOrder: (stages?.length ?? 0),
    }, {
      onSuccess: () => {
        setNewStageName('');
        setNewStageColor('#00C8E0');
      },
    });
  }

  if (error) {
    return <p className="text-xs text-status-error">{t('loadError')}</p>;
  }

  const isLoading = stagesLoading || dealsLoading;

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {[1, 2, 3, 4, 5, 6, 7].map((s) => (
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
      {/* KPI bar */}
      {kpis && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <KpiMini label={t('kpiPipelineValue')} value={formatCurrency(kpis.pipelineValue, 'BRL', locale)} />
          <KpiMini label={t('kpiWon')} value={formatNumber(kpis.wonCount, locale)} sub={formatCurrency(kpis.wonValue, 'BRL', locale)} />
          <KpiMini label={t('kpiLost')} value={formatNumber(kpis.lostCount, locale)} sub={formatCurrency(kpis.lostValue, 'BRL', locale)} />
          <KpiMini label={t('kpiConversion')} value={`${kpis.conversionRate}%`} growth={kpis.growth.conversion} />
          <KpiMini label={t('kpiAvgDeal')} value={formatCurrency(kpis.avgDealSize, 'BRL', locale)} />
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-[11px] text-text-muted">
            {hasDealData ? t('dealCount', { count: deals.length }) : t('noDealTitle')}
          </p>
          <PeriodSelector days={days} onChange={setDays} />
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setShowStageManager(!showStageManager)}>
            <Settings size={12} className="mr-1" />
            {t('manageStages')}
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X size={12} className="mr-1" /> : <Plus size={12} className="mr-1" />}
            {t('newDeal')}
          </Button>
        </div>
      </div>

      {/* Stage Manager */}
      {showStageManager && (
        <div className="border border-border-default bg-bg-base p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">{t('stageManager')}</p>
          <div className="mb-2 flex flex-col gap-1">
            {stages?.map((stage) => (
              <div key={stage.id} className="flex items-center gap-2">
                <div className="h-3 w-3" style={{ backgroundColor: stage.color }} />
                <span className="flex-1 text-[11px] text-text-primary">{stage.name}</span>
                {stage.isWon && <span className="text-[9px] text-status-success">WON</span>}
                {stage.isLost && <span className="text-[9px] text-status-error">LOST</span>}
                <button
                  type="button"
                  onClick={() => deleteStageMutation.mutate({ id: stage.id })}
                  className="text-text-muted hover:text-status-error"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <Input
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder={t('newStageName')}
              className="w-32"
            />
            <input
              type="color"
              value={newStageColor}
              onChange={(e) => setNewStageColor(e.target.value)}
              className="h-8 w-8 cursor-pointer border border-border-default bg-transparent"
            />
            <Button size="sm" onClick={handleAddStage} disabled={!newStageName.trim()}>
              <Plus size={12} />
            </Button>
          </div>
        </div>
      )}

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
            {createMutation.isPending ? t('creating') : t('createDeal')}
          </Button>
          {createError && (
            <p className="w-full text-[10px] text-status-error">{createError}</p>
          )}
        </div>
      )}

      {/* Kanban board */}
      <div className="flex gap-2 overflow-x-auto pb-4">
        {stages?.map((stage) => {
          const stageDeals = dealsByStage(stage.id);
          return (
            <div
              key={stage.id}
              className="flex min-w-[210px] flex-1 flex-col border-t-2 bg-bg-base"
              style={{ borderTopColor: `${stage.color}66` }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(stage.id)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-2.5 py-2">
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: stage.color }}
                >
                  {stage.name}
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
                        R$ {Number(deal.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

function KpiMini({
  label,
  value,
  sub,
  growth,
}: {
  label: string;
  value: string;
  sub?: string;
  growth?: number;
}) {
  return (
    <div className="border border-border-default bg-bg-base p-2.5">
      <p className="text-[8px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-text-primary">{value}</p>
      {sub && <p className="text-[9px] text-text-muted">{sub}</p>}
      {growth !== undefined && growth !== 0 && (
        <div className={`flex items-center gap-0.5 text-[9px] ${growth > 0 ? 'text-status-success' : 'text-status-error'}`}>
          {growth > 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
          <span>{growth > 0 ? '+' : ''}{growth}%</span>
        </div>
      )}
    </div>
  );
}

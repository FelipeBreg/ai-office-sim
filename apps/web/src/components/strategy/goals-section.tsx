'use client';

import { useState } from 'react';
import { Target, Calendar, Zap, Plus, Trash2, AlertTriangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

/* -------------------------------------------------------------------------- */
/*  Horizon config                                                            */
/* -------------------------------------------------------------------------- */

const HORIZON_CONFIG: Record<
  string,
  { labelKey: string; icon: LucideIcon; accentColor: string }
> = {
  '1_year': { labelKey: 'goalYear', icon: Target, accentColor: '#3B82F6' },
  '6_month': { labelKey: 'goalSemester', icon: Calendar, accentColor: '#00C8E0' },
  '1_month': { labelKey: 'goalMonth', icon: Zap, accentColor: '#10B981' },
};

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'default' | 'cyan'> = {
  planned: 'default',
  in_progress: 'cyan',
  on_track: 'success',
  at_risk: 'warning',
  completed: 'success',
};

/* -------------------------------------------------------------------------- */
/*  Progress bar color helper                                                 */
/* -------------------------------------------------------------------------- */

function progressBarColor(pct: number): string {
  if (pct >= 70) return '#2EA043';
  if (pct >= 40) return '#D29922';
  return '#F85149';
}

/* -------------------------------------------------------------------------- */
/*  Format value                                                              */
/* -------------------------------------------------------------------------- */

function formatValue(value: number, unit: string): string {
  if (unit === 'R$') return `R$ ${value.toLocaleString('pt-BR')}`;
  if (unit === '%') return `${value}%`;
  return value.toLocaleString('pt-BR');
}

/* -------------------------------------------------------------------------- */
/*  Deadline helper                                                           */
/* -------------------------------------------------------------------------- */

function deadlineInfo(deadline: string | Date | null | undefined): {
  label: string;
  isOverdue: boolean;
  daysLeft: number;
} {
  if (!deadline) return { label: '—', isOverdue: false, daysLeft: Infinity };
  const d = new Date(deadline);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return {
    label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
    isOverdue: days < 0,
    daysLeft: days,
  };
}

/* -------------------------------------------------------------------------- */
/*  KPI Progress Row                                                          */
/* -------------------------------------------------------------------------- */

function KpiProgressRow({ kpi }: { kpi: { name: string; currentValue: string | null; targetValue: string | null; unit: string | null } }) {
  const current = Number(kpi.currentValue) || 0;
  const target = Number(kpi.targetValue) || 0;
  const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  const barColor = progressBarColor(pct);

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-text-muted">{kpi.name}</span>
        <span className="text-[9px] text-text-secondary">
          {formatValue(current, kpi.unit ?? '')} / {formatValue(target, kpi.unit ?? '')}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full bg-bg-overlay">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      <div className="mt-0.5 text-right">
        <span className="text-[8px] text-text-muted">{pct}%</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Goal Card                                                                 */
/* -------------------------------------------------------------------------- */

function GoalCard({
  goal,
  t,
  onDelete,
}: {
  goal: {
    id: string;
    horizon: string;
    title: string;
    description: string | null;
    deadline: Date | string | null;
    status: string;
    kpis: Array<{ name: string; currentValue: string | null; targetValue: string | null; unit: string | null }>;
  };
  t: ReturnType<typeof useTranslations<'strategy'>>;
  onDelete: (id: string) => void;
}) {
  const config = HORIZON_CONFIG[goal.horizon] ?? HORIZON_CONFIG['1_month']!;
  const Icon = config.icon;
  const dl = deadlineInfo(goal.deadline);

  return (
    <div className="border border-border-default bg-bg-raised p-4">
      {/* Icon + horizon label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} strokeWidth={1.5} style={{ color: config.accentColor }} />
          <span
            className="text-[8px] uppercase tracking-[0.12em]"
            style={{ color: config.accentColor }}
          >
            {t(config.labelKey as Parameters<typeof t>[0])}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant={STATUS_VARIANT[goal.status] ?? 'default'}>
            {goal.status.replace('_', ' ')}
          </Badge>
          <button
            type="button"
            onClick={() => onDelete(goal.id)}
            className="text-text-muted transition-colors hover:text-status-error"
          >
            <Trash2 size={10} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="mt-2 text-[11px] font-medium text-text-primary">{goal.title}</h3>

      {/* Description */}
      {goal.description && (
        <p className="mt-1 text-[9px] leading-relaxed text-text-muted">{goal.description}</p>
      )}

      {/* Deadline */}
      <div className="mt-2 flex items-center gap-1.5">
        <Calendar size={10} strokeWidth={1.5} className="text-text-muted" />
        <span className={`text-[9px] ${dl.isOverdue ? 'text-status-error' : dl.daysLeft <= 7 ? 'text-status-warning' : 'text-text-muted'}`}>
          {dl.label}
          {dl.daysLeft !== Infinity && (
            <> ({dl.isOverdue ? `${Math.abs(dl.daysLeft)}d ${t('overdue' as Parameters<typeof t>[0])}` : `${dl.daysLeft}d`})</>
          )}
        </span>
        {dl.isOverdue && <AlertTriangle size={10} className="text-status-error" />}
      </div>

      {/* KPI progress bars */}
      {goal.kpis.length > 0 && (
        <div className="mt-3 border-t border-border-default pt-2">
          {goal.kpis.map((kpi) => (
            <KpiProgressRow key={kpi.name} kpi={kpi} />
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Quick-add Goal Form                                                       */
/* -------------------------------------------------------------------------- */

function QuickAddGoal({
  strategyId,
  horizon,
  onDone,
  t,
}: {
  strategyId: string;
  horizon: string;
  onDone: () => void;
  t: ReturnType<typeof useTranslations<'strategy'>>;
}) {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const utils = trpc.useUtils();
  const createMutation = trpc.strategies.createGoal.useMutation({
    onSuccess: () => {
      void utils.strategies.listGoals.invalidate();
      onDone();
    },
  });

  return (
    <div className="border border-accent-cyan bg-bg-overlay p-3 space-y-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('goalTitlePlaceholder' as Parameters<typeof t>[0])}
        className="w-full border border-border-default bg-bg-base px-2 py-1 text-[10px] text-text-primary focus:border-accent-cyan focus:outline-none"
      />
      <input
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        className="w-full border border-border-default bg-bg-base px-2 py-1 text-[10px] text-text-primary focus:border-accent-cyan focus:outline-none"
      />
      <div className="flex gap-1.5">
        <Button
          size="sm"
          variant="primary"
          disabled={!title.trim() || createMutation.isPending}
          onClick={() =>
            createMutation.mutate({
              strategyId,
              horizon: horizon as '1_year' | '6_month' | '1_month',
              title: title.trim(),
              ...(deadline ? { deadline: new Date(deadline).toISOString() } : {}),
            })
          }
        >
          {t('save' as Parameters<typeof t>[0])}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          {t('cancel' as Parameters<typeof t>[0])}
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  GoalsSection component                                                    */
/* -------------------------------------------------------------------------- */

export function GoalsSection({ strategyId }: { strategyId?: string }) {
  const t = useTranslations('strategy');
  const [addingHorizon, setAddingHorizon] = useState<string | null>(null);

  const { data: goals, isLoading } = trpc.strategies.listGoals.useQuery(
    { strategyId },
    { enabled: true },
  );

  const utils = trpc.useUtils();
  const deleteMutation = trpc.strategies.deleteGoal.useMutation({
    onSuccess: () => void utils.strategies.listGoals.invalidate(),
  });

  const horizons = ['1_year', '6_month', '1_month'] as const;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {horizons.map((h) => (
          <Skeleton key={h} className="h-40" />
        ))}
      </div>
    );
  }

  const grouped = Object.fromEntries(horizons.map((h) => [h, (goals ?? []).filter((g) => g.horizon === h)]));

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {horizons.map((horizon) => {
        const config = HORIZON_CONFIG[horizon]!;
        const Icon = config.icon;
        const items = grouped[horizon] ?? [];

        return (
          <div key={horizon} className="flex flex-col gap-2">
            {/* Column header */}
            <div className="flex items-center justify-between border-b border-border-default pb-1.5">
              <div className="flex items-center gap-1.5">
                <Icon size={12} strokeWidth={1.5} style={{ color: config.accentColor }} />
                <span className="text-[9px] uppercase tracking-[0.12em]" style={{ color: config.accentColor }}>
                  {t(config.labelKey as Parameters<typeof t>[0])}
                </span>
                <span className="text-[8px] text-text-muted">({items.length})</span>
              </div>
              {strategyId && (
                <button
                  type="button"
                  onClick={() => setAddingHorizon(horizon)}
                  className="text-text-muted transition-colors hover:text-accent-cyan"
                >
                  <Plus size={12} strokeWidth={1.5} />
                </button>
              )}
            </div>

            {/* Quick add form */}
            {addingHorizon === horizon && strategyId && (
              <QuickAddGoal
                strategyId={strategyId}
                horizon={horizon}
                onDone={() => setAddingHorizon(null)}
                t={t}
              />
            )}

            {/* Goal cards */}
            {items.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal as any}
                t={t}
                onDelete={(id) => deleteMutation.mutate({ id })}
              />
            ))}

            {items.length === 0 && !addingHorizon && (
              <div className="flex h-24 items-center justify-center border border-dashed border-border-default text-[9px] text-text-muted">
                {t('noGoals' as Parameters<typeof t>[0])}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

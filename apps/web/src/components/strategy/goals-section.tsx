'use client';

import { Target, Calendar, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface GoalKpi {
  name: string;
  current: number;
  target: number;
  unit: string;
}

interface Goal {
  horizon: '1-year' | '6-month' | '1-month';
  title: string;
  description: string;
  kpis: GoalKpi[];
}

/* -------------------------------------------------------------------------- */
/*  Mock data                                                                 */
/* -------------------------------------------------------------------------- */

const MOCK_GOALS: Goal[] = [
  {
    horizon: '1-year',
    title: 'Reach R$ 100k MRR',
    description: 'Scale recurring revenue through customer acquisition and retention',
    kpis: [
      { name: 'MRR', current: 45200, target: 100000, unit: 'R$' },
      { name: 'Active Clients', current: 89, target: 200, unit: '' },
    ],
  },
  {
    horizon: '6-month',
    title: 'Double lead pipeline',
    description: 'Increase qualified leads through automated outbound campaigns',
    kpis: [
      { name: 'Monthly Leads', current: 342, target: 700, unit: '' },
      { name: 'Conversion Rate', current: 12, target: 18, unit: '%' },
    ],
  },
  {
    horizon: '1-month',
    title: 'Reduce churn to 1.5%',
    description: 'Implement retention workflows and proactive account management',
    kpis: [
      { name: 'Churn Rate', current: 2.1, target: 1.5, unit: '%' },
      { name: 'NPS Score', current: 72, target: 80, unit: '' },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Horizon config                                                            */
/* -------------------------------------------------------------------------- */

const HORIZON_CONFIG: Record<
  Goal['horizon'],
  { labelKey: string; icon: LucideIcon; accentColor: string }
> = {
  '1-year': { labelKey: 'goalYear', icon: Target, accentColor: '#3B82F6' },
  '6-month': { labelKey: 'goalSemester', icon: Calendar, accentColor: '#00C8E0' },
  '1-month': { labelKey: 'goalMonth', icon: Zap, accentColor: '#10B981' },
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
  if (unit === 'R$') {
    return `R$ ${value.toLocaleString('pt-BR')}`;
  }
  if (unit === '%') {
    return `${value}%`;
  }
  return value.toLocaleString('pt-BR');
}

/* -------------------------------------------------------------------------- */
/*  KPI Progress Row                                                          */
/* -------------------------------------------------------------------------- */

function KpiProgressRow({ kpi }: { kpi: GoalKpi }) {
  const pct = kpi.target > 0 ? Math.min(Math.round((kpi.current / kpi.target) * 100), 100) : 0;
  const barColor = progressBarColor(pct);

  return (
    <div className="mt-2">
      {/* Label + values */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-text-muted">{kpi.name}</span>
        <span className="text-[9px] text-text-secondary">
          {formatValue(kpi.current, kpi.unit)} / {formatValue(kpi.target, kpi.unit)}
        </span>
      </div>

      {/* Bar */}
      <div className="mt-1 h-1.5 w-full bg-bg-overlay">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: barColor,
          }}
        />
      </div>

      {/* Percentage */}
      <div className="mt-0.5 text-right">
        <span className="text-[8px] text-text-muted">{pct}%</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Goal Card                                                                 */
/* -------------------------------------------------------------------------- */

function GoalCard({ goal, t }: { goal: Goal; t: ReturnType<typeof useTranslations<'strategy'>> }) {
  const config = HORIZON_CONFIG[goal.horizon];
  const Icon = config.icon;

  return (
    <div className="border border-border-default bg-bg-raised p-4">
      {/* Icon + horizon label */}
      <div className="flex items-center gap-2">
        <Icon size={14} strokeWidth={1.5} style={{ color: config.accentColor }} />
        <span
          className="text-[8px] uppercase tracking-[0.12em]"
          style={{ color: config.accentColor }}
        >
          {t(config.labelKey as Parameters<typeof t>[0])}
        </span>
      </div>

      {/* Title */}
      <h3 className="mt-2 text-[11px] font-medium text-text-primary">{goal.title}</h3>

      {/* Description */}
      <p className="mt-1 text-[9px] leading-relaxed text-text-muted">{goal.description}</p>

      {/* KPI progress bars */}
      <div className="mt-3 border-t border-border-default pt-2">
        {goal.kpis.map((kpi) => (
          <KpiProgressRow key={kpi.name} kpi={kpi} />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  GoalsSection component                                                    */
/* -------------------------------------------------------------------------- */

export function GoalsSection() {
  const t = useTranslations('strategy');
  // TODO: Replace with real data from tRPC when goals endpoint exists
  const goals = MOCK_GOALS;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {goals.map((goal) => (
        <GoalCard key={goal.horizon} goal={goal} t={t} />
      ))}
    </div>
  );
}

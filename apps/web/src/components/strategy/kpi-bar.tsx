'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc/client';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface KpiMetric {
  labelKey: string;
  value: string;
  trend: string;
  direction: 'up' | 'down' | 'neutral';
  invertColor?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Trend helpers                                                             */
/* -------------------------------------------------------------------------- */

function TrendIcon({ direction, isGood }: { direction: KpiMetric['direction']; isGood: boolean }) {
  if (direction === 'neutral') return <Minus size={10} strokeWidth={2} className="text-text-muted" />;
  const color = isGood ? 'text-status-success' : 'text-status-error';
  const Icon = direction === 'up' ? TrendingUp : TrendingDown;
  return <Icon size={10} strokeWidth={2} className={color} />;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

/* -------------------------------------------------------------------------- */
/*  KpiBar component                                                          */
/* -------------------------------------------------------------------------- */

export function KpiBar() {
  const t = useTranslations('strategy');

  const { data: strategies } = trpc.strategies.list.useQuery();
  const { data: usage } = trpc.billing.currentPeriodUsage.useQuery();
  const { data: learnings } = trpc.strategies.listPendingLearnings.useQuery();

  const totalStrategies = strategies?.length ?? 0;
  const activeStrategies = strategies?.filter((s) => s.status === 'active').length ?? 0;
  const completedStrategies = strategies?.filter((s) => s.status === 'completed').length ?? 0;
  const atRiskStrategies = strategies?.filter((s) => s.status === 'at_risk').length ?? 0;
  const actionCount = usage?.actionCount ?? 0;
  const totalCost = Number(usage?.totalCostUsd ?? 0);
  const totalTokens = usage?.totalTokens ?? 0;
  const pendingLearnings = learnings?.length ?? 0;

  const kpis: KpiMetric[] = [
    {
      labelKey: 'kpiStrategies',
      value: `${activeStrategies}/${totalStrategies}`,
      trend: completedStrategies > 0 ? `${completedStrategies} done` : 'active',
      direction: activeStrategies > 0 ? 'up' : 'neutral',
    },
    {
      labelKey: 'kpiActions',
      value: formatNumber(actionCount),
      trend: `${formatNumber(totalTokens)} tokens`,
      direction: actionCount > 0 ? 'up' : 'neutral',
    },
    {
      labelKey: 'kpiCost',
      value: `$${totalCost.toFixed(2)}`,
      trend: 'this month',
      direction: 'neutral',
    },
    {
      labelKey: 'kpiLearnings',
      value: String(pendingLearnings),
      trend: pendingLearnings > 0 ? 'pending review' : 'none',
      direction: pendingLearnings > 0 ? 'up' : 'neutral',
    },
    {
      labelKey: 'kpiAtRisk',
      value: String(atRiskStrategies),
      trend: atRiskStrategies > 0 ? 'need attention' : 'all clear',
      direction: atRiskStrategies > 0 ? 'up' : 'neutral',
      invertColor: true,
    },
    {
      labelKey: 'kpiCompleted',
      value: String(completedStrategies),
      trend: totalStrategies > 0 ? `${Math.round((completedStrategies / totalStrategies) * 100)}%` : '0%',
      direction: completedStrategies > 0 ? 'up' : 'neutral',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {kpis.map((metric) => {
        const isGood = metric.invertColor
          ? metric.direction === 'down'
          : metric.direction === 'up';
        const trendColor = metric.direction === 'neutral'
          ? 'text-text-muted'
          : isGood ? 'text-status-success' : 'text-status-error';

        return (
          <div key={metric.labelKey} className="border border-border-default bg-bg-raised p-3">
            <span className="block text-[8px] uppercase tracking-[0.12em] text-text-muted">
              {t(metric.labelKey as Parameters<typeof t>[0])}
            </span>
            <span className="mt-1 block text-lg font-bold leading-tight text-text-primary">
              {metric.value}
            </span>
            <div className="mt-1.5 flex items-center gap-1">
              <TrendIcon direction={metric.direction} isGood={isGood} />
              <span className={`text-[10px] ${trendColor}`}>{metric.trend}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

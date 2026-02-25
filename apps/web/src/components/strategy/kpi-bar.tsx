'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
/*  Mock data — replaced with real tRPC data in Phase 4                       */
/* -------------------------------------------------------------------------- */

const MOCK_KPIS: KpiMetric[] = [
  { labelKey: 'kpiMrr', value: 'R$ 45.2k', trend: '+12%', direction: 'up' },
  { labelKey: 'kpiLeads', value: '342', trend: '+8%', direction: 'up' },
  { labelKey: 'kpiChurn', value: '2.1%', trend: '-0.3%', direction: 'down', invertColor: true },
  { labelKey: 'kpiNps', value: '72', trend: '+5', direction: 'up' },
  { labelKey: 'kpiActions', value: '1,847', trend: '+23%', direction: 'up' },
  { labelKey: 'kpiStrategies', value: '4/6', trend: 'on track', direction: 'neutral' },
];

/* -------------------------------------------------------------------------- */
/*  Trend helpers                                                             */
/* -------------------------------------------------------------------------- */

function TrendIcon({ direction, isGood }: { direction: KpiMetric['direction']; isGood: boolean }) {
  if (direction === 'neutral') return <Minus size={10} strokeWidth={2} className="text-text-muted" />;
  const color = isGood ? 'text-status-success' : 'text-status-error';
  const Icon = direction === 'up' ? TrendingUp : TrendingDown;
  return <Icon size={10} strokeWidth={2} className={color} />;
}

/* -------------------------------------------------------------------------- */
/*  KpiBar component                                                          */
/* -------------------------------------------------------------------------- */

export function KpiBar() {
  const t = useTranslations('strategy');

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {MOCK_KPIS.map((metric) => {
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

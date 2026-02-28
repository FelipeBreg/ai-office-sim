'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { TrendingUp, TrendingDown, Bot } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PeriodSelector } from '@/components/period-selector';
import { AgentDrawer } from '@/components/agent-drawer';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import type { Locale } from '@/i18n/routing';

export function GeneralTab() {
  const t = useTranslations('dashboard');
  const locale = useLocale() as Locale;
  const [days, setDays] = useState(30);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading, error } = trpc.dashboard.general.useQuery({ days });

  if (error) {
    return <p className="text-xs text-status-error">{t('loadError')}</p>;
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-40" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    { label: t('genRevenue'), value: formatCurrency(data.revenue.value, 'BRL', locale), growth: data.revenue.growth },
    { label: t('genProfit'), value: formatCurrency(data.profit.value, 'BRL', locale), growth: data.profit.growth },
    { label: t('genAiCost'), value: formatCurrency(data.aiCost.value, 'USD', locale), growth: data.aiCost.growth, invertGrowth: true },
    { label: t('genPipelineValue'), value: formatCurrency(data.pipelineValue.value, 'BRL', locale), growth: data.pipelineValue.growth },
    { label: t('genDealsWon'), value: formatNumber(data.dealsWon.value, locale), growth: data.dealsWon.growth },
    { label: t('genConversionRate'), value: `${data.conversionRate.value}%`, growth: data.conversionRate.growth },
    { label: t('genActiveAgents'), value: formatNumber(data.activeAgents.value, locale), growth: data.activeAgents.growth },
    { label: t('genTaskCompletion'), value: `${data.taskCompletion.value}%`, growth: data.taskCompletion.growth },
    { label: t('genCampaignRoi'), value: `${data.campaignRoi.value}%`, growth: data.campaignRoi.growth },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <PeriodSelector days={days} onChange={setDays} />
        <Button size="sm" variant="ghost" onClick={() => setDrawerOpen(true)}>
          <Bot size={12} className="mr-1" />
          {t('viewAgents')}
        </Button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <AgentDrawer team="operations" open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

function KpiCard({
  label,
  value,
  growth,
  invertGrowth,
}: {
  label: string;
  value: string;
  growth: number;
  invertGrowth?: boolean;
}) {
  const isPositive = invertGrowth ? growth < 0 : growth > 0;
  const isNegative = invertGrowth ? growth > 0 : growth < 0;

  return (
    <div className="border border-border-default bg-bg-base p-4">
      <p className="text-[9px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-1.5 text-xl font-semibold tabular-nums text-text-primary">{value}</p>
      {growth !== 0 && (
        <div className={`mt-1 flex items-center gap-1 text-[10px] ${isPositive ? 'text-status-success' : isNegative ? 'text-status-error' : 'text-text-muted'}`}>
          {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          <span>{growth > 0 ? '+' : ''}{growth}%</span>
        </div>
      )}
    </div>
  );
}

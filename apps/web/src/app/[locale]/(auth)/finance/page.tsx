'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DollarSign, TrendingUp, Receipt, FileText, BarChart3, Download } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function FinancePage() {
  const t = useTranslations('finance');
  const [days, setDays] = useState(30);

  const { data: stats, isLoading } = trpc.actionLogs.stats.useQuery({ days });

  const totalCost = stats ? parseFloat(stats.totals.totalCost) : 0;
  const totalTokens = stats?.totals.totalTokens ?? 0;
  const totalActions = stats?.totals.totalActions ?? 0;

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign size={14} strokeWidth={1.5} className="text-accent-cyan" />
            <h1 className="text-xs font-semibold uppercase tracking-[0.15em] text-text-primary">
              {t('title')}
            </h1>
          </div>
          <p className="mt-0.5 text-[10px] text-text-muted">{t('subtitle')}</p>
        </div>
        {/* Period selector */}
        <div className="flex items-center gap-1.5">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`px-2 py-0.5 text-[9px] transition-colors ${
                days === d
                  ? 'bg-accent-cyan/10 text-accent-cyan'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col gap-4">
          {/* Revenue Overview */}
          <div className="border border-border-default bg-bg-raised p-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} strokeWidth={1.5} className="text-text-muted" />
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-primary">
                {t('revenueOverview')}
              </h2>
            </div>
            {isLoading ? (
              <div className="mt-3 flex gap-4">
                <Skeleton className="h-16 flex-1" />
                <Skeleton className="h-16 flex-1" />
                <Skeleton className="h-16 flex-1" />
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div className="border border-border-default bg-bg-base p-3">
                  <p className="text-[8px] uppercase tracking-[0.15em] text-text-muted">
                    {t('totalSpend')}
                  </p>
                  <p className="mt-1 text-lg font-bold text-text-primary">
                    ${totalCost.toFixed(4)}
                  </p>
                </div>
                <div className="border border-border-default bg-bg-base p-3">
                  <p className="text-[8px] uppercase tracking-[0.15em] text-text-muted">
                    {t('totalTokens')}
                  </p>
                  <p className="mt-1 text-lg font-bold text-text-primary">
                    {totalTokens.toLocaleString()}
                  </p>
                </div>
                <div className="border border-border-default bg-bg-base p-3">
                  <p className="text-[8px] uppercase tracking-[0.15em] text-text-muted">
                    {t('totalActions')}
                  </p>
                  <p className="mt-1 text-lg font-bold text-text-primary">
                    {totalActions.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Expenses — Cost by Model */}
          <div className="border border-border-default bg-bg-raised p-4">
            <div className="flex items-center gap-2">
              <Receipt size={14} strokeWidth={1.5} className="text-text-muted" />
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-primary">
                {t('expenses')}
              </h2>
            </div>
            {isLoading ? (
              <Skeleton className="mt-3 h-24" />
            ) : stats?.byModel && stats.byModel.length > 0 ? (
              <div className="mt-3 flex flex-col">
                {/* Table header */}
                <div className="flex items-center border border-border-default bg-bg-overlay px-3 py-1.5">
                  <span className="flex-1 text-[8px] uppercase tracking-[0.1em] text-text-muted">{t('model')}</span>
                  <span className="w-20 text-right text-[8px] uppercase tracking-[0.1em] text-text-muted">{t('calls')}</span>
                  <span className="w-24 text-right text-[8px] uppercase tracking-[0.1em] text-text-muted">{t('tokens')}</span>
                  <span className="w-24 text-right text-[8px] uppercase tracking-[0.1em] text-text-muted">{t('cost')}</span>
                </div>
                {stats.byModel.map((row) => (
                  <div
                    key={row.model}
                    className="flex items-center border border-t-0 border-border-default px-3 py-2"
                  >
                    <span className="flex-1 text-[10px] text-text-primary">{row.model || 'unknown'}</span>
                    <span className="w-20 text-right text-[10px] text-text-secondary">{row.count}</span>
                    <span className="w-24 text-right text-[10px] text-text-secondary">{row.tokens.toLocaleString()}</span>
                    <span className="w-24 text-right text-[10px] text-text-secondary">${parseFloat(row.cost).toFixed(4)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[10px] text-text-muted">{t('noExpenses')}</p>
            )}
          </div>

          {/* Daily Breakdown */}
          {stats?.daily && stats.daily.length > 0 && (
            <div className="border border-border-default bg-bg-raised p-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={14} strokeWidth={1.5} className="text-text-muted" />
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-primary">
                  {t('dailyBreakdown')}
                </h2>
              </div>
              <div className="mt-3 flex flex-col">
                <div className="flex items-center border border-border-default bg-bg-overlay px-3 py-1.5">
                  <span className="flex-1 text-[8px] uppercase tracking-[0.1em] text-text-muted">{t('date')}</span>
                  <span className="w-20 text-right text-[8px] uppercase tracking-[0.1em] text-text-muted">{t('actions')}</span>
                  <span className="w-24 text-right text-[8px] uppercase tracking-[0.1em] text-text-muted">{t('tokens')}</span>
                  <span className="w-24 text-right text-[8px] uppercase tracking-[0.1em] text-text-muted">{t('cost')}</span>
                </div>
                {stats.daily.map((row) => (
                  <div
                    key={row.day}
                    className="flex items-center border border-t-0 border-border-default px-3 py-2"
                  >
                    <span className="flex-1 text-[10px] text-text-primary">{row.day}</span>
                    <span className="w-20 text-right text-[10px] text-text-secondary">{row.actions}</span>
                    <span className="w-24 text-right text-[10px] text-text-secondary">{row.tokens.toLocaleString()}</span>
                    <span className="w-24 text-right text-[10px] text-text-secondary">${parseFloat(row.cost).toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tax & Reports — placeholder */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex flex-col border border-border-default bg-bg-raised p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={14} strokeWidth={1.5} className="text-text-muted" />
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-primary">
                    {t('taxObligations')}
                  </h2>
                </div>
                <Badge variant="default">{t('comingSoon')}</Badge>
              </div>
              <p className="mt-4 text-[10px] text-text-muted">{t('taxPlaceholder')}</p>
            </div>

            <div className="flex flex-col border border-border-default bg-bg-raised p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download size={14} strokeWidth={1.5} className="text-text-muted" />
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-primary">
                    {t('reports')}
                  </h2>
                </div>
                <Badge variant="default">{t('comingSoon')}</Badge>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="secondary" disabled>
                  <Download size={10} strokeWidth={1.5} className="mr-1" />
                  {t('exportCSV')}
                </Button>
                <Button size="sm" variant="secondary" disabled>
                  <Download size={10} strokeWidth={1.5} className="mr-1" />
                  {t('exportPDF')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

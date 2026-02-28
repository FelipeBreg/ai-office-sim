'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ExternalLink } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatNumber, formatDate } from '@/lib/formatters';
import type { Locale } from '@/i18n/routing';

const PERIODS = [
  { days: 7, key: 'period7d' },
  { days: 30, key: 'period30d' },
  { days: 90, key: 'period90d' },
] as const;

export function FinanceTab() {
  const t = useTranslations('dashboard');
  const locale = useLocale() as Locale;
  const [days, setDays] = useState(30);

  const { data, isLoading, error } = trpc.dashboard.finance.useQuery({ days });

  if (error) {
    return <p className="text-xs text-status-error">{t('loadError')}</p>;
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 flex-1" />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const totalCost = Number(data.totals.totalCost);

  return (
    <div className="flex flex-col gap-6">
      {/* Period selector */}
      <div className="flex gap-1">
        {PERIODS.map((p) => (
          <Button
            key={p.days}
            size="sm"
            variant={days === p.days ? 'primary' : 'ghost'}
            onClick={() => setDays(p.days)}
          >
            {t(p.key)}
          </Button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label={t('totalCost')} value={formatCurrency(totalCost, 'USD', locale)} />
        <StatCard label={t('totalTokens')} value={formatNumber(data.totals.totalTokens, locale)} />
        <StatCard label={t('totalActions')} value={formatNumber(data.totals.totalActions, locale)} />
      </div>

      {/* Daily cost area chart */}
      {data.daily.length > 0 && (
        <div className="border border-border-default bg-bg-base p-4">
          <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {t('dailyCost')}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.daily}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontFamily: 'IBM Plex Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontFamily: 'IBM Plex Mono' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${v.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0A0E14',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 0,
                  fontFamily: 'IBM Plex Mono',
                  fontSize: 10,
                }}
                formatter={(value) => [`$${Number(value ?? 0).toFixed(4)}`, t('cost')]}
              />
              <Area
                type="monotone"
                dataKey="cost"
                stroke="#00C8E0"
                fill="rgba(0,200,224,0.15)"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cost by model bar chart */}
      {data.byModel.length > 0 && (
        <div className="border border-border-default bg-bg-base p-4">
          <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {t('costByModel')}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.byModel}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <XAxis
                dataKey="model"
                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontFamily: 'IBM Plex Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontFamily: 'IBM Plex Mono' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${v.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0A0E14',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 0,
                  fontFamily: 'IBM Plex Mono',
                  fontSize: 10,
                }}
                formatter={(value) => [`$${Number(value ?? 0).toFixed(4)}`, t('cost')]}
              />
              <Bar dataKey="cost" fill="#00C8E0" radius={0} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Invoices table */}
      <div className="border border-border-default bg-bg-base p-4">
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          {t('invoices')}
        </h3>
        {data.invoices.length === 0 ? (
          <p className="py-4 text-center text-[10px] text-text-muted">{t('noInvoices')}</p>
        ) : (
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted">
                <th className="py-1 text-left font-medium uppercase tracking-wider">{t('invoiceStatus')}</th>
                <th className="py-1 text-left font-medium uppercase tracking-wider">{t('invoiceAmount')}</th>
                <th className="py-1 text-left font-medium uppercase tracking-wider">{t('invoiceDate')}</th>
                <th className="py-1 text-right font-medium uppercase tracking-wider">{t('invoicePdf')}</th>
              </tr>
            </thead>
            <tbody>
              {data.invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border-subtle/50">
                  <td className="py-1.5">
                    <span className={`uppercase ${inv.status === 'paid' ? 'text-status-success' : inv.status === 'open' ? 'text-status-warning' : 'text-text-muted'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-1.5 text-text-primary">
                    {formatCurrency(inv.amountDue / 100, inv.currency === 'brl' ? 'BRL' : 'USD', locale)}
                  </td>
                  <td className="py-1.5 text-text-secondary">
                    {inv.createdAt ? formatDate(inv.createdAt, locale) : '—'}
                  </td>
                  <td className="py-1.5 text-right">
                    {inv.invoicePdf ? (
                      <a
                        href={inv.invoicePdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-accent-cyan hover:underline"
                      >
                        PDF <ExternalLink size={8} />
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Empty state */}
      {data.daily.length === 0 && data.byModel.length === 0 && (
        <p className="py-8 text-center text-[11px] text-text-muted">{t('noData')}</p>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border-default bg-bg-base p-3">
      <p className="text-[9px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-text-primary">{value}</p>
    </div>
  );
}

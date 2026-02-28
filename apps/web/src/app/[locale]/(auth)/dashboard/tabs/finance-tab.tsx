'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ExternalLink, TrendingUp, TrendingDown, Plus, X, Trash2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PeriodSelector } from '@/components/period-selector';
import { formatCurrency, formatNumber, formatDate } from '@/lib/formatters';
import type { Locale } from '@/i18n/routing';

const RECORD_TYPES = ['revenue', 'expense', 'tax', 'investment'] as const;
const RECORD_CATEGORIES = [
  'mrr', 'arr', 'cogs', 'salary', 'tax_obligation',
  'marketing_spend', 'infrastructure', 'software', 'consulting', 'other',
] as const;

export function FinanceTab() {
  const t = useTranslations('dashboard');
  const locale = useLocale() as Locale;
  const utils = trpc.useUtils();
  const [days, setDays] = useState(30);

  const { data, isLoading, error } = trpc.dashboard.finance.useQuery({ days });
  const { data: finSummary } = trpc.financialRecords.summary.useQuery({ days });
  const { data: records } = trpc.financialRecords.list.useQuery();

  const createRecordMutation = trpc.financialRecords.create.useMutation({
    onSuccess: () => {
      utils.financialRecords.list.invalidate();
      utils.financialRecords.summary.invalidate();
    },
  });
  const deleteRecordMutation = trpc.financialRecords.delete.useMutation({
    onSuccess: () => {
      utils.financialRecords.list.invalidate();
      utils.financialRecords.summary.invalidate();
    },
  });

  const [showRecordForm, setShowRecordForm] = useState(false);
  const [recLabel, setRecLabel] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recType, setRecType] = useState<(typeof RECORD_TYPES)[number]>('revenue');
  const [recCategory, setRecCategory] = useState<(typeof RECORD_CATEGORIES)[number]>('other');

  if (error) {
    return <p className="text-xs text-status-error">{t('loadError')}</p>;
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-20 flex-1" />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const totalCost = Number(data.totals.totalCost);

  function handleCreateRecord() {
    if (!recLabel.trim() || !recAmount.trim()) return;
    const cleanAmount = recAmount.replace(/[^\d.\-]/g, '').trim();
    createRecordMutation.mutate(
      { label: recLabel.trim(), amount: cleanAmount, type: recType, category: recCategory },
      {
        onSuccess: () => {
          setRecLabel('');
          setRecAmount('');
          setShowRecordForm(false);
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Period selector */}
      <PeriodSelector days={days} onChange={setDays} />

      {/* KPI cards with growth */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <FinKpi label={t('finRevenue')} value={formatCurrency(finSummary?.revenue ?? 0, 'BRL', locale)} growth={finSummary?.growth.revenue} />
        <FinKpi label={t('finProfit')} value={formatCurrency(finSummary?.profit ?? 0, 'BRL', locale)} growth={finSummary?.growth.profit} />
        <FinKpi label={t('finEbitda')} value={formatCurrency(finSummary?.ebitda ?? 0, 'BRL', locale)} />
        <FinKpi label={t('finMrr')} value={formatCurrency(finSummary?.mrr ?? 0, 'BRL', locale)} />
        <FinKpi label={t('finTax')} value={formatCurrency(finSummary?.tax ?? 0, 'BRL', locale)} invertGrowth />
        <FinKpi label={t('totalCost')} value={formatCurrency(totalCost, 'USD', locale)} sub={t('aiCostSub')} invertGrowth />
      </div>

      {/* AI cost stat cards */}
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

      {/* Financial Records CRUD */}
      <div className="border border-border-default bg-bg-base p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {t('financialRecords')}
          </h3>
          <Button size="sm" onClick={() => setShowRecordForm(!showRecordForm)}>
            {showRecordForm ? <X size={12} className="mr-1" /> : <Plus size={12} className="mr-1" />}
            {t('addRecord')}
          </Button>
        </div>

        {showRecordForm && (
          <div className="mb-3 flex flex-wrap items-end gap-2 border border-border-subtle bg-bg-overlay p-2">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase text-text-muted">{t('recLabel')}</label>
              <Input value={recLabel} onChange={(e) => setRecLabel(e.target.value)} className="w-36" placeholder={t('recLabelPlaceholder')} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase text-text-muted">{t('recAmount')}</label>
              <Input value={recAmount} onChange={(e) => setRecAmount(e.target.value)} className="w-28" placeholder="0.00" inputMode="decimal" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase text-text-muted">{t('recType')}</label>
              <select value={recType} onChange={(e) => setRecType(e.target.value as typeof recType)} className="h-8 border border-border-default bg-bg-overlay px-2 text-[11px] text-text-primary">
                {RECORD_TYPES.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase text-text-muted">{t('recCategory')}</label>
              <select value={recCategory} onChange={(e) => setRecCategory(e.target.value as typeof recCategory)} className="h-8 border border-border-default bg-bg-overlay px-2 text-[11px] text-text-primary">
                {RECORD_CATEGORIES.map((rc) => <option key={rc} value={rc}>{rc}</option>)}
              </select>
            </div>
            <Button size="sm" onClick={handleCreateRecord} disabled={!recLabel.trim() || !recAmount.trim() || createRecordMutation.isPending}>
              {createRecordMutation.isPending ? t('creating') : t('create')}
            </Button>
          </div>
        )}

        {(!records || records.length === 0) ? (
          <p className="py-4 text-center text-[10px] text-text-muted">{t('noRecords')}</p>
        ) : (
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted">
                <th className="py-1 text-left font-medium uppercase tracking-wider">{t('recLabel')}</th>
                <th className="py-1 text-left font-medium uppercase tracking-wider">{t('recType')}</th>
                <th className="py-1 text-left font-medium uppercase tracking-wider">{t('recCategory')}</th>
                <th className="py-1 text-right font-medium uppercase tracking-wider">{t('recAmount')}</th>
                <th className="py-1 text-right font-medium uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr key={rec.id} className="group border-b border-border-subtle/50">
                  <td className="py-1.5 text-text-primary">{rec.label}</td>
                  <td className="py-1.5">
                    <span className={`uppercase ${rec.type === 'revenue' ? 'text-status-success' : rec.type === 'expense' ? 'text-status-error' : 'text-text-muted'}`}>
                      {rec.type}
                    </span>
                  </td>
                  <td className="py-1.5 text-text-secondary">{rec.category}</td>
                  <td className="py-1.5 text-right tabular-nums text-text-primary">
                    {formatCurrency(Number(rec.amount), rec.currency === 'BRL' ? 'BRL' : 'USD', locale)}
                  </td>
                  <td className="py-1.5 text-right">
                    <button
                      type="button"
                      onClick={() => deleteRecordMutation.mutate({ id: rec.id })}
                      className="text-text-muted opacity-0 hover:text-status-error group-hover:opacity-100"
                    >
                      <Trash2 size={10} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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

function FinKpi({
  label,
  value,
  sub,
  growth,
  invertGrowth,
}: {
  label: string;
  value: string;
  sub?: string;
  growth?: number;
  invertGrowth?: boolean;
}) {
  const isPositive = invertGrowth ? (growth ?? 0) < 0 : (growth ?? 0) > 0;
  const isNegative = invertGrowth ? (growth ?? 0) > 0 : (growth ?? 0) < 0;

  return (
    <div className="border border-border-default bg-bg-base p-3">
      <p className="text-[8px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-text-primary">{value}</p>
      {sub && <p className="text-[8px] text-text-muted">{sub}</p>}
      {growth !== undefined && growth !== 0 && (
        <div className={`mt-0.5 flex items-center gap-0.5 text-[9px] ${isPositive ? 'text-status-success' : isNegative ? 'text-status-error' : 'text-text-muted'}`}>
          {isPositive ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
          <span>{growth > 0 ? '+' : ''}{growth}%</span>
        </div>
      )}
    </div>
  );
}

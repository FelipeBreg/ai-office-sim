'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle, Mail } from 'lucide-react';
import {
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

const PERIODS = [
  { days: 7, key: 'period7d' },
  { days: 30, key: 'period30d' },
  { days: 90, key: 'period90d' },
] as const;

export function MarketingTab() {
  const t = useTranslations('dashboard');
  const [days, setDays] = useState(30);

  const { data, isLoading, error } = trpc.dashboard.marketing.useQuery({ days });

  if (error) {
    return <p className="text-xs text-status-error">{t('loadError')}</p>;
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <Skeleton key={p.days} className="h-7 w-12" />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const waTotal = data.whatsapp.byDirection.reduce((s, r) => s + r.count, 0);
  const waInbound = data.whatsapp.byDirection.find((r) => r.direction === 'inbound')?.count ?? 0;
  const waOutbound = data.whatsapp.byDirection.find((r) => r.direction === 'outbound')?.count ?? 0;

  const emailTotal = data.email.byStatus.reduce((s, r) => s + r.count, 0);

  const hasData = waTotal > 0 || emailTotal > 0;

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

      {/* WhatsApp section */}
      <div className="border border-border-default bg-bg-base p-4">
        <div className="mb-4 flex items-center gap-1.5">
          <MessageCircle size={13} strokeWidth={1.5} className="text-green-400" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-green-400">
            {t('whatsapp')}
          </span>
        </div>

        {/* Volume cards */}
        <div className="mb-4 grid grid-cols-4 gap-2">
          <MiniStat label={t('totalMessages')} value={waTotal} />
          <MiniStat label={t('inbound')} value={waInbound} />
          <MiniStat label={t('outbound')} value={waOutbound} />
          <MiniStat label={t('uniqueContacts')} value={data.whatsapp.uniqueContacts} />
        </div>

        {/* Daily volume chart */}
        {data.whatsapp.daily.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-[9px] uppercase tracking-wider text-text-muted">{t('dailyVolume')}</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={data.whatsapp.daily}>
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
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A0E14',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 0,
                    fontFamily: 'IBM Plex Mono',
                    fontSize: 10,
                  }}
                />
                <Bar dataKey="count" fill="#4ade80" radius={0} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Status breakdown */}
        {data.whatsapp.byStatus.length > 0 && (
          <div>
            <p className="mb-2 text-[9px] uppercase tracking-wider text-text-muted">{t('deliveryStatus')}</p>
            <StatusBar
              items={data.whatsapp.byStatus.map((r) => ({
                label: t(r.status as 'sent' | 'delivered' | 'read' | 'pending' | 'failed'),
                count: r.count,
                color: getWaStatusColor(r.status),
              }))}
            />
          </div>
        )}
      </div>

      {/* Email section */}
      <div className="border border-border-default bg-bg-base p-4">
        <div className="mb-4 flex items-center gap-1.5">
          <Mail size={13} strokeWidth={1.5} className="text-accent-cyan" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-cyan">
            {t('email')}
          </span>
        </div>

        {/* Volume cards */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          <MiniStat label={t('totalMessages')} value={emailTotal} />
          <MiniStat label={t('uniqueRecipients')} value={data.email.uniqueRecipients} />
          <MiniStat
            label={t('delivered')}
            value={data.email.byStatus.find((r) => r.status === 'delivered')?.count ?? 0}
          />
        </div>

        {/* Daily volume chart */}
        {data.email.daily.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-[9px] uppercase tracking-wider text-text-muted">{t('dailyVolume')}</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={data.email.daily}>
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
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A0E14',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 0,
                    fontFamily: 'IBM Plex Mono',
                    fontSize: 10,
                  }}
                />
                <Bar dataKey="count" fill="#00C8E0" radius={0} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Status breakdown */}
        {data.email.byStatus.length > 0 && (
          <div>
            <p className="mb-2 text-[9px] uppercase tracking-wider text-text-muted">{t('deliveryStatus')}</p>
            <StatusBar
              items={data.email.byStatus.map((r) => ({
                label: t(r.status as 'sent' | 'delivered' | 'pending' | 'bounced' | 'failed'),
                count: r.count,
                color: getEmailStatusColor(r.status),
              }))}
            />
          </div>
        )}
      </div>

      {/* Empty state */}
      {!hasData && (
        <p className="py-8 text-center text-[11px] text-text-muted">{t('noData')}</p>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border-subtle bg-bg-overlay p-2">
      <p className="text-[8px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-text-primary">{value}</p>
    </div>
  );
}

function StatusBar({ items }: { items: { label: string; count: number; color: string }[] }) {
  const total = items.reduce((s, i) => s + i.count, 0);
  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-2 overflow-hidden">
        {items
          .filter((i) => i.count > 0)
          .map((item) => (
            <div
              key={item.label}
              className={`${item.color} transition-all`}
              style={{ width: `${(item.count / total) * 100}%` }}
            />
          ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <div className={`h-1.5 w-1.5 ${item.color}`} />
            <span className="text-[9px] text-text-muted">{item.label}</span>
            <span className="text-[9px] font-medium tabular-nums text-text-secondary">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getWaStatusColor(status: string): string {
  switch (status) {
    case 'delivered': return 'bg-status-success';
    case 'read': return 'bg-accent-cyan';
    case 'sent': return 'bg-blue-400';
    case 'pending': return 'bg-status-warning';
    case 'failed': return 'bg-status-error';
    default: return 'bg-text-muted';
  }
}

function getEmailStatusColor(status: string): string {
  switch (status) {
    case 'delivered': return 'bg-status-success';
    case 'sent': return 'bg-blue-400';
    case 'pending': return 'bg-status-warning';
    case 'bounced': return 'bg-status-error';
    case 'failed': return 'bg-status-error';
    default: return 'bg-text-muted';
  }
}

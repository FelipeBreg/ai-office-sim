'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Users, CheckSquare, ShieldCheck, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
  Legend,
} from 'recharts';
import { trpc } from '@/lib/trpc/client';
import { Skeleton } from '@/components/ui/skeleton';
import { PeriodSelector } from '@/components/period-selector';

interface StatusCount {
  status: string;
  count: number;
}

export function OperationsTab() {
  const t = useTranslations('dashboard');
  const [days, setDays] = useState(30);

  const { data, isLoading, error } = trpc.dashboard.operations.useQuery({ days });

  if (error) {
    return <p className="text-xs text-status-error">{t('loadError')}</p>;
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-40" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // Prepare data
  const agentTotal = data.agentStatus.reduce((s, r) => s + r.count, 0);
  const taskTotal = data.taskStatus.reduce((s, r) => s + r.count, 0);
  const taskDone = data.taskStatus.find((r) => r.status === 'done')?.count ?? 0;
  const approvalTotal = data.approvalStatus.reduce((s, r) => s + r.count, 0);
  const approvedCount = data.approvalStatus.find((r) => r.status === 'approved')?.count ?? 0;
  const actionTotal = data.actionStatus.reduce((s, r) => s + r.count, 0);
  const actionCompleted = data.actionStatus.find((r) => r.status === 'completed')?.count ?? 0;

  // Build hourly data (pad all 24 hours)
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    count: data.agentActivity?.find((a) => a.hour === i)?.count ?? 0,
  }));

  // Build daily stacked data
  const dailyMap = new Map<string, Record<string, number>>();
  data.actionDaily?.forEach((row) => {
    if (!dailyMap.has(row.day)) dailyMap.set(row.day, {});
    dailyMap.get(row.day)![row.status] = row.count;
  });
  const dailyStacked = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, statuses]) => ({ day, ...statuses }));

  return (
    <div className="flex flex-col gap-6">
      {/* Period selector */}
      <PeriodSelector days={days} onChange={setDays} />

      {/* 4-col widget row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricWidget
          icon={Users}
          title={t('agentStatus')}
          items={[
            { label: t('idle'), count: findCount(data.agentStatus, 'idle'), color: 'bg-text-muted' },
            { label: t('working'), count: findCount(data.agentStatus, 'working'), color: 'bg-accent-cyan' },
            { label: t('awaitingApproval'), count: findCount(data.agentStatus, 'awaiting_approval'), color: 'bg-status-warning' },
            { label: t('error'), count: findCount(data.agentStatus, 'error'), color: 'bg-status-error' },
            { label: t('offline'), count: findCount(data.agentStatus, 'offline'), color: 'bg-border-default' },
          ]}
          total={agentTotal}
        />

        <MetricWidget
          icon={CheckSquare}
          title={t('taskCompletion')}
          items={[
            { label: t('todo'), count: findCount(data.taskStatus, 'todo'), color: 'bg-text-muted' },
            { label: t('inProgress'), count: findCount(data.taskStatus, 'in_progress'), color: 'bg-status-warning' },
            { label: t('done'), count: findCount(data.taskStatus, 'done'), color: 'bg-status-success' },
          ]}
          total={taskTotal}
          rate={taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : 0}
          rateLabel={t('completionRate')}
        />

        <MetricWidget
          icon={ShieldCheck}
          title={t('approvalRates')}
          items={[
            { label: t('pending'), count: findCount(data.approvalStatus, 'pending'), color: 'bg-status-warning' },
            { label: t('approved'), count: findCount(data.approvalStatus, 'approved'), color: 'bg-status-success' },
            { label: t('rejected'), count: findCount(data.approvalStatus, 'rejected'), color: 'bg-status-error' },
          ]}
          total={approvalTotal}
          rate={approvalTotal > 0 ? Math.round((approvedCount / approvalTotal) * 100) : 0}
          rateLabel={t('approvalRate')}
        />

        <MetricWidget
          icon={Zap}
          title={t('actionSuccess')}
          items={[
            { label: t('completed'), count: findCount(data.actionStatus, 'completed'), color: 'bg-status-success' },
            { label: t('failed'), count: findCount(data.actionStatus, 'failed'), color: 'bg-status-error' },
            { label: t('pending'), count: findCount(data.actionStatus, 'pending'), color: 'bg-status-warning' },
            { label: t('cancelled'), count: findCount(data.actionStatus, 'cancelled'), color: 'bg-text-muted' },
          ]}
          total={actionTotal}
          rate={actionTotal > 0 ? Math.round((actionCompleted / actionTotal) * 100) : 0}
          rateLabel={t('successRate')}
        />
      </div>

      {/* Agent Activity by Hour */}
      {hourlyData.some((h) => h.count > 0) && (
        <div className="border border-border-default bg-bg-base p-4">
          <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {t('agentActivityHour')}
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={hourlyData}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)', fontFamily: 'IBM Plex Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)', fontFamily: 'IBM Plex Mono' }}
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
              <Area type="monotone" dataKey="count" stroke="#00C8E0" fill="rgba(0,200,224,0.15)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Actions by Day (stacked by status) */}
      {dailyStacked.length > 0 && (
        <div className="border border-border-default bg-bg-base p-4">
          <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {t('actionsByDay')}
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dailyStacked}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)', fontFamily: 'IBM Plex Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)', fontFamily: 'IBM Plex Mono' }}
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
              <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'IBM Plex Mono' }} />
              <Bar dataKey="completed" stackId="a" fill="#10b981" radius={0} />
              <Bar dataKey="failed" stackId="a" fill="#ef4444" radius={0} />
              <Bar dataKey="pending" stackId="a" fill="#f59e0b" radius={0} />
              <Bar dataKey="cancelled" stackId="a" fill="#6b7280" radius={0} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Empty state */}
      {agentTotal === 0 && taskTotal === 0 && approvalTotal === 0 && actionTotal === 0 && (
        <p className="py-8 text-center text-[11px] text-text-muted">{t('noData')}</p>
      )}
    </div>
  );
}

function findCount(items: StatusCount[], status: string): number {
  return items.find((i) => i.status === status)?.count ?? 0;
}

interface BarItem {
  label: string;
  count: number;
  color: string;
}

function MetricWidget({
  icon: Icon,
  title,
  items,
  total,
  rate,
  rateLabel,
}: {
  icon: LucideIcon;
  title: string;
  items: BarItem[];
  total: number;
  rate?: number;
  rateLabel?: string;
}) {
  return (
    <div className="border border-border-default bg-bg-base p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon size={12} strokeWidth={1.5} className="text-text-muted" />
          <span className="text-[9px] font-semibold uppercase tracking-wider text-text-muted">
            {title}
          </span>
        </div>
        {rate !== undefined && rateLabel && (
          <span className="text-[9px] text-accent-cyan">
            {rateLabel}: {rate}%
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="mb-2 flex h-1.5 overflow-hidden">
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
      )}

      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <div className={`h-1.5 w-1.5 ${item.color}`} />
            <span className="text-[9px] text-text-secondary">{item.label}</span>
            <span className="text-[9px] font-medium tabular-nums text-text-primary">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Users, CheckSquare, ShieldCheck, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const PERIODS = [
  { days: 7, key: 'period7d' },
  { days: 30, key: 'period30d' },
  { days: 90, key: 'period90d' },
] as const;

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
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <Skeleton key={p.days} className="h-7 w-12" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
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

      {/* 2x2 widget grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Agent Status */}
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

        {/* Task Completion */}
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

        {/* Approval Rates */}
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

        {/* Action Success */}
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
    <div className="border border-border-default bg-bg-base p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon size={13} strokeWidth={1.5} className="text-text-muted" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {title}
          </span>
        </div>
        {rate !== undefined && rateLabel && (
          <span className="text-[10px] text-accent-cyan">
            {rateLabel}: {rate}%
          </span>
        )}
      </div>

      {/* Proportional bar */}
      {total > 0 && (
        <div className="mb-3 flex h-2 overflow-hidden">
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

      {/* Counts */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`h-2 w-2 ${item.color}`} />
            <span className="text-[10px] text-text-secondary">{item.label}</span>
            <span className="text-[10px] font-medium tabular-nums text-text-primary">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

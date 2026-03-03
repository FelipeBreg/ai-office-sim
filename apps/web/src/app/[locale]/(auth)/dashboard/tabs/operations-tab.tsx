'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Users, CheckSquare, ShieldCheck, Zap, GitBranch, ChevronRight, ChevronDown, AlertTriangle as AlertTriangleIcon } from 'lucide-react';
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

      {/* Cascade Traces */}
      <CascadeTraceSection t={t} />

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

/* -------------------------------------------------------------------------- */
/*  Cascade Trace Section                                                     */
/* -------------------------------------------------------------------------- */

const CASCADE_STATUS_COLOR: Record<string, string> = {
  completed: 'text-status-success',
  failed: 'text-status-error',
  partial_failure: 'text-status-warning',
  in_progress: 'text-accent-cyan',
};

function CascadeTraceSection({ t }: { t: ReturnType<typeof useTranslations<'dashboard'>> }) {
  const { data: cascades, isLoading } = trpc.cascades.listRecent.useQuery({ limit: 20 });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="border border-border-default bg-bg-base p-4">
        <Skeleton className="mb-3 h-4 w-40" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!cascades || cascades.length === 0) return null;

  return (
    <div className="border border-border-default bg-bg-base p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <GitBranch size={12} strokeWidth={1.5} className="text-text-muted" />
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          {t('cascadeTraces' as Parameters<typeof t>[0])}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-border-default text-left">
              <th className="w-6 px-2 py-1.5" />
              <th className="px-2 py-1.5 text-text-muted">{t('cascadeId' as Parameters<typeof t>[0])}</th>
              <th className="px-2 py-1.5 text-text-muted">{t('status' as Parameters<typeof t>[0])}</th>
              <th className="px-2 py-1.5 text-text-muted">{t('events' as Parameters<typeof t>[0])}</th>
              <th className="px-2 py-1.5 text-text-muted">{t('depth' as Parameters<typeof t>[0])}</th>
              <th className="px-2 py-1.5 text-text-muted">{t('totalCost' as Parameters<typeof t>[0])}</th>
              <th className="px-2 py-1.5 text-text-muted">{t('duration' as Parameters<typeof t>[0])}</th>
              <th className="px-2 py-1.5 text-text-muted">{t('trigger' as Parameters<typeof t>[0])}</th>
            </tr>
          </thead>
          <tbody>
            {cascades.map((c) => (
              <CascadeRow
                key={c.cascadeId}
                cascade={c}
                expanded={expandedId === c.cascadeId}
                onToggle={() => setExpandedId(expandedId === c.cascadeId ? null : c.cascadeId)}
                t={t}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CascadeRow({
  cascade,
  expanded,
  onToggle,
  t,
}: {
  cascade: {
    cascadeId: string;
    status: string;
    eventCount: number;
    maxDepth: number;
    totalCostUsd: string;
    maxDurationMs: number;
    rootTriggerType: string | null;
    createdAt: string;
  };
  expanded: boolean;
  onToggle: () => void;
  t: ReturnType<typeof useTranslations<'dashboard'>>;
}) {
  return (
    <>
      <tr
        className="cursor-pointer border-b border-border-default transition-colors hover:bg-bg-overlay"
        onClick={onToggle}
      >
        <td className="px-2 py-1.5">
          {expanded ? (
            <ChevronDown size={10} strokeWidth={1.5} className="text-text-muted" />
          ) : (
            <ChevronRight size={10} strokeWidth={1.5} className="text-text-muted" />
          )}
        </td>
        <td className="px-2 py-1.5 font-mono text-text-secondary">
          {cascade.cascadeId.slice(0, 8)}...
        </td>
        <td className={`px-2 py-1.5 ${CASCADE_STATUS_COLOR[cascade.status] ?? 'text-text-muted'}`}>
          {cascade.status.replace('_', ' ')}
        </td>
        <td className="px-2 py-1.5 tabular-nums text-text-primary">{cascade.eventCount}</td>
        <td className="px-2 py-1.5 tabular-nums text-text-primary">{cascade.maxDepth}</td>
        <td className="px-2 py-1.5 tabular-nums text-text-primary">
          ${Number(cascade.totalCostUsd).toFixed(4)}
        </td>
        <td className="px-2 py-1.5 tabular-nums text-text-primary">
          {cascade.maxDurationMs > 0 ? `${(cascade.maxDurationMs / 1000).toFixed(1)}s` : '—'}
        </td>
        <td className="px-2 py-1.5 text-text-secondary">
          {cascade.rootTriggerType ?? '—'}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="bg-bg-overlay px-4 py-3">
            <CascadeTreeDetail cascadeId={cascade.cascadeId} t={t} />
          </td>
        </tr>
      )}
    </>
  );
}

function CascadeTreeDetail({
  cascadeId,
  t,
}: {
  cascadeId: string;
  t: ReturnType<typeof useTranslations<'dashboard'>>;
}) {
  const { data: events, isLoading } = trpc.cascades.getCascadeTree.useQuery(
    { cascadeId },
    { enabled: true },
  );

  if (isLoading) return <Skeleton className="h-16" />;
  if (!events || events.length === 0) {
    return <p className="text-[9px] text-text-muted">{t('noData')}</p>;
  }

  type CascadeEvent = (typeof events)[number];

  // Build tree structure from flat events using parentEventId
  const roots = events.filter((e) => !e.parentEventId);
  const childMap = new Map<string, CascadeEvent[]>();
  for (const e of events) {
    if (e.parentEventId) {
      const arr = childMap.get(e.parentEventId) ?? [];
      arr.push(e);
      childMap.set(e.parentEventId, arr);
    }
  }

  function renderNode(
    node: CascadeEvent,
    depth: number,
  ): React.ReactNode {
    const children = childMap.get(node.id) ?? [];
    const statusColor = CASCADE_STATUS_COLOR[node.status] ?? 'text-text-muted';

    return (
      <div key={node.id} style={{ paddingLeft: depth * 16 }}>
        <div className="flex items-center gap-2 py-0.5">
          {depth > 0 && <span className="text-[8px] text-border-default">└</span>}
          <span className={`text-[9px] font-medium ${statusColor}`}>
            {node.status === 'failed' && <AlertTriangleIcon size={8} className="mr-0.5 inline" />}
            {node.agentName ?? node.agentId?.slice(0, 8) ?? 'workflow'}
          </span>
          <span className="text-[8px] text-text-muted">
            d{node.depth} · {node.triggerType ?? '—'}
          </span>
          <span className="text-[8px] tabular-nums text-text-secondary">
            ${Number(node.costUsd ?? 0).toFixed(4)}
          </span>
          {node.durationMs != null && (
            <span className="text-[8px] tabular-nums text-text-muted">
              {(node.durationMs / 1000).toFixed(1)}s
            </span>
          )}
          {node.error && (
            <span className="text-[8px] text-status-error" title={node.error}>
              err
            </span>
          )}
        </div>
        {children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }

  return <div>{roots.map((r) => renderNode(r, 0))}</div>;
}

/* -------------------------------------------------------------------------- */
/*  MetricWidget                                                              */
/* -------------------------------------------------------------------------- */

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

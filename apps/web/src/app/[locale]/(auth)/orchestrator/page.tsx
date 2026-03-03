'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Cpu,
  Users,
  GitBranch,
  ShieldCheck,
  DollarSign,
  Coins,
  BarChart3,
  Settings2,
  Pause,
  Play,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { trpc } from '@/lib/trpc/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PeriodSelector } from '@/components/period-selector';

const TEAMS = ['development', 'research', 'marketing', 'sales', 'support', 'finance', 'operations'] as const;

type Tab = 'fleet' | 'cost' | 'config';

export default function OrchestratorPage() {
  const t = useTranslations('orchestrator');
  const [activeTab, setActiveTab] = useState<Tab>('fleet');

  const tabs: { id: Tab; labelKey: string; icon: typeof Cpu }[] = [
    { id: 'fleet', labelKey: 'fleetOverview', icon: Users },
    { id: 'cost', labelKey: 'costTracker', icon: DollarSign },
    { id: 'config', labelKey: 'config', icon: Settings2 },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Cpu size={16} strokeWidth={1.5} className="text-accent-cyan" />
        <div>
          <h1 className="text-sm font-semibold uppercase tracking-widest text-text-primary">
            {t('title')}
          </h1>
          <p className="mt-0.5 text-[11px] text-text-muted">{t('subtitle')}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-border-default">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-[11px] uppercase tracking-wider transition-colors ${
                isActive
                  ? 'border-b-2 border-accent-cyan text-accent-cyan'
                  : 'border-b-2 border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              <Icon size={13} strokeWidth={1.5} />
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1">
        {activeTab === 'fleet' && <FleetTab />}
        {activeTab === 'cost' && <CostTab />}
        {activeTab === 'config' && <ConfigTab />}
      </div>
    </div>
  );
}

/* ──────────────────── Fleet Overview Tab ──────────────────── */

function FleetTab() {
  const t = useTranslations('orchestrator');
  const { data, isLoading } = trpc.orchestrator.getFleetStatus.useQuery();

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-32" />
      </div>
    );
  }

  const { agents: a } = data;
  const agentTotal = a.total;

  const statusItems = [
    { key: 'idle', label: t('idle'), count: a.idle, color: 'bg-text-muted' },
    { key: 'working', label: t('working'), count: a.working, color: 'bg-accent-cyan' },
    { key: 'awaiting', label: t('awaitingApproval'), count: a.awaitingApproval, color: 'bg-status-warning' },
    { key: 'error', label: t('errorState'), count: a.error, color: 'bg-status-error' },
    { key: 'offline', label: t('offline'), count: a.offline, color: 'bg-border-default' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={Users} label={t('totalAgents')} value={agentTotal} />
        <KpiCard icon={GitBranch} label={t('workflowsRunning')} value={data.workflowsRunning} accent />
        <KpiCard icon={ShieldCheck} label={t('pendingApprovals')} value={data.pendingApprovals} warning={data.pendingApprovals > 0} />
        <KpiCard icon={DollarSign} label={t('todaySpend')} value={`$${data.cost.todayUsd.toFixed(2)}`} />
      </div>

      {/* Agent status bar */}
      <div className="border border-border-default bg-bg-base p-4">
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          Agent Fleet Status
        </h3>
        {agentTotal > 0 && (
          <div className="mb-3 flex h-2 overflow-hidden">
            {statusItems
              .filter((s) => s.count > 0)
              .map((s) => (
                <div
                  key={s.key}
                  className={`${s.color} transition-all`}
                  style={{ width: `${(s.count / agentTotal) * 100}%` }}
                />
              ))}
          </div>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {statusItems.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5">
              <div className={`h-2 w-2 ${s.color}`} />
              <span className="text-[10px] text-text-secondary">{s.label}</span>
              <span className="text-[10px] font-medium tabular-nums text-text-primary">{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cost summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t('todaySpend')} value={`$${data.cost.todayUsd.toFixed(2)}`} />
        <StatCard label={t('monthSpend')} value={`$${data.cost.monthUsd.toFixed(2)}`} />
        <StatCard label={t('todayTokens')} value={data.cost.todayTokens.toLocaleString()} />
        <StatCard label={t('monthTokens')} value={data.cost.monthTokens.toLocaleString()} />
      </div>

      {/* Team actions */}
      <div className="border border-border-default bg-bg-base p-4">
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          {t('teamActions')}
        </h3>
        <div className="flex flex-wrap gap-2">
          {TEAMS.map((team) => (
            <TeamActionButtons key={team} team={team} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TeamActionButtons({ team }: { team: string }) {
  const t = useTranslations('orchestrator');
  const utils = trpc.useUtils();
  const pauseMut = trpc.orchestrator.pauseTeam.useMutation({
    onSuccess: () => utils.orchestrator.getFleetStatus.invalidate(),
  });
  const resumeMut = trpc.orchestrator.resumeTeam.useMutation({
    onSuccess: () => utils.orchestrator.getFleetStatus.invalidate(),
  });

  return (
    <div className="flex items-center gap-1 border border-border-default px-2 py-1.5">
      <span className="text-[9px] font-semibold uppercase tracking-wider text-text-secondary">
        {team}
      </span>
      <button
        type="button"
        onClick={() => pauseMut.mutate({ team })}
        disabled={pauseMut.isPending}
        className="ml-1.5 p-0.5 text-text-muted transition-colors hover:text-status-warning"
        title={t('pauseTeam')}
      >
        <Pause size={10} strokeWidth={2} />
      </button>
      <button
        type="button"
        onClick={() => resumeMut.mutate({ team })}
        disabled={resumeMut.isPending}
        className="p-0.5 text-text-muted transition-colors hover:text-status-success"
        title={t('resumeTeam')}
      >
        <Play size={10} strokeWidth={2} />
      </button>
    </div>
  );
}

/* ──────────────────── Cost Tracker Tab ──────────────────── */

function CostTab() {
  const t = useTranslations('orchestrator');
  const [days, setDays] = useState(7);
  const { data, isLoading } = trpc.orchestrator.getCostReport.useQuery({ days });

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PeriodSelector days={days} onChange={setDays} />

      {/* Daily cost trend */}
      {data.daily.length > 0 ? (
        <div className="border border-border-default bg-bg-base p-4">
          <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {t('dailyTrend')}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.daily}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)', fontFamily: 'IBM Plex Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)', fontFamily: 'IBM Plex Mono' }}
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
                formatter={(value: number | string | undefined) => [`$${Number(value ?? 0).toFixed(4)}`, 'Cost']}
              />
              <Area
                type="monotone"
                dataKey="totalCostUsd"
                stroke="#00C8E0"
                fill="rgba(0,200,224,0.15)"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-8 text-center text-[11px] text-text-muted">{t('noCostData')}</p>
      )}

      {/* Per-agent cost table */}
      {data.perAgent.length > 0 && (
        <div className="border border-border-default bg-bg-base p-4">
          <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {t('costByAgent')}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-border-default text-left text-text-muted">
                  <th className="pb-2 pr-4 font-medium uppercase tracking-wider">{t('agent')}</th>
                  <th className="pb-2 pr-4 text-right font-medium uppercase tracking-wider">{t('cost')}</th>
                  <th className="pb-2 pr-4 text-right font-medium uppercase tracking-wider">{t('tokens')}</th>
                  <th className="pb-2 text-right font-medium uppercase tracking-wider">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.perAgent.map((row) => (
                  <tr key={row.agentId} className="border-b border-border-subtle">
                    <td className="py-1.5 pr-4 text-text-primary">{row.agentName}</td>
                    <td className="py-1.5 pr-4 text-right tabular-nums text-accent-cyan">
                      ${row.totalCostUsd.toFixed(4)}
                    </td>
                    <td className="py-1.5 pr-4 text-right tabular-nums text-text-secondary">
                      {row.totalTokens.toLocaleString()}
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-text-secondary">
                      {row.actionCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bar chart — top 10 agents by cost */}
      {data.perAgent.length > 0 && (
        <div className="border border-border-default bg-bg-base p-4">
          <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {t('costByAgent')} — Top 10
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.perAgent.slice(0, 10)} layout="vertical">
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <XAxis
                type="number"
                tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)', fontFamily: 'IBM Plex Mono' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${v.toFixed(2)}`}
              />
              <YAxis
                type="category"
                dataKey="agentName"
                width={100}
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
                formatter={(value: number | string | undefined) => [`$${Number(value ?? 0).toFixed(4)}`, 'Cost']}
              />
              <Bar dataKey="totalCostUsd" fill="#00C8E0" radius={0} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ──────────────────── Config Tab ──────────────────── */

function ConfigTab() {
  const t = useTranslations('orchestrator');
  const { data, isLoading } = trpc.orchestrator.getConfig.useQuery();
  const utils = trpc.useUtils();

  const [maxConcurrency, setMaxConcurrency] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState<string | null>(null);
  const [monthlyLimit, setMonthlyLimit] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const updateMut = trpc.orchestrator.updateConfig.useMutation({
    onSuccess: () => {
      utils.orchestrator.getConfig.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  // Initialize form values when data loads
  const concurrency = maxConcurrency ?? data?.maxConcurrency ?? 5;
  const daily = dailyLimit ?? String(data?.dailySpendLimitUsd ?? '0');
  const monthly = monthlyLimit ?? String(data?.monthlySpendLimitUsd ?? '0');

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-lg space-y-4">
        {/* Max Concurrency */}
        <div className="border border-border-default bg-bg-base p-4">
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {t('maxConcurrency')}
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={concurrency}
            onChange={(e) => setMaxConcurrency(Number(e.target.value))}
            className="w-full border border-border-default bg-bg-deepest px-3 py-1.5 text-xs text-text-primary outline-none transition-colors focus:border-accent-cyan"
          />
          <p className="mt-1 text-[9px] text-text-muted">
            Maximum agents executing concurrently in this project.
          </p>
        </div>

        {/* Daily Spend Limit */}
        <div className="border border-border-default bg-bg-base p-4">
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {t('dailySpendLimit')} (USD)
          </label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={daily}
            onChange={(e) => setDailyLimit(e.target.value)}
            className="w-full border border-border-default bg-bg-deepest px-3 py-1.5 text-xs text-text-primary outline-none transition-colors focus:border-accent-cyan"
          />
          <p className="mt-1 text-[9px] text-text-muted">
            0 = {t('unlimited')}. Agents pause when limit is reached.
          </p>
        </div>

        {/* Monthly Spend Limit */}
        <div className="border border-border-default bg-bg-base p-4">
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {t('monthlySpendLimit')} (USD)
          </label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={monthly}
            onChange={(e) => setMonthlyLimit(e.target.value)}
            className="w-full border border-border-default bg-bg-deepest px-3 py-1.5 text-xs text-text-primary outline-none transition-colors focus:border-accent-cyan"
          />
          <p className="mt-1 text-[9px] text-text-muted">
            0 = {t('unlimited')}. All agents pause when monthly limit is reached.
          </p>
        </div>

        {/* Save */}
        <button
          type="button"
          onClick={() =>
            updateMut.mutate({
              maxConcurrency: concurrency,
              dailySpendLimitUsd: daily,
              monthlySpendLimitUsd: monthly,
            })
          }
          disabled={updateMut.isPending}
          className="border border-accent-cyan bg-accent-cyan/10 px-4 py-2 text-[11px] uppercase tracking-wider text-accent-cyan transition-colors hover:bg-accent-cyan/20 disabled:opacity-50"
        >
          {updateMut.isPending ? t('saving') : t('saveConfig')}
        </button>

        {saved && (
          <p className="text-[10px] text-status-success">{t('configSaved')}</p>
        )}
      </div>
    </div>
  );
}

/* ──────────────────── Shared Components ──────────────────── */

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
  warning,
}: {
  icon: typeof Cpu;
  label: string;
  value: string | number;
  accent?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="border border-border-default bg-bg-base p-3">
      <div className="mb-1 flex items-center gap-1.5">
        <Icon size={12} strokeWidth={1.5} className="text-text-muted" />
        <span className="text-[9px] font-semibold uppercase tracking-wider text-text-muted">
          {label}
        </span>
      </div>
      <span
        className={`text-lg font-semibold tabular-nums ${
          warning ? 'text-status-warning' : accent ? 'text-accent-cyan' : 'text-text-primary'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border-default bg-bg-base p-3">
      <span className="block text-[9px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <span className="text-sm font-medium tabular-nums text-text-primary">{value}</span>
    </div>
  );
}

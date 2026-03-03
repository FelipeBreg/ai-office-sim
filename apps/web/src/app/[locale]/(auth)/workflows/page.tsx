'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus, GitBranch, AlertTriangle, Trash2, LayoutGrid, Bot,
  Activity, Play, RefreshCw, CheckCircle, XCircle, Clock, Loader2,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/navigation';

/* -------------------------------------------------------------------------- */
/*  Node-type colors (same as templates)                                      */
/* -------------------------------------------------------------------------- */

const NODE_TYPE_COLORS: Record<string, string> = {
  trigger: 'bg-emerald-500',
  agent: 'bg-cyan-400',
  condition: 'bg-amber-400',
  approval: 'bg-violet-400',
  output: 'bg-rose-400',
  delay: 'bg-blue-400',
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function timeAgo(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return '<1m';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface DefinitionData {
  nodes?: Array<{ type?: string; data?: { nodeType?: string } }>;
  edges?: unknown[];
}

function extractNodeInfo(definition: unknown): { nodeTypes: Set<string>; agentCount: number; nodeCount: number } {
  const def = definition as DefinitionData | null;
  const nodeTypes = new Set<string>();
  let agentCount = 0;

  if (def?.nodes) {
    for (const n of def.nodes) {
      const nt = n.data?.nodeType ?? n.type;
      if (nt) nodeTypes.add(nt);
      if (nt === 'agent') agentCount++;
    }
  }

  return { nodeTypes, agentCount, nodeCount: def?.nodes?.length ?? 0 };
}

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                          */
/* -------------------------------------------------------------------------- */

function WorkflowCardSkeleton() {
  return (
    <div className="border border-border-default bg-bg-raised p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <div>
            <Skeleton className="mb-1 h-3 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
        <Skeleton className="h-4 w-14" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="mt-3 h-2.5 w-full" />
      <div className="mt-3 flex items-center justify-between border-t border-border-default pt-2.5">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-2.5 w-12" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Empty state                                                               */
/* -------------------------------------------------------------------------- */

function EmptyState({ t }: { t: ReturnType<typeof useTranslations<'workflows'>> }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center border border-border-default bg-bg-raised">
        <GitBranch size={24} strokeWidth={1.2} className="text-text-muted" />
      </div>
      <div className="text-center">
        <p className="text-xs text-text-secondary">{t('noWorkflows')}</p>
        <p className="mt-1 text-[10px] text-text-muted">{t('noWorkflowsDescription')}</p>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/workflows/new">
          <Button size="sm">
            <Plus size={12} strokeWidth={2} className="mr-1" />
            {t('createWorkflow')}
          </Button>
        </Link>
        <Link href="/workflows/templates">
          <Button size="sm" variant="secondary">
            <LayoutGrid size={12} strokeWidth={2} className="mr-1" />
            {t('browseTemplates')}
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Error state                                                               */
/* -------------------------------------------------------------------------- */

function ErrorState({ t }: { t: ReturnType<typeof useTranslations<'workflows'>> }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <AlertTriangle size={20} strokeWidth={1.5} className="text-status-error" />
      <p className="text-xs text-status-error">{t('loadError')}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Workflow card                                                             */
/* -------------------------------------------------------------------------- */

interface Workflow {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  definition: unknown;
  isActive: boolean;
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

function WorkflowCard({
  workflow,
  t,
  onDelete,
}: {
  workflow: Workflow;
  t: ReturnType<typeof useTranslations<'workflows'>>;
  onDelete: (id: string) => void;
}) {
  const { nodeTypes, agentCount, nodeCount } = extractNodeInfo(workflow.definition);
  const runCount = 0; // TODO: wire up when run history is available
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    onDelete(workflow.id);
  };

  return (
    <Link href={`/workflows/${workflow.id}`} className="block">
      <div className="group border border-border-default bg-bg-raised transition-colors hover:border-accent-cyan/40 hover:bg-bg-raised/80">
        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border-default bg-bg-base">
              <GitBranch size={14} strokeWidth={1.5} className="text-text-muted" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-xs font-medium text-text-primary">{workflow.name}</h3>
            </div>
          </div>
          <Badge variant={workflow.isActive ? 'success' : 'default'}>
            {workflow.isActive ? t('active') : t('inactive')}
          </Badge>
        </div>

        {/* Stats badges + node dots */}
        <div className="flex flex-wrap items-center gap-1.5 px-4">
          <Badge variant="default">
            {t('nodes', { count: nodeCount })}
          </Badge>
          {agentCount > 0 && (
            <Badge variant="default">
              <Bot size={8} strokeWidth={1.5} className="mr-0.5" />
              {t('agentCount', { count: agentCount })}
            </Badge>
          )}
          <Badge variant="default">
            {t('runs', { count: runCount })}
          </Badge>
          {/* Node type dots */}
          {nodeTypes.size > 0 && (
            <div className="ml-1 flex items-center gap-1">
              {Array.from(nodeTypes).map((nt) => (
                <span
                  key={nt}
                  className={`inline-block h-1.5 w-1.5 ${NODE_TYPE_COLORS[nt] ?? 'bg-text-muted'}`}
                  title={nt}
                />
              ))}
            </div>
          )}
        </div>

        {/* Description preview */}
        {workflow.description && (
          <p className="mt-3 truncate px-4 text-[10px] text-text-muted">
            {workflow.description}
          </p>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between border-t border-border-default px-4 py-2.5">
          <span className="text-[10px] text-text-muted">
            {t('lastRun')}: {t('never')}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-muted opacity-0 transition-opacity group-hover:opacity-100">
              {timeAgo(workflow.updatedAt)}
            </span>
            <button
              type="button"
              onClick={handleDelete}
              className="flex h-5 w-5 items-center justify-center text-text-muted opacity-0 transition-all hover:text-status-error group-hover:opacity-100"
              aria-label={t('deleteWorkflow')}
            >
              {confirmDelete ? (
                <span className="text-[8px] text-status-error">{t('confirmDelete')}</span>
              ) : (
                <Trash2 size={10} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Run status config                                                         */
/* -------------------------------------------------------------------------- */

const RUN_STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
  running: { color: 'text-accent-cyan', icon: Loader2, label: 'Running' },
  completed: { color: 'text-status-success', icon: CheckCircle, label: 'Completed' },
  failed: { color: 'text-status-error', icon: XCircle, label: 'Failed' },
  cancelled: { color: 'text-text-muted', icon: XCircle, label: 'Cancelled' },
  waiting_approval: { color: 'text-[#D29922]', icon: Clock, label: 'Awaiting Approval' },
};

/* -------------------------------------------------------------------------- */
/*  Runs tab                                                                  */
/* -------------------------------------------------------------------------- */

function RunsTab({ t }: { t: ReturnType<typeof useTranslations<'workflows'>> }) {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const utils = trpc.useUtils();

  const { data: stats } = trpc.workflows.getRunStats.useQuery();
  const { data: runs, isLoading } = trpc.workflows.listAllRuns.useQuery(
    statusFilter ? { status: statusFilter as any } : undefined,
  );
  const retryMutation = trpc.workflows.retryRun.useMutation({
    onSuccess: () => {
      void utils.workflows.listAllRuns.invalidate();
      void utils.workflows.getRunStats.invalidate();
    },
  });

  const resumeMutation = trpc.workflows.resumeRun.useMutation({
    onSuccess: () => {
      void utils.workflows.listAllRuns.invalidate();
      void utils.workflows.getRunStats.invalidate();
    },
  });

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      {stats && (
        <div className="flex items-center gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'text-text-primary' },
            { label: 'Running', value: stats.running, color: 'text-accent-cyan' },
            { label: 'Completed', value: stats.completed, color: 'text-status-success' },
            { label: 'Failed', value: stats.failed, color: 'text-status-error' },
            { label: 'Approval', value: stats.waitingApproval, color: 'text-[#D29922]' },
          ].map(({ label, value, color }) => (
            <button
              key={label}
              onClick={() => setStatusFilter(
                label === 'Total' ? undefined :
                label === 'Approval' ? 'waiting_approval' :
                label.toLowerCase()
              )}
              className={`border px-3 py-1.5 transition-colors ${
                (statusFilter === label.toLowerCase() || (label === 'Total' && !statusFilter) || (label === 'Approval' && statusFilter === 'waiting_approval'))
                  ? 'border-accent-cyan bg-accent-cyan/5'
                  : 'border-border-default hover:border-border-hover'
              }`}
            >
              <span className={`text-sm font-medium ${color}`}>{value}</span>
              <p className="text-[8px] uppercase tracking-[0.15em] text-text-muted">{label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Run list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !runs || runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Activity size={20} className="text-text-muted" />
          <p className="text-[10px] text-text-muted">{t('noRuns')}</p>
        </div>
      ) : (
        <div className="divide-y divide-border-default border border-border-default">
          {runs.map((run) => {
            const cfg = RUN_STATUS_CONFIG[run.status] ?? RUN_STATUS_CONFIG.completed!;
            const StatusIcon = cfg.icon;
            const duration = run.completedAt
              ? Math.round((new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)
              : null;

            return (
              <div key={run.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-bg-base/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <StatusIcon
                    size={14}
                    className={`shrink-0 ${cfg.color} ${run.status === 'running' ? 'animate-spin' : ''}`}
                  />
                  <div className="min-w-0">
                    <Link href={`/workflows/${run.workflowId}`} className="text-[11px] text-text-primary hover:text-accent-cyan truncate block">
                      {run.workflowName}
                    </Link>
                    <div className="flex items-center gap-2 text-[8px] text-text-muted">
                      <span>{new Date(run.startedAt).toLocaleString()}</span>
                      {duration !== null && <span>{duration}s</span>}
                      {run.error && (
                        <span className="text-status-error truncate max-w-48" title={run.error}>
                          {run.error}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant={run.status === 'completed' ? 'success' : run.status === 'failed' ? 'error' : 'default'}>
                    {cfg.label}
                  </Badge>
                  {run.status === 'failed' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => retryMutation.mutate({ runId: run.id })}
                      disabled={retryMutation.isPending}
                      className="!text-[8px] !py-0.5 !px-1.5"
                    >
                      <RefreshCw size={8} className={`mr-0.5 ${retryMutation.isPending ? 'animate-spin' : ''}`} />
                      Retry
                    </Button>
                  )}
                  {run.status === 'waiting_approval' && (
                    <div className="flex gap-1">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => resumeMutation.mutate({ runId: run.id, approved: true })}
                        disabled={resumeMutation.isPending}
                        className="!text-[8px] !py-0.5 !px-1.5"
                      >
                        {t('approve')}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => resumeMutation.mutate({ runId: run.id, approved: false })}
                        disabled={resumeMutation.isPending}
                        className="!text-[8px] !py-0.5 !px-1.5"
                      >
                        {t('reject')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

type Tab = 'workflows' | 'runs';

export default function WorkflowsPage() {
  const t = useTranslations('workflows');
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<Tab>('workflows');
  const { data: workflows, isLoading, isError } = trpc.workflows.list.useQuery();
  const deleteMutation = trpc.workflows.delete.useMutation({
    onSuccess: () => {
      void utils.workflows.list.invalidate();
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ id });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xs font-semibold uppercase tracking-[0.15em] text-text-primary">
              {t('title')}
            </h1>
            <p className="mt-0.5 text-[10px] text-text-muted">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-1">
            {(['workflows', 'runs'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-[10px] font-medium uppercase tracking-wider transition-colors ${
                  activeTab === tab
                    ? 'border border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                    : 'border border-transparent text-text-muted hover:text-text-secondary'
                }`}
              >
                {tab === 'workflows' ? t('title') : t('allRuns')}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/workflows/templates">
            <Button size="sm" variant="secondary">
              <LayoutGrid size={12} strokeWidth={2} className="mr-1" />
              {t('browseTemplates')}
            </Button>
          </Link>
          <Link href="/workflows/new">
            <Button size="sm">
              <Plus size={12} strokeWidth={2} className="mr-1" />
              {t('newWorkflow')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'runs' ? (
          <RunsTab t={t} />
        ) : (
          <>
            {/* Loading */}
            {isLoading && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <WorkflowCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Error */}
            {isError && <ErrorState t={t} />}

            {/* Empty */}
            {!isLoading && !isError && workflows && workflows.length === 0 && <EmptyState t={t} />}

            {/* Workflow grid */}
            {!isLoading && !isError && workflows && workflows.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {workflows.map((workflow) => (
                  <WorkflowCard
                    key={workflow.id}
                    workflow={workflow as unknown as Workflow}
                    t={t}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

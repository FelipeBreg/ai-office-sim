'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Rocket,
  GitPullRequest,
  RotateCcw,
  Server,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Inbox,
  ChevronDown,
  ChevronRight,
  ListTodo,
  User,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button, Badge, Skeleton } from '@/components/ui';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type Tab = 'board' | 'tasks';
type DevopsStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'deployed' | 'failed';
type DevopsType = 'deploy' | 'pr_review' | 'rollback' | 'infra_change';
type DevopsPriority = 'low' | 'medium' | 'high' | 'critical';
type TaskStatus = 'todo' | 'in_progress' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface DevopsRequest {
  id: string;
  projectId: string;
  agentId: string;
  type: DevopsType;
  priority: DevopsPriority;
  status: DevopsStatus;
  title: string;
  description: string | null;
  metadata: {
    branch?: string;
    commitSha?: string;
    prUrl?: string;
    prNumber?: number;
    environment?: string;
    repoUrl?: string;
    rollbackTarget?: string;
  } | null;
  reviewedBy: string | null;
  reviewComment: string | null;
  reviewedAt: string | Date | null;
  deployedAt: string | Date | null;
  createdAt: string | Date;
}

interface HumanTask {
  id: string;
  projectId: string;
  agentId: string | null;
  assignedTo: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  title: string;
  description: string | null;
  context: string | null;
  devopsRequestId: string | null;
  dueAt: string | Date | null;
  completedAt: string | Date | null;
  createdAt: string | Date;
}

interface Agent {
  id: string;
  name: string;
  archetype: string;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const TYPE_ICON: Record<DevopsType, typeof Rocket> = {
  deploy: Rocket,
  pr_review: GitPullRequest,
  rollback: RotateCcw,
  infra_change: Server,
};

const PRIORITY_VARIANT: Record<DevopsPriority, 'default' | 'warning' | 'error' | 'cyan'> = {
  low: 'default',
  medium: 'cyan',
  high: 'warning',
  critical: 'error',
};

const TASK_PRIORITY_VARIANT: Record<TaskPriority, 'default' | 'warning' | 'error' | 'cyan'> = {
  low: 'default',
  medium: 'cyan',
  high: 'warning',
  urgent: 'error',
};

const KANBAN_COLUMNS: { status: DevopsStatus; colorClass: string }[] = [
  { status: 'pending', colorClass: 'border-t-status-warning' },
  { status: 'in_review', colorClass: 'border-t-accent-cyan' },
  { status: 'deployed', colorClass: 'border-t-status-success' },
];

const TASK_COLUMNS: { status: TaskStatus; colorClass: string }[] = [
  { status: 'todo', colorClass: 'border-t-status-warning' },
  { status: 'in_progress', colorClass: 'border-t-accent-cyan' },
  { status: 'done', colorClass: 'border-t-status-success' },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function relativeTime(date: string | Date): string {
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return '--';
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return `${diffSec}s`;
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  return `${diffDay}d`;
}

/* -------------------------------------------------------------------------- */
/*  Loading skeletons                                                          */
/* -------------------------------------------------------------------------- */

function CardSkeleton() {
  return (
    <div className="border border-border-default bg-bg-raised p-3">
      <Skeleton className="mb-2 h-3 w-3/4" />
      <Skeleton className="mb-2 h-2.5 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

function ColumnSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Empty state                                                                */
/* -------------------------------------------------------------------------- */

function EmptyColumn({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8">
      <Inbox size={14} strokeWidth={1.5} className="text-text-muted" />
      <p className="text-[9px] text-text-muted">{message}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  DevOps Request Card                                                        */
/* -------------------------------------------------------------------------- */

function DevopsCard({
  request,
  agent,
  onReview,
  onMarkDeployed,
  isActioning,
  t,
}: {
  request: DevopsRequest;
  agent: Agent | undefined;
  onReview: (id: string, action: 'approve' | 'reject', comment?: string) => void;
  onMarkDeployed: (id: string) => void;
  isActioning: boolean;
  t: ReturnType<typeof useTranslations<'devops'>>;
}) {
  const [expanded, setExpanded] = useState(false);
  const TypeIcon = TYPE_ICON[request.type] ?? Rocket;
  const agentName = agent?.name ?? t('unknownAgent');

  return (
    <div className="border border-border-default bg-bg-raised transition-colors hover:border-border-hover">
      <div className="p-3">
        {/* Header: icon + title */}
        <div className="flex items-start gap-2">
          <TypeIcon size={12} strokeWidth={1.5} className="mt-0.5 shrink-0 text-text-muted" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-text-primary">{request.title}</p>
            <p className="mt-0.5 text-[9px] text-text-muted">{agentName}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge variant="default">{t(`type_${request.type}`)}</Badge>
          <Badge variant={PRIORITY_VARIANT[request.priority]}>
            {request.priority.toUpperCase()}
          </Badge>
          {request.metadata?.branch && (
            <span className="truncate text-[9px] text-text-muted">
              {request.metadata.branch}
            </span>
          )}
        </div>

        {/* Description toggle */}
        {request.description && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-1.5 flex items-center gap-0.5 text-[9px] text-text-muted transition-colors hover:text-accent-cyan"
          >
            {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            {t('details')}
          </button>
        )}

        {expanded && request.description && (
          <p className="mt-1 text-[9px] leading-relaxed text-text-secondary">
            {request.description}
          </p>
        )}

        {/* Review comment */}
        {request.reviewComment && (
          <p className="mt-1.5 border-l-2 border-border-default pl-2 text-[9px] text-text-muted italic">
            {request.reviewComment}
          </p>
        )}

        {/* Timestamp */}
        <div className="mt-2 flex items-center gap-1">
          <Clock size={9} strokeWidth={1.5} className="text-text-muted" />
          <span className="text-[9px] text-text-muted">{relativeTime(request.createdAt)}</span>
        </div>

        {/* Actions */}
        {(request.status === 'pending' || request.status === 'in_review') && (
          <div className="mt-2 flex gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              disabled={isActioning}
              onClick={() => onReview(request.id, 'approve')}
              className="flex-1 border border-status-success/30 text-status-success hover:bg-status-success/10"
            >
              <CheckCircle2 size={10} strokeWidth={1.5} className="mr-1" />
              {t('approve')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isActioning}
              onClick={() => onReview(request.id, 'reject')}
              className="flex-1 border border-status-error/30 text-status-error hover:bg-status-error/10"
            >
              <XCircle size={10} strokeWidth={1.5} className="mr-1" />
              {t('reject')}
            </Button>
          </div>
        )}

        {request.status === 'approved' && (
          <div className="mt-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={isActioning}
              onClick={() => onMarkDeployed(request.id)}
              className="w-full border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/10"
            >
              <Rocket size={10} strokeWidth={1.5} className="mr-1" />
              {t('markDeployed')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Human Task Card                                                            */
/* -------------------------------------------------------------------------- */

function TaskCard({
  task,
  agent,
  onStatusChange,
  isActioning,
  t,
}: {
  task: HumanTask;
  agent: Agent | undefined;
  onStatusChange: (id: string, status: TaskStatus) => void;
  isActioning: boolean;
  t: ReturnType<typeof useTranslations<'devops'>>;
}) {
  const [expanded, setExpanded] = useState(false);
  const agentName = agent?.name ?? null;

  const nextStatus: TaskStatus | null =
    task.status === 'todo'
      ? 'in_progress'
      : task.status === 'in_progress'
        ? 'done'
        : null;

  const prevStatus: TaskStatus | null =
    task.status === 'done'
      ? 'in_progress'
      : task.status === 'in_progress'
        ? 'todo'
        : null;

  return (
    <div className="border border-border-default bg-bg-raised transition-colors hover:border-border-hover">
      <div className="p-3">
        <p className="text-[11px] font-medium text-text-primary">{task.title}</p>

        {/* Source agent */}
        {agentName && (
          <p className="mt-0.5 text-[9px] text-text-muted">
            {t('createdBy')} {agentName}
          </p>
        )}

        {/* Badges */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge variant={TASK_PRIORITY_VARIANT[task.priority]}>
            {task.priority.toUpperCase()}
          </Badge>
          {task.dueAt && (
            <span className="text-[9px] text-text-muted">
              {t('due')} {relativeTime(task.dueAt)}
            </span>
          )}
        </div>

        {/* Description toggle */}
        {(task.description || task.context) && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-1.5 flex items-center gap-0.5 text-[9px] text-text-muted transition-colors hover:text-accent-cyan"
          >
            {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            {t('details')}
          </button>
        )}

        {expanded && (
          <div className="mt-1 space-y-1">
            {task.description && (
              <p className="text-[9px] leading-relaxed text-text-secondary">
                {task.description}
              </p>
            )}
            {task.context && (
              <p className="border-l-2 border-border-default pl-2 text-[9px] text-text-muted italic">
                {task.context}
              </p>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className="mt-2 flex items-center gap-1">
          <Clock size={9} strokeWidth={1.5} className="text-text-muted" />
          <span className="text-[9px] text-text-muted">{relativeTime(task.createdAt)}</span>
        </div>

        {/* Status transitions */}
        <div className="mt-2 flex gap-1.5">
          {prevStatus && (
            <Button
              size="sm"
              variant="ghost"
              disabled={isActioning}
              onClick={() => onStatusChange(task.id, prevStatus)}
              className="flex-1 border border-border-default text-text-muted hover:text-text-secondary"
            >
              {t(`taskStatus_${prevStatus}`)}
            </Button>
          )}
          {nextStatus && (
            <Button
              size="sm"
              variant="ghost"
              disabled={isActioning}
              onClick={() => onStatusChange(task.id, nextStatus)}
              className="flex-1 border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/10"
            >
              {nextStatus === 'done' ? (
                <CheckCircle2 size={10} strokeWidth={1.5} className="mr-1" />
              ) : null}
              {t(`taskStatus_${nextStatus}`)}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  DevOps Kanban Board                                                        */
/* -------------------------------------------------------------------------- */

function KanbanBoard({
  requests,
  agents,
  isLoading,
  onReview,
  onMarkDeployed,
  isActioning,
  t,
}: {
  requests: DevopsRequest[] | undefined;
  agents: Map<string, Agent>;
  isLoading: boolean;
  onReview: (id: string, action: 'approve' | 'reject', comment?: string) => void;
  onMarkDeployed: (id: string) => void;
  isActioning: boolean;
  t: ReturnType<typeof useTranslations<'devops'>>;
}) {
  const grouped = useMemo(() => {
    const map: Record<DevopsStatus, DevopsRequest[]> = {
      pending: [],
      in_review: [],
      approved: [],
      rejected: [],
      deployed: [],
      failed: [],
    };
    if (requests) {
      for (const req of requests) {
        map[req.status]?.push(req);
      }
    }
    return map;
  }, [requests]);

  // Merge approved into in_review column display (they need action)
  const columnData: Record<string, DevopsRequest[]> = {
    pending: grouped.pending,
    in_review: [...grouped.in_review, ...grouped.approved],
    deployed: [...grouped.deployed, ...grouped.rejected, ...grouped.failed],
  };

  return (
    <div className="grid h-full grid-cols-3 gap-3">
      {KANBAN_COLUMNS.map((col) => {
        const items = columnData[col.status] ?? [];
        const count = items.length;

        return (
          <div key={col.status} className="flex flex-col">
            {/* Column header */}
            <div
              className={`mb-2 border-t-2 ${col.colorClass} border border-border-default bg-bg-raised px-3 py-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-primary">
                  {t(`column_${col.status}`)}
                </span>
                {count > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center bg-accent-cyan/15 px-1 text-[9px] font-semibold text-accent-cyan">
                    {count}
                  </span>
                )}
              </div>
            </div>

            {/* Column cards */}
            <div className="flex-1 space-y-2 overflow-auto">
              {isLoading ? (
                <ColumnSkeleton />
              ) : items.length === 0 ? (
                <EmptyColumn message={t('emptyColumn')} />
              ) : (
                items.map((req) => (
                  <DevopsCard
                    key={req.id}
                    request={req}
                    agent={agents.get(req.agentId)}
                    onReview={onReview}
                    onMarkDeployed={onMarkDeployed}
                    isActioning={isActioning}
                    t={t}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Human Tasks Board                                                          */
/* -------------------------------------------------------------------------- */

function HumanTasksBoard({
  tasks,
  agents,
  isLoading,
  onStatusChange,
  isActioning,
  t,
}: {
  tasks: HumanTask[] | undefined;
  agents: Map<string, Agent>;
  isLoading: boolean;
  onStatusChange: (id: string, status: TaskStatus) => void;
  isActioning: boolean;
  t: ReturnType<typeof useTranslations<'devops'>>;
}) {
  const grouped = useMemo(() => {
    const map: Record<TaskStatus, HumanTask[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    if (tasks) {
      for (const task of tasks) {
        map[task.status]?.push(task);
      }
    }
    return map;
  }, [tasks]);

  return (
    <div className="grid h-full grid-cols-3 gap-3">
      {TASK_COLUMNS.map((col) => {
        const items = grouped[col.status] ?? [];
        const count = items.length;

        return (
          <div key={col.status} className="flex flex-col">
            {/* Column header */}
            <div
              className={`mb-2 border-t-2 ${col.colorClass} border border-border-default bg-bg-raised px-3 py-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-primary">
                  {t(`taskStatus_${col.status}`)}
                </span>
                {count > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center bg-accent-cyan/15 px-1 text-[9px] font-semibold text-accent-cyan">
                    {count}
                  </span>
                )}
              </div>
            </div>

            {/* Column cards */}
            <div className="flex-1 space-y-2 overflow-auto">
              {isLoading ? (
                <ColumnSkeleton />
              ) : items.length === 0 ? (
                <EmptyColumn message={t('emptyColumn')} />
              ) : (
                items.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    agent={task.agentId ? agents.get(task.agentId) : undefined}
                    onStatusChange={onStatusChange}
                    isActioning={isActioning}
                    t={t}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                  */
/* -------------------------------------------------------------------------- */

export default function DevOpsPage() {
  const t = useTranslations('devops');
  const utils = trpc.useUtils();

  const [activeTab, setActiveTab] = useState<Tab>('board');

  // Queries
  const requestsQuery = trpc.devops.listRequests.useQuery({ limit: 100 });
  const tasksQuery = trpc.devops.listTasks.useQuery({ limit: 100 });
  const agentsQuery = trpc.agents.list.useQuery();

  const agentsMap = useMemo(() => {
    const map = new Map<string, Agent>();
    if (agentsQuery.data) {
      for (const a of agentsQuery.data) {
        map.set(a.id, { id: a.id, name: a.name, archetype: a.archetype });
      }
    }
    return map;
  }, [agentsQuery.data]);

  // Mutations
  const reviewMutation = trpc.devops.reviewRequest.useMutation({
    onSuccess: () => utils.devops.listRequests.invalidate(),
  });

  const markDeployedMutation = trpc.devops.markDeployed.useMutation({
    onSuccess: () => utils.devops.listRequests.invalidate(),
  });

  const updateTaskStatusMutation = trpc.devops.updateTaskStatus.useMutation({
    onSuccess: () => utils.devops.listTasks.invalidate(),
  });

  const isActioning =
    reviewMutation.isPending ||
    markDeployedMutation.isPending ||
    updateTaskStatusMutation.isPending;

  const handleReview = (id: string, action: 'approve' | 'reject', comment?: string) => {
    reviewMutation.mutate({ id, action, comment });
  };

  const handleMarkDeployed = (id: string) => {
    markDeployedMutation.mutate({ id });
  };

  const handleTaskStatusChange = (id: string, status: TaskStatus) => {
    updateTaskStatusMutation.mutate({ id, status });
  };

  const pendingCount = requestsQuery.data?.filter((r) => r.status === 'pending').length ?? 0;
  const todoCount = tasksQuery.data?.filter((task) => task.status === 'todo').length ?? 0;

  const tabs: { id: Tab; labelKey: string; icon: typeof Rocket; count?: number }[] = [
    { id: 'board', labelKey: 'tabBoard', icon: Rocket, count: pendingCount },
    { id: 'tasks', labelKey: 'tabTasks', icon: ListTodo, count: todoCount },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="border-b border-border-default px-4 py-3">
        <h1 className="text-xs font-semibold uppercase tracking-[0.15em] text-text-primary">
          {t('title')}
        </h1>
        <p className="mt-0.5 text-[10px] text-text-muted">{t('subtitle')}</p>
      </div>

      {/* Tabs */}
      <div
        className="flex border-b border-border-default"
        role="tablist"
        aria-label={t('title')}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2 text-[10px] font-medium uppercase tracking-[0.1em] transition-colors ${
                isActive
                  ? 'text-accent-cyan'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Icon size={11} strokeWidth={1.5} />
                {t(tab.labelKey)}
                {tab.count != null && tab.count > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center bg-accent-cyan/15 px-1 text-[9px] font-semibold text-accent-cyan">
                    {tab.count}
                  </span>
                )}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-accent-cyan" />
              )}
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {(requestsQuery.isError || tasksQuery.isError) && (
        <div className="flex items-center gap-2 px-4 py-2">
          <AlertTriangle size={12} strokeWidth={1.5} className="text-status-error" />
          <p className="text-[10px] text-status-error">{t('errorLoading')}</p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'board' ? (
          <KanbanBoard
            requests={requestsQuery.data as DevopsRequest[] | undefined}
            agents={agentsMap}
            isLoading={requestsQuery.isLoading}
            onReview={handleReview}
            onMarkDeployed={handleMarkDeployed}
            isActioning={isActioning}
            t={t}
          />
        ) : (
          <HumanTasksBoard
            tasks={tasksQuery.data as HumanTask[] | undefined}
            agents={agentsMap}
            isLoading={tasksQuery.isLoading}
            onStatusChange={handleTaskStatusChange}
            isActioning={isActioning}
            t={t}
          />
        )}
      </div>

      {/* Mutation error feedback */}
      {(reviewMutation.isError || markDeployedMutation.isError || updateTaskStatusMutation.isError) && (
        <div className="border-t border-border-default px-4 py-2">
          <p className="text-[10px] text-status-error">
            {t('actionError')}:{' '}
            {reviewMutation.error?.message ??
              markDeployedMutation.error?.message ??
              updateTaskStatusMutation.error?.message}
          </p>
        </div>
      )}
    </div>
  );
}

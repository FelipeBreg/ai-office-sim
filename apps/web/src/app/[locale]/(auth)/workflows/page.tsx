'use client';

import { useTranslations } from 'next-intl';
import { Plus, GitBranch, AlertTriangle } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/navigation';

/* -------------------------------------------------------------------------- */
/*  Relative time helper                                                      */
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
      <Link href="/workflows/new">
        <Button size="sm">
          <Plus size={12} strokeWidth={2} className="mr-1" />
          {t('createWorkflow')}
        </Button>
      </Link>
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
}: {
  workflow: Workflow;
  t: ReturnType<typeof useTranslations<'workflows'>>;
}) {
  const nodeCount = (workflow.definition as any)?.nodes?.length ?? 0;
  const runCount = 0; // TODO: wire up when run history is available

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

        {/* Stats badges */}
        <div className="flex flex-wrap items-center gap-1.5 px-4">
          <Badge variant="default">
            {t('nodes', { count: nodeCount })}
          </Badge>
          <Badge variant="default">
            {t('runs', { count: runCount })}
          </Badge>
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
          <span className="text-[10px] text-text-muted opacity-0 transition-opacity group-hover:opacity-100">
            {timeAgo(workflow.updatedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function WorkflowsPage() {
  const t = useTranslations('workflows');
  const { data: workflows, isLoading, isError } = trpc.workflows.list.useQuery();

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <div>
          <h1 className="text-xs font-semibold uppercase tracking-[0.15em] text-text-primary">
            {t('title')}
          </h1>
          <p className="mt-0.5 text-[10px] text-text-muted">{t('subtitle')}</p>
        </div>
        <Link href="/workflows/new">
          <Button size="sm">
            <Plus size={12} strokeWidth={2} className="mr-1" />
            {t('newWorkflow')}
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

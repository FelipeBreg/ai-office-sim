'use client';

import { use, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc/client';
import { WorkflowEditor } from '@/components/workflows/WorkflowEditor';
import { RunWorkflowDialog } from '@/components/workflows/RunWorkflowDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, Play, ChevronDown, ChevronRight } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import type { Node, Edge } from '@xyflow/react';
import type { WorkflowVariable, WorkflowDefinition } from '@ai-office/shared';

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  running: 'text-accent-cyan',
  completed: 'text-status-success',
  failed: 'text-status-error',
  cancelled: 'text-text-muted',
  waiting_approval: 'text-[#D29922]',
};

export default function WorkflowEditorPage({ params }: PageProps) {
  const { id } = use(params);
  const t = useTranslations('workflows');
  const router = useRouter();
  const utils = trpc.useUtils();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const { data: workflow, isLoading } = trpc.workflows.getById.useQuery({ id });
  const updateMutation = trpc.workflows.update.useMutation({
    onSuccess: () => {
      void utils.workflows.getById.invalidate({ id });
    },
  });
  const deleteMutation = trpc.workflows.delete.useMutation({
    onSuccess: () => {
      router.push('/workflows');
    },
  });

  const { data: runs } = trpc.workflows.listRuns.useQuery(
    { workflowId: id },
    { enabled: showHistory },
  );

  const { data: runDetail } = trpc.workflows.getRunDetail.useQuery(
    { runId: expandedRunId! },
    { enabled: !!expandedRunId },
  );

  const resumeMutation = trpc.workflows.resumeRun.useMutation({
    onSuccess: () => {
      void utils.workflows.listRuns.invalidate({ workflowId: id });
    },
  });

  const handleSave = useCallback(
    (nodes: Node[], edges: Edge[], variables: WorkflowVariable[]) => {
      updateMutation.mutate({
        id,
        definition: { nodes, edges, variables },
      });
    },
    [id, updateMutation],
  );

  const handleDelete = useCallback(() => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    deleteMutation.mutate({ id });
  }, [id, confirmDelete, deleteMutation]);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-border-default px-4 py-3">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[11px] text-text-muted">Workflow not found.</p>
      </div>
    );
  }

  const definition = (workflow.definition as WorkflowDefinition | null) ?? {
    nodes: [],
    edges: [],
    variables: [],
  };
  const initialNodes = (definition.nodes ?? []) as unknown as Node[];
  const initialEdges = (definition.edges ?? []) as unknown as Edge[];
  const workflowVariables: WorkflowVariable[] = definition.variables ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border-default px-4 py-2">
        <div className="flex items-center gap-3">
          <Link
            href="/workflows"
            className="flex h-6 w-6 items-center justify-center border border-border-default text-text-muted transition-colors hover:border-border-hover hover:text-text-primary"
          >
            <ArrowLeft size={12} />
          </Link>
          <div>
            <h1 className="text-xs font-medium text-text-primary">{workflow.name}</h1>
            {workflow.description && (
              <p className="text-[9px] text-text-muted">{workflow.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] uppercase tracking-[0.15em] text-text-muted">
            {updateMutation.isPending ? 'Saving...' : updateMutation.isSuccess ? 'Saved' : ''}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            {t('runHistory')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowRunDialog(true)}
          >
            <Play size={10} strokeWidth={2} className="mr-1" />
            {t('runWorkflow')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={10} strokeWidth={2} className="mr-1" />
            {confirmDelete ? t('confirmDelete') : t('deleteWorkflow')}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <WorkflowEditor
            initialNodes={initialNodes}
            initialEdges={initialEdges}
            initialVariables={workflowVariables}
            onSave={handleSave}
          />
        </div>

        {showHistory && (
          <div className="w-80 border-l border-border-default bg-bg-raised overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-default p-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-text-primary">
                {t('runHistory')}
              </span>
              <button
                onClick={() => setShowHistory(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <ChevronRight size={12} />
              </button>
            </div>

            {!runs || runs.length === 0 ? (
              <p className="p-3 text-[10px] text-text-muted">{t('noRuns')}</p>
            ) : (
              <div className="divide-y divide-border-default">
                {runs.map((run) => (
                  <div key={run.id} className="p-3">
                    <button
                      onClick={() =>
                        setExpandedRunId(expandedRunId === run.id ? null : run.id)
                      }
                      className="flex w-full items-center justify-between text-left"
                    >
                      <div>
                        <span className={`text-[10px] font-medium uppercase ${STATUS_COLORS[run.status] ?? 'text-text-muted'}`}>
                          {run.status}
                        </span>
                        <p className="text-[8px] text-text-muted">
                          {new Date(run.startedAt).toLocaleString()}
                        </p>
                      </div>
                      {expandedRunId === run.id ? (
                        <ChevronDown size={10} className="text-text-muted" />
                      ) : (
                        <ChevronRight size={10} className="text-text-muted" />
                      )}
                    </button>

                    {run.status === 'waiting_approval' && (
                      <div className="mt-2 flex gap-1.5">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => resumeMutation.mutate({ runId: run.id, approved: true })}
                          disabled={resumeMutation.isPending}
                          className="!text-[9px] !py-0.5 !px-2"
                        >
                          {t('approve')}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => resumeMutation.mutate({ runId: run.id, approved: false })}
                          disabled={resumeMutation.isPending}
                          className="!text-[9px] !py-0.5 !px-2"
                        >
                          {t('reject')}
                        </Button>
                      </div>
                    )}

                    {expandedRunId === run.id && runDetail && (
                      <div className="mt-2 space-y-1.5">
                        {runDetail.nodeRuns.map((nr) => (
                          <div
                            key={nr.id}
                            className="border border-border-default bg-bg-base p-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono text-text-primary">
                                {nr.nodeType ?? nr.nodeId}
                              </span>
                              <span className={`text-[8px] uppercase ${STATUS_COLORS[nr.status] ?? 'text-text-muted'}`}>
                                {nr.status}
                              </span>
                            </div>
                            {nr.output != null && (
                              <pre className="mt-1 max-h-20 overflow-auto text-[7px] text-text-muted">
                                {JSON.stringify(nr.output as Record<string, unknown>, null, 1)}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showRunDialog && (
        <RunWorkflowDialog
          workflowId={id}
          variables={workflowVariables}
          onClose={() => setShowRunDialog(false)}
          onSuccess={() => {
            void utils.workflows.listRuns.invalidate({ workflowId: id });
            setShowHistory(true);
          }}
        />
      )}
    </div>
  );
}

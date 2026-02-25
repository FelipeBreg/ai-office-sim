'use client';

import { use, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc/client';
import { WorkflowEditor } from '@/components/workflows/WorkflowEditor';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Node, Edge } from '@xyflow/react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WorkflowEditorPage({ params }: PageProps) {
  const { id } = use(params);
  const t = useTranslations('workflows');
  const utils = trpc.useUtils();

  const { data: workflow, isLoading } = trpc.workflows.getById.useQuery({ id });
  const updateMutation = trpc.workflows.update.useMutation({
    onSuccess: () => {
      void utils.workflows.getById.invalidate({ id });
    },
  });

  const handleSave = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      updateMutation.mutate({
        id,
        definition: { nodes, edges },
      });
    },
    [id, updateMutation],
  );

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

  const definition = (workflow.definition as { nodes?: Node[]; edges?: Edge[] }) ?? {};
  const initialNodes = definition.nodes ?? [];
  const initialEdges = definition.edges ?? [];

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
        </div>
      </div>
      <div className="flex-1">
        <WorkflowEditor
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}

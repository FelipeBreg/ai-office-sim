'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc/client';
import { useRouter } from '@/i18n/navigation';

export default function NewWorkflowPage() {
  const t = useTranslations('workflows');
  const router = useRouter();
  const createdRef = useRef(false);

  const createMutation = trpc.workflows.create.useMutation({
    onSuccess: (workflow) => {
      router.replace(`/workflows/${workflow.id}`);
    },
  });

  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;
    createMutation.mutate({ name: 'Untitled Workflow' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (createMutation.isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-[11px] text-status-error">
          {t('createError')}
        </p>
        <button
          onClick={() => router.push('/workflows')}
          className="text-[10px] text-text-muted underline"
        >
          {t('backToWorkflows')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <span className="text-[10px] uppercase tracking-widest text-text-muted">
        {t('creating')}
      </span>
    </div>
  );
}

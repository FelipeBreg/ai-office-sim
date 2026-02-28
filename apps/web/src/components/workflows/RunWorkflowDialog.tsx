'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc/client';
import type { WorkflowVariable } from '@ai-office/shared';

interface RunWorkflowDialogProps {
  workflowId: string;
  variables: WorkflowVariable[];
  onClose: () => void;
  onSuccess: () => void;
}

export function RunWorkflowDialog({
  workflowId,
  variables,
  onClose,
  onSuccess,
}: RunWorkflowDialogProps) {
  const t = useTranslations('workflows');
  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    for (const v of variables) {
      if (v.defaultValue) defaults[v.key] = v.defaultValue;
    }
    return defaults;
  });
  const [error, setError] = useState<string | null>(null);

  const triggerMutation = trpc.workflows.trigger.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleRun = () => {
    // Validate required
    for (const v of variables) {
      if (v.required && !values[v.key]) {
        setError(`"${v.label || v.key}" ${t('required')}`);
        return;
      }
    }
    setError(null);
    triggerMutation.mutate({ id: workflowId, variables: values });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md border border-border-default bg-bg-raised">
        <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
          <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-text-primary">
            {t('runWorkflow')}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={14} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {variables.length === 0 ? (
            <p className="text-[10px] text-text-muted">
              {t('noVariables')}
            </p>
          ) : (
            variables.map((v) => (
              <div key={v.key}>
                <label className="mb-1.5 flex items-center gap-1 text-[8px] uppercase tracking-[0.15em] text-text-muted">
                  {v.label || v.key}
                  {v.required && <span className="text-status-error">*</span>}
                </label>
                {v.type === 'select' && v.options ? (
                  <select
                    value={values[v.key] ?? ''}
                    onChange={(e) => setValues({ ...values, [v.key]: e.target.value })}
                    className="w-full border border-border-default bg-bg-base px-2.5 py-1.5 text-xs text-text-primary transition-colors focus:border-accent-cyan focus:outline-none"
                  >
                    <option value="">Select...</option>
                    {v.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={v.type === 'number' ? 'number' : 'text'}
                    value={values[v.key] ?? ''}
                    onChange={(e) => setValues({ ...values, [v.key]: e.target.value })}
                    placeholder={v.defaultValue ?? ''}
                  />
                )}
              </div>
            ))
          )}

          {error && (
            <p className="text-[10px] text-status-error">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border-default px-4 py-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleRun}
            disabled={triggerMutation.isPending}
          >
            <Play size={10} strokeWidth={2} className="mr-1" />
            {triggerMutation.isPending ? t('running') : t('runWorkflow')}
          </Button>
        </div>
      </div>
    </div>
  );
}

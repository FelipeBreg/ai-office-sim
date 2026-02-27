'use client';

import { useState } from 'react';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/* -------------------------------------------------------------------------- */
/*  InsightStrip component                                                    */
/* -------------------------------------------------------------------------- */

export function InsightStrip() {
  const t = useTranslations('strategy');
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: learnings } = trpc.strategies.listPendingLearnings.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  const utils = trpc.useUtils();
  const applyMutation = trpc.strategies.applyLearning.useMutation({
    onSuccess: () => {
      void utils.strategies.listPendingLearnings.invalidate();
      void utils.strategies.getById.invalidate();
    },
  });
  const dismissMutation = trpc.strategies.dismissLearning.useMutation({
    onSuccess: () => {
      void utils.strategies.listPendingLearnings.invalidate();
    },
  });

  const items = learnings ?? [];

  /* -- Empty state --------------------------------------------------------- */
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 border border-accent-cyan/20 bg-accent-cyan/5 px-3 py-2">
        <Sparkles size={14} strokeWidth={1.5} className="shrink-0 text-accent-cyan" />
        <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-accent-cyan">
          {t('insightsTitle')}
        </span>
        <span className="text-[10px] text-text-muted">{t('insightsEmpty')}</span>
      </div>
    );
  }

  /* -- Clamp index --------------------------------------------------------- */
  const safeIndex = Math.min(currentIndex, items.length - 1);
  const learning = items[safeIndex]!;
  const confidencePercent = learning.confidence
    ? Math.round(Number(learning.confidence) * 100)
    : null;
  const hasMultiple = items.length > 1;

  /* -- Navigation ---------------------------------------------------------- */
  function prev() {
    setCurrentIndex((i) => (i > 0 ? i - 1 : items.length - 1));
  }
  function next() {
    setCurrentIndex((i) => (i < items.length - 1 ? i + 1 : 0));
  }

  return (
    <div className="flex items-center gap-3 border border-accent-cyan/20 bg-accent-cyan/5 px-3 py-2">
      {/* Icon + label */}
      <div className="flex shrink-0 items-center gap-1.5">
        <Sparkles size={14} strokeWidth={1.5} className="text-accent-cyan" />
        <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-accent-cyan">
          {t('insightsTitle')}
        </span>
      </div>

      {/* Left arrow */}
      {hasMultiple && (
        <button
          type="button"
          onClick={prev}
          className="flex h-5 w-5 shrink-0 items-center justify-center border border-border-default bg-bg-base text-text-muted transition-colors hover:border-border-hover hover:text-text-secondary"
          aria-label="Previous insight"
        >
          <ChevronLeft size={12} strokeWidth={2} />
        </button>
      )}

      {/* Insight text */}
      <span className="min-w-0 flex-1 truncate text-[10px] text-text-primary">
        {learning.insight}
      </span>

      {/* Confidence badge */}
      {confidencePercent !== null && (
        <Badge variant="cyan" className="shrink-0">
          {confidencePercent}%
        </Badge>
      )}

      {/* Right arrow */}
      {hasMultiple && (
        <button
          type="button"
          onClick={next}
          className="flex h-5 w-5 shrink-0 items-center justify-center border border-border-default bg-bg-base text-text-muted transition-colors hover:border-border-hover hover:text-text-secondary"
          aria-label="Next insight"
        >
          <ChevronRight size={12} strokeWidth={2} />
        </button>
      )}

      {/* Action buttons */}
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          size="sm"
          variant="primary"
          onClick={() => applyMutation.mutate({ id: learning.id })}
          disabled={applyMutation.isPending}
        >
          {t('apply')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => router.push(`/atlas?insight=${learning.id}`)}
        >
          {t('implement')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => dismissMutation.mutate({ id: learning.id })}
          disabled={dismissMutation.isPending}
        >
          {t('dismiss')}
        </Button>
      </div>

      {/* Counter */}
      {hasMultiple && (
        <span className="shrink-0 text-[9px] text-text-muted">
          {t('insightOf', { current: safeIndex + 1, total: items.length })}
        </span>
      )}
    </div>
  );
}

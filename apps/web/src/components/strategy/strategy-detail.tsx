'use client';

import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface StrategyDetailProps {
  strategyId: string | null;
  onClose: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Status badge variant mapping                                              */
/* -------------------------------------------------------------------------- */

const STATUS_BADGE_VARIANT: Record<string, 'success' | 'warning' | 'default' | 'cyan'> = {
  active: 'success',
  at_risk: 'warning',
  planned: 'default',
  completed: 'cyan',
};

const STATUS_LABEL_KEY: Record<string, string> = {
  active: 'statusActive',
  at_risk: 'statusAtRisk',
  planned: 'statusPlanned',
  completed: 'statusCompleted',
};

const TYPE_LABEL_KEY: Record<string, string> = {
  growth: 'typeGrowth',
  retention: 'typeRetention',
  brand: 'typeBrand',
  product: 'typeProduct',
};

/* -------------------------------------------------------------------------- */
/*  Progress bar color                                                        */
/* -------------------------------------------------------------------------- */

function progressBarColor(current: number, target: number): string {
  if (target <= 0) return '#484F58';
  const pct = (current / target) * 100;
  if (pct >= 70) return '#2EA043';
  if (pct >= 40) return '#D29922';
  return '#F85149';
}

/* -------------------------------------------------------------------------- */
/*  Animation variants                                                        */
/* -------------------------------------------------------------------------- */

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const panelVariants = {
  hidden: { x: 400 },
  visible: {
    x: 0,
    transition: { type: 'tween' as const, duration: 0.25, ease: 'easeOut' as const },
  },
  exit: {
    x: 400,
    transition: { type: 'tween' as const, duration: 0.2, ease: 'easeIn' as const },
  },
};

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                          */
/* -------------------------------------------------------------------------- */

function DetailSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="mt-6 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-2 w-full" />
      </div>
      <div className="mt-6 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  StrategyDetail component                                                  */
/* -------------------------------------------------------------------------- */

export function StrategyDetail({ strategyId, onClose }: StrategyDetailProps) {
  const t = useTranslations('strategy');
  const panelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = trpc.strategies.getById.useQuery(
    { id: strategyId! },
    { enabled: !!strategyId },
  );

  const utils = trpc.useUtils();
  const applyMutation = trpc.strategies.applyLearning.useMutation({
    onSuccess: () => {
      void utils.strategies.getById.invalidate();
      void utils.strategies.listPendingLearnings.invalidate();
    },
  });
  const dismissMutation = trpc.strategies.dismissLearning.useMutation({
    onSuccess: () => {
      void utils.strategies.getById.invalidate();
      void utils.strategies.listPendingLearnings.invalidate();
    },
  });

  /* -- Click outside to close ---------------------------------------------- */
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose],
  );

  /* -- ESC to close -------------------------------------------------------- */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (strategyId) {
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }
  }, [strategyId, onClose]);

  return (
    <AnimatePresence>
      {strategyId && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/30"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleOverlayClick}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            className="fixed right-0 top-0 z-50 flex h-full w-[400px] flex-col overflow-y-auto border-l border-border-default bg-bg-deepest"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {isLoading || !data ? (
              <DetailSkeleton />
            ) : (
              <>
                {/* ── Header ──────────────────────────────────────────── */}
                <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_BADGE_VARIANT[data.status] ?? 'default'}>
                      {t((STATUS_LABEL_KEY[data.status] ?? 'statusPlanned') as Parameters<typeof t>[0])}
                    </Badge>
                    <Badge variant="cyan">
                      {t((TYPE_LABEL_KEY[data.type] ?? 'typeGrowth') as Parameters<typeof t>[0])}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-6 w-6 items-center justify-center border border-border-default bg-transparent text-text-muted transition-colors hover:border-border-hover hover:text-text-primary"
                    aria-label="Close panel"
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                </div>

                {/* ── Definition ───────────────────────────────────────── */}
                <div className="border-b border-border-default px-4 py-4">
                  <div className="mb-3">
                    <span className="block text-[8px] uppercase tracking-[0.12em] text-text-muted">
                      {t('detailDraft')}
                    </span>
                    <p className="mt-1 text-[11px] leading-relaxed text-text-primary">
                      {data.userDraft || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase tracking-[0.12em] text-accent-cyan">
                      {t('detailRefined')}
                    </span>
                    <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
                      {data.aiRefined || '—'}
                    </p>
                  </div>
                </div>

                {/* ── KPIs ─────────────────────────────────────────────── */}
                {data.kpis && data.kpis.length > 0 && (
                  <div className="border-b border-border-default px-4 py-4">
                    <span className="mb-2 block text-[8px] uppercase tracking-[0.12em] text-text-muted">
                      {t('detailKpis')}
                    </span>
                    <div className="space-y-3">
                      {data.kpis.map((kpi) => {
                        const current = Number(kpi.currentValue) || 0;
                        const target = Number(kpi.targetValue) || 0;
                        const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
                        const barColor = progressBarColor(current, target);

                        return (
                          <div key={kpi.id}>
                            {/* Name + values */}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-text-primary">{kpi.name}</span>
                              <span className="text-[9px] text-text-muted">
                                {kpi.unit ? `${kpi.unit} ` : ''}
                                {current} / {target}
                              </span>
                            </div>

                            {/* Bar */}
                            <div className="mt-1 h-1.5 w-full bg-bg-overlay">
                              <div
                                className="h-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: barColor,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Learnings ────────────────────────────────────────── */}
                {/* ── Learnings ────────────────────────────────────────── */}
                <div className="px-4 py-4">
                  <span className="mb-2 block text-[8px] uppercase tracking-[0.12em] text-text-muted">
                    {t('detailLearnings')}
                  </span>
                  {data.learnings && data.learnings.length > 0 ? (
                    <div className="space-y-2">
                      {data.learnings.map((learning) => {
                        const conf = learning.confidence
                          ? Math.round(Number(learning.confidence) * 100)
                          : null;
                        const isPending = !learning.isApplied;

                        return (
                          <div
                            key={learning.id}
                            className="border border-border-default bg-bg-raised p-3"
                          >
                            <p className="text-[10px] leading-relaxed text-text-primary">
                              {learning.insight}
                            </p>
                            {learning.recommendation && (
                              <p className="mt-1 text-[9px] text-text-muted italic">
                                {learning.recommendation}
                              </p>
                            )}
                            <div className="mt-2 flex items-center justify-between">
                              {conf !== null && (
                                <Badge variant="cyan">{conf}%</Badge>
                              )}
                              {isPending && (
                                <div className="flex items-center gap-1.5">
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
                                    variant="ghost"
                                    onClick={() => dismissMutation.mutate({ id: learning.id })}
                                    disabled={dismissMutation.isPending}
                                  >
                                    {t('dismiss')}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-text-muted">—</p>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

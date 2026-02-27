'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, AlertTriangle, BookOpen, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { KpiBar } from '@/components/strategy/kpi-bar';
import { InsightStrip } from '@/components/strategy/insight-strip';
import { Timeline } from '@/components/strategy/timeline';
import { GoalsSection } from '@/components/strategy/goals-section';
import { StrategyDetail } from '@/components/strategy/strategy-detail';
import { StrategyWizard } from '@/components/strategy/strategy-wizard';

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                          */
/* -------------------------------------------------------------------------- */

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {/* KPI bar skeleton */}
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      {/* Insight strip skeleton */}
      <Skeleton className="h-10" />
      {/* Timeline skeleton */}
      <Skeleton className="h-48" />
      {/* Goals skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Strategy Page                                                             */
/* -------------------------------------------------------------------------- */

export default function StrategyPage() {
  const t = useTranslations('strategy');
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const { data: strategies, isLoading, isError } = trpc.strategies.list.useQuery();

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
        <div className="flex items-center gap-2">
          <Link href="/docs">
            <Button size="sm" variant="secondary">
              <BookOpen size={12} strokeWidth={1.5} className="mr-1" />
              {t('businessPlaybook')}
            </Button>
          </Link>
          <Button size="sm" variant="secondary" disabled>
            <Sparkles size={12} strokeWidth={1.5} className="mr-1" />
            {t('generateInsights')}
          </Button>
          <Button size="sm" onClick={() => setWizardOpen(true)}>
            <Plus size={12} strokeWidth={2} className="mr-1" />
            {t('createStrategy')}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Loading */}
        {isLoading && <PageSkeleton />}

        {/* Error */}
        {isError && (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <AlertTriangle size={20} strokeWidth={1.5} className="text-status-error" />
            <p className="text-xs text-status-error">{t('loadError')}</p>
          </div>
        )}

        {/* Main content */}
        {!isLoading && !isError && (
          <div className="flex flex-col gap-3">
            {/* P3-2.1: KPI Dashboard Bar */}
            <KpiBar />

            {/* P3-2.3: Agent Learning Insight Strip */}
            <InsightStrip />

            {/* P3-2.2: Gantt-style Timeline */}
            <Timeline
              strategies={(strategies ?? []) as Parameters<typeof Timeline>[0]['strategies']}
              onSelectStrategy={setSelectedStrategyId}
            />

            {/* P3-2.7: Goals Section */}
            <GoalsSection />
          </div>
        )}
      </div>

      {/* P3-2.4: Strategy Detail Panel (slide-in) */}
      <StrategyDetail
        strategyId={selectedStrategyId}
        onClose={() => setSelectedStrategyId(null)}
      />

      {/* P3-2.5: Strategy Creation Wizard */}
      <StrategyWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </div>
  );
}

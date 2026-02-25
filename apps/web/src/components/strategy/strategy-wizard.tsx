'use client';

import { useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Loader2,
  TrendingUp,
  Users,
  Megaphone,
  Package,
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type StrategyType = 'growth' | 'retention' | 'brand' | 'product';

interface StrategyWizardProps {
  open: boolean;
  onClose: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const STRATEGY_TYPES: { id: StrategyType; labelKey: string; icon: LucideIcon }[] = [
  { id: 'growth', labelKey: 'typeGrowth', icon: TrendingUp },
  { id: 'retention', labelKey: 'typeRetention', icon: Users },
  { id: 'brand', labelKey: 'typeBrand', icon: Megaphone },
  { id: 'product', labelKey: 'typeProduct', icon: Package },
];

/* -------------------------------------------------------------------------- */
/*  Animation variants                                                        */
/* -------------------------------------------------------------------------- */

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modalVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'tween' as const, duration: 0.25, ease: 'easeOut' as const },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.98,
    transition: { type: 'tween' as const, duration: 0.15, ease: 'easeIn' as const },
  },
};

/* -------------------------------------------------------------------------- */
/*  Step indicator                                                            */
/* -------------------------------------------------------------------------- */

function StepIndicator({ step, labels }: { step: number; labels: [string, string] }) {
  const steps = labels;

  return (
    <div className="flex items-center gap-0">
      {steps.map((label, idx) => {
        const isCompleted = idx < step;
        const isCurrent = idx === step;
        const isLast = idx === steps.length - 1;

        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-6 w-6 items-center justify-center border text-[9px] font-bold transition-colors ${
                  isCurrent
                    ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                    : isCompleted
                      ? 'border-accent-cyan bg-accent-cyan text-bg-deepest'
                      : 'border-border-default bg-bg-base text-text-muted'
                }`}
              >
                {isCompleted ? <Check size={10} strokeWidth={2.5} /> : idx + 1}
              </div>
              <span
                className={`mt-1 text-[8px] uppercase tracking-[0.1em] ${
                  isCurrent ? 'text-accent-cyan' : isCompleted ? 'text-text-secondary' : 'text-text-muted'
                }`}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`mx-2 h-px w-8 ${
                  isCompleted ? 'bg-accent-cyan' : 'bg-border-default'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  StrategyWizard component                                                  */
/* -------------------------------------------------------------------------- */

export function StrategyWizard({ open, onClose }: StrategyWizardProps) {
  const t = useTranslations('strategy');

  /* -- Form state ---------------------------------------------------------- */
  const [step, setStep] = useState(0);
  const [objective, setObjective] = useState('');
  const [type, setType] = useState<StrategyType>('growth');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [aiRefined, setAiRefined] = useState<string | null>(null);

  /* -- tRPC mutations ------------------------------------------------------ */
  const utils = trpc.useUtils();
  const createMutation = trpc.strategies.create.useMutation({
    onSuccess: () => {
      void utils.strategies.list.invalidate();
      resetAndClose();
    },
  });

  /* -- Reset --------------------------------------------------------------- */
  const resetAndClose = useCallback(() => {
    if (refineTimerRef.current) {
      clearTimeout(refineTimerRef.current);
      refineTimerRef.current = null;
    }
    setStep(0);
    setObjective('');
    setType('growth');
    setStartDate('');
    setEndDate('');
    setIsRefining(false);
    setAiRefined(null);
    onClose();
  }, [onClose]);

  /* -- Next step ----------------------------------------------------------- */
  const refineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleNext() {
    if (step === 0) {
      setStep(1);
      setIsRefining(true);
      setAiRefined(null);

      if (refineTimerRef.current) clearTimeout(refineTimerRef.current);
      refineTimerRef.current = setTimeout(() => {
        setIsRefining(false);
        // TODO: Replace with real AI refinement via trpc.strategies.refineWithAI
        setAiRefined(
          `${objective}\n\n` +
            t('wizardRefined') + `: ${t(('type' + type.charAt(0).toUpperCase() + type.slice(1)) as Parameters<typeof t>[0])}`,
        );
        refineTimerRef.current = null;
      }, 2500);
    }
  }

  /* -- Create strategy ----------------------------------------------------- */
  function handleCreate() {
    createMutation.mutate({
      type,
      userDraft: objective,
      ...(startDate ? { startDate: new Date(startDate).toISOString() } : {}),
      ...(endDate ? { endDate: new Date(endDate).toISOString() } : {}),
    });
  }

  /* -- Can proceed to step 2 ---------------------------------------------- */
  const canProceed = objective.trim().length > 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={resetAndClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="w-full max-w-2xl border border-border-default bg-bg-deepest"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Header ──────────────────────────────────────────── */}
              <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
                <div className="flex items-center gap-3">
                  <Sparkles size={14} strokeWidth={1.5} className="text-accent-cyan" />
                  <span className="text-xs font-semibold uppercase tracking-[0.15em] text-text-primary">
                    {t('wizardTitle')}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <StepIndicator step={step} labels={[t('wizardStep1'), t('wizardStep2')]} />
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="flex h-6 w-6 items-center justify-center border border-border-default bg-transparent text-text-muted transition-colors hover:border-border-hover hover:text-text-primary"
                    aria-label="Close wizard"
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* ── Body ────────────────────────────────────────────── */}
              <div className="p-6">
                {step === 0 && (
                  <div className="space-y-5">
                    {/* Objective textarea */}
                    <div>
                      <label className="mb-1.5 block text-[8px] uppercase tracking-[0.12em] text-text-muted">
                        {t('wizardObjective')}
                      </label>
                      <textarea
                        rows={4}
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        placeholder={t('wizardObjectivePlaceholder')}
                        className="w-full border border-border-default bg-bg-base px-2.5 py-2 text-xs text-text-primary placeholder:text-text-muted transition-colors focus:border-accent-cyan focus:outline-none"
                      />
                    </div>

                    {/* Strategy type selector */}
                    <div>
                      <label className="mb-1.5 block text-[8px] uppercase tracking-[0.12em] text-text-muted">
                        {t('wizardSelectType')}
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {STRATEGY_TYPES.map((st) => {
                          const Icon = st.icon;
                          const isSelected = type === st.id;
                          return (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => setType(st.id)}
                              className={`flex flex-col items-center gap-1.5 border p-3 transition-colors ${
                                isSelected
                                  ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                                  : 'border-border-default bg-bg-raised text-text-secondary hover:border-border-hover hover:text-text-primary'
                              }`}
                            >
                              <Icon size={16} strokeWidth={1.5} />
                              <span className="text-[9px] uppercase tracking-wider">
                                {t(st.labelKey as Parameters<typeof t>[0])}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Date inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.12em] text-text-muted">
                          {t('wizardStartDate')}
                        </label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.12em] text-text-muted">
                          {t('wizardEndDate')}
                        </label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-5">
                    {isRefining ? (
                      /* Loading state */
                      <div className="flex flex-col items-center justify-center gap-3 py-12">
                        <Loader2
                          size={24}
                          strokeWidth={1.5}
                          className="animate-spin text-accent-cyan"
                        />
                        <span className="text-xs text-text-secondary">
                          {t('wizardRefining')}
                        </span>
                      </div>
                    ) : (
                      /* Side-by-side comparison */
                      <div className="grid grid-cols-2 gap-4">
                        {/* User draft */}
                        <div className="border border-border-default bg-bg-raised p-4">
                          <span className="mb-2 block text-[8px] uppercase tracking-[0.12em] text-text-muted">
                            {t('wizardOriginal')}
                          </span>
                          <p className="text-[11px] leading-relaxed text-text-primary">
                            {objective}
                          </p>
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-[8px] uppercase tracking-[0.1em] text-text-muted">
                              {t('type')}
                            </span>
                            <span className="text-[10px] text-accent-cyan">
                              {t(('type' + type.charAt(0).toUpperCase() + type.slice(1)) as Parameters<typeof t>[0])}
                            </span>
                          </div>
                          {(startDate || endDate) && (
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-[8px] uppercase tracking-[0.1em] text-text-muted">
                                {t('period')}
                              </span>
                              <span className="text-[10px] text-text-secondary">
                                {startDate || '?'} - {endDate || '?'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* AI refined */}
                        <div className="border border-accent-cyan/20 bg-accent-cyan/5 p-4">
                          <span className="mb-2 block text-[8px] uppercase tracking-[0.12em] text-accent-cyan">
                            {t('wizardRefined')}
                          </span>
                          <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-text-primary">
                            {aiRefined || t('notRefinedYet')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Footer ──────────────────────────────────────────── */}
              <div className="flex items-center justify-between border-t border-border-default px-4 py-3">
                <div>
                  {step > 0 && (
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => setStep(0)}
                    >
                      <ArrowLeft size={12} strokeWidth={2} className="mr-1" />
                      {t('wizardBack')}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="md" onClick={resetAndClose}>
                    {t('cancel')}
                  </Button>
                  {step === 0 && (
                    <Button
                      variant="primary"
                      size="md"
                      disabled={!canProceed}
                      onClick={handleNext}
                    >
                      {t('wizardNext')}
                      <ArrowRight size={12} strokeWidth={2} className="ml-1" />
                    </Button>
                  )}
                  {step === 1 && (
                    <Button
                      variant="primary"
                      size="md"
                      disabled={isRefining || createMutation.isPending}
                      onClick={handleCreate}
                    >
                      {createMutation.isPending ? (
                        <>
                          <Loader2 size={12} strokeWidth={2} className="mr-1 animate-spin" />
                          {t('wizardCreate')}...
                        </>
                      ) : (
                        <>
                          <Check size={12} strokeWidth={2} className="mr-1" />
                          {t('wizardCreate')}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

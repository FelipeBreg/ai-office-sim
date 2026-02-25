'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ArrowLeft, ArrowRight, Loader2, FolderPlus, Palette, ChevronDown } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from '@/i18n/navigation';
import { useProjectStore, useActiveOrg } from '@/stores/project-store';

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const STEPS = ['stepName', 'stepDetails', 'stepReview'] as const;

const COLORS = [
  { id: '#00C8E0', name: 'Cyan' },
  { id: '#3B82F6', name: 'Blue' },
  { id: '#10B981', name: 'Green' },
  { id: '#F59E0B', name: 'Amber' },
  { id: '#EC4899', name: 'Pink' },
] as const;

const SECTORS = [
  'technology', 'ecommerce', 'saas', 'finance', 'healthcare',
  'education', 'legal', 'real_estate', 'marketing', 'other',
] as const;

/* -------------------------------------------------------------------------- */
/*  Plan limits fallback                                                      */
/* -------------------------------------------------------------------------- */

const PLAN_LIMITS_FALLBACK = {
  starter: { maxProjects: 1, maxAgents: 3, maxWorkflows: 5 },
  growth: { maxProjects: 5, maxAgents: 10, maxWorkflows: 25 },
  pro: { maxProjects: 20, maxAgents: 50, maxWorkflows: 100 },
  enterprise: { maxProjects: -1, maxAgents: -1, maxWorkflows: -1 },
} as const;

type PlanKey = keyof typeof PLAN_LIMITS_FALLBACK;

/* -------------------------------------------------------------------------- */
/*  Slug helper                                                               */
/* -------------------------------------------------------------------------- */

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/* -------------------------------------------------------------------------- */
/*  Sector translation key mapping                                            */
/* -------------------------------------------------------------------------- */

const SECTOR_KEY_MAP: Record<string, string> = {
  technology: 'sectorTechnology',
  ecommerce: 'sectorEcommerce',
  saas: 'sectorSaas',
  finance: 'sectorFinance',
  healthcare: 'sectorHealthcare',
  education: 'sectorEducation',
  legal: 'sectorLegal',
  real_estate: 'sectorRealEstate',
  marketing: 'sectorMarketing',
  other: 'sectorOther',
};

/* -------------------------------------------------------------------------- */
/*  Step Indicator                                                            */
/* -------------------------------------------------------------------------- */

function StepIndicator({
  steps,
  current,
  t,
}: {
  steps: readonly string[];
  current: number;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((stepKey, idx) => {
        const isCompleted = idx < current;
        const isCurrent = idx === current;
        const isLast = idx === steps.length - 1;

        return (
          <div key={stepKey} className="flex items-center">
            {/* Dot */}
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
                className={`mt-1 hidden text-[8px] uppercase tracking-[0.1em] sm:block ${
                  isCurrent ? 'text-accent-cyan' : isCompleted ? 'text-text-secondary' : 'text-text-muted'
                }`}
              >
                {t(stepKey)}
              </span>
            </div>

            {/* Connecting line */}
            {!isLast && (
              <div
                className={`mx-1 h-px w-4 sm:w-8 ${
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
/*  Step 0: Name + Slug + Color                                               */
/* -------------------------------------------------------------------------- */

function StepNameColor({
  name,
  setName,
  slug,
  color,
  setColor,
  t,
}: {
  name: string;
  setName: (v: string) => void;
  slug: string;
  color: string;
  setColor: (v: string) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Name input */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('nameLabel')}
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('namePlaceholder')}
          autoFocus
        />
        {name && (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[8px] uppercase tracking-[0.15em] text-text-muted">
              {t('slugLabel')}:
            </span>
            <span className="text-[10px] font-medium text-accent-cyan">{slug}</span>
          </div>
        )}
      </div>

      {/* Color selection */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('colorLabel')}
        </label>
        <div className="flex items-center gap-2">
          {COLORS.map((c) => {
            const isSelected = color === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.id)}
                className={`h-8 w-8 border-2 transition-colors ${
                  isSelected ? 'border-white' : 'border-transparent'
                }`}
                style={{ backgroundColor: c.id }}
                title={c.name}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 1: Sector + Primary Goal                                             */
/* -------------------------------------------------------------------------- */

function StepDetails({
  sector,
  setSector,
  primaryGoal,
  setPrimaryGoal,
  t,
}: {
  sector: string;
  setSector: (v: string) => void;
  primaryGoal: string;
  setPrimaryGoal: (v: string) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Sector dropdown */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('sectorLabel')}
        </label>
        <div className="relative w-full max-w-xs">
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="w-full appearance-none border border-border-default bg-bg-base px-2.5 py-1.5 pr-8 text-xs text-text-primary transition-colors focus:border-accent-cyan focus:outline-none [&>option]:bg-bg-base [&>option]:text-text-primary"
          >
            <option value="">{t('sectorPlaceholder')}</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {t(SECTOR_KEY_MAP[s]!)}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            strokeWidth={1.5}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
          />
        </div>
      </div>

      {/* Primary Goal textarea */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('goalLabel')}
        </label>
        <textarea
          value={primaryGoal}
          onChange={(e) => setPrimaryGoal(e.target.value)}
          placeholder={t('goalPlaceholder')}
          rows={4}
          className="w-full border border-border-default bg-bg-base px-3 py-2 font-mono text-[11px] leading-relaxed text-text-primary placeholder:text-text-muted transition-colors focus:border-accent-cyan focus:outline-none"
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 2: Review                                                            */
/* -------------------------------------------------------------------------- */

function StepReview({
  name,
  slug,
  color,
  sector,
  primaryGoal,
  t,
}: {
  name: string;
  slug: string;
  color: string;
  sector: string;
  primaryGoal: string;
  t: (key: string) => string;
}) {
  const colorName = COLORS.find((c) => c.id === color)?.name ?? color;

  const reviewRows: { labelKey: string; value: React.ReactNode }[] = [
    { labelKey: 'reviewName', value: name || t('reviewNotSet') },
    { labelKey: 'reviewSlug', value: slug || t('reviewNotSet') },
    {
      labelKey: 'reviewColor',
      value: (
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-3" style={{ backgroundColor: color }} />
          <span>{colorName} ({color})</span>
        </span>
      ),
    },
    {
      labelKey: 'reviewSector',
      value: sector
        ? t(SECTOR_KEY_MAP[sector]!)
        : t('reviewNotSet'),
    },
    {
      labelKey: 'reviewGoal',
      value: primaryGoal
        ? `${primaryGoal.slice(0, 120)}${primaryGoal.length > 120 ? '...' : ''}`
        : t('reviewNotSet'),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('reviewLabel')}
        </label>
        <p className="mb-3 text-[9px] text-text-muted">{t('reviewHint')}</p>
      </div>

      <div className="flex flex-col gap-0">
        {reviewRows.map((row) => (
          <div
            key={row.labelKey}
            className="flex items-start justify-between border border-border-default bg-bg-base px-3 py-2 -mt-px first:mt-0"
          >
            <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-text-muted">
              {t(row.labelKey)}
            </span>
            <span className="max-w-[60%] text-right text-[10px] text-text-primary">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Upgrade Banner                                                            */
/* -------------------------------------------------------------------------- */

function UpgradeBanner({
  plan,
  limit,
  t,
  onBack,
}: {
  plan: string;
  limit: number;
  t: (key: string, values?: Record<string, string | number>) => string;
  onBack: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <FolderPlus size={32} strokeWidth={1} className="text-text-muted" />
        <p className="max-w-sm text-[11px] text-text-secondary">
          {t('limitReached', { limit: String(limit), plan })}
        </p>
        <p className="text-[10px] text-text-muted">
          {t('upgradePrompt')}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="primary" size="md">
          {t('upgradePlan')}
        </Button>
        <Button variant="secondary" size="md" onClick={onBack}>
          {t('backToSettings')}
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Wizard Page                                                          */
/* -------------------------------------------------------------------------- */

export default function ProjectWizardPage() {
  const t = useTranslations('projectWizard');
  const router = useRouter();

  /* ---- Wizard step ---- */
  const [step, setStep] = useState<number>(0);

  /* ---- Step 0 state ---- */
  const [name, setName] = useState('');
  const [color, setColor] = useState('#00C8E0');

  /* ---- Step 1 state ---- */
  const [sector, setSector] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');

  /* ---- Derived ---- */
  const slug = useMemo(() => toSlug(name), [name]);

  /* ---- Plan limit check ---- */
  const activeOrg = useActiveOrg();
  const projectsQuery = trpc.projects.list.useQuery();
  const projectCount = projectsQuery.data?.length ?? 0;

  const planKey = ((activeOrg?.plan ?? 'starter') as string).toLowerCase() as PlanKey;
  const limits = PLAN_LIMITS_FALLBACK[planKey] ?? PLAN_LIMITS_FALLBACK.starter;
  const maxProjects = limits.maxProjects;
  const isAtLimit = maxProjects !== -1 && projectCount >= maxProjects;

  /* ---- Step validation ---- */
  const isStepValid = useMemo(() => {
    switch (step) {
      case 0:
        return name.trim().length > 0;
      case 1:
        return true; // Optional fields
      case 2:
        return name.trim().length > 0;
      default:
        return false;
    }
  }, [step, name]);

  /* ---- Create mutation ---- */
  const createMutation = trpc.projects.create.useMutation({
    onSuccess: (newProject) => {
      const store = useProjectStore.getState();
      store.setProjects([...store.projects, {
        id: newProject.id,
        orgId: newProject.orgId,
        name: newProject.name,
        slug: newProject.slug,
        color: newProject.color,
        isActive: newProject.isActive,
      }]);
      store.setCurrentProject(newProject.id);
      router.push('/office');
    },
  });

  const handleCreate = useCallback(() => {
    createMutation.mutate({
      name: name.trim(),
      slug,
      color,
      sector: sector || undefined,
      primaryGoal: primaryGoal || undefined,
    });
  }, [name, slug, color, sector, primaryGoal, createMutation]);

  /* ---- Navigation ---- */
  const goNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    }
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1);
    }
  }, [step]);

  const isLastStep = step === STEPS.length - 1;

  /* ---- Show upgrade banner if at limit ---- */
  if (isAtLimit) {
    return (
      <UpgradeBanner
        plan={planKey}
        limit={maxProjects}
        t={t}
        onBack={() => router.push('/settings')}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border-default px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xs font-semibold uppercase tracking-[0.15em] text-text-primary">
              {t('title')}
            </h1>
            <p className="mt-0.5 text-[10px] text-text-muted">{t('subtitle')}</p>
          </div>
          <span className="text-[9px] text-text-muted">
            {t('step', { current: String(step + 1), total: String(STEPS.length) })}
          </span>
        </div>

        {/* Step indicator */}
        <div className="mt-4 flex justify-center">
          <StepIndicator steps={STEPS} current={step} t={t} />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-3xl">
          {step === 0 && (
            <StepNameColor
              name={name}
              setName={setName}
              slug={slug}
              color={color}
              setColor={setColor}
              t={t}
            />
          )}
          {step === 1 && (
            <StepDetails
              sector={sector}
              setSector={setSector}
              primaryGoal={primaryGoal}
              setPrimaryGoal={setPrimaryGoal}
              t={t}
            />
          )}
          {step === 2 && (
            <StepReview
              name={name}
              slug={slug}
              color={color}
              sector={sector}
              primaryGoal={primaryGoal}
              t={t}
            />
          )}

          {/* Mutation feedback */}
          {createMutation.isError && (
            <p className="mt-3 text-[10px] text-status-error">
              {t('createError')}: {createMutation.error.message}
            </p>
          )}
          {createMutation.isSuccess && (
            <p className="mt-3 text-[10px] text-status-success">{t('createSuccess')}</p>
          )}
        </div>
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between border-t border-border-default px-4 py-3">
        <Button
          variant="secondary"
          size="md"
          onClick={goBack}
          disabled={step === 0}
        >
          <ArrowLeft size={12} strokeWidth={1.5} className="mr-1" />
          {t('back')}
        </Button>

        {isLastStep ? (
          <Button
            variant="primary"
            size="md"
            onClick={handleCreate}
            disabled={!isStepValid || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 size={12} strokeWidth={1.5} className="mr-1 animate-spin" />
                {t('creating')}
              </>
            ) : (
              <>
                <FolderPlus size={12} strokeWidth={1.5} className="mr-1" />
                {t('createProject')}
              </>
            )}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={goNext}
            disabled={!isStepValid}
          >
            {t('next')}
            <ArrowRight size={12} strokeWidth={1.5} className="ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Terminal,
  Building2,
  Globe,
  Target,
  Users,
  Rocket,
  Check,
  Loader2,
  DollarSign,
  X,
  PartyPopper,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from '@/i18n/navigation';
import { trpc } from '@/lib/trpc/client';
import type { FleetRecommendation } from '@ai-office/shared';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type SmartStep = 0 | 1 | 2 | 3 | 4;

const TOTAL_STEPS = 5;
const STEP_ICONS = [Building2, Globe, Target, Users, Rocket];

const SECTORS = [
  { id: 'saas', labelEn: 'SaaS / Software', labelPt: 'SaaS / Software' },
  { id: 'ecommerce', labelEn: 'E-Commerce / Retail', labelPt: 'E-Commerce / Varejo' },
  { id: 'agency', labelEn: 'Marketing Agency', labelPt: 'Agência de Marketing' },
  { id: 'services', labelEn: 'Professional Services', labelPt: 'Serviços Profissionais' },
  { id: 'finance', labelEn: 'Finance / Fintech', labelPt: 'Finanças / Fintech' },
  { id: 'healthcare', labelEn: 'Healthcare', labelPt: 'Saúde' },
  { id: 'education', labelEn: 'Education', labelPt: 'Educação' },
  { id: 'other', labelEn: 'Other', labelPt: 'Outro' },
];

const COMPANY_SIZES = [
  { id: '1-10' as const, label: '1-10' },
  { id: '11-50' as const, label: '11-50' },
  { id: '51-200' as const, label: '51-200' },
  { id: '200+' as const, label: '200+' },
];

/* -------------------------------------------------------------------------- */
/*  Animation                                                                 */
/* -------------------------------------------------------------------------- */

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
};

/* -------------------------------------------------------------------------- */
/*  Step Indicator                                                            */
/* -------------------------------------------------------------------------- */

function StepIndicator({ current }: { current: SmartStep }) {
  return (
    <div className="flex items-center gap-0">
      {Array.from({ length: TOTAL_STEPS }).map((_, idx) => {
        const isCompleted = idx < current;
        const isCurrent = idx === current;
        const isLast = idx === TOTAL_STEPS - 1;
        const Icon = STEP_ICONS[idx]!;

        return (
          <div key={idx} className="flex items-center">
            <div
              className={`flex h-7 w-7 items-center justify-center border transition-all duration-300 ${
                isCurrent
                  ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                  : isCompleted
                    ? 'border-accent-cyan bg-accent-cyan text-bg-deepest'
                    : 'border-border-default bg-bg-base text-text-muted'
              }`}
            >
              {isCompleted ? <Check size={11} strokeWidth={2.5} /> : <Icon size={11} strokeWidth={1.5} />}
            </div>
            {!isLast && (
              <div
                className={`mx-1 h-px w-6 transition-colors duration-300 sm:w-10 ${
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
/*  Step 0: Company Profile                                                   */
/* -------------------------------------------------------------------------- */

function StepCompanyProfile({
  companyName,
  setCompanyName,
  sector,
  setSector,
  companySize,
  setCompanySize,
  websiteUrl,
  setWebsiteUrl,
  t,
}: {
  companyName: string;
  setCompanyName: (v: string) => void;
  sector: string;
  setSector: (v: string) => void;
  companySize: '1-10' | '11-50' | '51-200' | '200+';
  setCompanySize: (v: '1-10' | '11-50' | '51-200' | '200+') => void;
  websiteUrl: string;
  setWebsiteUrl: (v: string) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-col gap-8 py-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-accent-cyan/40 bg-accent-cyan/5">
          <Building2 size={22} strokeWidth={1} className="text-accent-cyan" />
        </div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-text-primary">
          {t('smartCompanyTitle')}
        </h2>
        <p className="mt-1 text-[10px] text-text-muted">{t('smartCompanyDesc')}</p>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <div>
          <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
            {t('smartCompanyNameLabel')}
          </label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder={t('smartCompanyNamePlaceholder')}
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
            {t('smartSectorLabel')}
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SECTORS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSector(s.id)}
                className={`border p-2 text-[10px] transition-all ${
                  sector === s.id
                    ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                    : 'border-border-default text-text-secondary hover:border-border-hover'
                }`}
              >
                {s.labelEn}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
            {t('smartSizeLabel')}
          </label>
          <div className="flex gap-2">
            {COMPANY_SIZES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCompanySize(s.id)}
                className={`flex-1 border p-2 text-[10px] transition-all ${
                  companySize === s.id
                    ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                    : 'border-border-default text-text-secondary hover:border-border-hover'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
            {t('smartWebsiteLabel')}
          </label>
          <Input
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://yourcompany.com"
          />
          <p className="mt-1 text-[8px] text-text-muted">{t('smartWebsiteHint')}</p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 1: Scanning / Analysis (auto-advance)                                */
/* -------------------------------------------------------------------------- */

function StepScanning({
  t,
  onComplete,
  scrapeFinished,
}: {
  t: (key: string) => string;
  onComplete: () => void;
  scrapeFinished: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const completed = useRef(false);

  useEffect(() => {
    if (completed.current) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        // If scrape is done, rush to 100; otherwise cap at 90 to wait
        const cap = scrapeFinished ? 100 : 90;
        if (p >= cap) {
          if (p >= 100) {
            clearInterval(interval);
            if (!completed.current) {
              completed.current = true;
              setTimeout(onComplete, 500);
            }
          }
          return p;
        }
        return p + 2;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [onComplete, scrapeFinished]);

  const steps = [
    { label: t('smartScanWebsite'), threshold: 20 },
    { label: t('smartScanSocial'), threshold: 50 },
    { label: t('smartScanAnalyze'), threshold: 75 },
    { label: t('smartScanRecommend'), threshold: 95 },
  ];

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12">
      <div className="flex h-16 w-16 items-center justify-center border border-accent-cyan bg-accent-cyan/5">
        <Globe size={28} strokeWidth={1} className="animate-pulse text-accent-cyan" />
      </div>

      <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-text-primary">
        {t('smartScanTitle')}
      </h2>

      <div className="w-full max-w-sm">
        <div className="h-1 w-full bg-border-default">
          <div
            className="h-1 bg-accent-cyan transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-center text-[9px] text-text-muted">{progress}%</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2">
        {steps.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            {progress >= s.threshold ? (
              <Check size={10} className="text-accent-cyan" />
            ) : progress >= s.threshold - 20 ? (
              <Loader2 size={10} className="animate-spin text-accent-cyan" />
            ) : (
              <div className="h-2.5 w-2.5" />
            )}
            <span
              className={`text-[10px] ${
                progress >= s.threshold ? 'text-accent-cyan' : 'text-text-muted'
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 2: Strategy Setup                                                    */
/* -------------------------------------------------------------------------- */

function StepStrategy({
  primaryGoal,
  setPrimaryGoal,
  timeline,
  setTimeline,
  t,
}: {
  primaryGoal: string;
  setPrimaryGoal: (v: string) => void;
  timeline: 3 | 6 | 12;
  setTimeline: (v: 3 | 6 | 12) => void;
  t: (key: string) => string;
}) {
  const goals = [
    { id: 'grow_revenue', label: t('smartGoalGrowRevenue') },
    { id: 'reduce_churn', label: t('smartGoalReduceChurn') },
    { id: 'expand_market', label: t('smartGoalExpandMarket') },
    { id: 'improve_support', label: t('smartGoalImproveSupport') },
    { id: 'automate_ops', label: t('smartGoalAutomateOps') },
    { id: 'brand_awareness', label: t('smartGoalBrandAwareness') },
  ];

  return (
    <div className="flex flex-col gap-8 py-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-accent-cyan/40 bg-accent-cyan/5">
          <Target size={22} strokeWidth={1} className="text-accent-cyan" />
        </div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-text-primary">
          {t('smartStrategyTitle')}
        </h2>
        <p className="mt-1 text-[10px] text-text-muted">{t('smartStrategyDesc')}</p>
      </div>

      <div className="mx-auto w-full max-w-md">
        <label className="mb-2 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('smartGoalLabel')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {goals.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setPrimaryGoal(g.id)}
              className={`border p-3 text-left text-[10px] transition-all ${
                primaryGoal === g.id
                  ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                  : 'border-border-default text-text-secondary hover:border-border-hover'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-md">
        <label className="mb-2 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('smartTimelineLabel')}
        </label>
        <div className="flex gap-2">
          {([3, 6, 12] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setTimeline(m)}
              className={`flex-1 border p-3 text-center text-[10px] transition-all ${
                timeline === m
                  ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                  : 'border-border-default text-text-secondary hover:border-border-hover'
              }`}
            >
              {m} {t('smartTimelineMonths')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 3: Fleet Recommendation                                              */
/* -------------------------------------------------------------------------- */

function StepFleet({
  recommendation,
  toggleAgent,
  t,
}: {
  recommendation: FleetRecommendation;
  toggleAgent: (slug: string) => void;
  t: (key: string, values?: Record<string, string>) => string;
}) {
  const enabledCount = recommendation.agents.filter((a) => a.enabled).length;

  return (
    <div className="flex flex-col gap-6 py-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-accent-cyan/40 bg-accent-cyan/5">
          <Users size={22} strokeWidth={1} className="text-accent-cyan" />
        </div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-text-primary">
          {t('smartFleetTitle')}
        </h2>
        <p className="mt-1 text-[10px] text-text-muted">{t('smartFleetDesc')}</p>
      </div>

      {/* Cost estimate banner */}
      <div className="mx-auto flex w-full max-w-lg items-center gap-3 border border-accent-cyan/30 bg-accent-cyan/5 p-3">
        <DollarSign size={16} className="shrink-0 text-accent-cyan" />
        <div>
          <span className="text-[10px] font-medium text-accent-cyan">
            {t('smartFleetCost', {
              cost: recommendation.estimatedMonthlyCostUsd.toFixed(2),
            })}
          </span>
          <span className="ml-2 text-[9px] text-text-muted">
            ({enabledCount} {t('smartFleetAgents')})
          </span>
        </div>
      </div>

      {/* Teams and agents */}
      <div className="mx-auto w-full max-w-lg space-y-4">
        {recommendation.teams.map((team) => {
          const teamAgents = recommendation.agents.filter((a) => a.team === team.slug);
          if (teamAgents.length === 0) return null;

          return (
            <div key={team.slug} className="border border-border-default">
              <div className="flex items-center gap-2 border-b border-border-default bg-bg-base px-3 py-2">
                <Users size={12} className="text-accent-cyan" />
                <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-text-primary">
                  {team.name}
                </span>
                <span className="text-[8px] text-text-muted">— {team.description}</span>
              </div>

              <div className="divide-y divide-border-default">
                {teamAgents.map((agent) => (
                  <button
                    key={agent.slug}
                    type="button"
                    onClick={() => toggleAgent(agent.slug)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-bg-raised"
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-all ${
                        agent.enabled
                          ? 'border-accent-cyan bg-accent-cyan text-bg-deepest'
                          : 'border-border-default bg-bg-deepest'
                      }`}
                    >
                      {agent.enabled && <Check size={10} strokeWidth={2.5} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-[10px] font-medium ${
                          agent.enabled ? 'text-text-primary' : 'text-text-muted line-through'
                        }`}
                      >
                        {agent.name}
                      </span>
                      <span className="ml-2 text-[8px] text-text-muted">
                        {agent.archetype} · {agent.tools.length} tools · {agent.triggerType}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 4: Deploy                                                            */
/* -------------------------------------------------------------------------- */

function StepDeploy({
  deploying,
  deployed,
  result,
  t,
}: {
  deploying: boolean;
  deployed: boolean;
  result: { teamsCreated: number; agentsCreated: number } | null;
  t: (key: string, values?: Record<string, string>) => string;
}) {
  if (deploying) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <Loader2 size={32} className="animate-spin text-accent-cyan" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-text-primary">
          {t('smartDeployingTitle')}
        </h2>
        <p className="text-[10px] text-text-muted">{t('smartDeployingDesc')}</p>
      </div>
    );
  }

  if (deployed && result) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <div className="flex h-16 w-16 items-center justify-center border border-accent-cyan bg-accent-cyan/10">
          <PartyPopper size={28} strokeWidth={1} className="text-accent-cyan" />
        </div>
        <h2 className="text-lg font-bold uppercase tracking-[0.2em] text-text-primary">
          {t('smartDeployedTitle')}
        </h2>
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-accent-cyan">{result.teamsCreated}</p>
            <p className="text-[9px] uppercase text-text-muted">{t('smartDeployedTeams')}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-accent-cyan">{result.agentsCreated}</p>
            <p className="text-[9px] uppercase text-text-muted">{t('smartDeployedAgents')}</p>
          </div>
        </div>
        <p className="max-w-md text-center text-xs text-text-secondary">
          {t('smartDeployedDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12">
      <div className="flex h-16 w-16 items-center justify-center border border-accent-cyan bg-accent-cyan/5">
        <Rocket size={28} strokeWidth={1} className="text-accent-cyan" />
      </div>
      <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-text-primary">
        {t('smartDeployTitle')}
      </h2>
      <p className="text-[10px] text-text-muted">{t('smartDeployDesc')}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Smart Onboarding Page                                                */
/* -------------------------------------------------------------------------- */

export default function SmartOnboardingPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();

  const [step, setStep] = useState<SmartStep>(0);
  const [direction, setDirection] = useState(1);

  // Step 0: Company Profile
  const [companyName, setCompanyName] = useState('');
  const [sector, setSector] = useState('');
  const [companySize, setCompanySize] = useState<'1-10' | '11-50' | '51-200' | '200+'>('1-10');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Step 2: Strategy
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [timeline, setTimeline] = useState<3 | 6 | 12>(6);

  // Step 3: Fleet
  const [recommendation, setRecommendation] = useState<FleetRecommendation | null>(null);

  // Step 1: Scraping
  const scrapeMutation = trpc.onboarding.scrapeCompany.useMutation();
  const [scrapeFinished, setScrapeFinished] = useState(false);

  // Step 4: Deploy
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [deployResult, setDeployResult] = useState<{ teamsCreated: number; agentsCreated: number } | null>(null);

  // Fetch fleet recommendation
  const fleetQuery = trpc.onboarding.getFleetRecommendation.useQuery(
    { sector, companySize },
    { enabled: sector.length > 0 && step >= 2 },
  );

  useEffect(() => {
    if (fleetQuery.data && !recommendation) {
      setRecommendation(fleetQuery.data);
    }
  }, [fleetQuery.data, recommendation]);

  const deployMutation = trpc.onboarding.deployFleet.useMutation();

  const toggleAgent = useCallback((slug: string) => {
    setRecommendation((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        agents: prev.agents.map((a) =>
          a.slug === slug ? { ...a, enabled: !a.enabled } : a,
        ),
      };
    });
  }, []);

  const goNext = useCallback(() => {
    if (step < 4) {
      // Trigger scraping when moving from step 0 to step 1
      if (step === 0 && websiteUrl) {
        setScrapeFinished(false);
        scrapeMutation.mutate(
          { companyName, websiteUrl: websiteUrl || undefined },
          { onSettled: () => setScrapeFinished(true) },
        );
      } else if (step === 0) {
        setScrapeFinished(true); // No URL to scrape, skip
      }
      setDirection(1);
      setStep((s) => (s + 1) as SmartStep);
    }
  }, [step, websiteUrl, companyName, scrapeMutation]);

  const goBack = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => (s - 1) as SmartStep);
    }
  }, [step]);

  const handleScanComplete = useCallback(() => {
    goNext();
  }, [goNext]);

  const handleDeploy = useCallback(async () => {
    if (!recommendation) return;
    setDeploying(true);

    try {
      const enabledAgents = recommendation.agents.filter((a) => a.enabled);
      const result = await deployMutation.mutateAsync({
        teams: recommendation.teams,
        agents: enabledAgents.map((a) => ({
          name: a.name,
          namePtBr: a.namePtBr,
          slug: a.slug,
          archetype: a.archetype,
          team: a.team,
          tools: a.tools,
          triggerType: a.triggerType as 'always_on' | 'scheduled' | 'event' | 'manual' | 'agent',
          heartbeatIntervalMin: a.heartbeatIntervalMin,
        })),
        approvalMode: recommendation.approvalMode,
        companyName,
        sector,
      });
      setDeployResult(result);
      setDeployed(true);
    } catch {
      // Error handled by tRPC
    } finally {
      setDeploying(false);
    }
  }, [recommendation, companyName, sector, deployMutation]);

  const isStepValid = (() => {
    switch (step) {
      case 0: return companyName.trim().length > 0 && sector.length > 0;
      case 1: return true; // scanning auto-advances
      case 2: return primaryGoal.length > 0;
      case 3: return recommendation !== null && recommendation.agents.some((a) => a.enabled);
      case 4: return true;
      default: return false;
    }
  })();

  return (
    <div className="flex h-full flex-col bg-bg-deepest">
      {/* Header */}
      <div className="border-b border-border-default px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center border border-accent-cyan/40 bg-accent-cyan/5">
              <Terminal size={12} strokeWidth={1.5} className="text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-primary">
                {t('smartTitle')}
              </h1>
              <p className="text-[8px] text-text-muted">
                {t('step', { current: String(step + 1), total: String(TOTAL_STEPS) })}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <StepIndicator current={step} />
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: 'tween', duration: 0.25 }, opacity: { duration: 0.2 } }}
            className="absolute inset-0 overflow-auto p-4"
          >
            <div className="mx-auto max-w-3xl">
              {step === 0 && (
                <StepCompanyProfile
                  companyName={companyName}
                  setCompanyName={setCompanyName}
                  sector={sector}
                  setSector={setSector}
                  companySize={companySize}
                  setCompanySize={setCompanySize}
                  websiteUrl={websiteUrl}
                  setWebsiteUrl={setWebsiteUrl}
                  t={t}
                />
              )}
              {step === 1 && <StepScanning t={t} onComplete={handleScanComplete} scrapeFinished={scrapeFinished} />}
              {step === 2 && (
                <StepStrategy
                  primaryGoal={primaryGoal}
                  setPrimaryGoal={setPrimaryGoal}
                  timeline={timeline}
                  setTimeline={setTimeline}
                  t={t}
                />
              )}
              {step === 3 && recommendation && (
                <StepFleet recommendation={recommendation} toggleAgent={toggleAgent} t={t} />
              )}
              {step === 4 && (
                <StepDeploy
                  deploying={deploying}
                  deployed={deployed}
                  result={deployResult}
                  t={t}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border-default px-4 py-3">
        <div>
          {step > 0 && step !== 1 && !deploying && !deployed && (
            <Button variant="secondary" size="md" onClick={goBack}>
              <ArrowLeft size={12} strokeWidth={1.5} className="mr-1" />
              {t('back')}
            </Button>
          )}
        </div>

        <div>
          {step === 0 && (
            <Button variant="primary" size="md" onClick={goNext} disabled={!isStepValid}>
              {t('next')}
              <ArrowRight size={12} strokeWidth={1.5} className="ml-1" />
            </Button>
          )}
          {step === 2 && (
            <Button variant="primary" size="md" onClick={goNext} disabled={!isStepValid}>
              {t('next')}
              <ArrowRight size={12} strokeWidth={1.5} className="ml-1" />
            </Button>
          )}
          {step === 3 && (
            <Button
              variant="primary"
              size="md"
              onClick={() => { setStep(4); setDirection(1); }}
              disabled={!isStepValid}
            >
              {t('smartDeployBtn')}
              <Rocket size={12} strokeWidth={1.5} className="ml-1" />
            </Button>
          )}
          {step === 4 && !deploying && !deployed && (
            <Button variant="primary" size="lg" onClick={handleDeploy}>
              {t('smartDeployConfirm')}
              <Rocket size={12} strokeWidth={1.5} className="ml-1" />
            </Button>
          )}
          {step === 4 && deployed && (
            <Button variant="primary" size="lg" onClick={() => router.push('/dashboard')}>
              {t('goToOffice')}
              <ArrowRight size={12} strokeWidth={1.5} className="ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

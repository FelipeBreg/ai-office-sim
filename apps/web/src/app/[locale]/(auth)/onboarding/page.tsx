'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Terminal,
  Building2,
  LayoutGrid,
  Plug,
  Bot,
  PartyPopper,
  Check,
  MessageCircle,
  Mail,
  SkipForward,
  Headset,
  TrendingUp,
  PenTool,
  Wallet,
  BarChart3,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from '@/i18n/navigation';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type OnboardingStep = 0 | 1 | 2 | 3 | 4 | 5;

type TemplateChoice = 'blank' | 'demo';

type IntegrationChoice = 'whatsapp' | 'email' | 'skip';

type AgentArchetype = 'support' | 'sales' | 'content_writer' | 'finance' | 'data_analyst';

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const TOTAL_STEPS = 6;

const STEP_ICONS = [Terminal, Building2, LayoutGrid, Plug, Bot, PartyPopper];

const ARCHETYPES: {
  id: AgentArchetype;
  icon: typeof Headset;
  nameKey: string;
  descKey: string;
}[] = [
  { id: 'support', icon: Headset, nameKey: 'archetypeSupport', descKey: 'archetypeSupportDesc' },
  { id: 'sales', icon: TrendingUp, nameKey: 'archetypeSales', descKey: 'archetypeSalesDesc' },
  { id: 'content_writer', icon: PenTool, nameKey: 'archetypeContentWriter', descKey: 'archetypeContentWriterDesc' },
  { id: 'finance', icon: Wallet, nameKey: 'archetypeFinance', descKey: 'archetypeFinanceDesc' },
  { id: 'data_analyst', icon: BarChart3, nameKey: 'archetypeDataAnalyst', descKey: 'archetypeDataAnalystDesc' },
];

/* -------------------------------------------------------------------------- */
/*  Animation Variants                                                        */
/* -------------------------------------------------------------------------- */

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

/* -------------------------------------------------------------------------- */
/*  Step Indicator (dots + connecting lines)                                   */
/* -------------------------------------------------------------------------- */

function StepIndicator({ current }: { current: OnboardingStep }) {
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
              {isCompleted ? (
                <Check size={11} strokeWidth={2.5} />
              ) : (
                <Icon size={11} strokeWidth={1.5} />
              )}
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
/*  Step 0: Welcome                                                           */
/* -------------------------------------------------------------------------- */

function StepWelcome({ t }: { t: (key: string) => string }) {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const fullText = t('welcomeHeading');
  const animationDone = useRef(false);

  useEffect(() => {
    if (animationDone.current) {
      setDisplayedText(fullText);
      return;
    }

    let idx = 0;
    setDisplayedText('');

    const interval = setInterval(() => {
      idx++;
      setDisplayedText(fullText.slice(0, idx));
      if (idx >= fullText.length) {
        clearInterval(interval);
        animationDone.current = true;
      }
    }, 40);

    return () => clearInterval(interval);
  }, [fullText]);

  useEffect(() => {
    const blink = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(blink);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center border border-accent-cyan bg-accent-cyan/5">
        <Terminal size={28} strokeWidth={1} className="text-accent-cyan" />
      </div>

      <div className="min-h-[3rem]">
        <h1 className="text-lg font-bold uppercase tracking-[0.2em] text-text-primary sm:text-2xl">
          {displayedText}
          <span
            className={`ml-0.5 inline-block w-[2px] bg-accent-cyan transition-opacity ${
              showCursor ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ height: '1.1em', verticalAlign: 'text-bottom' }}
          />
        </h1>
      </div>

      <p className="max-w-md text-xs leading-relaxed text-text-secondary">
        {t('welcomeDescription')}
      </p>

      <div className="mt-2 flex items-center gap-2 text-[9px] text-text-muted">
        <span className="inline-block h-1.5 w-1.5 bg-accent-cyan" />
        <span className="uppercase tracking-[0.15em]">{t('welcomeHint')}</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 1: Create Company / Project                                          */
/* -------------------------------------------------------------------------- */

function StepCompanyProject({
  companyName,
  setCompanyName,
  projectName,
  setProjectName,
  t,
}: {
  companyName: string;
  setCompanyName: (v: string) => void;
  projectName: string;
  setProjectName: (v: string) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-col gap-8 py-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-accent-cyan/40 bg-accent-cyan/5">
          <Building2 size={22} strokeWidth={1} className="text-accent-cyan" />
        </div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-text-primary">
          {t('companyTitle')}
        </h2>
        <p className="mt-1 text-[10px] text-text-muted">{t('companyDescription')}</p>
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-col gap-5">
        <div>
          <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
            {t('companyNameLabel')}
          </label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder={t('companyNamePlaceholder')}
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
            {t('projectNameLabel')}
          </label>
          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder={t('projectNamePlaceholder')}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 2: Choose Template                                                   */
/* -------------------------------------------------------------------------- */

function StepChooseTemplate({
  template,
  setTemplate,
  t,
}: {
  template: TemplateChoice | null;
  setTemplate: (v: TemplateChoice) => void;
  t: (key: string) => string;
}) {
  const templates: {
    id: TemplateChoice;
    icon: typeof FileText;
    nameKey: string;
    descKey: string;
  }[] = [
    { id: 'blank', icon: FileText, nameKey: 'templateBlank', descKey: 'templateBlankDesc' },
    { id: 'demo', icon: Sparkles, nameKey: 'templateDemo', descKey: 'templateDemoDesc' },
  ];

  return (
    <div className="flex flex-col gap-8 py-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-accent-cyan/40 bg-accent-cyan/5">
          <LayoutGrid size={22} strokeWidth={1} className="text-accent-cyan" />
        </div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-text-primary">
          {t('templateTitle')}
        </h2>
        <p className="mt-1 text-[10px] text-text-muted">{t('templateDescription')}</p>
      </div>

      <div className="mx-auto grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
        {templates.map((tmpl) => {
          const Icon = tmpl.icon;
          const isSelected = template === tmpl.id;

          return (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => setTemplate(tmpl.id)}
              className={`group flex flex-col items-center gap-3 border p-6 text-center transition-all duration-200 ${
                isSelected
                  ? 'border-accent-cyan bg-accent-cyan/5'
                  : 'border-border-default bg-bg-base hover:border-border-hover hover:bg-bg-raised'
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center border transition-colors ${
                  isSelected
                    ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                    : 'border-border-default bg-bg-deepest text-text-muted group-hover:text-text-secondary'
                }`}
              >
                <Icon size={18} strokeWidth={1.2} />
              </div>
              <span
                className={`text-[11px] font-medium ${
                  isSelected ? 'text-accent-cyan' : 'text-text-primary'
                }`}
              >
                {t(tmpl.nameKey)}
              </span>
              <span className="text-[9px] leading-relaxed text-text-muted">
                {t(tmpl.descKey)}
              </span>
              {isSelected && (
                <div className="flex h-5 w-5 items-center justify-center bg-accent-cyan">
                  <Check size={11} strokeWidth={2.5} className="text-bg-deepest" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 3: Set Up First Integration                                          */
/* -------------------------------------------------------------------------- */

function StepIntegration({
  integration,
  setIntegration,
  t,
}: {
  integration: IntegrationChoice | null;
  setIntegration: (v: IntegrationChoice) => void;
  t: (key: string) => string;
}) {
  const options: {
    id: IntegrationChoice;
    icon: typeof MessageCircle;
    nameKey: string;
    descKey: string;
    recommended?: boolean;
  }[] = [
    {
      id: 'whatsapp',
      icon: MessageCircle,
      nameKey: 'integrationWhatsapp',
      descKey: 'integrationWhatsappDesc',
      recommended: true,
    },
    {
      id: 'email',
      icon: Mail,
      nameKey: 'integrationEmail',
      descKey: 'integrationEmailDesc',
    },
    {
      id: 'skip',
      icon: SkipForward,
      nameKey: 'integrationSkip',
      descKey: 'integrationSkipDesc',
    },
  ];

  return (
    <div className="flex flex-col gap-8 py-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-accent-cyan/40 bg-accent-cyan/5">
          <Plug size={22} strokeWidth={1} className="text-accent-cyan" />
        </div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-text-primary">
          {t('integrationTitle')}
        </h2>
        <p className="mt-1 text-[10px] text-text-muted">{t('integrationDescription')}</p>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col gap-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = integration === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setIntegration(opt.id)}
              className={`group relative flex items-center gap-4 border p-4 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-accent-cyan bg-accent-cyan/5'
                  : 'border-border-default bg-bg-base hover:border-border-hover hover:bg-bg-raised'
              }`}
            >
              {opt.recommended && (
                <span className="absolute -top-2 right-3 bg-accent-cyan px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.15em] text-bg-deepest">
                  {t('recommended')}
                </span>
              )}

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center border transition-colors ${
                  isSelected
                    ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                    : 'border-border-default bg-bg-deepest text-text-muted group-hover:text-text-secondary'
                }`}
              >
                <Icon size={18} strokeWidth={1.2} />
              </div>

              <div className="min-w-0 flex-1">
                <span
                  className={`block text-[11px] font-medium ${
                    isSelected ? 'text-accent-cyan' : 'text-text-primary'
                  }`}
                >
                  {t(opt.nameKey)}
                </span>
                <span className="block text-[9px] text-text-muted">{t(opt.descKey)}</span>
              </div>

              {isSelected && (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center bg-accent-cyan">
                  <Check size={11} strokeWidth={2.5} className="text-bg-deepest" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 4: Create First Agent                                                */
/* -------------------------------------------------------------------------- */

function StepFirstAgent({
  agentName,
  setAgentName,
  agentArchetype,
  setAgentArchetype,
  t,
}: {
  agentName: string;
  setAgentName: (v: string) => void;
  agentArchetype: AgentArchetype | null;
  setAgentArchetype: (v: AgentArchetype) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex flex-col gap-8 py-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-accent-cyan/40 bg-accent-cyan/5">
          <Bot size={22} strokeWidth={1} className="text-accent-cyan" />
        </div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-text-primary">
          {t('agentTitle')}
        </h2>
        <p className="mt-1 text-[10px] text-text-muted">{t('agentDescription')}</p>
      </div>

      <div className="mx-auto w-full max-w-sm">
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('agentNameLabel')}
        </label>
        <Input
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          placeholder={t('agentNamePlaceholder')}
          autoFocus
        />
      </div>

      <div className="mx-auto w-full max-w-lg">
        <label className="mb-2 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('agentArchetypeLabel')}
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {ARCHETYPES.map((a) => {
            const Icon = a.icon;
            const isSelected = agentArchetype === a.id;

            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAgentArchetype(a.id)}
                className={`flex flex-col items-center gap-2 border p-3 text-center transition-all duration-200 ${
                  isSelected
                    ? 'border-accent-cyan bg-accent-cyan/5 text-accent-cyan'
                    : 'border-border-default bg-bg-base text-text-secondary hover:border-border-hover hover:text-text-primary'
                }`}
              >
                <Icon size={18} strokeWidth={1.2} />
                <span className="text-[10px] font-medium">{t(a.nameKey)}</span>
                <span className="text-[8px] leading-tight text-text-muted">
                  {t(a.descKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 5: Done!                                                             */
/* -------------------------------------------------------------------------- */

function StepDone({ t }: { t: (key: string) => string }) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-6 py-12 text-center">
      {/* CSS-only confetti particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            className="absolute block animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-5%`,
              width: `${4 + Math.random() * 6}px`,
              height: `${4 + Math.random() * 6}px`,
              backgroundColor:
                i % 5 === 0
                  ? '#00C8E0'
                  : i % 5 === 1
                    ? '#00C8E0aa'
                    : i % 5 === 2
                      ? '#ffffff33'
                      : i % 5 === 3
                        ? '#00C8E066'
                        : '#ffffff1a',
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="flex h-16 w-16 items-center justify-center border border-accent-cyan bg-accent-cyan/10">
        <PartyPopper size={28} strokeWidth={1} className="text-accent-cyan" />
      </div>

      <h2 className="text-lg font-bold uppercase tracking-[0.2em] text-text-primary sm:text-2xl">
        {t('doneHeading')}
      </h2>

      <p className="max-w-md text-xs leading-relaxed text-text-secondary">
        {t('doneDescription')}
      </p>

      <div className="mt-2 flex items-center gap-2 text-[9px] text-accent-cyan">
        <span className="inline-block h-1.5 w-1.5 animate-pulse bg-accent-cyan" />
        <span className="uppercase tracking-[0.15em]">{t('doneHint')}</span>
      </div>

      {/* Confetti animation keyframes */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(calc(100vh + 20px)) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti-fall linear forwards;
        }
      `}</style>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Onboarding Page                                                      */
/* -------------------------------------------------------------------------- */

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();

  /* ---- Step state ---- */
  const [step, setStep] = useState<OnboardingStep>(0);
  const [direction, setDirection] = useState(1);

  /* ---- Step 1 state ---- */
  const [companyName, setCompanyName] = useState('');
  const [projectName, setProjectName] = useState('');

  /* ---- Step 2 state ---- */
  const [template, setTemplate] = useState<TemplateChoice | null>(null);

  /* ---- Step 3 state ---- */
  const [integration, setIntegration] = useState<IntegrationChoice | null>(null);

  /* ---- Step 4 state ---- */
  const [agentName, setAgentName] = useState('');
  const [agentArchetype, setAgentArchetype] = useState<AgentArchetype | null>(null);

  /* ---- Navigation ---- */
  const goNext = useCallback(() => {
    if (step < 5) {
      setDirection(1);
      setStep((s) => (s + 1) as OnboardingStep);
    }
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => (s - 1) as OnboardingStep);
    }
  }, [step]);

  const goToOffice = useCallback(() => {
    router.push('/office');
  }, [router]);

  /* ---- Step validation ---- */
  const isStepValid = (() => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return companyName.trim().length > 0 && projectName.trim().length > 0;
      case 2:
        return template !== null;
      case 3:
        return integration !== null;
      case 4:
        return true; // Agent step is optional (can skip)
      case 5:
        return true;
      default:
        return false;
    }
  })();

  const isLastStep = step === 5;
  const isFirstStep = step === 0;

  return (
    <div className="flex h-full flex-col bg-bg-deepest">
      {/* Header with step indicator */}
      <div className="border-b border-border-default px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center border border-accent-cyan/40 bg-accent-cyan/5">
              <Terminal size={12} strokeWidth={1.5} className="text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-primary">
                {t('title')}
              </h1>
              <p className="text-[8px] text-text-muted">
                {t('step', { current: String(step + 1), total: String(TOTAL_STEPS) })}
              </p>
            </div>
          </div>

          {!isLastStep && !isFirstStep && (
            <button
              type="button"
              onClick={goNext}
              className="text-[9px] uppercase tracking-[0.15em] text-text-muted transition-colors hover:text-accent-cyan"
            >
              {t('skip')}
            </button>
          )}
        </div>

        <div className="mt-4 flex justify-center">
          <StepIndicator current={step} />
        </div>
      </div>

      {/* Step content with slide transitions */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'tween', duration: 0.25, ease: 'easeInOut' },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0 overflow-auto p-4"
          >
            <div className="mx-auto max-w-3xl">
              {step === 0 && <StepWelcome t={t} />}
              {step === 1 && (
                <StepCompanyProject
                  companyName={companyName}
                  setCompanyName={setCompanyName}
                  projectName={projectName}
                  setProjectName={setProjectName}
                  t={t}
                />
              )}
              {step === 2 && (
                <StepChooseTemplate
                  template={template}
                  setTemplate={setTemplate}
                  t={t}
                />
              )}
              {step === 3 && (
                <StepIntegration
                  integration={integration}
                  setIntegration={setIntegration}
                  t={t}
                />
              )}
              {step === 4 && (
                <StepFirstAgent
                  agentName={agentName}
                  setAgentName={setAgentName}
                  agentArchetype={agentArchetype}
                  setAgentArchetype={setAgentArchetype}
                  t={t}
                />
              )}
              {step === 5 && <StepDone t={t} />}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between border-t border-border-default px-4 py-3">
        <div>
          {!isFirstStep && (
            <Button variant="secondary" size="md" onClick={goBack}>
              <ArrowLeft size={12} strokeWidth={1.5} className="mr-1" />
              {t('back')}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isLastStep && !isFirstStep && step === 4 && (
            <Button variant="ghost" size="md" onClick={goNext}>
              {t('skipStep')}
            </Button>
          )}

          {isFirstStep && (
            <Button variant="primary" size="lg" onClick={goNext}>
              {t('getStarted')}
              <ArrowRight size={12} strokeWidth={1.5} className="ml-1" />
            </Button>
          )}

          {!isFirstStep && !isLastStep && (
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

          {isLastStep && (
            <Button variant="primary" size="lg" onClick={goToOffice}>
              {t('goToOffice')}
              <ArrowRight size={12} strokeWidth={1.5} className="ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

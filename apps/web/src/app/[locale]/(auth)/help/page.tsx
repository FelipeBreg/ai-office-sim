'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Zap,
  MessageSquare,
  Bot,
  ShieldCheck,
  Activity,
  Brain,
  AlertTriangle,
  Bug,
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
} from 'lucide-react';

// ── Types ──

interface Section {
  id: string;
  labelKey: string;
  icon: typeof Zap;
}

const SECTIONS: Section[] = [
  { id: 'quick-start', labelKey: 'sectionQuickStart', icon: Zap },
  { id: 'whatsapp', labelKey: 'sectionWhatsApp', icon: MessageSquare },
  { id: 'agents', labelKey: 'sectionAgents', icon: Bot },
  { id: 'approvals', labelKey: 'sectionApprovals', icon: ShieldCheck },
  { id: 'monitoring', labelKey: 'sectionMonitoring', icon: Activity },
  { id: 'memory', labelKey: 'sectionMemory', icon: Brain },
  { id: 'limitations', labelKey: 'sectionLimitations', icon: AlertTriangle },
  { id: 'bugs', labelKey: 'sectionBugs', icon: Bug },
] as const;

// ── Accordion Section Component ──

function AccordionSection({
  id,
  isOpen,
  onToggle,
  children,
  title,
}: {
  id: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div id={id} className="border border-border-default">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-bg-raised"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-primary">
          {title}
        </span>
        {isOpen ? (
          <ChevronDown size={14} strokeWidth={1.5} className="text-accent-cyan" />
        ) : (
          <ChevronRight size={14} strokeWidth={1.5} className="text-text-muted" />
        )}
      </button>
      {isOpen && (
        <div className="border-t border-border-default bg-bg-base px-4 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Step Block ──

function StepBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="border-l-2 border-accent-cyan/30 pl-3 py-1.5">
      <p className="text-[10px] font-semibold text-accent-cyan">{title}</p>
      <p className="mt-0.5 text-[10px] leading-relaxed text-text-secondary">{text}</p>
    </div>
  );
}

// ── Bullet List ──

function BulletItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-[10px] leading-relaxed text-text-secondary">
      <span className="mt-1 h-1 w-1 shrink-0 bg-accent-cyan" />
      <span>{text}</span>
    </li>
  );
}

// ── Sub-heading ──

function SubHeading({ text }: { text: string }) {
  return (
    <h3 className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-text-primary first:mt-0">
      {text}
    </h3>
  );
}

// ── Description ──

function Desc({ text }: { text: string }) {
  return <p className="mb-3 text-[10px] leading-relaxed text-text-secondary">{text}</p>;
}

// ── Limitation Item ──

function LimitationItem({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-start gap-3 border border-border-default px-3 py-2">
      <span className="shrink-0 flex h-5 w-5 items-center justify-center border border-status-warning/30 text-[9px] font-bold text-status-warning">
        {number}
      </span>
      <p className="text-[10px] leading-relaxed text-text-secondary">{text}</p>
    </div>
  );
}

// ── Main Page ──

export default function HelpPage() {
  const t = useTranslations('help');

  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(['quick-start']),
  );

  const contentRef = useRef<HTMLDivElement>(null);

  const toggleSection = useCallback((id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setOpenSections(new Set(SECTIONS.map((s) => s.id)));
  }, []);

  const collapseAll = useCallback(() => {
    setOpenSections(new Set());
  }, []);

  const scrollToSection = useCallback((id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    // Give React a tick to render the opened section before scrolling
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="border-b border-border-default px-4 py-3">
        <h1 className="text-xs font-semibold uppercase tracking-[0.15em] text-text-primary">
          {t('title')}
        </h1>
        <p className="mt-0.5 text-[10px] text-text-muted">{t('subtitle')}</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar Navigation ── */}
        <nav
          className="flex w-52 shrink-0 flex-col border-r border-border-default"
          aria-label={t('title')}
        >
          <div className="flex-1 overflow-auto py-2">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = openSections.has(section.id);
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  className={`flex w-full items-center gap-2 border-l-2 px-4 py-2 text-left text-[10px] transition-colors ${
                    isActive
                      ? 'border-accent-cyan bg-accent-cyan/5 text-accent-cyan'
                      : 'border-transparent text-text-muted hover:text-text-secondary'
                  }`}
                >
                  <Icon size={12} strokeWidth={1.5} />
                  {t(section.labelKey)}
                </button>
              );
            })}
          </div>

          {/* Expand/Collapse all */}
          <div className="border-t border-border-default px-4 py-2 flex gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="flex items-center gap-1 text-[9px] text-text-muted transition-colors hover:text-accent-cyan"
            >
              <ChevronsDown size={10} strokeWidth={1.5} />
              {t('expandAll')}
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="flex items-center gap-1 text-[9px] text-text-muted transition-colors hover:text-accent-cyan"
            >
              <ChevronsUp size={10} strokeWidth={1.5} />
              {t('collapseAll')}
            </button>
          </div>
        </nav>

        {/* ── Main Content ── */}
        <div ref={contentRef} className="flex-1 overflow-auto p-4">
          <div className="mx-auto max-w-2xl space-y-3">

            {/* ─── Quick Start ─── */}
            <AccordionSection
              id="quick-start"
              isOpen={openSections.has('quick-start')}
              onToggle={() => toggleSection('quick-start')}
              title={t('quickStartTitle')}
            >
              <Desc text={t('quickStartDesc')} />
              <div className="space-y-3">
                <StepBlock title={t('quickStartStep1Title')} text={t('quickStartStep1')} />
                <StepBlock title={t('quickStartStep2Title')} text={t('quickStartStep2')} />
                <StepBlock title={t('quickStartStep3Title')} text={t('quickStartStep3')} />
                <StepBlock title={t('quickStartStep4Title')} text={t('quickStartStep4')} />
                <StepBlock title={t('quickStartStep5Title')} text={t('quickStartStep5')} />
              </div>
            </AccordionSection>

            {/* ─── WhatsApp ─── */}
            <AccordionSection
              id="whatsapp"
              isOpen={openSections.has('whatsapp')}
              onToggle={() => toggleSection('whatsapp')}
              title={t('whatsAppTitle')}
            >
              <Desc text={t('whatsAppDesc')} />
              <div className="space-y-3">
                <StepBlock title={t('whatsAppStep1Title')} text={t('whatsAppStep1')} />
                <StepBlock title={t('whatsAppStep2Title')} text={t('whatsAppStep2')} />
                <StepBlock
                  title={t('whatsAppStep3Title')}
                  text={t('whatsAppStep3', { webhookUrl: t('webhookUrlPlaceholder') })}
                />
                <StepBlock title={t('whatsAppStep4Title')} text={t('whatsAppStep4')} />
                <StepBlock title={t('whatsAppStep5Title')} text={t('whatsAppStep5')} />
                <StepBlock title={t('whatsAppStep6Title')} text={t('whatsAppStep6')} />
              </div>
              <div className="mt-4 border border-border-default bg-bg-deepest px-3 py-2">
                <p className="text-[9px] text-text-muted italic">
                  {t('whatsAppScreenshotPlaceholder')}
                </p>
              </div>
            </AccordionSection>

            {/* ─── Creating Agents ─── */}
            <AccordionSection
              id="agents"
              isOpen={openSections.has('agents')}
              onToggle={() => toggleSection('agents')}
              title={t('agentsTitle')}
            >
              <Desc text={t('agentsDesc')} />

              <SubHeading text={t('agentsWizardTitle')} />
              <Desc text={t('agentsWizardDesc')} />

              <SubHeading text={t('agentsArchetypesTitle')} />
              <Desc text={t('agentsArchetypesDesc')} />
              <ul className="mb-3 space-y-1.5">
                <BulletItem text={t('agentsArchetypeSupport')} />
                <BulletItem text={t('agentsArchetypeSales')} />
                <BulletItem text={t('agentsArchetypeMarketing')} />
                <BulletItem text={t('agentsArchetypeDataAnalyst')} />
                <BulletItem text={t('agentsArchetypeContentWriter')} />
                <BulletItem text={t('agentsArchetypeCustom')} />
              </ul>

              <SubHeading text={t('agentsToolsTitle')} />
              <Desc text={t('agentsToolsDesc')} />

              <SubHeading text={t('agentsTriggersTitle')} />
              <Desc text={t('agentsTriggersDesc')} />

              <div className="mt-3 border-l-2 border-status-info/40 bg-status-info/5 px-3 py-2">
                <p className="text-[10px] leading-relaxed text-status-info">
                  {t('agentsTip')}
                </p>
              </div>
            </AccordionSection>

            {/* ─── Approvals ─── */}
            <AccordionSection
              id="approvals"
              isOpen={openSections.has('approvals')}
              onToggle={() => toggleSection('approvals')}
              title={t('approvalsTitle')}
            >
              <Desc text={t('approvalsDesc')} />

              <SubHeading text={t('approvalsHowTitle')} />
              <Desc text={t('approvalsHowDesc')} />

              <SubHeading text={t('approvalsRiskTitle')} />
              <Desc text={t('approvalsRiskDesc')} />
              <div className="space-y-1.5 mb-3">
                <div className="flex items-start gap-2 text-[10px]">
                  <span className="mt-0.5 shrink-0 border border-status-success/40 px-1.5 py-0.5 text-[8px] font-bold text-status-success">
                    LOW
                  </span>
                  <span className="text-text-secondary">{t('approvalsRiskLow')}</span>
                </div>
                <div className="flex items-start gap-2 text-[10px]">
                  <span className="mt-0.5 shrink-0 border border-status-warning/40 px-1.5 py-0.5 text-[8px] font-bold text-status-warning">
                    MED
                  </span>
                  <span className="text-text-secondary">{t('approvalsRiskMedium')}</span>
                </div>
                <div className="flex items-start gap-2 text-[10px]">
                  <span className="mt-0.5 shrink-0 border border-status-error/40 px-1.5 py-0.5 text-[8px] font-bold text-status-error">
                    HIGH
                  </span>
                  <span className="text-text-secondary">{t('approvalsRiskHigh')}</span>
                </div>
                <div className="flex items-start gap-2 text-[10px]">
                  <span className="mt-0.5 shrink-0 border border-risk-critical/40 px-1.5 py-0.5 text-[8px] font-bold text-risk-critical">
                    CRIT
                  </span>
                  <span className="text-text-secondary">{t('approvalsRiskCritical')}</span>
                </div>
              </div>

              <SubHeading text={t('approvalsWhereTitle')} />
              <Desc text={t('approvalsWhereDesc')} />
            </AccordionSection>

            {/* ─── Monitoring ─── */}
            <AccordionSection
              id="monitoring"
              isOpen={openSections.has('monitoring')}
              onToggle={() => toggleSection('monitoring')}
              title={t('monitoringTitle')}
            >
              <Desc text={t('monitoringDesc')} />

              <SubHeading text={t('monitoringActivityTitle')} />
              <Desc text={t('monitoringActivityDesc')} />

              <SubHeading text={t('monitoringSessionTitle')} />
              <Desc text={t('monitoringSessionDesc')} />

              <SubHeading text={t('monitoringAgentDetailTitle')} />
              <Desc text={t('monitoringAgentDetailDesc')} />

              <div className="mt-3 border-l-2 border-status-info/40 bg-status-info/5 px-3 py-2">
                <p className="text-[10px] leading-relaxed text-status-info">
                  {t('monitoringTip')}
                </p>
              </div>
            </AccordionSection>

            {/* ─── Memory & Wiki ─── */}
            <AccordionSection
              id="memory"
              isOpen={openSections.has('memory')}
              onToggle={() => toggleSection('memory')}
              title={t('memoryTitle')}
            >
              <Desc text={t('memoryDesc')} />

              <SubHeading text={t('memoryAgentTitle')} />
              <Desc text={t('memoryAgentDesc')} />

              <SubHeading text={t('memoryCompanyTitle')} />
              <Desc text={t('memoryCompanyDesc')} />

              <SubHeading text={t('memoryWikiTitle')} />
              <Desc text={t('memoryWikiDesc')} />

              <div className="mt-3 border-l-2 border-status-info/40 bg-status-info/5 px-3 py-2">
                <p className="text-[10px] leading-relaxed text-status-info">
                  {t('memoryTip')}
                </p>
              </div>
            </AccordionSection>

            {/* ─── Known Limitations ─── */}
            <AccordionSection
              id="limitations"
              isOpen={openSections.has('limitations')}
              onToggle={() => toggleSection('limitations')}
              title={t('limitationsTitle')}
            >
              <Desc text={t('limitationsDesc')} />
              <div className="space-y-2">
                <LimitationItem number={1} text={t('limitation1')} />
                <LimitationItem number={2} text={t('limitation2')} />
                <LimitationItem number={3} text={t('limitation3')} />
                <LimitationItem number={4} text={t('limitation4')} />
                <LimitationItem number={5} text={t('limitation5')} />
                <LimitationItem number={6} text={t('limitation6')} />
                <LimitationItem number={7} text={t('limitation7')} />
                <LimitationItem number={8} text={t('limitation8')} />
              </div>
            </AccordionSection>

            {/* ─── Report Bugs ─── */}
            <AccordionSection
              id="bugs"
              isOpen={openSections.has('bugs')}
              onToggle={() => toggleSection('bugs')}
              title={t('bugsTitle')}
            >
              <Desc text={t('bugsDesc')} />

              <SubHeading text={t('bugsWidgetTitle')} />
              <Desc text={t('bugsWidgetDesc')} />

              <SubHeading text={t('bugsStepsTitle')} />
              <div className="space-y-1.5 mb-3">
                <StepBlock title="" text={t('bugsStep1')} />
                <StepBlock title="" text={t('bugsStep2')} />
                <StepBlock title="" text={t('bugsStep3')} />
                <StepBlock title="" text={t('bugsStep4')} />
                <StepBlock title="" text={t('bugsStep5')} />
              </div>

              <SubHeading text={t('bugsIncludeTitle')} />
              <ul className="mb-3 space-y-1.5">
                <BulletItem text={t('bugsInclude1')} />
                <BulletItem text={t('bugsInclude2')} />
                <BulletItem text={t('bugsInclude3')} />
                <BulletItem text={t('bugsInclude4')} />
                <BulletItem text={t('bugsInclude5')} />
                <BulletItem text={t('bugsInclude6')} />
              </ul>

              <SubHeading text={t('bugsEmailTitle')} />
              <Desc text={t('bugsEmailDesc')} />
            </AccordionSection>

          </div>
        </div>
      </div>
    </div>
  );
}

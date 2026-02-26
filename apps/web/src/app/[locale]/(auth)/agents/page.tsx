'use client';

import { useTranslations } from 'next-intl';
import { Plus, Bot, AlertTriangle, Wrench } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

/* -------------------------------------------------------------------------- */
/*  Status configuration                                                      */
/* -------------------------------------------------------------------------- */

const STATUS_CONFIG = {
  idle: { color: 'bg-[#2EA043]', label: 'idle' as const, pulse: false },
  working: { color: 'bg-[#00C8E0]', label: 'working' as const, pulse: true },
  awaiting_approval: { color: 'bg-[#D29922]', label: 'awaitingApproval' as const, pulse: false },
  error: { color: 'bg-[#F85149]', label: 'error' as const, pulse: false },
  offline: { color: 'bg-[#484F58]', label: 'offline' as const, pulse: false },
} as const;

type AgentStatus = keyof typeof STATUS_CONFIG;

/* -------------------------------------------------------------------------- */
/*  Archetype labels                                                          */
/* -------------------------------------------------------------------------- */

const ARCHETYPE_KEY: Record<string, string> = {
  support: 'archetypeSupport',
  sales: 'archetypeSales',
  marketing: 'archetypeMarketing',
  data_analyst: 'archetypeDataAnalyst',
  content_writer: 'archetypeContentWriter',
  developer: 'archetypeDeveloper',
  project_manager: 'archetypeProjectManager',
  hr: 'archetypeHr',
  finance: 'archetypeFinance',
  email_campaign_manager: 'archetypeEmailCampaign',
  research: 'archetypeResearch',
  recruiter: 'archetypeRecruiter',
  social_media: 'archetypeSocialMedia',
  mercado_livre: 'archetypeMercadoLivre',
  inventory_monitor: 'archetypeInventory',
  legal_research: 'archetypeLegalResearch',
  ad_analyst: 'archetypeAdAnalyst',
  account_manager: 'archetypeAccountManager',
  deployment_monitor: 'archetypeDeploymentMonitor',
  custom: 'archetypeCustom',
};

/* -------------------------------------------------------------------------- */
/*  Team labels                                                               */
/* -------------------------------------------------------------------------- */

const TEAM_KEY: Record<string, string> = {
  development: 'teamDevelopment',
  research: 'teamResearch',
  marketing: 'teamMarketing',
  sales: 'teamSales',
  support: 'teamSupport',
  finance: 'teamFinance',
  operations: 'teamOperations',
};

/* -------------------------------------------------------------------------- */
/*  Relative time helper                                                      */
/* -------------------------------------------------------------------------- */

function timeAgo(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return '<1m';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

/* -------------------------------------------------------------------------- */
/*  StatusDot component                                                       */
/* -------------------------------------------------------------------------- */

function StatusDot({ status }: { status: AgentStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.offline;

  return (
    <span className="relative inline-flex h-2 w-2">
      {cfg.pulse && (
        <span
          className={`absolute inline-flex h-full w-full animate-ping opacity-75 ${cfg.color}`}
          style={{ animationDuration: '1.5s' }}
        />
      )}
      <span className={`relative inline-flex h-2 w-2 ${cfg.color}`} />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loading skeleton                                                          */
/* -------------------------------------------------------------------------- */

function AgentCardSkeleton() {
  return (
    <div className="border border-border-default bg-bg-raised p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <div>
            <Skeleton className="mb-1 h-3 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
        <Skeleton className="h-2 w-2" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-14" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-2.5 w-12" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Empty state                                                               */
/* -------------------------------------------------------------------------- */

function EmptyState({ t, onCreateAgent }: { t: ReturnType<typeof useTranslations<'agents'>>; onCreateAgent: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center border border-border-default bg-bg-raised">
        <Bot size={24} strokeWidth={1.2} className="text-text-muted" />
      </div>
      <div className="text-center">
        <p className="text-xs text-text-secondary">{t('noAgents')}</p>
        <p className="mt-1 text-[10px] text-text-muted">{t('noAgentsDescription')}</p>
      </div>
      <Button size="sm" onClick={onCreateAgent}>
        <Plus size={12} strokeWidth={2} className="mr-1" />
        {t('createAgent')}
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Error state                                                               */
/* -------------------------------------------------------------------------- */

function ErrorState({ t }: { t: ReturnType<typeof useTranslations<'agents'>> }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <AlertTriangle size={20} strokeWidth={1.5} className="text-status-error" />
      <p className="text-xs text-status-error">{t('loadError')}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Agent card                                                                */
/* -------------------------------------------------------------------------- */

interface Agent {
  id: string;
  name: string;
  namePtBr: string | null;
  slug: string;
  archetype: string;
  status: AgentStatus;
  team: string | null;
  tools: string[] | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

function AgentCard({
  agent,
  t,
}: {
  agent: Agent;
  t: ReturnType<typeof useTranslations<'agents'>>;
}) {
  const status = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.offline;
  const archetypeKey = ARCHETYPE_KEY[agent.archetype] ?? 'archetypeCustom';
  const teamKey = agent.team ? TEAM_KEY[agent.team] : null;
  const toolCount = agent.tools?.length ?? 0;

  return (
    <div className="group border border-border-default bg-bg-raised transition-colors hover:border-accent-cyan/40 hover:bg-bg-raised/80">
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          {/* Avatar placeholder */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border-default bg-bg-base">
            <Bot size={14} strokeWidth={1.5} className="text-text-muted" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-xs font-medium text-text-primary">{agent.name}</h3>
            <p className="text-[10px] text-text-muted">
              {t(archetypeKey as Parameters<typeof t>[0])}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 pt-0.5">
          <StatusDot status={agent.status} />
          <span className="text-[10px] text-text-muted">
            {t(status.label as Parameters<typeof t>[0])}
          </span>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5 px-4">
        <Badge variant={agent.isActive ? 'success' : 'default'}>
          {agent.isActive ? t('active') : t('inactive')}
        </Badge>
        {teamKey && (
          <Badge variant="cyan">
            {t(teamKey as Parameters<typeof t>[0])}
          </Badge>
        )}
        {toolCount > 0 && (
          <Badge variant="default">
            <Wrench size={8} strokeWidth={1.5} className="mr-0.5" />
            {t('toolCount', { count: toolCount })}
          </Badge>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-border-default px-4 py-2.5">
        <span className="text-[10px] text-text-muted">
          {t('lastActive')}: {timeAgo(agent.updatedAt)}
        </span>
        <span className="text-[10px] text-text-muted opacity-0 transition-opacity group-hover:opacity-100">
          {agent.slug}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function AgentsPage() {
  const t = useTranslations('agents');
  const router = useRouter();
  const { data: agents, isLoading, isError } = trpc.agents.list.useQuery();

  const handleCreateAgent = () => router.push('/agents/new');

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
        <Button size="sm" onClick={handleCreateAgent}>
          <Plus size={12} strokeWidth={2} className="mr-1" />
          {t('newAgent')}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <AgentCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && <ErrorState t={t} />}

        {/* Empty */}
        {!isLoading && !isError && agents && agents.length === 0 && <EmptyState t={t} onCreateAgent={handleCreateAgent} />}

        {/* Agent grid */}
        {!isLoading && !isError && agents && agents.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent as unknown as Agent}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

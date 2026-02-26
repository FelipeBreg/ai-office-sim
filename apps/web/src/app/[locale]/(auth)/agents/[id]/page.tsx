'use client';

import { use, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  Bot,
  Eye,
  Settings2,
  ScrollText,
  Brain,
  AlertTriangle,
  Wrench,
  Clock,
  Zap,
  Check,
  X,
  Pencil,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type Tab = 'overview' | 'configuration' | 'activityLog' | 'memory';

type AgentStatus = 'idle' | 'working' | 'awaiting_approval' | 'error' | 'offline';

type TriggerType = 'always_on' | 'scheduled' | 'event' | 'manual' | 'agent';

type MemoryScope = 'read_only' | 'read_write';

type Team = 'development' | 'research' | 'marketing' | 'sales' | 'support' | 'finance' | 'operations';

type ActionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

interface Agent {
  id: string;
  projectId: string;
  name: string;
  namePtBr: string | null;
  slug: string;
  archetype: string;
  avatarUrl: string | null;
  status: AgentStatus;
  systemPromptEn: string | null;
  systemPromptPtBr: string | null;
  config: { model: string; temperature: number; maxTokens: number; budget: number } | null;
  tools: string[] | null;
  team: Team | null;
  memoryScope: MemoryScope;
  triggerType: TriggerType;
  triggerConfig: { cron?: string; eventName?: string; sourceAgentId?: string } | null;
  maxActionsPerSession: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface ActionLog {
  id: string;
  agentId: string;
  sessionId: string;
  actionType: string;
  toolName: string | null;
  status: ActionStatus;
  tokensUsed: number | null;
  costUsd: string | null;
  durationMs: number | null;
  error: string | null;
  createdAt: Date | string;
}

interface MemoryEntry {
  id: string;
  agentId: string;
  key: string;
  value: unknown;
  updatedAt: Date | string;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const STATUS_CONFIG: Record<AgentStatus, { color: string; labelKey: string; badgeVariant: 'success' | 'cyan' | 'warning' | 'error' | 'default'; pulse: boolean }> = {
  idle: { color: 'bg-[#2EA043]', labelKey: 'idle', badgeVariant: 'success', pulse: false },
  working: { color: 'bg-[#00C8E0]', labelKey: 'working', badgeVariant: 'cyan', pulse: true },
  awaiting_approval: { color: 'bg-[#D29922]', labelKey: 'awaitingApproval', badgeVariant: 'warning', pulse: false },
  error: { color: 'bg-[#F85149]', labelKey: 'error', badgeVariant: 'error', pulse: false },
  offline: { color: 'bg-[#484F58]', labelKey: 'offline', badgeVariant: 'default', pulse: false },
};

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
  custom: 'archetypeCustom',
};

const TEAM_KEY: Record<string, string> = {
  development: 'teamDevelopment',
  research: 'teamResearch',
  marketing: 'teamMarketing',
  sales: 'teamSales',
  support: 'teamSupport',
  finance: 'teamFinance',
  operations: 'teamOperations',
};

const TRIGGER_KEY: Record<TriggerType, string> = {
  always_on: 'triggerAlwaysOn',
  scheduled: 'triggerScheduled',
  event: 'triggerEventDriven',
  manual: 'triggerManual',
  agent: 'triggerAgent',
};

const TABS: { id: Tab; labelKey: string; icon: typeof Eye }[] = [
  { id: 'overview', labelKey: 'tabOverview', icon: Eye },
  { id: 'configuration', labelKey: 'tabConfiguration', icon: Settings2 },
  { id: 'activityLog', labelKey: 'tabActivityLog', icon: ScrollText },
  { id: 'memory', labelKey: 'tabMemory', icon: Brain },
];

const ALL_TOOLS = [
  'send_whatsapp',
  'read_whatsapp',
  'send_email',
  'read_email',
  'search_web',
  'search_memory',
  'search_contacts',
  'create_contact',
  'update_contact',
  'list_deals',
  'create_deal',
  'read_spreadsheet',
  'write_spreadsheet',
  'append_spreadsheet',
  'monitor_pix',
  'check_nfe',
];

const ALL_TEAMS: (Team | '')[] = ['', 'development', 'research', 'marketing', 'sales', 'support', 'finance', 'operations'];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatJson(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

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
/*  StatusDot                                                                  */
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
/*  Loading skeleton                                                           */
/* -------------------------------------------------------------------------- */

function DetailSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-7 w-20" />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: Overview                                                              */
/* -------------------------------------------------------------------------- */

function OverviewTab({ agent }: { agent: Agent }) {
  const t = useTranslations('agentDetail');
  const tAgents = useTranslations('agents');

  const statusCfg = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.offline;
  const archetypeKey = ARCHETYPE_KEY[agent.archetype] ?? 'archetypeCustom';
  const teamKey = agent.team ? TEAM_KEY[agent.team] : null;
  const triggerKey = TRIGGER_KEY[agent.triggerType] ?? 'triggerManual';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Info grid */}
      <div>
        <div className="mb-2 text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('overview')}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {/* Status */}
          <div className="border border-border-default bg-bg-base p-3">
            <div className="text-[8px] uppercase tracking-[0.15em] text-text-muted">{t('status')}</div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <StatusDot status={agent.status} />
              <span className="text-xs text-text-primary">
                {t(statusCfg.labelKey as Parameters<typeof t>[0])}
              </span>
            </div>
          </div>

          {/* Archetype */}
          <div className="border border-border-default bg-bg-base p-3">
            <div className="text-[8px] uppercase tracking-[0.15em] text-text-muted">{t('archetype')}</div>
            <div className="mt-1.5 text-xs text-text-primary">
              {tAgents(archetypeKey as Parameters<typeof tAgents>[0])}
            </div>
          </div>

          {/* Team */}
          <div className="border border-border-default bg-bg-base p-3">
            <div className="text-[8px] uppercase tracking-[0.15em] text-text-muted">{t('team')}</div>
            <div className="mt-1.5 text-xs text-text-primary">
              {teamKey ? tAgents(teamKey as Parameters<typeof tAgents>[0]) : t('placeholder')}
            </div>
          </div>

          {/* Last Activity */}
          <div className="border border-border-default bg-bg-base p-3">
            <div className="text-[8px] uppercase tracking-[0.15em] text-text-muted">{t('lastActivity')}</div>
            <div className="mt-1.5 flex items-center gap-1 text-xs text-text-primary">
              <Clock size={10} strokeWidth={1.5} className="text-text-muted" />
              {timeAgo(agent.updatedAt)}
            </div>
          </div>

          {/* Trigger Type */}
          <div className="border border-border-default bg-bg-base p-3">
            <div className="text-[8px] uppercase tracking-[0.15em] text-text-muted">{t('triggerType')}</div>
            <div className="mt-1.5 flex items-center gap-1 text-xs text-text-primary">
              <Zap size={10} strokeWidth={1.5} className="text-text-muted" />
              {t(triggerKey as Parameters<typeof t>[0])}
            </div>
          </div>

          {/* Memory Scope */}
          <div className="border border-border-default bg-bg-base p-3">
            <div className="text-[8px] uppercase tracking-[0.15em] text-text-muted">{t('memoryScope')}</div>
            <div className="mt-1.5 text-xs text-text-primary">
              {agent.memoryScope === 'read_write' ? t('readWrite') : t('readOnly')}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Stats */}
      <div>
        <div className="mb-2 text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('stats')}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="border border-border-default bg-bg-base p-3">
            <div className="text-[8px] uppercase tracking-[0.15em] text-text-muted">{t('totalActions')}</div>
            <div className="mt-1.5 text-sm font-medium text-accent-cyan">{t('placeholder')}</div>
          </div>
          <div className="border border-border-default bg-bg-base p-3">
            <div className="text-[8px] uppercase tracking-[0.15em] text-text-muted">{t('tokensUsed')}</div>
            <div className="mt-1.5 text-sm font-medium text-accent-cyan">{t('placeholder')}</div>
          </div>
          <div className="border border-border-default bg-bg-base p-3">
            <div className="text-[8px] uppercase tracking-[0.15em] text-text-muted">{t('maxActions')}</div>
            <div className="mt-1.5 text-sm font-medium text-text-primary">{agent.maxActionsPerSession}</div>
          </div>
          <div className="border border-border-default bg-bg-base p-3">
            <div className="text-[8px] uppercase tracking-[0.15em] text-text-muted">{t('slug')}</div>
            <div className="mt-1.5 truncate text-xs font-mono text-text-secondary">{agent.slug}</div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Tools */}
      <div>
        <div className="mb-2 text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('tools')}
        </div>
        {(!agent.tools || agent.tools.length === 0) ? (
          <p className="text-[10px] text-text-muted">{t('noTools')}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {agent.tools.map((tool) => (
              <Badge key={tool} variant="default">
                <Wrench size={8} strokeWidth={1.5} className="mr-0.5" />
                {tool}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Created */}
      <div className="text-[10px] text-text-muted">
        {t('createdAt')}: {formatDate(agent.createdAt)}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: Configuration                                                         */
/* -------------------------------------------------------------------------- */

function ConfigurationTab({ agent, onSaved }: { agent: Agent; onSaved: () => void }) {
  const t = useTranslations('agentDetail');
  const tAgents = useTranslations('agents');

  // Form state
  const [name, setName] = useState(agent.name);
  const [promptLang, setPromptLang] = useState<'en' | 'ptBr'>('en');
  const [promptEn, setPromptEn] = useState(agent.systemPromptEn ?? '');
  const [promptPtBr, setPromptPtBr] = useState(agent.systemPromptPtBr ?? '');
  const [selectedTools, setSelectedTools] = useState<string[]>(agent.tools ?? []);
  const [triggerType, setTriggerType] = useState<TriggerType>(agent.triggerType);
  const [triggerCron, setTriggerCron] = useState(agent.triggerConfig?.cron ?? '');
  const [triggerEvent, setTriggerEvent] = useState(agent.triggerConfig?.eventName ?? '');
  const [triggerSourceAgent, setTriggerSourceAgent] = useState(agent.triggerConfig?.sourceAgentId ?? '');
  const [memoryScope, setMemoryScope] = useState<MemoryScope>(agent.memoryScope);
  const [team, setTeam] = useState<Team | ''>(agent.team ?? '');

  const updateMutation = trpc.agents.update.useMutation({
    onSuccess: () => {
      onSaved();
    },
  });

  const handleSave = () => {
    const triggerConfig: { cron?: string; eventName?: string; sourceAgentId?: string } = {};
    if (triggerType === 'scheduled' && triggerCron) triggerConfig.cron = triggerCron;
    if (triggerType === 'event' && triggerEvent) triggerConfig.eventName = triggerEvent;
    if (triggerType === 'agent' && triggerSourceAgent) triggerConfig.sourceAgentId = triggerSourceAgent;

    updateMutation.mutate({
      id: agent.id,
      name,
      systemPromptEn: promptEn || undefined,
      systemPromptPtBr: promptPtBr || undefined,
      tools: selectedTools,
      triggerType,
      team: team || null,
    });
  };

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool],
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Name */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('name')}
        </label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <Separator />

      {/* System Prompt with lang tabs */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {promptLang === 'en' ? t('systemPromptEn') : t('systemPromptPtBr')}
        </label>
        <div className="mb-2 flex gap-1">
          <button
            onClick={() => setPromptLang('en')}
            className={`border px-2 py-1 text-[10px] transition-colors ${
              promptLang === 'en'
                ? 'border-accent-cyan bg-accent-cyan/5 text-accent-cyan'
                : 'border-border-default text-text-muted hover:text-text-secondary'
            }`}
          >
            {t('promptLangEn')}
          </button>
          <button
            onClick={() => setPromptLang('ptBr')}
            className={`border px-2 py-1 text-[10px] transition-colors ${
              promptLang === 'ptBr'
                ? 'border-accent-cyan bg-accent-cyan/5 text-accent-cyan'
                : 'border-border-default text-text-muted hover:text-text-secondary'
            }`}
          >
            {t('promptLangPtBr')}
          </button>
        </div>
        {promptLang === 'en' ? (
          <textarea
            value={promptEn}
            onChange={(e) => setPromptEn(e.target.value)}
            rows={8}
            className="w-full border border-border-default bg-bg-base px-2.5 py-1.5 font-mono text-[10px] text-text-primary placeholder:text-text-muted transition-colors focus:border-accent-cyan focus:outline-none"
          />
        ) : (
          <textarea
            value={promptPtBr}
            onChange={(e) => setPromptPtBr(e.target.value)}
            rows={8}
            className="w-full border border-border-default bg-bg-base px-2.5 py-1.5 font-mono text-[10px] text-text-primary placeholder:text-text-muted transition-colors focus:border-accent-cyan focus:outline-none"
          />
        )}
      </div>

      <Separator />

      {/* Tools checkboxes */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('toolsConfig')}
        </label>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {ALL_TOOLS.map((tool) => {
            const isChecked = selectedTools.includes(tool);
            return (
              <button
                key={tool}
                type="button"
                onClick={() => toggleTool(tool)}
                className={`flex items-center gap-2 border px-2.5 py-1.5 text-left text-[10px] transition-colors ${
                  isChecked
                    ? 'border-accent-cyan bg-accent-cyan/5 text-accent-cyan'
                    : 'border-border-default text-text-muted hover:border-border-hover hover:text-text-secondary'
                }`}
              >
                <span
                  className={`flex h-3 w-3 shrink-0 items-center justify-center border ${
                    isChecked ? 'border-accent-cyan bg-accent-cyan' : 'border-border-default'
                  }`}
                >
                  {isChecked && <Check size={8} strokeWidth={2} className="text-bg-deepest" />}
                </span>
                {tool}
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Trigger Config */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('triggerConfig')}
        </label>
        <div className="relative mb-2">
          <select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value as TriggerType)}
            className="w-full appearance-none border border-border-default bg-bg-base px-2.5 py-1.5 pr-8 text-xs text-text-primary transition-colors focus:border-accent-cyan focus:outline-none [&>option]:bg-bg-base [&>option]:text-text-primary"
          >
            {(['always_on', 'scheduled', 'event', 'manual', 'agent'] as TriggerType[]).map((tt) => (
              <option key={tt} value={tt}>
                {t(TRIGGER_KEY[tt] as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            strokeWidth={1.5}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
          />
        </div>

        {triggerType === 'scheduled' && (
          <div>
            <label className="mb-1 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
              {t('triggerCron')}
            </label>
            <Input
              value={triggerCron}
              onChange={(e) => setTriggerCron(e.target.value)}
              placeholder="0 9 * * 1-5"
            />
          </div>
        )}
        {triggerType === 'event' && (
          <div>
            <label className="mb-1 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
              {t('triggerEvent')}
            </label>
            <Input
              value={triggerEvent}
              onChange={(e) => setTriggerEvent(e.target.value)}
              placeholder="new_ticket"
            />
          </div>
        )}
        {triggerType === 'agent' && (
          <div>
            <label className="mb-1 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
              {t('triggerSourceAgent')}
            </label>
            <Input
              value={triggerSourceAgent}
              onChange={(e) => setTriggerSourceAgent(e.target.value)}
              placeholder="agent-uuid"
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Memory Scope */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('memoryScopeConfig')}
        </label>
        <div className="flex gap-2">
          {(['read_only', 'read_write'] as MemoryScope[]).map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => setMemoryScope(scope)}
              className={`border px-3 py-1.5 text-[10px] transition-colors ${
                memoryScope === scope
                  ? 'border-accent-cyan bg-accent-cyan/5 text-accent-cyan'
                  : 'border-border-default text-text-muted hover:text-text-secondary'
              }`}
            >
              {scope === 'read_only' ? t('readOnly') : t('readWrite')}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Team */}
      <div>
        <label className="mb-1.5 block text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('teamConfig')}
        </label>
        <div className="relative">
          <select
            value={team}
            onChange={(e) => setTeam(e.target.value as Team | '')}
            className="w-full appearance-none border border-border-default bg-bg-base px-2.5 py-1.5 pr-8 text-xs text-text-primary transition-colors focus:border-accent-cyan focus:outline-none [&>option]:bg-bg-base [&>option]:text-text-primary"
          >
            {ALL_TEAMS.map((tm) => (
              <option key={tm} value={tm}>
                {tm ? tAgents(TEAM_KEY[tm] as Parameters<typeof tAgents>[0]) : t('noTeam')}
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

      <Separator />

      {/* Save button + feedback */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? t('saving') : t('saveChanges')}
        </Button>
        {updateMutation.isSuccess && (
          <span className="text-[10px] text-status-success">{t('saved')}</span>
        )}
        {updateMutation.isError && (
          <span className="text-[10px] text-status-error">{t('saveFailed')}</span>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: Activity Log                                                          */
/* -------------------------------------------------------------------------- */

function ActivityLogTab({ agentId }: { agentId: string }) {
  const t = useTranslations('agentDetail');
  const [statusFilter, setStatusFilter] = useState<ActionStatus | ''>('');

  const logsQuery = trpc.actionLogs.list.useQuery({
    agentId,
    status: statusFilter || undefined,
    limit: 20,
  });

  const logs = ((logsQuery.data as { items: ActionLog[]; total: number } | undefined)?.items ?? []) as ActionLog[];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <label className="text-[8px] uppercase tracking-[0.15em] text-text-muted">
          {t('filterByStatus')}
        </label>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ActionStatus | '')}
            className="appearance-none border border-border-default bg-bg-base px-2.5 py-1 pr-7 text-[10px] text-text-primary transition-colors focus:border-accent-cyan focus:outline-none [&>option]:bg-bg-base [&>option]:text-text-primary"
          >
            <option value="">{t('allStatuses')}</option>
            <option value="pending">{t('pending')}</option>
            <option value="completed">{t('completed')}</option>
            <option value="failed">{t('failed')}</option>
            <option value="cancelled">{t('cancelled')}</option>
          </select>
          <ChevronDown
            size={10}
            strokeWidth={1.5}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
          />
        </div>
      </div>

      {/* Loading */}
      {logsQuery.isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {/* Error */}
      {logsQuery.isError && (
        <div className="flex items-center gap-2 text-[10px] text-status-error">
          <AlertTriangle size={12} strokeWidth={1.5} />
          {t('loadError')}
        </div>
      )}

      {/* Empty */}
      {!logsQuery.isLoading && !logsQuery.isError && logs.length === 0 && (
        <p className="text-[10px] text-text-muted">{t('noActivity')}</p>
      )}

      {/* Log rows */}
      {logs.length > 0 && (
        <div className="space-y-1">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_80px_60px_60px_60px] gap-2 px-3 py-1.5 text-[8px] uppercase tracking-[0.15em] text-text-muted">
            <span>{t('actionType')}</span>
            <span>{t('toolName')}</span>
            <span>{t('tokens')}</span>
            <span>{t('duration')}</span>
            <span>{t('status')}</span>
          </div>
          {logs.map((log) => {
            const statusVariant: Record<ActionStatus, 'default' | 'success' | 'error' | 'warning'> = {
              pending: 'warning',
              completed: 'success',
              failed: 'error',
              cancelled: 'default',
            };
            return (
              <div
                key={log.id}
                className="grid grid-cols-[1fr_80px_60px_60px_60px] items-center gap-2 border border-border-default bg-bg-base px-3 py-2"
              >
                <div className="min-w-0">
                  <span className="text-[10px] text-text-primary">{log.actionType}</span>
                  <div className="text-[8px] text-text-muted">{timeAgo(log.createdAt)}</div>
                </div>
                <span className="truncate text-[10px] text-text-secondary">
                  {log.toolName ?? t('placeholder')}
                </span>
                <span className="text-[10px] text-text-secondary">
                  {log.tokensUsed ?? t('placeholder')}
                </span>
                <span className="text-[10px] text-text-secondary">
                  {log.durationMs ? `${log.durationMs}ms` : t('placeholder')}
                </span>
                <Badge variant={statusVariant[log.status]}>
                  {t(log.status as Parameters<typeof t>[0])}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: Memory                                                                */
/* -------------------------------------------------------------------------- */

function MemoryTab({ agentId }: { agentId: string }) {
  const t = useTranslations('agentDetail');

  const memoryQuery = trpc.agentMemory.list.useQuery({ agentId }, { retry: false });
  const updateMutation = trpc.agentMemory.update.useMutation({
    onSuccess: () => {
      memoryQuery.refetch();
    },
  });

  const entries = (memoryQuery.data ?? []) as MemoryEntry[];

  const handleSave = (key: string, value: string) => {
    updateMutation.mutate({ agentId, key, value });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="text-[8px] uppercase tracking-[0.15em] text-text-muted">
        {t('agentMemory')} {entries.length > 0 && `(${entries.length})`}
      </div>

      {/* Loading */}
      {memoryQuery.isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {/* Error */}
      {memoryQuery.isError && (
        <div className="flex items-center gap-2 text-[10px] text-status-error">
          <AlertTriangle size={12} strokeWidth={1.5} />
          {t('loadError')}
        </div>
      )}

      {/* Empty */}
      {!memoryQuery.isLoading && !memoryQuery.isError && entries.length === 0 && (
        <p className="text-[10px] text-text-muted">{t('noMemory')}</p>
      )}

      {/* Memory entries */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry) => (
            <MemoryEntryCard key={entry.id} entry={entry} t={t} onSave={handleSave} />
          ))}
        </div>
      )}

      {/* Save feedback */}
      {updateMutation.isSuccess && (
        <p className="text-[10px] text-status-success">{t('memorySaved')}</p>
      )}
      {updateMutation.isError && (
        <p className="text-[10px] text-status-error">{updateMutation.error.message}</p>
      )}
    </div>
  );
}

function MemoryEntryCard({
  entry,
  t,
  onSave,
}: {
  entry: MemoryEntry;
  t: ReturnType<typeof useTranslations<'agentDetail'>>;
  onSave: (key: string, value: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const startEdit = () => {
    setEditValue(formatJson(entry.value));
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditValue('');
  };

  const saveEdit = () => {
    onSave(entry.key, editValue);
    setIsEditing(false);
  };

  return (
    <div className="border border-border-default bg-bg-base p-3">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold tracking-wide text-accent-cyan">{entry.key}</div>
          {isEditing ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={4}
              className="mt-1.5 w-full border border-border-default bg-bg-deepest px-2 py-1.5 font-mono text-[10px] text-text-primary focus:border-accent-cyan focus:outline-none"
            />
          ) : (
            <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-text-secondary">
              {formatJson(entry.value)}
            </pre>
          )}
          <div className="mt-1 text-[8px] text-text-muted">
            {t('memoryUpdated')}: {formatDate(entry.updatedAt)}
          </div>
        </div>
        <div className="ml-2 flex shrink-0 items-center gap-1">
          {isEditing ? (
            <>
              <Button variant="ghost" size="sm" onClick={saveEdit}>
                <Check size={12} strokeWidth={1.5} />
              </Button>
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                <X size={12} strokeWidth={1.5} />
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={startEdit}>
              <Pencil size={12} strokeWidth={1.5} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                  */
/* -------------------------------------------------------------------------- */

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('agentDetail');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const agentQuery = trpc.agents.getById.useQuery({ id });
  const agent = agentQuery.data as Agent | undefined;

  const triggerMutation = trpc.agents.trigger.useMutation();
  const updateMutation = trpc.agents.update.useMutation({
    onSuccess: () => {
      agentQuery.refetch();
    },
  });
  const deleteMutation = trpc.agents.delete.useMutation({
    onSuccess: () => {
      router.push('/agents');
    },
  });

  const handleToggleActive = useCallback(() => {
    if (!agent) return;
    updateMutation.mutate({
      id: agent.id,
      isActive: !agent.isActive,
    });
  }, [agent, updateMutation]);

  const handleTestRun = useCallback(() => {
    if (!agent) return;
    triggerMutation.mutate({ id: agent.id });
  }, [agent, triggerMutation]);

  const handleDelete = useCallback(() => {
    if (!agent) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    deleteMutation.mutate({ id: agent.id });
  }, [agent, confirmDelete, deleteMutation]);

  const handleBack = useCallback(() => {
    router.push('/agents');
  }, [router]);

  // Loading state
  if (agentQuery.isLoading) {
    return <DetailSkeleton />;
  }

  // Error state
  if (agentQuery.isError || !agent) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <AlertTriangle size={20} strokeWidth={1.5} className="text-status-error" />
        <p className="text-xs text-status-error">{t('loadError')}</p>
        <Button variant="secondary" size="sm" onClick={handleBack}>
          <ArrowLeft size={12} strokeWidth={2} className="mr-1" />
          {t('backToAgents')}
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.offline;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="flex h-6 w-6 items-center justify-center border border-border-default text-text-muted transition-colors hover:border-border-hover hover:text-text-primary"
            aria-label={t('backToAgents')}
          >
            <ArrowLeft size={12} strokeWidth={2} />
          </button>

          {/* Agent avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border-default bg-bg-base">
            <Bot size={14} strokeWidth={1.5} className="text-text-muted" />
          </div>

          {/* Name + status */}
          <div>
            <h1 className="text-xs font-semibold text-text-primary">{agent.name}</h1>
            <div className="mt-0.5 flex items-center gap-1.5">
              <StatusDot status={agent.status} />
              <span className="text-[10px] text-text-muted">
                {t(statusCfg.labelKey as Parameters<typeof t>[0])}
              </span>
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Test Run */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTestRun}
            disabled={triggerMutation.isPending || !agent.isActive}
          >
            <Play size={10} strokeWidth={2} className="mr-1" />
            {t('testRun')}
          </Button>

          {/* Active/Inactive toggle */}
          <button
            onClick={handleToggleActive}
            disabled={updateMutation.isPending}
            className={`flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-medium transition-colors ${
              agent.isActive
                ? 'border-status-success/40 text-status-success hover:bg-status-success/10'
                : 'border-border-default text-text-muted hover:border-border-hover hover:text-text-secondary'
            } disabled:pointer-events-none disabled:opacity-50`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 ${
                agent.isActive ? 'bg-status-success' : 'bg-[#484F58]'
              }`}
            />
            {agent.isActive ? t('activeToggle') : t('inactiveToggle')}
          </button>

          {/* Delete */}
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={10} strokeWidth={2} className="mr-1" />
            {confirmDelete ? t('confirmDelete') : t('deleteAgent')}
          </Button>
        </div>
      </div>

      {/* Trigger feedback */}
      {triggerMutation.isSuccess && (
        <div className="border-b border-status-success/20 bg-status-success/5 px-4 py-1.5 text-[10px] text-status-success">
          {t('testRunTriggered')}
        </div>
      )}
      {triggerMutation.isError && (
        <div className="border-b border-status-error/20 bg-status-error/5 px-4 py-1.5 text-[10px] text-status-error">
          {t('testRunFailed')}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border-default px-4" role="tablist" aria-label={t('tabOverview')}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[10px] transition-colors ${
                isActive
                  ? 'border-accent-cyan text-accent-cyan'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              <Icon size={12} strokeWidth={1.5} />
              {t(tab.labelKey as Parameters<typeof t>[0])}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div
        className="flex-1 overflow-auto p-4"
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
      >
        {activeTab === 'overview' && <OverviewTab agent={agent} />}
        {activeTab === 'configuration' && (
          <ConfigurationTab
            agent={agent}
            onSaved={() => agentQuery.refetch()}
          />
        )}
        {activeTab === 'activityLog' && <ActivityLogTab agentId={id} />}
        {activeTab === 'memory' && <MemoryTab agentId={id} />}
      </div>
    </div>
  );
}

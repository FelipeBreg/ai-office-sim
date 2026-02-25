'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  Activity,
  X,
  ChevronDown,
  ChevronRight,
  Inbox,
  Clock,
  Cpu,
  Brain,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CircleDot,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button, Badge, Skeleton, Separator } from '@/components/ui';

// ── Types ──────────────────────────────────────────────────────────────────

type ActionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
type ActionType = 'tool_call' | 'llm_response' | 'approval_request';

interface ActionLog {
  id: string;
  projectId: string;
  agentId: string;
  sessionId: string;
  actionType: string;
  toolName: string | null;
  input: unknown;
  output: unknown;
  status: ActionStatus;
  error: string | null;
  tokensUsed: number | null;
  costUsd: string | null;
  durationMs: number | null;
  createdAt: string | Date;
}

interface Agent {
  id: string;
  name: string;
  archetype: string;
}

type ViewMode = 'list' | 'session';

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_BADGE_VARIANT: Record<ActionStatus, 'success' | 'cyan' | 'error' | 'default'> = {
  completed: 'success',
  pending: 'cyan',
  failed: 'error',
  cancelled: 'default',
};

const STATUS_ICON: Record<ActionStatus, typeof CheckCircle2> = {
  completed: CheckCircle2,
  pending: CircleDot,
  failed: XCircle,
  cancelled: MinusCircle,
};

const ACTION_TYPE_ICON: Record<string, typeof Cpu> = {
  tool_call: Cpu,
  llm_response: Brain,
  approval_request: ShieldCheck,
};

function relativeTime(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return `${diffSec}s`;
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  return `${diffDay}d`;
}

function formatPayload(payload: unknown): string {
  if (payload == null) return '—';
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

function formatDuration(ms: number | null): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTokens(tokens: number | null): string {
  if (tokens == null) return '—';
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
  return String(tokens);
}

// ── Sub-components ─────────────────────────────────────────────────────────

function LogSkeleton() {
  return (
    <div className="border border-border-default p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="flex h-10 w-10 items-center justify-center border border-border-default">
        <Inbox size={16} strokeWidth={1.5} className="text-text-muted" />
      </div>
      <p className="text-[11px] text-text-muted">{message}</p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={label}
        className="appearance-none border border-border-default bg-bg-base px-2 py-1 pr-6 text-[10px] text-text-primary transition-colors focus:border-accent-cyan focus:outline-none disabled:pointer-events-none disabled:opacity-50 [&>option]:bg-bg-base [&>option]:text-text-primary"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={10}
        strokeWidth={1.5}
        className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted"
      />
    </div>
  );
}

// ── Log Row ────────────────────────────────────────────────────────────────

function LogRow({
  log,
  agentName,
  onClick,
  t,
}: {
  log: ActionLog;
  agentName: string;
  onClick: () => void;
  t: (key: string) => string;
}) {
  const StatusIcon = STATUS_ICON[log.status] ?? CircleDot;
  const TypeIcon = ACTION_TYPE_ICON[log.actionType] ?? Activity;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border border-border-default px-3 py-2 text-left transition-colors hover:border-accent-cyan/40 hover:bg-bg-raised/50"
    >
      {/* Timestamp */}
      <span className="flex shrink-0 items-center gap-1 text-[9px] text-text-muted" style={{ width: '36px' }}>
        <Clock size={9} strokeWidth={1.5} />
        {relativeTime(log.createdAt)}
      </span>

      {/* Agent */}
      <span className="min-w-0 shrink-0 truncate text-[10px] font-medium text-text-primary" style={{ width: '100px' }}>
        {agentName}
      </span>

      {/* Action type */}
      <Badge variant="default">
        <TypeIcon size={8} strokeWidth={1.5} className="mr-0.5" />
        {t(`type_${log.actionType}`)}
      </Badge>

      {/* Tool name */}
      {log.toolName && (
        <span className="hidden truncate text-[9px] text-text-secondary sm:inline-block" style={{ maxWidth: '120px' }}>
          {log.toolName}
        </span>
      )}

      {/* Status */}
      <Badge variant={STATUS_BADGE_VARIANT[log.status]}>
        <StatusIcon size={8} strokeWidth={1.5} className="mr-0.5" />
        {t(`status_${log.status}`)}
      </Badge>

      {/* Tokens */}
      <span className="ml-auto shrink-0 text-[9px] tabular-nums text-text-muted">
        {log.tokensUsed != null ? `${formatTokens(log.tokensUsed)} tok` : ''}
      </span>

      {/* Arrow */}
      <ChevronRight size={10} strokeWidth={1.5} className="shrink-0 text-text-muted" />
    </button>
  );
}

// ── Detail Drawer ──────────────────────────────────────────────────────────

function DetailDrawer({
  log,
  agentName,
  onClose,
  onOpenSession,
  t,
}: {
  log: ActionLog;
  agentName: string;
  onClose: () => void;
  onOpenSession: (sessionId: string) => void;
  t: (key: string) => string;
}) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const StatusIcon = STATUS_ICON[log.status] ?? CircleDot;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-bg-deepest/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('detailTitle')}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[400px] flex-col border-l border-border-default bg-bg-base shadow-2xl"
        style={{ animation: 'slideInRight 200ms ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-primary">
            {t('detailTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center text-text-muted transition-colors hover:text-text-primary"
            aria-label={t('close')}
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="flex flex-col gap-4">
            {/* Agent info */}
            <DetailField label={t('agent')} value={agentName} />

            {/* Session ID */}
            <div>
              <span className="block text-[8px] uppercase tracking-[0.15em] text-text-muted">
                {t('sessionId')}
              </span>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="font-mono text-[10px] text-text-secondary">
                  {log.sessionId.slice(0, 8)}...
                </span>
                <button
                  type="button"
                  onClick={() => onOpenSession(log.sessionId)}
                  className="flex items-center gap-0.5 text-[9px] text-accent-cyan transition-colors hover:underline"
                >
                  {t('viewSession')}
                  <ArrowRight size={9} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Action type */}
            <DetailField label={t('actionType')} value={t(`type_${log.actionType}`)} />

            {/* Tool name */}
            {log.toolName && (
              <DetailField label={t('toolName')} value={log.toolName} />
            )}

            {/* Status */}
            <div>
              <span className="block text-[8px] uppercase tracking-[0.15em] text-text-muted">
                {t('statusLabel')}
              </span>
              <div className="mt-0.5">
                <Badge variant={STATUS_BADGE_VARIANT[log.status]}>
                  <StatusIcon size={8} strokeWidth={1.5} className="mr-0.5" />
                  {t(`status_${log.status}`)}
                </Badge>
              </div>
            </div>

            {/* Tokens */}
            <DetailField
              label={t('tokensUsed')}
              value={log.tokensUsed != null ? String(log.tokensUsed) : '—'}
            />

            {/* Duration */}
            <DetailField
              label={t('duration')}
              value={formatDuration(log.durationMs)}
            />

            {/* Cost */}
            {log.costUsd != null && (
              <DetailField label={t('cost')} value={`$${log.costUsd}`} />
            )}

            {/* Error */}
            {log.error && (
              <div>
                <span className="block text-[8px] uppercase tracking-[0.15em] text-status-error">
                  {t('errorMessage')}
                </span>
                <p className="mt-0.5 border border-status-error/20 bg-status-error/5 px-2 py-1.5 text-[10px] text-status-error">
                  {log.error}
                </p>
              </div>
            )}

            <Separator />

            {/* Input payload */}
            <div>
              <span className="block text-[8px] uppercase tracking-[0.15em] text-text-muted">
                {t('inputPayload')}
              </span>
              <pre className="mt-1 max-h-48 overflow-auto border border-border-default bg-bg-deepest px-2 py-1.5 font-mono text-[9px] leading-relaxed text-text-secondary">
                {formatPayload(log.input)}
              </pre>
            </div>

            {/* Output payload */}
            <div>
              <span className="block text-[8px] uppercase tracking-[0.15em] text-text-muted">
                {t('outputPayload')}
              </span>
              <pre className="mt-1 max-h-48 overflow-auto border border-border-default bg-bg-deepest px-2 py-1.5 font-mono text-[9px] leading-relaxed text-text-secondary">
                {formatPayload(log.output)}
              </pre>
            </div>

            {/* Timestamp */}
            <DetailField
              label={t('timestamp')}
              value={new Date(log.createdAt).toLocaleString()}
            />
          </div>
        </div>
      </div>

      {/* Slide-in animation */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[8px] uppercase tracking-[0.15em] text-text-muted">{label}</span>
      <span className="mt-0.5 block text-[10px] text-text-primary">{value}</span>
    </div>
  );
}

// ── Session Timeline ───────────────────────────────────────────────────────

function SessionTimeline({
  sessionId,
  agentsMap,
  onBack,
  onSelectLog,
  t,
}: {
  sessionId: string;
  agentsMap: Map<string, Agent>;
  onBack: () => void;
  onSelectLog: (log: ActionLog) => void;
  t: (key: string) => string;
}) {
  const { data, isLoading, isError } = trpc.actionLogs.list.useQuery({
    sessionId,
    limit: 100,
    offset: 0,
  });

  const logs = (data?.items ?? []) as ActionLog[];

  return (
    <div className="flex h-full flex-col">
      {/* Session header */}
      <div className="flex items-center gap-3 border-b border-border-default px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          {t('backToList')}
        </Button>
        <div>
          <span className="text-[8px] uppercase tracking-[0.15em] text-text-muted">
            {t('sessionView')}
          </span>
          <span className="ml-2 font-mono text-[10px] text-text-secondary">
            {sessionId.slice(0, 8)}...
          </span>
        </div>
      </div>

      {/* Timeline content */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-full w-px" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-2 text-[10px] text-status-error">
            <AlertTriangle size={12} strokeWidth={1.5} />
            {t('loadError')}
          </div>
        )}

        {!isLoading && logs.length === 0 && (
          <EmptyState message={t('noLogs')} />
        )}

        {logs.length > 0 && (
          <div className="relative ml-3">
            {/* Vertical line */}
            <div className="absolute bottom-0 left-0 top-0 w-px bg-border-default" />

            {logs.map((log, idx) => {
              const agent = agentsMap.get(log.agentId);
              const agentName = agent?.name ?? t('unknownAgent');
              const StatusIcon = STATUS_ICON[log.status] ?? CircleDot;
              const TypeIcon = ACTION_TYPE_ICON[log.actionType] ?? Activity;
              const isLast = idx === logs.length - 1;

              return (
                <div key={log.id} className={`relative pl-6 ${isLast ? '' : 'pb-4'}`}>
                  {/* Node dot */}
                  <div
                    className={`absolute left-0 top-0.5 flex h-4 w-4 -translate-x-1/2 items-center justify-center border bg-bg-base ${
                      log.status === 'failed'
                        ? 'border-status-error'
                        : log.status === 'completed'
                          ? 'border-status-success'
                          : 'border-accent-cyan'
                    }`}
                  >
                    <StatusIcon size={8} strokeWidth={1.5} className={
                      log.status === 'failed'
                        ? 'text-status-error'
                        : log.status === 'completed'
                          ? 'text-status-success'
                          : 'text-accent-cyan'
                    } />
                  </div>

                  {/* Node content */}
                  <button
                    type="button"
                    onClick={() => onSelectLog(log)}
                    className="w-full border border-border-default bg-bg-base p-2.5 text-left transition-colors hover:border-accent-cyan/40"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="default">
                        <TypeIcon size={8} strokeWidth={1.5} className="mr-0.5" />
                        {t(`type_${log.actionType}`)}
                      </Badge>
                      {log.toolName && (
                        <span className="text-[9px] text-text-secondary">{log.toolName}</span>
                      )}
                      <Badge variant={STATUS_BADGE_VARIANT[log.status]}>
                        {t(`status_${log.status}`)}
                      </Badge>
                      <span className="ml-auto text-[9px] tabular-nums text-text-muted">
                        {relativeTime(log.createdAt)}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-[9px] text-text-muted">
                      <span>{agentName}</span>
                      {log.tokensUsed != null && (
                        <span>{formatTokens(log.tokensUsed)} tok</span>
                      )}
                      {log.durationMs != null && (
                        <span>{formatDuration(log.durationMs)}</span>
                      )}
                    </div>

                    {/* Error inline */}
                    {log.error != null && (
                      <p className="mt-1 truncate text-[9px] text-status-error">
                        {log.error}
                      </p>
                    )}

                    {/* Collapsible LLM response snippet */}
                    {log.actionType === 'llm_response' && log.output != null && (
                      <CollapsiblePayload label={t('outputSnippet')} payload={log.output} />
                    )}

                    {/* Collapsible tool_call input/output */}
                    {log.actionType === 'tool_call' && (
                      <div className="mt-1 flex gap-2">
                        {log.input != null && (
                          <CollapsiblePayload label={t('input')} payload={log.input} />
                        )}
                        {log.output != null && (
                          <CollapsiblePayload label={t('output')} payload={log.output} />
                        )}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CollapsiblePayload({ label, payload }: { label: string; payload: unknown }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="flex items-center gap-0.5 text-[8px] text-text-muted transition-colors hover:text-accent-cyan"
      >
        {open ? <ChevronDown size={8} strokeWidth={1.5} /> : <ChevronRight size={8} strokeWidth={1.5} />}
        {label}
      </button>
      {open && (
        <pre
          className="mt-0.5 max-h-32 overflow-auto bg-bg-deepest px-2 py-1 font-mono text-[8px] leading-relaxed text-text-muted"
          onClick={(e) => e.stopPropagation()}
        >
          {formatPayload(payload)}
        </pre>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function ActivityLogPage() {
  const t = useTranslations('activity');
  const tCommon = useTranslations('common');

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<ActionLog | null>(null);

  // Filters
  const [filterAgent, setFilterAgent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;

  // Reset offset when filters change
  useEffect(() => {
    setOffset(0);
  }, [filterAgent, filterStatus]);

  // Queries
  const agentsQuery = trpc.agents.list.useQuery();
  const logsQuery = trpc.actionLogs.list.useQuery({
    limit: LIMIT,
    offset,
    agentId: filterAgent || undefined,
    status: (filterStatus as ActionStatus) || undefined,
  });

  const agentsMap = useMemo(() => {
    const map = new Map<string, Agent>();
    if (agentsQuery.data) {
      for (const a of agentsQuery.data) {
        map.set(a.id, { id: a.id, name: a.name, archetype: a.archetype });
      }
    }
    return map;
  }, [agentsQuery.data]);

  const logs = (logsQuery.data?.items ?? []) as ActionLog[];
  const total = logsQuery.data?.total ?? 0;
  const hasMore = offset + LIMIT < total;

  // Handlers
  const handleOpenSession = useCallback((sessionId: string) => {
    setSelectedLog(null);
    setSelectedSessionId(sessionId);
    setViewMode('session');
  }, []);

  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedSessionId(null);
  }, []);

  const handleSelectLog = useCallback((log: ActionLog) => {
    setSelectedLog(log);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedLog(null);
  }, []);

  const handleLoadMore = useCallback(() => {
    setOffset((prev) => prev + LIMIT);
  }, []);

  // Agent dropdown options
  const agentOptions = useMemo(() => {
    const opts = [{ value: '', label: t('allAgents') }];
    if (agentsQuery.data) {
      for (const agent of agentsQuery.data) {
        opts.push({ value: agent.id, label: agent.name });
      }
    }
    return opts;
  }, [agentsQuery.data, t]);

  const statusOptions = useMemo(
    () => [
      { value: '', label: t('allStatuses') },
      { value: 'pending', label: t('status_pending') },
      { value: 'completed', label: t('status_completed') },
      { value: 'failed', label: t('status_failed') },
      { value: 'cancelled', label: t('status_cancelled') },
    ],
    [t],
  );

  // ── Session View ──
  if (viewMode === 'session' && selectedSessionId) {
    return (
      <div className="flex h-full flex-col">
        <SessionTimeline
          sessionId={selectedSessionId}
          agentsMap={agentsMap}
          onBack={handleBackToList}
          onSelectLog={handleSelectLog}
          t={t}
        />

        {/* Drawer overlay for selected log in session view */}
        {selectedLog && (
          <DetailDrawer
            log={selectedLog}
            agentName={agentsMap.get(selectedLog.agentId)?.name ?? t('unknownAgent')}
            onClose={handleCloseDrawer}
            onOpenSession={handleOpenSession}
            t={t}
          />
        )}
      </div>
    );
  }

  // ── List View ──
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

        {/* Filters */}
        <div className="flex items-center gap-2">
          <FilterSelect
            label={t('filterAgent')}
            value={filterAgent}
            onChange={setFilterAgent}
            options={agentOptions}
            disabled={agentsQuery.isLoading}
          />
          <FilterSelect
            label={t('filterStatus')}
            value={filterStatus}
            onChange={setFilterStatus}
            options={statusOptions}
          />
        </div>
      </div>

      {/* Error state */}
      {logsQuery.isError && (
        <div className="flex items-center gap-2 px-4 py-3 text-[10px] text-status-error">
          <AlertTriangle size={12} strokeWidth={1.5} />
          {t('loadError')}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {logsQuery.isLoading ? (
          <div className="space-y-1 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <LogSkeleton key={i} />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState message={t('noLogs')} />
        ) : (
          <div className="flex flex-col">
            {/* Table header */}
            <div className="flex items-center gap-3 border-b border-border-default bg-bg-raised/30 px-3 py-1.5 text-[8px] uppercase tracking-[0.15em] text-text-muted">
              <span style={{ width: '36px' }}>{t('time')}</span>
              <span style={{ width: '100px' }}>{t('agent')}</span>
              <span>{t('type')}</span>
              <span className="ml-auto">{t('tokens')}</span>
              <span style={{ width: '10px' }} />
            </div>

            {/* Rows */}
            <div className="divide-y divide-border-subtle">
              {logs.map((log) => {
                const agent = agentsMap.get(log.agentId);
                const agentName = agent?.name ?? t('unknownAgent');

                return (
                  <LogRow
                    key={log.id}
                    log={log}
                    agentName={agentName}
                    onClick={() => handleSelectLog(log)}
                    t={t}
                  />
                );
              })}
            </div>

            {/* Load more / pagination info */}
            <div className="flex items-center justify-between border-t border-border-default px-4 py-2">
              <span className="text-[9px] tabular-nums text-text-muted">
                {t('showing', { count: Math.min(offset + LIMIT, total), total })}
              </span>
              {hasMore && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={logsQuery.isFetching}
                >
                  {logsQuery.isFetching ? (
                    <Loader2 size={10} strokeWidth={1.5} className="mr-1 animate-spin" />
                  ) : null}
                  {t('loadMore')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selectedLog && (
        <DetailDrawer
          log={selectedLog}
          agentName={agentsMap.get(selectedLog.agentId)?.name ?? t('unknownAgent')}
          onClose={handleCloseDrawer}
          onOpenSession={handleOpenSession}
          t={t}
        />
      )}
    </div>
  );
}

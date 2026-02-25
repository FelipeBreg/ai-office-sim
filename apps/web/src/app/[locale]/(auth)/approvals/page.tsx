'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  ShieldCheck,
  ShieldX,
  ChevronDown,
  ChevronRight,
  Clock,
  Inbox,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button, Badge, Skeleton } from '@/components/ui';

// ── Types ──

type Tab = 'pending' | 'all';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface Approval {
  id: string;
  projectId: string;
  agentId: string;
  actionLogId: string;
  actionType: string;
  actionPayload: unknown;
  reason: string | null;
  riskLevel: RiskLevel;
  status: ApprovalStatus;
  reviewedBy: string | null;
  reviewComment: string | null;
  createdAt: string | Date;
  reviewedAt: string | Date | null;
}

interface Agent {
  id: string;
  name: string;
  archetype: string;
}

// ── Helpers ──

const RISK_BADGE_VARIANT: Record<RiskLevel, 'cyan' | 'warning' | 'error'> = {
  low: 'cyan',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

const RISK_LABEL: Record<RiskLevel, string> = {
  low: 'LOW',
  medium: 'MEDIUM',
  high: 'HIGH',
  critical: 'CRITICAL',
};

const STATUS_BADGE_VARIANT: Record<ApprovalStatus, 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
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
  if (payload == null) return '{}';
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

// ── Components ──

function ApprovalSkeleton() {
  return (
    <div className="border border-border-default p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
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

function ApprovalItem({
  approval,
  agent,
  onApprove,
  onReject,
  isActioning,
}: {
  approval: Approval;
  agent: Agent | undefined;
  onApprove: (id: string, comment: string) => void;
  onReject: (id: string, comment: string) => void;
  isActioning: boolean;
}) {
  const t = useTranslations('approvals');
  const [expanded, setExpanded] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [comment, setComment] = useState('');
  const isPending = approval.status === 'pending';

  const agentName = agent?.name ?? t('unknownAgent');
  const archetype = agent?.archetype ?? 'custom';

  return (
    <div className="border border-border-default transition-colors hover:border-border-hover">
      {/* Main row */}
      <div className="flex items-start justify-between gap-3 p-3">
        <div className="min-w-0 flex-1">
          {/* Agent + badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-text-primary">
              {agentName}
            </span>
            <Badge variant="default">{archetype}</Badge>
            <Badge variant={RISK_BADGE_VARIANT[approval.riskLevel]}>
              {RISK_LABEL[approval.riskLevel]}
            </Badge>
            {!isPending && (
              <Badge variant={STATUS_BADGE_VARIANT[approval.status]}>
                {approval.status.toUpperCase()}
              </Badge>
            )}
          </div>

          {/* Action description */}
          <p className="mt-1 text-[10px] leading-relaxed text-text-secondary">
            {approval.reason ?? `${agentName} ${t('wants')} ${approval.actionType}`}
          </p>

          {/* Timestamp + expand toggle */}
          <div className="mt-1.5 flex items-center gap-3">
            <span className="flex items-center gap-1 text-[9px] text-text-muted">
              <Clock size={9} strokeWidth={1.5} />
              {relativeTime(approval.createdAt)}
            </span>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-0.5 text-[9px] text-text-muted transition-colors hover:text-accent-cyan"
            >
              {expanded ? (
                <ChevronDown size={10} strokeWidth={1.5} />
              ) : (
                <ChevronRight size={10} strokeWidth={1.5} />
              )}
              {t('payload')}
            </button>
          </div>

          {/* Review comment (for already-reviewed approvals) */}
          {approval.reviewComment && !isPending && (
            <p className="mt-1.5 border-l-2 border-border-default pl-2 text-[9px] text-text-muted italic">
              {approval.reviewComment}
            </p>
          )}
        </div>

        {/* Action buttons */}
        {isPending && (
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                disabled={isActioning}
                onClick={() => {
                  if (commentOpen && comment.trim()) {
                    onApprove(approval.id, comment.trim());
                  } else {
                    onApprove(approval.id, '');
                  }
                }}
                className="border border-status-success/30 text-status-success hover:bg-status-success/10"
              >
                <ShieldCheck size={11} strokeWidth={1.5} className="mr-1" />
                {t('approve')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={isActioning}
                onClick={() => {
                  if (commentOpen && comment.trim()) {
                    onReject(approval.id, comment.trim());
                  } else {
                    onReject(approval.id, '');
                  }
                }}
                className="border border-status-error/30 text-status-error hover:bg-status-error/10"
              >
                <ShieldX size={11} strokeWidth={1.5} className="mr-1" />
                {t('reject')}
              </Button>
            </div>
            <button
              type="button"
              onClick={() => setCommentOpen(!commentOpen)}
              className="text-[8px] text-text-muted transition-colors hover:text-text-secondary"
            >
              {commentOpen ? t('hideComment') : t('addComment')}
            </button>
          </div>
        )}
      </div>

      {/* Comment field */}
      {isPending && commentOpen && (
        <div className="border-t border-border-default px-3 py-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('commentPlaceholder')}
            rows={2}
            className="w-full resize-none border border-border-default bg-bg-base px-2 py-1.5 text-[10px] text-text-primary placeholder:text-text-muted transition-colors focus:border-accent-cyan focus:outline-none"
          />
        </div>
      )}

      {/* Expandable payload */}
      {expanded && (
        <div className="border-t border-border-default bg-bg-deepest px-3 py-2">
          <pre className="overflow-x-auto text-[9px] leading-relaxed text-text-muted">
            {formatPayload(approval.actionPayload)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──

export default function ApprovalsPage() {
  const t = useTranslations('approvals');
  const utils = trpc.useUtils();

  const [activeTab, setActiveTab] = useState<Tab>('pending');

  // Queries
  const pendingQuery = trpc.approvals.listPending.useQuery(undefined, {
    enabled: activeTab === 'pending',
  });

  const allQuery = trpc.approvals.listAll.useQuery(
    {},
    { enabled: activeTab === 'all' },
  );

  // Fetch agents to resolve agentId -> name/archetype
  const agentsQuery = trpc.agents.list.useQuery();

  const agentsMap = useMemo(() => {
    const map = new Map<string, Agent>();
    if (agentsQuery.data) {
      for (const a of agentsQuery.data) {
        map.set(a.id, { id: a.id, name: a.name, archetype: a.archetype });
      }
    }
    return map;
  }, [agentsQuery.data]);

  // Mutations
  const approveMutation = trpc.approvals.approve.useMutation({
    onSuccess: () => {
      utils.approvals.listPending.invalidate();
      utils.approvals.listAll.invalidate();
    },
  });

  const rejectMutation = trpc.approvals.reject.useMutation({
    onSuccess: () => {
      utils.approvals.listPending.invalidate();
      utils.approvals.listAll.invalidate();
    },
  });

  const isActioning = approveMutation.isPending || rejectMutation.isPending;

  const handleApprove = (id: string, comment: string) => {
    approveMutation.mutate({ id, comment: comment || undefined });
  };

  const handleReject = (id: string, comment: string) => {
    rejectMutation.mutate({ id, comment: comment || undefined });
  };

  // Determine current data and loading state
  const isLoading =
    activeTab === 'pending'
      ? pendingQuery.isLoading
      : allQuery.isLoading;

  const approvals = (
    activeTab === 'pending' ? pendingQuery.data : allQuery.data
  ) as Approval[] | undefined;

  const tabs: { id: Tab; labelKey: string; count?: number }[] = [
    {
      id: 'pending',
      labelKey: 'tabPending',
      count: pendingQuery.data?.length,
    },
    { id: 'all', labelKey: 'tabAll' },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="border-b border-border-default px-4 py-3">
        <h1 className="text-xs font-semibold uppercase tracking-[0.15em] text-text-primary">
          {t('title')}
        </h1>
        <p className="mt-0.5 text-[10px] text-text-muted">{t('subtitle')}</p>
      </div>

      {/* Tabs */}
      <div
        className="flex border-b border-border-default"
        role="tablist"
        aria-label={t('title')}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2 text-[10px] font-medium uppercase tracking-[0.1em] transition-colors ${
                isActive
                  ? 'text-accent-cyan'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {t(tab.labelKey)}
                {tab.count != null && tab.count > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center bg-accent-cyan/15 px-1 text-[9px] font-semibold text-accent-cyan">
                    {tab.count}
                  </span>
                )}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-accent-cyan" />
              )}
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {(pendingQuery.isError || allQuery.isError) && (
        <div className="px-4 py-3">
          <p className="text-[10px] text-status-error">
            {t('errorLoading')}
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="space-y-2">
            <ApprovalSkeleton />
            <ApprovalSkeleton />
            <ApprovalSkeleton />
          </div>
        ) : !approvals || approvals.length === 0 ? (
          <EmptyState
            message={
              activeTab === 'pending'
                ? t('emptyPending')
                : t('emptyAll')
            }
          />
        ) : (
          <div className="space-y-2">
            {approvals.map((approval) => (
              <ApprovalItem
                key={approval.id}
                approval={approval}
                agent={agentsMap.get(approval.agentId)}
                onApprove={handleApprove}
                onReject={handleReject}
                isActioning={isActioning}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mutation feedback */}
      {approveMutation.isError && (
        <div className="border-t border-border-default px-4 py-2">
          <p className="text-[10px] text-status-error">
            {t('approveError')}: {approveMutation.error.message}
          </p>
        </div>
      )}
      {rejectMutation.isError && (
        <div className="border-t border-border-default px-4 py-2">
          <p className="text-[10px] text-status-error">
            {t('rejectError')}: {rejectMutation.error.message}
          </p>
        </div>
      )}
    </div>
  );
}

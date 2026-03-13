'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { trpc } from '@/lib/trpc/client';
import type { AgentStatus } from './AgentAvatar';

// ── Types ────────────────────────────────────────────────────────────
export interface InspectedAgent {
  id: string;
  name: string;
  archetype: string;
  status: AgentStatus;
  currentAction?: string;
}

export interface ActionFeedItem {
  id: string;
  toolName: string;
  status: 'running' | 'completed' | 'failed';
  inputPreview: string;
  timestamp: number;
}

export interface AgentInspectPanelProps {
  agent: InspectedAgent | null;
  onClose: () => void;
}

// ── Status color mapping ─────────────────────────────────────────────
const STATUS_COLORS: Record<AgentStatus, string> = {
  idle: '#00FF88',
  working: '#00C8FF',
  error: '#FF4444',
  awaiting_approval: '#FFD700',
  offline: '#444444',
};

// ── Time ago helper ──────────────────────────────────────────────────
function timeAgo(date: Date | string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

// ── Action status icon ───────────────────────────────────────────────
function ActionStatusIcon({ status }: { status: ActionFeedItem['status'] }) {
  if (status === 'running') {
    return (
      <span className="inline-block h-3 w-3 animate-spin" style={{ color: '#00C8E0' }}>
        &#9676;
      </span>
    );
  }
  if (status === 'completed') {
    return <span style={{ color: '#00FF88' }}>&#10003;</span>;
  }
  return <span style={{ color: '#FF4444' }}>&#10007;</span>;
}

// ── Panel animation variants ─────────────────────────────────────────
const panelVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'tween' as const, duration: 0.25, ease: 'easeOut' as const },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { type: 'tween' as const, duration: 0.2, ease: 'easeIn' as const },
  },
};

const actionCardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'tween' as const, duration: 0.2, ease: 'easeOut' as const },
  },
};

// ── Component ────────────────────────────────────────────────────────
export function AgentInspectPanel({ agent, onClose }: AgentInspectPanelProps) {
  const t = useTranslations('agentPanel');
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Real action logs from tRPC ──────────────────────────────────
  const { data: actionData } = trpc.actionLogs.list.useQuery(
    { agentId: agent?.id, limit: 10 },
    { enabled: !!agent, refetchInterval: agent?.status === 'working' ? 3000 : false },
  );

  const recentActivity = (actionData?.items ?? []).map((item) => ({
    id: item.id,
    action: item.toolName ?? item.actionType ?? 'unknown',
    result: item.status === 'completed' ? 'completed' : item.status === 'failed' ? 'failed' : 'running',
    time: timeAgo(item.createdAt),
  }));

  // ── Live action feed: show most recent actions with "running" status ──
  const [liveActions, setLiveActions] = useState<ActionFeedItem[]>([]);

  useEffect(() => {
    if (!agent || agent.status !== 'working' || !actionData?.items) {
      setLiveActions([]);
      return;
    }

    const recent = actionData.items.slice(0, 5).map((item) => ({
      id: item.id,
      toolName: item.toolName ?? item.actionType ?? 'action',
      status: (item.status === 'completed' ? 'completed' : item.status === 'failed' ? 'failed' : 'running') as ActionFeedItem['status'],
      inputPreview: item.toolName ? `tool: ${item.toolName}` : '',
      timestamp: new Date(item.createdAt).getTime(),
    }));

    setLiveActions(recent);
  }, [agent, actionData]);

  // ── Click outside to close ───────────────────────────────────────
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose],
  );

  // ── Keyboard ESC to close ────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (agent) {
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }
  }, [agent, onClose]);

  // ── Status translation key mapping ───────────────────────────────
  const statusKey = agent
    ? (`status_${agent.status}` as const)
    : ('status_idle' as const);

  return (
    <AnimatePresence>
      {agent && (
        <div
          className="absolute inset-0 z-50"
          onClick={handleBackdropClick}
          style={{ pointerEvents: 'auto' }}
        >
          <motion.div
            ref={panelRef}
            className="absolute right-0 top-0 h-full overflow-y-auto"
            style={{
              width: 360,
              background: '#0A0E14',
              borderLeft: '1px solid rgba(0,200,224,0.2)',
              fontFamily: '"IBM Plex Mono", monospace',
            }}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ──────────────────────────────────────────── */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid rgba(0,200,224,0.15)' }}
            >
              <span
                className="text-xs uppercase tracking-widest"
                style={{ color: '#00C8E0' }}
              >
                {t('title')}
              </span>
              <button
                onClick={onClose}
                className="flex h-6 w-6 items-center justify-center text-xs transition-colors hover:text-white"
                style={{
                  color: 'rgba(0,200,224,0.5)',
                  border: '1px solid rgba(0,200,224,0.2)',
                  background: 'transparent',
                  borderRadius: 0,
                }}
                aria-label={t('close')}
              >
                &#10005;
              </button>
            </div>

            {/* ── Agent identity ───────────────────────────────────── */}
            <div className="px-4 py-4">
              <h2
                className="mb-1 text-sm font-bold"
                style={{ color: '#E6E6E6' }}
              >
                {agent.name}
              </h2>

              {/* Archetype badge */}
              <span
                className="mr-2 inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider"
                style={{
                  background: 'rgba(0,200,224,0.1)',
                  border: '1px solid rgba(0,200,224,0.3)',
                  color: '#00C8E0',
                  borderRadius: 0,
                }}
              >
                {agent.archetype}
              </span>

              {/* Status badge */}
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase tracking-wider"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: STATUS_COLORS[agent.status],
                  borderRadius: 0,
                }}
              >
                <span
                  className="inline-block h-1.5 w-1.5"
                  style={{
                    background: STATUS_COLORS[agent.status],
                    borderRadius: 0,
                  }}
                />
                {t(statusKey)}
              </span>
            </div>

            {/* ── Current action ───────────────────────────────────── */}
            {agent.currentAction && (
              <div
                className="mx-4 mb-3 px-3 py-2"
                style={{
                  background: 'rgba(0,200,255,0.05)',
                  border: '1px solid rgba(0,200,224,0.15)',
                  borderRadius: 0,
                }}
              >
                <span
                  className="block text-[10px] uppercase tracking-wider"
                  style={{ color: 'rgba(0,200,224,0.6)' }}
                >
                  {t('currentAction')}
                </span>
                <span className="text-xs" style={{ color: '#B0B0B0' }}>
                  {agent.currentAction}
                </span>
              </div>
            )}

            {/* ── Live action feed (P2-3.3) ────────────────────────── */}
            {agent.status === 'working' && (
              <div className="px-4 pb-3">
                <span
                  className="mb-2 block text-[10px] uppercase tracking-wider"
                  style={{ color: 'rgba(0,200,224,0.6)' }}
                >
                  {t('liveActions')}
                </span>
                <div className="flex flex-col gap-1.5">
                  <AnimatePresence>
                    {liveActions.map((action) => (
                      <motion.div
                        key={action.id}
                        variants={actionCardVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex items-start gap-2 px-2 py-1.5"
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 0,
                        }}
                      >
                        <span className="mt-0.5 text-xs">
                          <ActionStatusIcon status={action.status} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <span
                            className="block text-[11px] font-medium"
                            style={{ color: '#E6E6E6' }}
                          >
                            {action.toolName}
                          </span>
                          <span
                            className="block truncate text-[10px]"
                            style={{ color: '#666' }}
                          >
                            {action.inputPreview}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* ── Divider ──────────────────────────────────────────── */}
            <div
              className="mx-4"
              style={{
                height: 1,
                background: 'rgba(0,200,224,0.1)',
              }}
            />

            {/* ── Recent activity ──────────────────────────────────── */}
            <div className="px-4 py-3">
              <span
                className="mb-2 block text-[10px] uppercase tracking-wider"
                style={{ color: 'rgba(0,200,224,0.6)' }}
              >
                {t('recentActivity')}
              </span>
              <div className="flex flex-col gap-1">
                {recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-1"
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                    }}
                  >
                    <span className="text-[11px]" style={{ color: '#B0B0B0' }}>
                      {item.action}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px]"
                        style={{
                          color:
                            item.result === 'completed'
                              ? '#00FF88'
                              : '#FF4444',
                        }}
                      >
                        {item.result === 'completed' ? t('actionCompleted') : t('actionFailed')}
                      </span>
                      <span
                        className="text-[10px]"
                        style={{ color: '#555' }}
                      >
                        {item.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Divider ──────────────────────────────────────────── */}
            <div
              className="mx-4"
              style={{
                height: 1,
                background: 'rgba(0,200,224,0.1)',
              }}
            />

            {/* ── Quick actions ────────────────────────────────────── */}
            <div className="flex flex-col gap-2 px-4 py-4">
              <button
                className="w-full py-2 text-xs uppercase tracking-wider transition-colors"
                style={{
                  background: 'rgba(0,200,224,0.1)',
                  border: '1px solid rgba(0,200,224,0.3)',
                  color: '#00C8E0',
                  borderRadius: 0,
                  cursor: 'pointer',
                }}
              >
                {t('trigger')}
              </button>
              <button
                className="w-full py-2 text-xs uppercase tracking-wider transition-colors"
                style={{
                  background: 'rgba(255,215,0,0.05)',
                  border: '1px solid rgba(255,215,0,0.2)',
                  color: '#FFD700',
                  borderRadius: 0,
                  cursor: 'pointer',
                }}
              >
                {t('pause')}
              </button>
              <button
                className="w-full py-2 text-xs uppercase tracking-wider transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#B0B0B0',
                  borderRadius: 0,
                  cursor: 'pointer',
                }}
              >
                {t('viewConfig')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

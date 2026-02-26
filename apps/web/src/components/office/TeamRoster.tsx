'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import type { AgentStatus } from './AgentAvatar';
import type { AgentStatusMap } from './useAgentStatuses';
import { useRosterStore, type RosterMode } from '@/stores/roster-store';

// ── Types ────────────────────────────────────────────────────────────
export interface RosterAgent {
  id: string;
  name: string;
  archetype: string;
}

export interface TeamRosterProps {
  agents: RosterAgent[];
  statuses: AgentStatusMap;
  currentActions: Partial<Record<AgentStatus, string>>;
  onSelectAgent: (agentId: string) => void;
}

// ── Status color mapping (matches AgentAvatar glow) ─────────────────
const STATUS_COLORS: Record<AgentStatus, string> = {
  idle: '#00FF88',
  working: '#00C8FF',
  error: '#FF4444',
  awaiting_approval: '#FFD700',
  offline: '#444444',
};

// ── Status sort priority (lower = higher in list) ───────────────────
const STATUS_PRIORITY: Record<AgentStatus, number> = {
  working: 0,
  awaiting_approval: 1,
  idle: 2,
  error: 3,
  offline: 4,
};

// ── Animation variants ──────────────────────────────────────────────
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

const collapsedVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'tween' as const, duration: 0.2, ease: 'easeOut' as const },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { type: 'tween' as const, duration: 0.15, ease: 'easeIn' as const },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: 10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'tween' as const, duration: 0.15, ease: 'easeOut' as const },
  },
};

// ── Toggle Button ───────────────────────────────────────────────────
function RosterToggleButton() {
  const t = useTranslations('teamRoster');
  const mode = useRosterStore((s) => s.mode);
  const cycleMode = useRosterStore((s) => s.cycleMode);

  const iconLabel = useMemo(() => {
    const labels: Record<RosterMode, string> = {
      expanded: t('collapse'),
      collapsed: t('hide'),
      hidden: t('show'),
    };
    return labels[mode];
  }, [mode, t]);

  return (
    <button
      onClick={cycleMode}
      className="pointer-events-auto absolute right-4 top-4 z-20 flex items-center justify-center px-2 py-1.5 text-[10px] uppercase tracking-widest transition-colors"
      style={{
        background: mode === 'hidden' ? '#0A0E14' : 'rgba(10,14,20,0.95)',
        color: '#00C8E0',
        border: '1px solid rgba(0,200,224,0.3)',
        borderRadius: 0,
        cursor: 'pointer',
        fontFamily: "'IBM Plex Mono', monospace",
      }}
      title={iconLabel}
      aria-label={iconLabel}
    >
      <RosterIcon mode={mode} />
      <span className="ml-1.5">{iconLabel}</span>
    </button>
  );
}

// ── Icon for toggle button ──────────────────────────────────────────
function RosterIcon({ mode }: { mode: RosterMode }) {
  const color = '#00C8E0';
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      {/* Three horizontal lines representing a roster/list */}
      <rect x="1" y="2" width={mode === 'collapsed' ? '4' : '12'} height="2" fill={color} />
      <rect x="1" y="6" width={mode === 'collapsed' ? '4' : '12'} height="2" fill={color} />
      <rect x="1" y="10" width={mode === 'collapsed' ? '4' : '12'} height="2" fill={color} />
      {/* Dots for each line */}
      {mode !== 'hidden' && (
        <>
          <circle cx="3" cy="3" r="1" fill={color} opacity="0.5" />
          <circle cx="3" cy="7" r="1" fill={color} opacity="0.5" />
          <circle cx="3" cy="11" r="1" fill={color} opacity="0.5" />
        </>
      )}
    </svg>
  );
}

// ── Expanded Row ────────────────────────────────────────────────────
function AgentRow({
  agent,
  status,
  currentAction,
  onClick,
}: {
  agent: RosterAgent;
  status: AgentStatus;
  currentAction?: string;
  onClick: () => void;
}) {
  const t = useTranslations('teamRoster');
  const statusKey = `status_${status}` as const;

  return (
    <motion.button
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      onClick={onClick}
      className="flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors"
      style={{
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid rgba(0,200,224,0.06)',
        borderRadius: 0,
        cursor: 'pointer',
        fontFamily: "'IBM Plex Mono', monospace",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          'rgba(0,200,224,0.05)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      {/* Status dot */}
      <span
        className="mt-1.5 inline-block h-2 w-2 flex-shrink-0"
        style={{
          background: STATUS_COLORS[status],
          borderRadius: 0,
          boxShadow: `0 0 4px ${STATUS_COLORS[status]}40`,
        }}
      />

      <div className="min-w-0 flex-1">
        {/* Agent name */}
        <span
          className="block truncate text-[11px] font-medium"
          style={{ color: '#E6E6E6' }}
        >
          {agent.name}
        </span>

        {/* Status label */}
        <span
          className="block text-[9px] uppercase tracking-wider"
          style={{ color: STATUS_COLORS[status], opacity: 0.7 }}
        >
          {t(statusKey)}
        </span>

        {/* Current action (if working/awaiting/error) */}
        {currentAction && (
          <span
            className="mt-0.5 block truncate text-[10px]"
            style={{ color: '#666' }}
          >
            {currentAction}
          </span>
        )}
      </div>
    </motion.button>
  );
}

// ── Collapsed Dot ───────────────────────────────────────────────────
function AgentDot({
  agent,
  status,
  onClick,
}: {
  agent: RosterAgent;
  status: AgentStatus;
  onClick: () => void;
}) {
  return (
    <motion.button
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      onClick={onClick}
      className="flex items-center justify-center p-1.5"
      style={{
        background: 'transparent',
        border: 'none',
        borderRadius: 0,
        cursor: 'pointer',
      }}
      title={agent.name}
      aria-label={agent.name}
    >
      <span
        className="inline-block h-3 w-3"
        style={{
          background: STATUS_COLORS[status],
          borderRadius: 0,
          boxShadow: `0 0 6px ${STATUS_COLORS[status]}50`,
        }}
      />
    </motion.button>
  );
}

// ── Main Component ──────────────────────────────────────────────────
export function TeamRoster({
  agents,
  statuses,
  currentActions,
  onSelectAgent,
}: TeamRosterProps) {
  const t = useTranslations('teamRoster');
  const mode = useRosterStore((s) => s.mode);

  // Rehydrate persisted state on mount
  useEffect(() => {
    useRosterStore.persist.rehydrate();
  }, []);

  // Sort agents by status priority
  const sortedAgents = useMemo(() => {
    return [...agents].sort((a, b) => {
      const statusA = statuses.get(a.id) ?? 'idle';
      const statusB = statuses.get(b.id) ?? 'idle';
      return STATUS_PRIORITY[statusA] - STATUS_PRIORITY[statusB];
    });
  }, [agents, statuses]);

  const agentCount = agents.length;

  const handleAgentClick = useCallback(
    (agentId: string) => {
      onSelectAgent(agentId);
    },
    [onSelectAgent],
  );

  return (
    <>
      {/* Toggle button — always visible */}
      <RosterToggleButton />

      <AnimatePresence mode="wait">
        {/* ── Expanded mode ─────────────────────────────────────────── */}
        {mode === 'expanded' && (
          <motion.div
            key="roster-expanded"
            className="pointer-events-auto absolute right-0 top-12 z-10 overflow-y-auto"
            style={{
              width: 280,
              maxHeight: 'calc(100% - 64px)',
              background: 'rgba(10,14,20,0.95)',
              borderLeft: '1px solid rgba(0,200,224,0.15)',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-3 py-2.5"
              style={{ borderBottom: '1px solid rgba(0,200,224,0.15)' }}
            >
              <span
                className="text-[10px] uppercase tracking-widest"
                style={{ color: '#00C8E0' }}
              >
                {t('header', { count: agentCount })}
              </span>
            </div>

            {/* Agent rows */}
            <div className="flex flex-col">
              {sortedAgents.map((agent) => {
                const status: AgentStatus = statuses.get(agent.id) ?? 'idle';
                const action = currentActions[status];
                return (
                  <AgentRow
                    key={agent.id}
                    agent={agent}
                    status={status}
                    currentAction={action}
                    onClick={() => handleAgentClick(agent.id)}
                  />
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Collapsed mode (dots only) ────────────────────────────── */}
        {mode === 'collapsed' && (
          <motion.div
            key="roster-collapsed"
            className="pointer-events-auto absolute right-1 top-12 z-10 flex flex-col gap-0.5 overflow-y-auto py-1"
            style={{
              maxHeight: 'calc(100% - 64px)',
              background: 'rgba(10,14,20,0.95)',
              border: '1px solid rgba(0,200,224,0.12)',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
            variants={collapsedVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {sortedAgents.map((agent) => {
              const status: AgentStatus = statuses.get(agent.id) ?? 'idle';
              return (
                <AgentDot
                  key={agent.id}
                  agent={agent}
                  status={status}
                  onClick={() => handleAgentClick(agent.id)}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

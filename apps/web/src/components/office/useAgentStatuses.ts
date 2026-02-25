'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { AgentStatus } from './AgentAvatar';

// ── Types ────────────────────────────────────────────────────────────
export type AgentStatusMap = Map<string, AgentStatus>;

// ── Status cycle for demo mode ───────────────────────────────────────
const DEMO_STATUSES: AgentStatus[] = [
  'idle',
  'working',
  'working',
  'awaiting_approval',
  'idle',
  'error',
  'idle',
  'working',
];

const DEBOUNCE_MS = 200;
const CYCLE_INTERVAL_MS = 5000; // cycle every 5s in demo mode

/**
 * Hook that provides real-time agent status data.
 *
 * For now, this uses mock data that cycles through statuses for
 * demo purposes. When Socket.IO integration is fully wired, this
 * will subscribe to real-time status events.
 *
 * @param agentIds - Array of agent IDs to track
 * @param useMockData - Whether to use cycling mock data (default: true)
 */
export function useAgentStatuses(
  agentIds: string[],
  useMockData = true,
): AgentStatusMap {
  const [statuses, setStatuses] = useState<AgentStatusMap>(() => {
    const initial = new Map<string, AgentStatus>();
    for (const id of agentIds) {
      initial.set(id, 'idle');
    }
    return initial;
  });

  // Per-agent debounce map to avoid canceling different agents' updates
  const debounceMapRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // Debounced status updater (per-agent)
  const updateStatus = useCallback(
    (agentId: string, newStatus: AgentStatus) => {
      const map = debounceMapRef.current;
      const existing = map.get(agentId);
      if (existing) {
        clearTimeout(existing);
      }

      map.set(
        agentId,
        setTimeout(() => {
          map.delete(agentId);
          setStatuses((prev) => {
            const next = new Map(prev);
            next.set(agentId, newStatus);
            return next;
          });
        }, DEBOUNCE_MS),
      );
    },
    [],
  );

  // Stabilize agentIds to prevent effect teardown on every render
  const idsKey = agentIds.join(',');

  // ── Mock data cycling ──────────────────────────────────────────────
  useEffect(() => {
    if (!useMockData || agentIds.length === 0) return;

    // Initialize with varied statuses
    const initialMap = new Map<string, AgentStatus>();
    agentIds.forEach((id, i) => {
      initialMap.set(id, DEMO_STATUSES[i % DEMO_STATUSES.length]!);
    });
    setStatuses(initialMap);

    // Cycle statuses on an interval
    const cycleIndices = new Map<string, number>();
    agentIds.forEach((id, i) => {
      cycleIndices.set(id, i % DEMO_STATUSES.length);
    });

    const interval = setInterval(() => {
      // Pick a random agent to update
      const randomIdx = Math.floor(Math.random() * agentIds.length);
      const agentId = agentIds[randomIdx]!;

      const currentIdx = cycleIndices.get(agentId) ?? 0;
      const nextIdx = (currentIdx + 1) % DEMO_STATUSES.length;
      cycleIndices.set(agentId, nextIdx);

      const nextStatus = DEMO_STATUSES[nextIdx]!;
      updateStatus(agentId, nextStatus);
    }, CYCLE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      // Clear all per-agent debounce timeouts
      for (const timeout of debounceMapRef.current.values()) {
        clearTimeout(timeout);
      }
      debounceMapRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, useMockData, updateStatus]);

  return statuses;
}

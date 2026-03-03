'use client';

import { useCallback } from 'react';
import { useSocketEvent } from './use-socket';
import { useRealtimeStore } from '@/stores/realtime-store';
import { trpc } from '@/lib/trpc/client';
import type {
  AgentStatusChangedEvent,
  AgentSessionStartedEvent,
  AgentSessionCompleteEvent,
  AgentErrorEvent,
} from '@ai-office/realtime';

/**
 * Subscribes to all agent:* Socket.IO events.
 * Updates the realtime Zustand store and invalidates tRPC queries.
 */
export function useAgentEvents() {
  const setAgentStatus = useRealtimeStore((s) => s.setAgentStatus);
  const utils = trpc.useUtils();

  useSocketEvent(
    'agent:status_changed',
    useCallback(
      (data: AgentStatusChangedEvent) => {
        setAgentStatus(data.agentId, data.status);
      },
      [setAgentStatus],
    ),
  );

  useSocketEvent(
    'agent:session_started',
    useCallback(
      (_data: AgentSessionStartedEvent) => {
        // Invalidate agent list so the detail page picks up status change
        void utils.agents.list.invalidate();
      },
      [utils],
    ),
  );

  useSocketEvent(
    'agent:session_complete',
    useCallback(
      (data: AgentSessionCompleteEvent) => {
        // Invalidate agent queries so action logs / session data refresh
        void utils.agents.getById.invalidate({ id: data.agentId });
        void utils.agents.list.invalidate();
        void utils.actionLogs.list.invalidate();
      },
      [utils],
    ),
  );

  useSocketEvent(
    'agent:error',
    useCallback(
      (data: AgentErrorEvent) => {
        setAgentStatus(data.agentId, 'error');
        void utils.agents.getById.invalidate({ id: data.agentId });
      },
      [setAgentStatus, utils],
    ),
  );
}

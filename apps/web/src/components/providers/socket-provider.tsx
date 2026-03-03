'use client';

import { useEffect } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { useAgentEvents } from '@/hooks/use-agent-events';
import { useWorkflowEvents } from '@/hooks/use-workflow-events';
import { useApprovalEvents } from '@/hooks/use-approval-events';
import { useConversationEvents } from '@/hooks/use-conversation-events';
import { useRealtimeStore } from '@/stores/realtime-store';
import { trpc } from '@/lib/trpc/client';

interface SocketProviderProps {
  projectId: string | null;
}

/**
 * Top-level provider that manages the Socket.IO connection and
 * subscribes to all real-time event channels.
 * Mount once inside AppShell.
 */
export function SocketProvider({ projectId }: SocketProviderProps) {
  const socketRef = useSocket(projectId);
  const setConnectionStatus = useRealtimeStore((s) => s.setConnectionStatus);
  const setPendingApprovalCount = useRealtimeStore((s) => s.setPendingApprovalCount);

  // Track connection status — polls for socket availability (same pattern as useSocketEvent)
  useEffect(() => {
    let cleanedUp = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentSocket: any = null;

    function attach(socket: NonNullable<typeof socketRef.current>) {
      if (cleanedUp) return;
      currentSocket = socket;

      if (socket.connected) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('connecting');
      }

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.io.on('reconnect_attempt', onReconnectAttempt);
    }

    function detach() {
      if (!currentSocket) return;
      currentSocket.off('connect', onConnect);
      currentSocket.off('disconnect', onDisconnect);
      currentSocket.io.off('reconnect_attempt', onReconnectAttempt);
      currentSocket = null;
    }

    const onConnect = () => setConnectionStatus('connected');
    const onDisconnect = () => setConnectionStatus('disconnected');
    const onReconnectAttempt = () => setConnectionStatus('reconnecting');

    // Try immediately
    if (socketRef.current) {
      attach(socketRef.current);
    }

    // Poll for socket availability / reconnection (new socket instance)
    const interval = setInterval(() => {
      const s = socketRef.current;
      if (s && s !== currentSocket) {
        detach();
        attach(s);
      } else if (!s && currentSocket) {
        detach();
        setConnectionStatus('disconnected');
      }
    }, 200);

    return () => {
      cleanedUp = true;
      clearInterval(interval);
      detach();
    };
  }, [socketRef, setConnectionStatus]);

  // Hydrate pending approval count from DB on mount
  const pendingQuery = trpc.approvals.listPending.useQuery(undefined, {
    enabled: !!projectId,
  });
  useEffect(() => {
    if (pendingQuery.data) {
      setPendingApprovalCount(pendingQuery.data.length);
    }
  }, [pendingQuery.data, setPendingApprovalCount]);

  // Subscribe to all event channels
  useAgentEvents();
  useWorkflowEvents();
  useApprovalEvents();
  useConversationEvents();

  return null;
}

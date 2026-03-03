import { create } from 'zustand';

type AgentStatus = 'idle' | 'working' | 'awaiting_approval' | 'error' | 'offline';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface RealtimeState {
  /** Socket.IO connection status */
  connectionStatus: ConnectionStatus;
  /** Live agent statuses from Socket.IO events (overrides DB values) */
  agentStatuses: Map<string, AgentStatus>;
  /** Pending approval count (for notification badge) */
  pendingApprovalCount: number;

  setConnectionStatus: (status: ConnectionStatus) => void;
  setAgentStatus: (agentId: string, status: AgentStatus) => void;
  batchSetAgentStatuses: (updates: Array<{ agentId: string; status: AgentStatus }>) => void;
  setPendingApprovalCount: (count: number) => void;
  incrementPendingApprovals: () => void;
  decrementPendingApprovals: () => void;
  reset: () => void;
}

export const useRealtimeStore = create<RealtimeState>()((set) => ({
  connectionStatus: 'disconnected',
  agentStatuses: new Map(),
  pendingApprovalCount: 0,

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setAgentStatus: (agentId, status) =>
    set((state) => {
      const next = new Map(state.agentStatuses);
      next.set(agentId, status);
      return { agentStatuses: next };
    }),

  batchSetAgentStatuses: (updates) =>
    set((state) => {
      const next = new Map(state.agentStatuses);
      for (const { agentId, status } of updates) {
        next.set(agentId, status);
      }
      return { agentStatuses: next };
    }),

  setPendingApprovalCount: (pendingApprovalCount) => set({ pendingApprovalCount }),
  incrementPendingApprovals: () =>
    set((state) => ({ pendingApprovalCount: state.pendingApprovalCount + 1 })),
  decrementPendingApprovals: () =>
    set((state) => ({ pendingApprovalCount: Math.max(0, state.pendingApprovalCount - 1) })),

  reset: () =>
    set({
      connectionStatus: 'disconnected',
      agentStatuses: new Map(),
      pendingApprovalCount: 0,
    }),
}));

// Selectors
export const useConnectionStatus = () =>
  useRealtimeStore((s) => s.connectionStatus);

export const useLiveAgentStatus = (agentId: string) =>
  useRealtimeStore((s) => s.agentStatuses.get(agentId));

export const useLiveAgentStatuses = () =>
  useRealtimeStore((s) => s.agentStatuses);

export const usePendingApprovalCount = () =>
  useRealtimeStore((s) => s.pendingApprovalCount);

import { create } from 'zustand';

export type AtlasState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface AtlasMessage {
  id: string;
  role: 'user' | 'atlas';
  text: string;
  timestamp: number;
}

export interface AtlasAction {
  id: string;
  type: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

interface AtlasStore {
  state: AtlasState;
  messages: AtlasMessage[];
  intensity: number;
  muted: boolean;
  context: string;
  pendingActions: AtlasAction[];

  setState: (state: AtlasState) => void;
  setIntensity: (intensity: number) => void;
  toggleMuted: () => void;
  addMessage: (role: 'user' | 'atlas', text: string) => void;
  clearMessages: () => void;
  setContext: (context: string) => void;
  addAction: (action: Omit<AtlasAction, 'id' | 'status' | 'timestamp'>) => void;
  approveAction: (id: string) => void;
  rejectAction: (id: string) => void;
  reset: () => void;
}

const MAX_MESSAGES = 200;
let msgCounter = 0;
let actionCounter = 0;

export const useAtlasStore = create<AtlasStore>()((set) => ({
  state: 'idle',
  messages: [],
  intensity: 0,
  muted: false,
  context: '',
  pendingActions: [],

  setState: (state) => set({ state }),
  setIntensity: (intensity) => set({ intensity }),
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
  addMessage: (role, text) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: `msg-${Date.now()}-${msgCounter++}`,
          role,
          text,
          timestamp: Date.now(),
        },
      ].slice(-MAX_MESSAGES),
    })),
  clearMessages: () => set({ messages: [] }),
  setContext: (context) => set({ context }),
  addAction: (action) =>
    set((s) => ({
      pendingActions: [
        ...s.pendingActions,
        {
          ...action,
          id: `action-${Date.now()}-${actionCounter++}`,
          status: 'pending' as const,
          timestamp: Date.now(),
        },
      ],
    })),
  approveAction: (id) =>
    set((s) => ({
      pendingActions: s.pendingActions.map((a) =>
        a.id === id ? { ...a, status: 'approved' as const } : a,
      ),
    })),
  rejectAction: (id) =>
    set((s) => ({
      pendingActions: s.pendingActions.map((a) =>
        a.id === id ? { ...a, status: 'rejected' as const } : a,
      ),
    })),
  reset: () =>
    set({
      state: 'idle',
      messages: [],
      intensity: 0,
      muted: false,
      context: '',
      pendingActions: [],
    }),
}));

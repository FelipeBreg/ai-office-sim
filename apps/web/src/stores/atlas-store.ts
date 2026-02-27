import { create } from 'zustand';

export type AtlasState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'awaiting_approval';

export interface AtlasMessage {
  id: string;
  role: 'user' | 'atlas';
  text: string;
  timestamp: number;
}

export interface PendingToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ToolCallResult {
  id: string;
  toolName: string;
  output: string;
  isError: boolean;
  autoExecuted: boolean;
  timestamp: number;
}

interface AtlasStore {
  state: AtlasState;
  messages: AtlasMessage[];
  intensity: number;
  muted: boolean;
  context: string;

  // Tool-use state
  conversationHistory: any[];
  pendingToolCalls: PendingToolCall[];
  partialHistory: any[];
  toolCallResults: ToolCallResult[];

  // Actions
  setState: (state: AtlasState) => void;
  setIntensity: (intensity: number) => void;
  toggleMuted: () => void;
  addMessage: (role: 'user' | 'atlas', text: string) => void;
  clearMessages: () => void;
  setContext: (context: string) => void;

  // Tool-use actions
  setConversationHistory: (history: any[]) => void;
  setPendingToolCalls: (calls: PendingToolCall[]) => void;
  setPartialHistory: (history: any[]) => void;
  approveToolCall: (id: string) => void;
  rejectToolCall: (id: string) => void;
  addToolCallResult: (result: Omit<ToolCallResult, 'id' | 'timestamp'>) => void;
  clearToolState: () => void;

  reset: () => void;
}

const MAX_MESSAGES = 200;
let msgCounter = 0;
let toolResultCounter = 0;

export const useAtlasStore = create<AtlasStore>()((set) => ({
  state: 'idle',
  messages: [],
  intensity: 0,
  muted: false,
  context: '',
  conversationHistory: [],
  pendingToolCalls: [],
  partialHistory: [],
  toolCallResults: [],

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

  setConversationHistory: (history) => set({ conversationHistory: history }),
  setPendingToolCalls: (calls) => set({ pendingToolCalls: calls }),
  setPartialHistory: (history) => set({ partialHistory: history }),
  approveToolCall: (id) =>
    set((s) => ({
      pendingToolCalls: s.pendingToolCalls.map((tc) =>
        tc.id === id ? { ...tc, status: 'approved' as const } : tc,
      ),
    })),
  rejectToolCall: (id) =>
    set((s) => ({
      pendingToolCalls: s.pendingToolCalls.map((tc) =>
        tc.id === id ? { ...tc, status: 'rejected' as const } : tc,
      ),
    })),
  addToolCallResult: (result) =>
    set((s) => ({
      toolCallResults: [
        ...s.toolCallResults,
        {
          ...result,
          id: `tr-${Date.now()}-${toolResultCounter++}`,
          timestamp: Date.now(),
        },
      ],
    })),
  clearToolState: () =>
    set({
      pendingToolCalls: [],
      partialHistory: [],
    }),

  reset: () =>
    set({
      state: 'idle',
      messages: [],
      intensity: 0,
      muted: false,
      context: '',
      conversationHistory: [],
      pendingToolCalls: [],
      partialHistory: [],
      toolCallResults: [],
    }),
}));

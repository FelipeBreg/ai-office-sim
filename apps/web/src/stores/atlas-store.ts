import { create } from 'zustand';

export type AtlasState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface AtlasMessage {
  id: string;
  role: 'user' | 'atlas';
  text: string;
  timestamp: number;
}

interface AtlasStore {
  state: AtlasState;
  messages: AtlasMessage[];
  intensity: number;
  muted: boolean;

  setState: (state: AtlasState) => void;
  setIntensity: (intensity: number) => void;
  toggleMuted: () => void;
  addMessage: (role: 'user' | 'atlas', text: string) => void;
  clearMessages: () => void;
  reset: () => void;
}

let msgCounter = 0;

export const useAtlasStore = create<AtlasStore>()((set) => ({
  state: 'idle',
  messages: [],
  intensity: 0,
  muted: false,

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
      ],
    })),
  clearMessages: () => set({ messages: [] }),
  reset: () =>
    set({
      state: 'idle',
      messages: [],
      intensity: 0,
      muted: false,
    }),
}));

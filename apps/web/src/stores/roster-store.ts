import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Roster display modes ──────────────────────────────────────────────
export type RosterMode = 'expanded' | 'collapsed' | 'hidden';

interface RosterState {
  /** Current display mode for the team roster panel */
  mode: RosterMode;

  /** Cycle through modes: expanded -> collapsed -> hidden -> expanded */
  cycleMode: () => void;

  /** Set a specific mode */
  setMode: (mode: RosterMode) => void;
}

const MODE_CYCLE: RosterMode[] = ['expanded', 'collapsed', 'hidden'];

export const useRosterStore = create<RosterState>()(
  persist(
    (set) => ({
      mode: 'expanded', // default: expanded on desktop

      cycleMode: () =>
        set((s) => {
          const currentIdx = MODE_CYCLE.indexOf(s.mode);
          const nextIdx = (currentIdx + 1) % MODE_CYCLE.length;
          return { mode: MODE_CYCLE[nextIdx]! };
        }),

      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'ai-office-roster',
      partialize: (state) => ({
        mode: state.mode,
      }),
      skipHydration: true,
    },
  ),
);

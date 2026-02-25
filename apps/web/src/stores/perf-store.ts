import { create } from 'zustand';

// ── Performance state ─────────────────────────────────────────────────
interface PerfState {
  /** True when average FPS drops below threshold — components should reduce effects */
  lowPerformance: boolean;

  /** Current measured FPS (updated periodically, not every frame) */
  fps: number;

  /** Set the low performance flag */
  setLowPerformance: (low: boolean) => void;

  /** Update the measured FPS */
  setFps: (fps: number) => void;
}

export const usePerfStore = create<PerfState>()((set) => ({
  lowPerformance: false,
  fps: 60,

  setLowPerformance: (low) => set({ lowPerformance: low }),
  setFps: (fps) => set({ fps }),
}));

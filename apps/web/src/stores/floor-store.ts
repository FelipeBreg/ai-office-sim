import { create } from 'zustand';
import { DEFAULT_ACTIVE_FLOOR } from '@/components/office/layouts/floors';

interface FloorState {
  /** Index into FLOOR_CONFIGS for the currently active (fully opaque) floor */
  activeFloor: number;

  /** Whether the exploded view is active (all floors spread apart) */
  exploded: boolean;

  /** Set the active floor index */
  setActiveFloor: (index: number) => void;

  /** Toggle exploded view on/off */
  toggleExploded: () => void;

  /** Set exploded state directly */
  setExploded: (exploded: boolean) => void;
}

export const useFloorStore = create<FloorState>()((set) => ({
  activeFloor: DEFAULT_ACTIVE_FLOOR,
  exploded: false,

  setActiveFloor: (index) =>
    set({ activeFloor: index }),

  toggleExploded: () =>
    set((s) => ({ exploded: !s.exploded })),

  setExploded: (exploded) =>
    set({ exploded }),
}));

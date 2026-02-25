import { create } from 'zustand';
import { DEFAULT_ACTIVE_FLOOR } from '@/components/office/layouts/floors';

// ── Camera control actions (consumed by FloorCameraController) ──────
export type CameraAction =
  | { type: 'zoom'; delta: number }
  | { type: 'pan'; dx: number; dz: number }
  | { type: 'reset' };

interface FloorState {
  /** Index into FLOOR_CONFIGS for the currently active (fully opaque) floor */
  activeFloor: number;

  /** Whether the exploded view is active (all floors spread apart) */
  exploded: boolean;

  /** Queued camera action from NavControls (consumed once per frame) */
  cameraAction: CameraAction | null;

  /** Set the active floor index */
  setActiveFloor: (index: number) => void;

  /** Toggle exploded view on/off */
  toggleExploded: () => void;

  /** Set exploded state directly */
  setExploded: (exploded: boolean) => void;

  /** Dispatch a camera action (zoom / pan / reset) */
  dispatchCamera: (action: CameraAction) => void;

  /** Clear camera action after consumption */
  clearCameraAction: () => void;
}

export const useFloorStore = create<FloorState>()((set) => ({
  activeFloor: DEFAULT_ACTIVE_FLOOR,
  exploded: false,
  cameraAction: null,

  setActiveFloor: (index) =>
    set({ activeFloor: index }),

  toggleExploded: () =>
    set((s) => ({ exploded: !s.exploded })),

  setExploded: (exploded) =>
    set({ exploded }),

  dispatchCamera: (action) =>
    set({ cameraAction: action }),

  clearCameraAction: () =>
    set({ cameraAction: null }),
}));

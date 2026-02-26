import { create } from 'zustand';

// ── Camera control actions (consumed by FloorCameraController) ──────
export type CameraAction =
  | { type: 'zoom'; delta: number }
  | { type: 'pan'; dx: number; dz: number }
  | { type: 'reset' };

interface FloorState {
  /** Queued camera action from NavControls (consumed once per frame) */
  cameraAction: CameraAction | null;

  /** Dispatch a camera action (zoom / pan / reset) */
  dispatchCamera: (action: CameraAction) => void;

  /** Clear camera action after consumption */
  clearCameraAction: () => void;
}

export const useFloorStore = create<FloorState>()((set) => ({
  cameraAction: null,

  dispatchCamera: (action) =>
    set({ cameraAction: action }),

  clearCameraAction: () =>
    set({ cameraAction: null }),
}));

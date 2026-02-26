'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useFloorStore } from '@/stores/floor-store';

// ── Constants ───────────────────────────────────────────────────────────
const BASE_TARGET_X = 10;
const BASE_TARGET_Y = 0;
const BASE_TARGET_Z = 16;
const NORMAL_ZOOM = 35;

/** Default camera position offset from target */
const DEFAULT_CAMERA_OFFSET = new THREE.Vector3(10, 10, 10);

/** Zoom step applied per NavControls click */
const ZOOM_STEP = 8;

/** Pan step applied per NavControls click */
const PAN_STEP = 2;

/**
 * FloorCameraController
 *
 * Runs inside the R3F scene graph. Consumes camera actions dispatched
 * by NavControls (zoom, pan, reset).
 *
 * Must be placed AFTER <OrbitControls makeDefault /> so that
 * `controls` is available via useThree.
 */
export function FloorCameraController() {
  const cameraActionRef = useRef(useFloorStore.getState().cameraAction);

  useEffect(() => {
    const unsub = useFloorStore.subscribe((s) => {
      cameraActionRef.current = s.cameraAction;
    });
    return unsub;
  }, []);

  useFrame((state) => {
    const controls = state.controls as unknown as { target: THREE.Vector3; update: () => void } | undefined;
    if (!controls) return;

    const camera = state.camera as THREE.OrthographicCamera;
    const cameraAction = cameraActionRef.current;

    // ── Process queued camera actions from NavControls ─────────────
    if (cameraAction) {
      switch (cameraAction.type) {
        case 'zoom': {
          camera.zoom = THREE.MathUtils.clamp(
            camera.zoom + cameraAction.delta * ZOOM_STEP,
            15,
            120,
          );
          camera.updateProjectionMatrix();
          break;
        }
        case 'pan': {
          controls.target.x += cameraAction.dx * PAN_STEP;
          controls.target.z += cameraAction.dz * PAN_STEP;
          camera.position.x += cameraAction.dx * PAN_STEP;
          camera.position.z += cameraAction.dz * PAN_STEP;
          break;
        }
        case 'reset': {
          controls.target.set(BASE_TARGET_X, BASE_TARGET_Y, BASE_TARGET_Z);
          camera.position.set(
            BASE_TARGET_X + DEFAULT_CAMERA_OFFSET.x,
            BASE_TARGET_Y + DEFAULT_CAMERA_OFFSET.y,
            BASE_TARGET_Z + DEFAULT_CAMERA_OFFSET.z,
          );
          camera.zoom = NORMAL_ZOOM;
          camera.updateProjectionMatrix();
          break;
        }
      }
      useFloorStore.getState().clearCameraAction();
    }

    controls.update();
  });

  return null;
}

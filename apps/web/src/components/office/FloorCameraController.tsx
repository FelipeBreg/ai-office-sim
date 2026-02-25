'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useFloorStore } from '@/stores/floor-store';
import {
  FLOOR_NORMAL_SPACING,
  FLOOR_EXPLODED_SPACING,
} from './layouts/floors';

// ── Constants ───────────────────────────────────────────────────────────
const CAMERA_LERP_SPEED = 3;
const NORMAL_ZOOM = 50;
const EXPLODED_ZOOM = 30;
const BASE_TARGET_X = 9.5;
const BASE_TARGET_Z = 4;

/** Default camera position offset from target */
const DEFAULT_CAMERA_OFFSET = new THREE.Vector3(10, 10, 10);

/** Zoom step applied per NavControls click */
const ZOOM_STEP = 8;

/** Pan step applied per NavControls click */
const PAN_STEP = 2;

/**
 * FloorCameraController
 *
 * Runs inside the R3F scene graph. Smoothly animates the OrbitControls
 * target and camera position/zoom based on the active floor and
 * exploded view state from the floor store.
 *
 * Also consumes camera actions dispatched by NavControls (zoom, pan, reset).
 *
 * Must be placed AFTER <OrbitControls makeDefault /> so that
 * `controls` is available via useThree.
 */
export function FloorCameraController() {
  // Subscribe via refs to avoid React re-renders in the R3F scene graph
  const activeFloorRef = useRef(useFloorStore.getState().activeFloor);
  const explodedRef = useRef(useFloorStore.getState().exploded);
  const cameraActionRef = useRef(useFloorStore.getState().cameraAction);

  useEffect(() => {
    const unsub = useFloorStore.subscribe((s) => {
      activeFloorRef.current = s.activeFloor;
      explodedRef.current = s.exploded;
      cameraActionRef.current = s.cameraAction;
    });
    return unsub;
  }, []);

  const targetVec = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const controls = state.controls as unknown as { target: THREE.Vector3; update: () => void } | undefined;
    if (!controls) return;

    const camera = state.camera as THREE.OrthographicCamera;
    const activeFloor = activeFloorRef.current;
    const exploded = explodedRef.current;
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
          const spacing = exploded ? FLOOR_EXPLODED_SPACING : FLOOR_NORMAL_SPACING;
          const resetY = activeFloor * spacing - spacing;

          controls.target.set(BASE_TARGET_X, resetY, BASE_TARGET_Z);
          camera.position.set(
            BASE_TARGET_X + DEFAULT_CAMERA_OFFSET.x,
            resetY + DEFAULT_CAMERA_OFFSET.y,
            BASE_TARGET_Z + DEFAULT_CAMERA_OFFSET.z,
          );
          camera.zoom = exploded ? EXPLODED_ZOOM : NORMAL_ZOOM;
          camera.updateProjectionMatrix();
          break;
        }
      }
      useFloorStore.getState().clearCameraAction();
    }

    // ── Floor-based smooth animation ──────────────────────────────
    const spacing = exploded ? FLOOR_EXPLODED_SPACING : FLOOR_NORMAL_SPACING;
    const targetY = activeFloor * spacing - spacing;
    const targetZoom = exploded ? EXPLODED_ZOOM : NORMAL_ZOOM;

    const t = 1 - Math.exp(-CAMERA_LERP_SPEED * delta);

    targetVec.current.set(BASE_TARGET_X, targetY, BASE_TARGET_Z);
    controls.target.lerp(targetVec.current, t);

    // Lerp camera position Y relative to target
    const desiredCameraY = targetY + 10;
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, desiredCameraY, t);

    // Lerp zoom (only update projection matrix when changing)
    if (Math.abs(camera.zoom - targetZoom) > 0.01) {
      camera.zoom = THREE.MathUtils.lerp(camera.zoom, targetZoom, t);
      camera.updateProjectionMatrix();
    }

    controls.update();
  });

  return null;
}

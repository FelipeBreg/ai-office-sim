'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
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

/**
 * FloorCameraController
 *
 * Runs inside the R3F scene graph. Smoothly animates the OrbitControls
 * target and camera position/zoom based on the active floor and
 * exploded view state from the floor store.
 *
 * Must be placed AFTER <OrbitControls makeDefault /> so that
 * `controls` is available via useThree.
 */
export function FloorCameraController() {
  const activeFloor = useFloorStore((s) => s.activeFloor);
  const exploded = useFloorStore((s) => s.exploded);

  const targetVec = useRef(new THREE.Vector3(BASE_TARGET_X, 0, BASE_TARGET_Z));

  useFrame((state, delta) => {
    const controls = state.controls as unknown as { target: THREE.Vector3; update: () => void } | undefined;
    if (!controls) return;

    const camera = state.camera as THREE.OrthographicCamera;

    // Compute target Y for the active floor
    const spacing = exploded ? FLOOR_EXPLODED_SPACING : FLOOR_NORMAL_SPACING;
    const targetY = activeFloor * spacing - spacing;

    // Compute target zoom
    const targetZoom = exploded ? EXPLODED_ZOOM : NORMAL_ZOOM;

    // Smoothly interpolate
    const t = 1 - Math.exp(-CAMERA_LERP_SPEED * delta);

    targetVec.current.set(BASE_TARGET_X, targetY, BASE_TARGET_Z);

    controls.target.lerp(targetVec.current, t);

    // Lerp camera position Y relative to target
    const desiredCameraY = targetY + 10; // keep same offset
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, desiredCameraY, t);

    // Lerp zoom
    camera.zoom = THREE.MathUtils.lerp(camera.zoom, targetZoom, t);
    camera.updateProjectionMatrix();

    controls.update();
  });

  return null;
}

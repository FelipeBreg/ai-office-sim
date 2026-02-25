'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ── LOD zoom thresholds for orthographic camera ──────────────────────
// Far zoom (< 25): simplified boxes
// Medium zoom (25-60): current wireframe furniture
// Close zoom (> 60): full detail (same as medium for now)
const LOD_FAR_THRESHOLD = 25;
const LOD_CLOSE_THRESHOLD = 60;

export type LODLevel = 'far' | 'medium' | 'close';

// ── Simplified furniture box dimensions per type ─────────────────────
// Used at far zoom to replace detailed furniture with a single box
const SIMPLE_DIMENSIONS: Record<string, { size: [number, number, number]; yOffset: number }> = {
  desk: { size: [1.2, 0.75, 0.6], yOffset: 0.375 },
  monitor: { size: [0.4, 0.5, 0.05], yOffset: 0.25 },
  chair: { size: [0.4, 0.82, 0.4], yOffset: 0.41 },
  meetingTable: { size: [2, 0.75, 1], yOffset: 0.375 },
  serverRack: { size: [0.6, 2, 0.4], yOffset: 1 },
  couch: { size: [1.4, 0.8, 0.6], yOffset: 0.4 },
  coffeeMachine: { size: [0.3, 0.5, 0.25], yOffset: 0.25 },
};

const SIMPLE_EDGE_COLOR = '#2288CC';
const SIMPLE_FILL_COLOR = '#0A1929';
const SIMPLE_FILL_OPACITY = 0.08;

// ── SimpleFurniture: single box replacement at far zoom ──────────────
interface SimpleFurnitureProps {
  furnitureType: string;
}

export const SimpleFurniture = memo(function SimpleFurniture({ furnitureType }: SimpleFurnitureProps) {
  const config = SIMPLE_DIMENSIONS[furnitureType];
  if (!config) return null;

  const { size, yOffset } = config;

  const geometries = useMemo(() => {
    const boxGeo = new THREE.BoxGeometry(size[0], size[1], size[2]);
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    return { boxGeo, edgesGeo };
  }, [size[0], size[1], size[2]]);

  useEffect(() => {
    return () => {
      geometries.boxGeo.dispose();
      geometries.edgesGeo.dispose();
    };
  }, [geometries]);

  return (
    <group>
      <mesh geometry={geometries.boxGeo} position={[0, yOffset, 0]}>
        <meshStandardMaterial
          color={SIMPLE_FILL_COLOR}
          transparent
          opacity={SIMPLE_FILL_OPACITY}
        />
      </mesh>
      <lineSegments geometry={geometries.edgesGeo} position={[0, yOffset, 0]}>
        <lineBasicMaterial color={SIMPLE_EDGE_COLOR} transparent opacity={0.5} />
      </lineSegments>
    </group>
  );
});

SimpleFurniture.displayName = 'SimpleFurniture';

// ── useLODLevel: reads camera zoom and returns current LOD level ─────
export function useLODLevel(): LODLevel {
  const [level, setLevel] = useState<LODLevel>('medium');
  const levelRef = useRef<LODLevel>('medium');

  useFrame((state) => {
    const camera = state.camera as THREE.OrthographicCamera;
    const zoom = camera.zoom;

    let newLevel: LODLevel;
    if (zoom < LOD_FAR_THRESHOLD) {
      newLevel = 'far';
    } else if (zoom > LOD_CLOSE_THRESHOLD) {
      newLevel = 'close';
    } else {
      newLevel = 'medium';
    }

    // Only trigger state update when level actually changes
    if (newLevel !== levelRef.current) {
      levelRef.current = newLevel;
      setLevel(newLevel);
    }
  });

  return level;
}

// ── LODWrapper: conditionally renders children based on zoom level ───
interface LODWrapperProps {
  /** Rendered at far zoom (zoom < 25) */
  far: React.ReactNode;
  /** Rendered at medium zoom (25-60) */
  medium: React.ReactNode;
  /** Rendered at close zoom (> 60). Falls back to medium if not provided. */
  close?: React.ReactNode;
  /** Current LOD level (pass from useLODLevel to share across components) */
  level: LODLevel;
}

export const LODWrapper = memo(function LODWrapper({ far, medium, close, level }: LODWrapperProps) {
  switch (level) {
    case 'far':
      return <>{far}</>;
    case 'close':
      return <>{close ?? medium}</>;
    case 'medium':
    default:
      return <>{medium}</>;
  }
});

LODWrapper.displayName = 'LODWrapper';

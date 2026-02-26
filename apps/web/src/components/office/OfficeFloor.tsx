'use client';

import { memo, useEffect, useMemo } from 'react';
import * as THREE from 'three';

const FLOOR_COLOR = '#0D1117';
const GRID_COLOR = '#1a2a3a';

const FLOOR_WIDTH = 22;
const FLOOR_DEPTH = 36;

export const OfficeFloor = memo(function OfficeFloor() {
  const gridLines = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const step = 1;

    // Lines along X axis
    for (let z = 0; z <= FLOOR_DEPTH; z += step) {
      points.push(new THREE.Vector3(0, 0.026, z));
      points.push(new THREE.Vector3(FLOOR_WIDTH, 0.026, z));
    }

    // Lines along Z axis
    for (let x = 0; x <= FLOOR_WIDTH; x += step) {
      points.push(new THREE.Vector3(x, 0.026, 0));
      points.push(new THREE.Vector3(x, 0.026, FLOOR_DEPTH));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, []);

  useEffect(() => {
    return () => {
      gridLines.dispose();
    };
  }, [gridLines]);

  return (
    <group>
      {/* Floor slab */}
      <mesh position={[FLOOR_WIDTH / 2, 0, FLOOR_DEPTH / 2]} receiveShadow>
        <boxGeometry args={[FLOOR_WIDTH, 0.05, FLOOR_DEPTH]} />
        <meshStandardMaterial
          color={FLOOR_COLOR}
          metalness={0.3}
          roughness={0.8}
        />
      </mesh>

      {/* Grid overlay */}
      <lineSegments geometry={gridLines}>
        <lineBasicMaterial color={GRID_COLOR} transparent opacity={0.4} />
      </lineSegments>
    </group>
  );
});

OfficeFloor.displayName = 'OfficeFloor';

'use client';

import { memo, useEffect, useMemo } from 'react';
import * as THREE from 'three';

const FLOOR_COLOR = '#0D1117';
const GRID_COLOR = '#1a2a3a';

export const OfficeFloor = memo(function OfficeFloor() {
  const gridLines = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const width = 20;
    const depth = 15;
    const step = 1;

    // Lines along X axis
    for (let z = 0; z <= depth; z += step) {
      points.push(new THREE.Vector3(0, 0.026, z));
      points.push(new THREE.Vector3(width, 0.026, z));
    }

    // Lines along Z axis
    for (let x = 0; x <= width; x += step) {
      points.push(new THREE.Vector3(x, 0.026, 0));
      points.push(new THREE.Vector3(x, 0.026, depth));
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
      <mesh position={[10, 0, 7.5]} receiveShadow>
        <boxGeometry args={[20, 0.05, 15]} />
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

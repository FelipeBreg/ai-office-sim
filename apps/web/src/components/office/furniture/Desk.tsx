'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

const EDGE_COLOR = '#2288CC';
const FILL_COLOR = '#0A1929';
const FILL_OPACITY = 0.1;

export function Desk() {
  const geometries = useMemo(() => {
    const topGeo = new THREE.BoxGeometry(1.2, 0.04, 0.6);
    const topEdges = new THREE.EdgesGeometry(topGeo);

    const legGeo = new THREE.BoxGeometry(0.04, 0.71, 0.04);
    const legEdges = new THREE.EdgesGeometry(legGeo);

    return { topGeo, topEdges, legGeo, legEdges };
  }, []);

  useEffect(() => {
    return () => {
      geometries.topGeo.dispose();
      geometries.topEdges.dispose();
      geometries.legGeo.dispose();
      geometries.legEdges.dispose();
    };
  }, [geometries]);

  const legPositions: [number, number, number][] = [
    [-0.56, -0.375, -0.26],
    [0.56, -0.375, -0.26],
    [-0.56, -0.375, 0.26],
    [0.56, -0.375, 0.26],
  ];

  return (
    <group>
      {/* Table top */}
      <mesh geometry={geometries.topGeo} position={[0, 0.75, 0]}>
        <meshStandardMaterial
          color={FILL_COLOR}
          transparent
          opacity={FILL_OPACITY}
        />
      </mesh>
      <lineSegments geometry={geometries.topEdges} position={[0, 0.75, 0]}>
        <lineBasicMaterial color={EDGE_COLOR} />
      </lineSegments>

      {/* Legs */}
      {legPositions.map((pos, i) => (
        <group key={i}>
          <mesh geometry={geometries.legGeo} position={pos}>
            <meshStandardMaterial
              color={FILL_COLOR}
              transparent
              opacity={FILL_OPACITY}
            />
          </mesh>
          <lineSegments geometry={geometries.legEdges} position={pos}>
            <lineBasicMaterial color={EDGE_COLOR} />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}

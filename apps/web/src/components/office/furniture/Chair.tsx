'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

const EDGE_COLOR = '#2288CC';
const FILL_COLOR = '#0A1929';
const FILL_OPACITY = 0.1;

export function Chair() {
  const geometries = useMemo(() => {
    const seatGeo = new THREE.BoxGeometry(0.4, 0.04, 0.4);
    const seatEdges = new THREE.EdgesGeometry(seatGeo);

    const backGeo = new THREE.BoxGeometry(0.4, 0.4, 0.04);
    const backEdges = new THREE.EdgesGeometry(backGeo);

    const legGeo = new THREE.BoxGeometry(0.03, 0.4, 0.03);
    const legEdges = new THREE.EdgesGeometry(legGeo);

    return { seatGeo, seatEdges, backGeo, backEdges, legGeo, legEdges };
  }, []);

  useEffect(() => {
    return () => {
      geometries.seatGeo.dispose();
      geometries.seatEdges.dispose();
      geometries.backGeo.dispose();
      geometries.backEdges.dispose();
      geometries.legGeo.dispose();
      geometries.legEdges.dispose();
    };
  }, [geometries]);

  const legPositions: [number, number, number][] = [
    [-0.16, -0.2, -0.16],
    [0.16, -0.2, -0.16],
    [-0.16, -0.2, 0.16],
    [0.16, -0.2, 0.16],
  ];

  return (
    <group>
      {/* Seat */}
      <mesh geometry={geometries.seatGeo} position={[0, 0.4, 0]}>
        <meshStandardMaterial
          color={FILL_COLOR}
          transparent
          opacity={FILL_OPACITY}
        />
      </mesh>
      <lineSegments geometry={geometries.seatEdges} position={[0, 0.4, 0]}>
        <lineBasicMaterial color={EDGE_COLOR} />
      </lineSegments>

      {/* Backrest */}
      <mesh geometry={geometries.backGeo} position={[0, 0.62, -0.18]}>
        <meshStandardMaterial
          color={FILL_COLOR}
          transparent
          opacity={FILL_OPACITY}
        />
      </mesh>
      <lineSegments geometry={geometries.backEdges} position={[0, 0.62, -0.18]}>
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

'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

const EDGE_COLOR = '#2288CC';
const FILL_COLOR = '#0A1929';
const FILL_OPACITY = 0.1;

export function ServerRack() {
  const geometries = useMemo(() => {
    const cabinetGeo = new THREE.BoxGeometry(0.6, 2, 0.4);
    const cabinetEdges = new THREE.EdgesGeometry(cabinetGeo);

    const shelfGeo = new THREE.BoxGeometry(0.58, 0.01, 0.38);
    const shelfEdges = new THREE.EdgesGeometry(shelfGeo);

    return { cabinetGeo, cabinetEdges, shelfGeo, shelfEdges };
  }, []);

  useEffect(() => {
    return () => {
      geometries.cabinetGeo.dispose();
      geometries.cabinetEdges.dispose();
      geometries.shelfGeo.dispose();
      geometries.shelfEdges.dispose();
    };
  }, [geometries]);

  const shelfYPositions = [0.4, 0.7, 1.0, 1.3, 1.6];

  return (
    <group>
      {/* Cabinet frame */}
      <mesh geometry={geometries.cabinetGeo} position={[0, 1, 0]}>
        <meshStandardMaterial
          color={FILL_COLOR}
          transparent
          opacity={FILL_OPACITY}
        />
      </mesh>
      <lineSegments geometry={geometries.cabinetEdges} position={[0, 1, 0]}>
        <lineBasicMaterial color={EDGE_COLOR} />
      </lineSegments>

      {/* Shelf lines */}
      {shelfYPositions.map((y, i) => (
        <lineSegments key={i} geometry={geometries.shelfEdges} position={[0, y, 0]}>
          <lineBasicMaterial color={EDGE_COLOR} opacity={0.5} transparent />
        </lineSegments>
      ))}
    </group>
  );
}
